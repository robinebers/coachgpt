import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import type { UIMessage } from "ai";

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    assistantSlug: text("assistant_slug").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("chats_user_updated_idx").on(t.userId, t.updatedAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: text("role").$type<UIMessage["role"]>().notNull(),
    parts: jsonb("parts").$type<UIMessage["parts"]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("messages_chat_idx").on(t.chatId, t.createdAt)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assistantSlug: text("assistant_slug").notNull(),
    name: text("name").notNull(),
    blobPathname: text("blob_pathname").notNull(),
    status: text("status").$type<"processing" | "ready" | "failed">().notNull(),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("documents_assistant_idx").on(t.assistantSlug)],
);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    assistantSlug: text("assistant_slug").notNull(),
    position: integer("position").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    search: tsvector("search")
      .notNull()
      .generatedAlwaysAs(sql`to_tsvector('simple', "content")`),
  },
  (t) => [
    index("chunks_assistant_idx").on(t.assistantSlug),
    index("chunks_document_idx").on(t.documentId),
    index("chunks_search_idx").using("gin", t.search),
  ],
);

export const usage = pgTable(
  "usage",
  {
    userId: text("user_id").notNull(),
    day: text("day").notNull(),
    messages: integer("messages").notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] }), index("usage_day_idx").on(t.day)],
);
