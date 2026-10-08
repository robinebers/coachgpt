import { desc } from "drizzle-orm";
import Link from "next/link";
import { assistants } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { db, documents, user } from "@/lib/db";
import { allowedExtensions } from "@/lib/file-types";
import { getUsageToday } from "@/lib/limits";
import { deleteDocument } from "./actions";
import { AutoRefresh } from "./auto-refresh";
import { AddClientForm, RemoveButton, ResetPasswordButton } from "./clients";
import { UploadFiles } from "./upload-files";

export default async function AdminPage() {
  await requireAdmin();
  const [files, usageToday, people] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    getUsageToday(),
    db.select().from(user).orderBy(user.name),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <AutoRefresh active={files.some((file) => file.status === "processing")} />
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl">Admin</h1>
        <Link href="/" className="text-muted-foreground text-sm hover:underline">
          Back to chat
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Only people you add here can sign in. You get a password to send them.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AddClientForm />
          <div className="flex flex-col divide-y">
            {people.map((person) => (
              <div key={person.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1 truncate">
                  {person.name} <span className="text-muted-foreground">{person.email}</span>
                </span>
                <ResetPasswordButton userId={person.id} email={person.email} />
                {!isAdminEmail(person.email) && <RemoveButton userId={person.id} email={person.email} />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>Counts reset every day at midnight UTC.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-xl">
              {usageToday.messages} / {coachConfig.limits.messagesTotalPerDay}
            </div>
            <div className="text-muted-foreground">messages</div>
          </div>
          <div>
            <div className="font-semibold text-xl">{usageToday.people}</div>
            <div className="text-muted-foreground">people chatting</div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(assistants).map(([slug, assistant]) => (
        <Card key={slug}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{assistant.name}</CardTitle>
              <CardDescription>
                Knowledge files this assistant can search: {allowedExtensions.map((e) => `.${e}`).join(", ")}
              </CardDescription>
            </div>
            <UploadFiles assistantSlug={slug} />
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {files
              .filter((file) => file.assistantSlug === slug)
              .map((file) => (
                <div key={file.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1 truncate">{file.name}</span>
                  <Badge
                    variant={file.status === "failed" ? "destructive" : "secondary"}
                    title={file.error ?? undefined}
                  >
                    {file.status === "processing" ? "reading…" : file.status}
                  </Badge>
                  <form action={deleteDocument.bind(null, file.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
