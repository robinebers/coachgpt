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
import { user } from "./auth-schema";

// Login tables, made by Better Auth's CLI. Don't hand-edit them. After adding a Better Auth plugin, run:
// npx auth@latest generate --config lib/auth.ts --output lib/db/auth-schema.ts
export * from "./auth-schema";

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

const bytea = customType<{ data: Buffer }>({
  dataType: () => "bytea",
});

export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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

// Images clients send in chat. Messages link to them, so the messages table stays small.
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("attachments_chat_idx").on(t.chatId)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assistantSlug: text("assistant_slug").notNull(),
    name: text("name").notNull(),
    status: text("status").$type<"processing" | "ready" | "failed">().notNull(),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

// Instructions a coach saved on /admin. Without a row, the assistant has none.
export const assistantInstructions = pgTable("assistant_instructions", {
  assistantSlug: text("assistant_slug").primaryKey(),
  instructions: text("instructions").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    search: tsvector("search")
      .notNull()
      .generatedAlwaysAs(sql`to_tsvector('simple', "content")`),
  },
  (t) => [
    index("chunks_document_idx").on(t.documentId),
    index("chunks_search_idx").using("gin", t.search),
  ],
);

export const usage = pgTable(
  "usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    messages: integer("messages").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);
