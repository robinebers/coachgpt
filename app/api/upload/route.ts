import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAssistant } from "@/assistants";
import { coachConfig } from "@/coach.config";
import { requireAdmin } from "@/lib/auth";
import { isAllowedFile } from "@/lib/file-types";

export async function POST(request: Request) {
  try {
    const result = await handleUpload({
      body: (await request.json()) as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        const [folder, assistantSlug] = pathname.split("/");
        if (folder !== "knowledge" || !getAssistant(assistantSlug ?? "") || !isAllowedFile(pathname)) {
          throw new Error("This file can't be uploaded");
        }
        return {
          maximumSizeInBytes: coachConfig.knowledge.maxFileSizeMB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
