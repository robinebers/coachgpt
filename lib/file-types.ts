export const allowedExtensions = ["txt", "md", "srt", "vtt", "pdf"];

// Vercel rejects request bodies over 4.5 MB, so files can't be bigger than this.
export const maxFileSizeMB = 4;

export function isAllowedFile(fileName: string) {
  return allowedExtensions.includes(fileName.split(".").pop()?.toLowerCase() ?? "");
}
