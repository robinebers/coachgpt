export const fileTypes = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  srt: "application/x-subrip",
  vtt: "text/vtt",
} as const;

export const allowedExtensions = Object.keys(fileTypes);

// Vercel rejects request bodies over 4.5 MB, so files can't be bigger than this.
export const maxFileSizeMB = 4;

export const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const maxImagesPerMessage = 3;
// Three images this size, sent as text, still fit Vercel's 4.5 MB request limit.
export const maxImageMB = 1;

export function isAllowedFile(fileName: string) {
  return allowedExtensions.includes(fileName.split(".").pop()?.toLowerCase() ?? "");
}

export const dropzoneAccept = Object.entries(fileTypes).reduce<Record<string, string[]>>(
  (accept, [extension, mime]) => {
    (accept[mime] ??= []).push(`.${extension}`);
    return accept;
  },
  {},
);
