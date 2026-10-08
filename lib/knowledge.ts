import { embed, embedMany, gateway, rerank } from "ai";
import { and, cosineDistance, desc, eq, sql } from "drizzle-orm";
import { extractText, getDocumentProxy } from "unpdf";
import { coachConfig } from "@/coach.config";
import { chunks, db, documents } from "@/lib/db";

const { models } = coachConfig;

async function readFileText(fileName: string, bytes: Uint8Array) {
  if (!fileName.toLowerCase().endsWith(".pdf")) return new TextDecoder().decode(bytes);

  const { text } = await extractText(await getDocumentProxy(bytes), { mergePages: true });
  if (!text.trim()) throw new Error("This PDF has no text in it. It may be a scan.");
  return text;
}

const chunkSize = 1500;
const chunkOverlap = 200;

function splitIntoChunks(text: string) {
  const pieces: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current.trim() && current.length + line.length > chunkSize) {
      pieces.push(current.trim());
      current = current.slice(-chunkOverlap);
    }
    current = current ? `${current}\n${line}` : line;
    while (current.length > chunkSize * 1.5) {
      pieces.push(current.slice(0, chunkSize));
      current = current.slice(chunkSize - chunkOverlap);
    }
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

export async function processDocument(document: typeof documents.$inferSelect, bytes: Uint8Array) {
  try {
    const pieces = splitIntoChunks(await readFileText(document.name, bytes));
    if (pieces.length === 0) throw new Error("No text was found in this file.");

    const { embeddings } = await embedMany({
      model: gateway.embeddingModel(models.embedding),
      values: pieces,
    });

    const rows = pieces.map((content, i) => ({
      documentId: document.id,
      content,
      embedding: embeddings[i],
    }));
    for (let i = 0; i < rows.length; i += 100) {
      await db.insert(chunks).values(rows.slice(i, i + 100));
    }
    await db
      .update(documents)
      .set({ status: "ready", error: null })
      .where(eq(documents.id, document.id));
  } catch (error) {
    await db.delete(chunks).where(eq(chunks.documentId, document.id));
    await db
      .update(documents)
      .set({ status: "failed", error: (error as Error).message })
      .where(eq(documents.id, document.id));
  }
}

const candidatesPerSearch = 30;
const resultsPerSearch = 6;

export async function searchKnowledge(assistantSlug: string, query: string) {
  const { embedding } = await embed({
    model: gateway.embeddingModel(models.embedding),
    value: query,
  });
  const keywordQuery = sql`websearch_to_tsquery('simple', ${query})`;
  const columns = { id: chunks.id, content: chunks.content, file: documents.name };

  const [byMeaning, byKeyword] = await Promise.all([
    db
      .select(columns)
      .from(chunks)
      .innerJoin(documents, eq(chunks.documentId, documents.id))
      .where(and(eq(documents.assistantSlug, assistantSlug), eq(documents.status, "ready")))
      .orderBy(cosineDistance(chunks.embedding, embedding))
      .limit(candidatesPerSearch),
    db
      .select(columns)
      .from(chunks)
      .innerJoin(documents, eq(chunks.documentId, documents.id))
      .where(and(eq(documents.assistantSlug, assistantSlug), eq(documents.status, "ready"), sql`${chunks.search} @@ ${keywordQuery}`))
      .orderBy(desc(sql`ts_rank(${chunks.search}, ${keywordQuery})`))
      .limit(candidatesPerSearch),
  ]);

  // Reciprocal rank fusion: a chunk ranked high in either list rises to the top.
  const scores = new Map<string, { chunk: (typeof byMeaning)[number]; score: number }>();
  for (const list of [byMeaning, byKeyword]) {
    list.forEach((chunk, rank) => {
      const entry = scores.get(chunk.id) ?? { chunk, score: 0 };
      entry.score += 1 / (60 + rank + 1);
      scores.set(chunk.id, entry);
    });
  }
  const candidates = [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, candidatesPerSearch)
    .map((entry) => entry.chunk);
  if (candidates.length === 0) return [];

  const { ranking } = await rerank({
    model: gateway.reranking(models.reranker),
    query,
    documents: candidates.map((chunk) => chunk.content),
    topN: resultsPerSearch,
  });
  return ranking.map(({ originalIndex }) => ({
    file: candidates[originalIndex].file,
    text: candidates[originalIndex].content,
  }));
}
