"use client";

import { CheckIcon, CopyIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeClient, resetPassword, saveClient } from "./actions";

type Client = { id: string; name: string; email: string; isAdmin: boolean };
type SignIn = { name: string; email: string; password: string };

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {children}
    </Button>
  );
}

function ClientForm({ client, onSaved }: { client?: Client; onSaved: (signIn?: SignIn) => void }) {
  const [error, setError] = useState<string>();

  async function save(formData: FormData) {
    const result = await saveClient(client?.id, formData);
    if (result.error) return setError(result.error);
    const name = String(formData.get("name"));
    onSaved(result.password ? { name, email: String(formData.get("email")), password: result.password } : undefined);
  }

  return (
    <form action={save} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{client ? "Edit client" : "Add client"}</DialogTitle>
        <DialogDescription>
          {client ? "Change their name or email." : "Next, you get a password to send them."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={client?.name} required autoFocus />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={client?.email}
          readOnly={client?.isAdmin}
          required
        />
        {client?.isAdmin && (
          <p className="text-muted-foreground text-sm">Admin emails can only be changed in the app’s settings.</p>
        )}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <SubmitButton>{client ? "Save" : "Add client"}</SubmitButton>
      </DialogFooter>
    </form>
  );
}

function CopyButton({ text, label, children }: { text: string; label: string; children?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? CheckIcon : CopyIcon;
  return children ? (
    <Button onClick={copy}>
      <Icon data-icon="inline-start" />
      {copied ? "Copied" : children}
    </Button>
  ) : (
    <Button variant="ghost" size="icon-sm" aria-label={label} onClick={copy}>
      <Icon />
    </Button>
  );
}

function SignInDetails({ signIn }: { signIn: SignIn }) {
  const address = window.location.origin;
  const fields = [
    { label: "Web address", value: address },
    { label: "Email", value: signIn.email },
    { label: "Password", value: signIn.password },
  ];
  const message = `Here's how to sign in to ${document.title}:\n\n${fields.map((field) => `${field.label}: ${field.value}`).join("\n")}`;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Send this to {signIn.name}</DialogTitle>
        <DialogDescription>You’ll only see this password once. If it gets lost, reset it.</DialogDescription>
      </DialogHeader>
      <dl className="grid divide-y rounded-lg bg-muted">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center gap-2 py-2 pr-2 pl-3">
            <div className="min-w-0 flex-1">
              <dt className="text-muted-foreground text-xs">{field.label}</dt>
              <dd className={field.label === "Password" ? "truncate font-mono" : "truncate"}>{field.value}</dd>
            </div>
            <CopyButton text={field.value} label={`Copy ${field.label.toLowerCase()}`} />
          </div>
        ))}
      </dl>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
        <CopyButton text={message} label="Copy all">
          Copy all
        </CopyButton>
      </DialogFooter>
    </>
  );
}

export function AddClientButton() {
  const [open, setOpen] = useState(false);
  const [signIn, setSignIn] = useState<SignIn>();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        onClick={() => {
          setSignIn(undefined);
          setOpen(true);
        }}
      >
        Add client
      </Button>
      <DialogContent>
        {signIn ? <SignInDetails signIn={signIn} /> : <ClientForm onSaved={setSignIn} />}
      </DialogContent>
    </Dialog>
  );
}

export function ClientRow({ client }: { client: Client }) {
  const [open, setOpen] = useState<"edit" | "reset" | "remove" | "details">();
  const [signIn, setSignIn] = useState<SignIn>();
  const close = () => setOpen(undefined);
  const closeIf = (which: typeof open) => (next: boolean) =>
    !next && setOpen((current) => (current === which ? undefined : current));

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-medium">
          <span className="truncate">{client.name}</span>
          {client.isAdmin && <Badge variant="secondary">Admin</Badge>}
        </div>
        <div className="truncate text-muted-foreground">{client.email}</div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${client.name}`} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setSignIn(undefined);
              setOpen("edit");
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("reset")}>Reset password</DropdownMenuItem>
          {!client.isAdmin && (
            <DropdownMenuItem variant="destructive" onClick={() => setOpen("remove")}>
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open === "edit" || open === "details"} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          {signIn ? (
            <SignInDetails signIn={signIn} />
          ) : (
            <ClientForm client={client} onSaved={close} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open === "reset"}
        onOpenChange={closeIf("reset")}
        title={`Reset ${client.name}'s password?`}
        description="Their old password stops working right away, and they're signed out everywhere."
        action="Reset password"
        onConfirm={async () => {
          setSignIn({ name: client.name, email: client.email, password: await resetPassword(client.id) });
          setOpen("details");
        }}
      />

      <ConfirmDialog
        open={open === "remove"}
        onOpenChange={closeIf("remove")}
        title={`Remove ${client.name}?`}
        description="They can't sign in anymore, and all their chats are deleted. This can't be undone."
        action="Remove"
        onConfirm={() => removeClient(client.id)}
      />
    </div>
  );
}
