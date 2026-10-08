import { desc } from "drizzle-orm";
import { assistants } from "@/assistants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { db, documents, user } from "@/lib/db";
import { allowedExtensions } from "@/lib/file-types";
import { deleteDocument } from "./actions";
import { AutoRefresh } from "./auto-refresh";
import { ClientRow } from "./clients";
import { UploadFiles } from "./upload-files";

export default async function AdminPage() {
  await requireAdmin();
  const [files, people] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(user).orderBy(user.name),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 p-6">
      <AutoRefresh active={files.some((file) => file.status === "processing")} />

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Clients</h2>
        <p className="text-muted-foreground text-sm">Only people you add here can sign in. You get a password to send them.</p>
        <ClientRow />
        {people.map((person) => (
          <ClientRow
            key={person.id}
            client={{ id: person.id, name: person.name, email: person.email, isAdmin: isAdminEmail(person.email) }}
          />
        ))}
      </section>

      {Object.entries(assistants).map(([slug, assistant]) => (
        <section key={slug} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{assistant.name}</h2>
            <UploadFiles assistantSlug={slug} />
          </div>
          <p className="text-muted-foreground text-sm">
            Knowledge files it can search: {allowedExtensions.map((extension) => `.${extension}`).join(", ")}
          </p>
          <div className="flex flex-col divide-y">
            {files
              .filter((file) => file.assistantSlug === slug)
              .map((file) => (
                <div key={file.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1 truncate">{file.name}</span>
                  <Badge variant={file.status === "failed" ? "destructive" : "secondary"} title={file.error ?? undefined}>
                    {file.status === "processing" ? "reading…" : file.status}
                  </Badge>
                  <form action={deleteDocument.bind(null, file.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
