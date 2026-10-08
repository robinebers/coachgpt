CREATE TABLE "assistant_instructions" (
	"assistant_slug" text PRIMARY KEY NOT NULL,
	"instructions" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
