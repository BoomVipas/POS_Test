import Link from "next/link";
import { SettingsForm } from "./Form";
import { DangerZone } from "./DangerZone";

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">Settings</h1>
      <p className="mt-2 text-text/85">
        Workspace-level configuration that the POS reads at runtime.
      </p>
      {!isConfigured() && (
        <p className="mt-2 text-xs text-muted">
          Demo mode: changes save to your browser only.
        </p>
      )}

      <div className="panel mt-8 p-6">
        <SettingsForm />
      </div>

      <DangerZone />

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
