"use client";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { allowedExtensions, maxFileSizeMB } from "@/lib/file-types";
import { cn } from "@/lib/utils";
import { addDocument, deleteDocument } from "./actions";

export function DeleteFileButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${name}`} onClick={() => setConfirming(true)}>
        <Trash2Icon />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${name}?`}
        description="The assistant can't search it anymore."
        action="Delete"
        onConfirm={() => deleteDocument(id)}
      />
    </>
  );
}

export function UploadFiles({ assistantSlug }: { assistantSlug: string }) {
  const [uploading, setUploading] = useState(0);

  async function uploadOne(file: File) {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      toast.error(`${file.name} is bigger than ${maxFileSizeMB} MB. Split it into smaller files.`);
      return;
    }
    setUploading((count) => count + 1);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { error } = await addDocument(assistantSlug, formData);
      if (error) toast.error(`${file.name}: ${error}`);
    } catch (error) {
      toast.error(`${file.name}: ${(error as Error).message}`);
    } finally {
      setUploading((count) => count - 1);
    }
  }

  return (
    <label className={cn(buttonVariants({ variant: "outline" }))}>
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
