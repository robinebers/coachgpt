import { desc } from "drizzle-orm";
import { assistants } from "@/assistants";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { db, documents, user } from "@/lib/db";
import { allowedExtensions } from "@/lib/file-types";
import { AutoRefresh } from "./auto-refresh";
import { AddClientButton, ClientRow } from "./clients";
import { DeleteFileButton, UploadFiles } from "./files";

export default async function AdminPage() {
  await requireAdmin();
  const [files, people] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(user).orderBy(user.name),
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
            Add the knowledge files each assistant can search: {allowedExtensions.map((e) => `.${e}`).join(", ")}.
            Only add material you’re OK with clients seeing through the assistant.
          </p>
        </div>
        {Object.entries(assistants).map(([slug, assistant]) => {
          const assistantFiles = files.filter((file) => file.assistantSlug === slug);
          return (
            <Card key={slug}>
              <CardHeader>
                <CardTitle>{assistant.name}</CardTitle>
                <CardDescription>{assistant.description}</CardDescription>
                <CardAction>
                  <UploadFiles assistantSlug={slug} />
                </CardAction>
              </CardHeader>
              <CardContent>
                {assistantFiles.length === 0 ? (
                  <p className="text-muted-foreground">No knowledge files yet.</p>
                ) : (
                  <div className="flex flex-col divide-y">
                    {assistantFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 py-2">
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <Badge
                          variant={file.status === "failed" ? "destructive" : "secondary"}
                          title={file.error ?? undefined}
                        >
                          {file.status === "processing" ? "reading…" : file.status}
                        </Badge>
                        <DeleteFileButton id={file.id} name={file.name} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
