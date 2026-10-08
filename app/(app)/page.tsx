import Link from "next/link";
import { assistants } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";

export default async function Home() {
  await getUser();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">{coachConfig.appName}</h1>
        <p className="text-muted-foreground">{coachConfig.tagline}</p>
      </div>
      <div className="flex flex-col gap-3">
        {Object.entries(assistants).map(([slug, assistant]) => (
          <Link key={slug} href={`/${slug}`}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle>{assistant.name}</CardTitle>
                <CardDescription>{assistant.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
