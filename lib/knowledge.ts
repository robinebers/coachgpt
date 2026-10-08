import { embed, embedMany, gateway, generateText, rerank } from "ai";
import { get } from "@vercel/blob";
import { and, cosineDistance, desc, eq, sql } from "drizzle-orm";
import { coachConfig } from "@/coach.config";
import { chunks, db, documents } from "@/lib/db";

const { models } = coachConfig;

async function readFileText(fileName: string, bytes: Uint8Array) {
  if (!fileName.toLowerCase().endsWith(".pdf")) return new TextDecoder().decode(bytes);

  const { text, finishReason } = await generateText({
    model: models.chat,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Copy all text in this PDF faithfully, in reading order, as Markdown. Describe images and charts in words. Reply with the content only.",
          },
          { type: "file", data: bytes, mediaType: "application/pdf", filename: fileName },
        ],
      },
    ],
  });
  if (finishReason !== "stop") throw new Error("This PDF is too long. Split it into smaller files.");
  return text;
}

const chunkSize = 1500;
const chunkOverlap = 200;

function splitIntoChunks(text: string) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const pieces: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > chunkSize) {
      pieces.push(current);
      current = current.slice(-chunkOverlap);
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
    while (current.length > chunkSize * 1.5) {
      pieces.push(current.slice(0, chunkSize));
      current = current.slice(chunkSize - chunkOverlap);
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

export async function processDocument(document: typeof documents.$inferSelect) {
  try {
    const blob = await get(document.blobPathname, { access: "private" });
    if (blob?.statusCode !== 200) throw new Error("The uploaded file is missing from storage.");
    const bytes = new Uint8Array(await new Response(blob.stream).arrayBuffer());

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
      .where(eq(documents.assistantSlug, assistantSlug))
      .orderBy(cosineDistance(chunks.embedding, embedding))
      .limit(candidatesPerSearch),
    db
      .select(columns)
      .from(chunks)
      .innerJoin(documents, eq(chunks.documentId, documents.id))
      .where(and(eq(documents.assistantSlug, assistantSlug), sql`${chunks.search} @@ ${keywordQuery}`))
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
