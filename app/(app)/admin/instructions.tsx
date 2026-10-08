"use client";

import { ScrollTextIcon } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { maxInstructionsLength } from "@/assistants/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { saveInstructions } from "./actions";

type Props = {
  assistant: { slug: string; name: string };
  instructions?: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      Save
    </Button>
  );
}

function InstructionsForm({ assistant, instructions, onDone }: Props & { onDone: () => void }) {
  const [text, setText] = useState(instructions ?? "");
  const [error, setError] = useState<string>();

  async function save(formData: FormData) {
    const result = await saveInstructions(assistant.slug, formData);
    if (result.error) return setError(result.error);
    onDone();
  }

  return (
    <form action={save} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{assistant.name} instructions</DialogTitle>
        <DialogDescription>
          What this assistant does, how it talks, and what to avoid. Clients never see this.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Textarea
          name="instructions"
          aria-label="Instructions"
          placeholder="Paste the instructions from your GPT's Configure tab, or write new ones."
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={maxInstructionsLength}
          className="max-h-[60vh] min-h-80"
          required
          autoFocus
        />
        <p className="text-right text-muted-foreground text-xs tabular-nums">
          {text.length.toLocaleString("en-US")} / {maxInstructionsLength.toLocaleString("en-US")}
        </p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <SaveButton />
      </DialogFooter>
    </form>
  );
}

export function InstructionsButton(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!props.instructions && <Badge variant="outline" className="self-center">No instructions</Badge>}
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ScrollTextIcon data-icon="inline-start" />
        Instructions
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <InstructionsForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
