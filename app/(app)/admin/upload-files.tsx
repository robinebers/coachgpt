"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { allowedExtensions } from "@/lib/file-types";
import { addDocument } from "./actions";

export function UploadFiles({ assistantSlug }: { assistantSlug: string }) {
  const [uploading, setUploading] = useState(0);

  async function uploadOne(file: File) {
    setUploading((count) => count + 1);
    try {
      const blob = await upload(`knowledge/${assistantSlug}/${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      await addDocument(assistantSlug, file.name, blob.pathname);
    } catch (error) {
      toast.error(`${file.name}: ${(error as Error).message}`);
    } finally {
      setUploading((count) => count - 1);
    }
  }

  return (
    <label className={buttonVariants({ variant: "outline", size: "sm" })}>
      {uploading > 0 ? `Uploading ${uploading}…` : "Add files"}
      <input
        type="file"
        multiple
        hidden
        disabled={uploading > 0}
        accept={allowedExtensions.map((extension) => `.${extension}`).join(",")}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          void Promise.all(files.map(uploadOne));
        }}
      />
    </label>
  );
}
