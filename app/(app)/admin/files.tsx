"use client";

import { FileTextIcon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { allowedExtensions, dropzoneAccept, isAllowedFile, maxFileSizeMB } from "@/lib/file-types";
import { cn } from "@/lib/utils";
import { addDocument, deleteDocument } from "./actions";

const extensionList = allowedExtensions.map((extension) => `.${extension}`).join(", ");
const wrongTypeMessage = `Only ${extensionList} files`;
const tooLargeMessage = `Bigger than ${maxFileSizeMB} MB. Split it into smaller files.`;

type ServerFile = {
  id: string;
  name: string;
  status: "processing" | "ready" | "failed";
  error: string | null;
};

type PendingUpload = { id: string; name: string } & ({ state: "uploading" } | { state: "failed"; error: string });

function rejectionMessage(errors: FileRejection["errors"]) {
  if (errors.some((error) => error.code === "file-invalid-type")) return wrongTypeMessage;
  if (errors.some((error) => error.code === "file-too-large")) return tooLargeMessage;
  return errors[0]?.message ?? wrongTypeMessage;
}

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

function FileStatus({
  status,
  error,
}: {
  status: "uploading" | "processing" | "ready" | "failed";
  error?: string | null;
}) {
  if (status === "uploading" || status === "processing") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Spinner aria-hidden />
        {status === "uploading" ? "Uploading" : "Reading"}
      </span>
    );
  }
  if (status === "ready") return <Badge variant="secondary">Ready</Badge>;
  if (!error) return <Badge variant="destructive">Failed</Badge>;
  return (
    <Tooltip>
      <TooltipTrigger render={<Badge variant="destructive" />}>Failed</TooltipTrigger>
      <TooltipContent>{error}</TooltipContent>
    </Tooltip>
  );
}

function FileRow({
  name,
  status,
  error,
  action,
}: {
  name: string;
  status: "uploading" | "processing" | "ready" | "failed";
  error?: string | null;
  action?: ReactNode;
}) {
  return (
    <Item size="sm" className="flex-nowrap rounded-none px-0">
      <ItemMedia variant="icon">
        <FileTextIcon />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">{name}</ItemTitle>
      </ItemContent>
      <ItemActions className="shrink-0">
        <FileStatus status={status} error={error} />
        {action}
      </ItemActions>
    </Item>
  );
}

export function AssistantFiles({
  assistant,
  files,
}: {
  assistant: { slug: string; name: string; description: string };
  files: ServerFile[];
}) {
  const [pending, setPending] = useState<PendingUpload[]>([]);

  function fail(id: string, name: string, error: string) {
    setPending((current) => current.map((item) => (item.id === id ? { id, name, state: "failed", error } : item)));
  }

  async function upload(file: File, id: string) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { error } = await addDocument(assistant.slug, formData);
      if (error) {
        fail(id, file.name, error);
        return;
      }
      setPending((current) => current.filter((item) => item.id !== id));
    } catch (caught) {
      fail(id, file.name, caught instanceof Error ? caught.message : "This file couldn't be added.");
    }
  }

  function onDrop(acceptedFiles: File[], fileRejections: FileRejection[]) {
    const uploads = acceptedFiles.filter((file) => isAllowedFile(file.name)).map((file) => ({
      file,
      row: { id: crypto.randomUUID(), name: file.name, state: "uploading" as const },
    }));
    const failed: PendingUpload[] = [
      ...acceptedFiles
        .filter((file) => !isAllowedFile(file.name))
        .map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          state: "failed" as const,
          error: wrongTypeMessage,
        })),
      ...fileRejections.map(({ file, errors }) => ({
        id: crypto.randomUUID(),
        name: file.name,
        state: "failed" as const,
        error: rejectionMessage(errors),
      })),
    ];
    setPending((current) => [...uploads.map((item) => item.row), ...failed, ...current]);
    void Promise.all(uploads.map((item) => upload(item.file, item.row.id)));
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    multiple: true,
    accept: dropzoneAccept,
    maxSize: maxFileSizeMB * 1024 * 1024,
    onDrop,
  });
  const hasRows = pending.length > 0 || files.length > 0;

  return (
    <Card
      {...getRootProps({
        className: cn(
          "relative",
          isDragActive && "overflow-visible ring-0 outline-2 outline-dashed outline-primary",
        ),
      })}
    >
      <input {...getInputProps({ className: "absolute size-0 overflow-hidden" })} />
      <CardHeader>
        <CardTitle>{assistant.name}</CardTitle>
        <CardDescription>{assistant.description}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" onClick={open}>
            Add files
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {hasRows ? (
          <ItemGroup className="gap-0 divide-y">
            {pending.map((item) => (
              <FileRow
                key={item.id}
                name={item.name}
                status={item.state}
                error={item.state === "failed" ? item.error : undefined}
                action={
                  item.state === "failed" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Dismiss ${item.name}`}
                      onClick={() => setPending((current) => current.filter((row) => row.id !== item.id))}
                    >
                      <XIcon />
                    </Button>
                  ) : undefined
                }
              />
            ))}
            {files.map((file) => (
              <FileRow
                key={file.id}
                name={file.name}
                status={file.status}
                error={file.error}
                action={<DeleteFileButton id={file.id} name={file.name} />}
              />
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UploadIcon />
              </EmptyMedia>
              <EmptyTitle>Drop knowledge files here</EmptyTitle>
              <EmptyDescription>
                {extensionList}, up to {maxFileSizeMB} MB each
              </EmptyDescription>
            </EmptyHeader>
            <Button type="button" variant="outline" onClick={open}>
              Add files
            </Button>
          </Empty>
        )}
      </CardContent>
      {isDragActive && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/90 px-6 text-center font-medium">
          Drop to add to {assistant.name}
        </div>
      )}
    </Card>
  );
}
