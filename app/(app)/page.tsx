import Link from "next/link";
import { redirect } from "next/navigation";
import { assistants } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";

export default async function Home() {
  await getUser();
  const slugs = Object.keys(assistants);
  if (slugs.length === 1) redirect(`/${slugs[0]}`);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pt-8 pb-16">
      <div>
        <h1 className="font-semibold text-2xl">{coachConfig.appName}</h1>
        <p className="text-muted-foreground">{coachConfig.tagline}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
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
