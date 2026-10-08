export const allowedExtensions = ["txt", "md", "srt", "vtt", "pdf"];

export function isAllowedFile(fileName: string) {
  return allowedExtensions.includes(fileName.split(".").pop()?.toLowerCase() ?? "");
}
