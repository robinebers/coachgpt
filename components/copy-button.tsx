"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/icon-button";

export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return { copied, copy, Icon: copied ? CheckIcon : CopyIcon };
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const { copied, copy, Icon } = useCopy(text);
  return (
    <IconButton label={copied ? "Copied" : label} onClick={copy}>
      <Icon />
    </IconButton>
  );
}
