"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { issueInviteCode } from "./actions";

type IssuedCode = { code: string; email: string; emailed: boolean };

const inputCls =
  "w-full rounded-[10px] border border-line bg-panel px-3 py-2 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]";

export function IssueInviteButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [issued, setIssued] = useState<IssuedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function reset() {
    setEmail("");
    setBrandName("");
    setIssued(null);
    setError(null);
    setOpen(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await issueInviteCode(email, brandName);
      if (res.ok) {
        setIssued({ code: res.code, email: res.email, emailed: res.emailed });
        push({
          kind: "success",
          title: "Invite code issued",
          message: res.emailed
            ? `Sent to ${res.email}`
            : `Code ready — email not configured, copy it manually`,
        });
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        + Issue invite code
      </Button>
    );
  }

  if (issued) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-ok-soft-fg)]/40 bg-[var(--color-ok-soft-bg)] p-4">
        <p className="text-sm font-bold text-[var(--color-ok-soft-fg)]">
          Invite code issued for {issued.email}
        </p>
        <p className="num mt-2 rounded-[8px] border border-line bg-panel px-3 py-2 font-extrabold tracking-wider text-accent-strong">
          {issued.code}
        </p>
        {!issued.emailed && (
          <p className="mt-2 text-xs text-muted">
            Email not configured — copy the code above and send it manually.
          </p>
        )}
        {issued.emailed && (
          <p className="mt-2 text-xs text-muted">Invite email sent.</p>
        )}
        <Button variant="ghost" size="sm" className="mt-3" onClick={reset}>
          Issue another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-lg)] border border-line bg-panel p-4"
    >
      <p className="mb-3 text-sm font-bold text-text">Issue invite code directly</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className={inputCls}
            placeholder="seller@brand.com"
            required
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
            Brand name
          </span>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.currentTarget.value)}
            className={inputCls}
            placeholder="Meow House"
            required
            maxLength={120}
          />
        </label>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Expires in 14 days. No application required.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-[8px] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-3 py-2 text-sm text-[var(--color-danger-soft-fg)]"
        >
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          Issue code
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
