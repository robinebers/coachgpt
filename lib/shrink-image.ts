import type { FileUIPart } from "ai";
import { maxImageMB } from "@/lib/file-types";

// Models scale images down to about this size anyway.
const maxSide = 1568;

// Turns any image into a JPEG small enough for the model and the server.
export async function shrinkImage(file: FileUIPart): Promise<FileUIPart> {
  const bitmap = await createImageBitmap(await (await fetch(file.url)).blob());
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas to draw the image on");
  // JPEG has no transparency, so see-through parts would turn black without this.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.6, 0.4]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    const bytes = ((url.length - url.indexOf(",") - 1) * 3) / 4;
    if (bytes <= maxImageMB * 1024 * 1024) return { ...file, mediaType: "image/jpeg", url };
  }
  throw new Error("Image is too detailed to fit");
}
