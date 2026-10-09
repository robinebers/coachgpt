import type { CSSProperties } from "react";
import { coachConfig } from "@/coach.config";

const darkText = "oklch(0.147 0.004 49.25)";
const lightText = "oklch(0.985 0.001 106.423)";

// WCAG relative luminance: text on the color is dark above 0.179, light below.
function textOn(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`coach.config.ts colors must be six-digit hex like "#0731f8", got "${hex}"`);
  }
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? darkText : lightText;
}

const { primary, secondary } = coachConfig.colors;

export const brandStyle = {
  "--brand-primary": primary,
  "--brand-primary-foreground": textOn(primary),
  "--brand-secondary": secondary,
  "--brand-secondary-foreground": textOn(secondary),
} as CSSProperties;
