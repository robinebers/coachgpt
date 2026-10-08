import { desc } from "drizzle-orm";
import { assistants } from "@/assistants";
import { Card } from "@/components/ui/card";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { assistantInstructions, db, documents, user } from "@/lib/db";
import { AutoRefresh } from "./auto-refresh";
import { AddClientButton, ClientRow } from "./clients";
import { AssistantFiles } from "./files";
import { InstructionsButton } from "./instructions";

export default async function AdminPage() {
  await requireAdmin();
  const [files, people, savedInstructions] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(user).orderBy(user.name),
    db.select().from(assistantInstructions),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 pt-8 pb-16">
      <AutoRefresh active={files.some((file) => file.status === "processing")} />

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Clients</h2>
            <p className="text-muted-foreground text-sm">Only people you add here can sign in.</p>
          </div>
          <AddClientButton />
        </div>
        <Card className="gap-0 divide-y py-0">
          {people.map((person) => (
            <ClientRow
              key={person.id}
              client={{ id: person.id, name: person.name, email: person.email, isAdmin: isAdminEmail(person.email) }}
            />
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-lg">Assistants</h2>
          <p className="text-muted-foreground text-sm">
            Drop knowledge files on an assistant, or use Add files. Only add material you’re OK with clients seeing
            through the assistant.
          </p>
        </div>
        {Object.entries(assistants).map(([slug, assistant]) => (
          <AssistantFiles
            key={slug}
            assistant={{ slug, name: assistant.name, description: assistant.description }}
            files={files
              .filter((file) => file.assistantSlug === slug)
              .map(({ id, name, status, error }) => ({ id, name, status, error }))}
            action={
              <InstructionsButton
                assistant={{ slug, name: assistant.name }}
                instructions={{
                  text: savedInstructions.find((row) => row.assistantSlug === slug)?.instructions ?? assistant.instructions,
                  original: assistant.instructions,
                }}
              />
            }
          />
        ))}
      </section>
    </main>
  );
}
