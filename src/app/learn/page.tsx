import Link from "next/link";

const REPO_DOC = (file: string) =>
  `https://github.com/visanchan/meowmeow_sandbox/blob/main/pos-for-sell/docs/${file}`;

export const metadata = {
  title: "Founder Learning Path — MochiPOS",
  description:
    "5-level curriculum for the MochiPOS founder. Web basics → Next.js → Supabase → Deployment → SaaS architecture.",
};

type Status = "in-progress" | "locked" | "done";

export default function LearnPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Founder learning path
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-accent-strong sm:text-5xl">
          Learn how MochiPOS is built,
          <br />
          one level at a time.
        </h1>
        <p className="mt-5 max-w-2xl text-text/85">
          You don&apos;t need to become a full-time engineer. You need to read
          this repo, guide AI agents, review work, and make architectural calls.
          That&apos;s what this curriculum builds — using booth analogies and
          real MochiPOS files, never abstract textbook examples.
        </p>
      </header>

      <ResumeCallout />

      <section className="mt-12">
        <h2 className="font-display text-2xl text-accent-strong">
          Demo navigation map
        </h2>
        <p className="mt-2 text-sm text-text/75">
          MochiPOS has four audiences and four surfaces. When you run{" "}
          <code className="rounded bg-panel px-1.5 py-0.5">npm run dev</code>,
          each URL below opens the section for that audience. Demo data is
          mocked — no real database needed.
        </p>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          <SurfaceTile
            audience="future sellers"
            title="Public marketing"
            body="Where new pet brands sign up. Today this is the first screen you see when you open the dev server — easy to mistake for the whole app."
            links={[
              { href: "/", label: "/" },
              { href: "/apply", label: "/apply" },
            ]}
          />
          <SurfaceTile
            audience="sellers at the booth"
            title="Cashier app"
            body="The heart of the product. Cashier rings up sales, manages inventory, closes the day. Start here."
            links={[
              { href: "/app/pos", label: "/app/pos", primary: true },
              { href: "/app/dashboard", label: "/app/dashboard" },
              { href: "/app/customers", label: "/app/customers" },
              { href: "/app/send-later", label: "/app/send-later" },
              { href: "/app/stock-count", label: "/app/stock-count" },
              { href: "/app/close-day", label: "/app/close-day" },
              { href: "/app/setup/products", label: "/app/setup/products" },
            ]}
          />
          <SurfaceTile
            audience="you (the founder)"
            title="Platform admin"
            body="Approve seller applications, manage workspaces, watch the audit log."
            links={[
              { href: "/admin/applications", label: "/admin/applications" },
              { href: "/admin/workspaces", label: "/admin/workspaces" },
              { href: "/admin/invite-codes", label: "/admin/invite-codes" },
              { href: "/admin/audit-log", label: "/admin/audit-log" },
            ]}
          />
          <SurfaceTile
            audience="pet owners (customers)"
            title="Customer-facing"
            body="What the customer sees: scan QR at the booth to browse the menu (/qr-menu), or after a purchase claim a pet profile via the token link on their receipt (/register/[token])."
            links={[
              { href: "/qr-menu", label: "/qr-menu" },
            ]}
          />
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-accent-strong">The 5 levels</h2>
        <p className="mt-2 text-sm text-text/75">
          Tackle them in order. Each ends with one hands-on exercise inside this
          repo.
        </p>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          <LevelTile
            n={1}
            status="in-progress"
            title="Web app basics"
            body="Frontend vs backend, database, hosting, API. The 5 ideas every level builds on. Booth analogy: cashier, manager, file cabinet, warehouse, intercom."
            exercise="Open DevTools Network tab, watch the frontend↔backend conversation."
            duration="10 min"
          />
          <LevelTile
            n={2}
            status="locked"
            title="Next.js structure"
            body="Pages, layouts, server vs client components, server actions, env vars. How src/app/ folders become URLs."
            exercise="Read /apply end-to-end. Identify which file is server vs client."
            duration="15 min"
          />
          <LevelTile
            n={3}
            status="locked"
            title="Supabase basics"
            body="Tables, columns, primary/foreign keys, Postgres functions, RLS. Why money is satang. Why create_order is a database function, not JavaScript."
            exercise="Read schema.sql + rls-policies.sql for one table. Optional: sign up for Supabase, run schema in SQL editor."
            duration="20 min"
          />
          <LevelTile
            n={4}
            status="locked"
            title="Deployment flow"
            body="GitHub branch → PR → Vercel preview → merge → production. Env vars per environment. The biggest unlock for the project."
            exercise="Provision Supabase + Vercel. Deploy your first change. ~60 min."
            duration="60 min"
          />
          <LevelTile
            n={5}
            status="locked"
            title="SaaS architecture"
            body="Tenant, workspace_id, RLS, audit logs, the 3 layers of tenant defense. Why no seller can ever see another seller's data."
            exercise="Trace tenant rule across schema, RLS, RPCs. Try to leak data — watch RLS block it."
            duration="30 min"
          />
          <LevelTile
            n="★"
            status="locked"
            title="Bonus — ship a mini feature"
            body="Add one small feature to /app/setup/products (duplicate button, sort toggle, inline edit). End-to-end: branch, plan, implement, PR, review, merge, deploy."
            exercise="Pick one feature. Use the AI workflow from LEARNING_AI_WORKFLOW.md."
            duration="2-4 hr"
          />
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-accent-strong">
          Reference docs
        </h2>
        <p className="mt-2 text-sm text-text/75">
          Open these whenever you&apos;re lost or curious. They&apos;re for
          lookup, not start-to-finish reading.
        </p>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          <DocTile
            file="LEARNING.md"
            title="Curriculum (master)"
            body="The 5 levels in full detail. Concepts, anchors, exercises, success criteria. Includes the scavenger hunt and the cheat sheet."
          />
          <DocTile
            file="LEARNING_REPO_MAP.md"
            title="Repo map"
            body="Annotated tour of every key folder. Open when an AI agent says 'edit X' and you need to find it."
          />
          <DocTile
            file="LEARNING_GLOSSARY.md"
            title="Glossary"
            body="~80 technical terms in plain language, alphabetical. Tenant, RLS, RPC, hydration, JWT, satang, slug, etc."
          />
          <DocTile
            file="LEARNING_FLOWS.md"
            title="Sequence diagrams"
            body="What happens when you click — for 7 main flows: apply, auth gate, sale, customer portal claim, returning customer, admin approval, login."
          />
          <DocTile
            file="LEARNING_ERRORS.md"
            title="Reading errors"
            body="What error messages mean, by category: TS errors, hydration mismatch, RLS denials, build failures, Vercel errors. Open when something breaks."
          />
          <DocTile
            file="LEARNING_AI_WORKFLOW.md"
            title="Working with AI"
            body="Trigger phrases, prompt anatomy, when to plan vs implement, 10 common AI failure modes specific to this stack, ready-to-use templates."
          />
          <DocTile
            file="LEARNING_TYPESCRIPT.md"
            title="Reading TypeScript"
            body="10-minute cheat sheet. Read TS without learning to write it. Ten patterns + three real examples from MochiPOS."
          />
          <DocTile
            file="ROADMAP.md"
            title="Strategic roadmap"
            body="Where MochiPOS is going. Beachhead, vertical modules, Google Auth + invite, three-level data philosophy, six-month plan, pricing."
          />
        </ul>
      </section>

      <section className="mt-12 rounded-[var(--radius-lg)] border border-line bg-panel p-6">
        <h2 className="font-display text-xl text-accent-strong">
          The single rule of this curriculum
        </h2>
        <p className="mt-3 text-text/85">
          One level at a time. No skipping. Each level ends with a hands-on
          exercise — you don&apos;t graduate until you do it. The goal isn&apos;t
          to memorize but to <em>recognize</em>: when an AI agent says
          &ldquo;edit `src/app/app/pos/CartPanel.tsx`,&rdquo; you can immediately
          think <em>OK, that&apos;s a client component used in the POS page</em>.
        </p>
      </section>

      <footer className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link
          href="/"
          className="rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2 font-bold text-accent-strong hover:border-accent"
        >
          ← Marketing home
        </Link>
        <a
          href={REPO_DOC("LEARNING.md")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2 font-bold text-accent-strong hover:border-accent"
        >
          Open LEARNING.md on GitHub →
        </a>
      </footer>
    </main>
  );
}

function ResumeCallout() {
  return (
    <section className="mt-10 rounded-[var(--radius-lg)] border border-accent/30 bg-accent/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
        Today
      </p>
      <h2 className="mt-2 font-display text-2xl text-accent-strong">
        Level 1 — exercise pending
      </h2>
      <p className="mt-3 text-text/85">
        You&apos;ve been taught the 5 ideas of web app basics: frontend,
        backend, database, hosting, API. Now do the 10-minute DevTools
        exercise so the picture becomes concrete.
      </p>
      <ol className="mt-4 space-y-2 text-sm text-text/85">
        <li>
          <span className="font-bold text-accent-strong">1.</span> In Terminal
          inside <code className="rounded bg-panel px-1.5 py-0.5">pos-for-sell/</code>,
          run <code className="rounded bg-panel px-1.5 py-0.5">npm run dev</code>.
        </li>
        <li>
          <span className="font-bold text-accent-strong">2.</span> Open{" "}
          <code className="rounded bg-panel px-1.5 py-0.5">http://localhost:3000</code>{" "}
          in your browser.
        </li>
        <li>
          <span className="font-bold text-accent-strong">3.</span> Press{" "}
          <code className="rounded bg-panel px-1.5 py-0.5">F12</code>, click the{" "}
          <strong>Network</strong> tab, clear it.
        </li>
        <li>
          <span className="font-bold text-accent-strong">4.</span> Click around{" "}
          <code className="rounded bg-panel px-1.5 py-0.5">/apply</code>,{" "}
          <code className="rounded bg-panel px-1.5 py-0.5">/app</code>,{" "}
          <code className="rounded bg-panel px-1.5 py-0.5">/app/pos</code>.
        </li>
        <li>
          <span className="font-bold text-accent-strong">5.</span> Click any row
          to see Headers (request) and Response (server&apos;s reply). That IS
          the frontend↔backend conversation.
        </li>
      </ol>
      <p className="mt-4 text-sm text-muted">
        When you&apos;re done, tell Claude what you saw. Then Level 2 unlocks.
      </p>
    </section>
  );
}

function LevelTile({
  n,
  status,
  title,
  body,
  exercise,
  duration,
}: {
  n: number | string;
  status: Status;
  title: string;
  body: string;
  exercise: string;
  duration: string;
}) {
  return (
    <li>
      <article className="rounded-[var(--radius-lg)] border border-line bg-panel p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-strong/10 font-display text-base text-accent-strong">
            {n}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="font-display text-lg text-accent-strong">
                {title}
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text/80">{body}</p>
            <div className="mt-3 rounded-[var(--radius-md)] border border-line/60 bg-bg/50 px-3 py-2 text-xs text-text/75">
              <span className="font-bold text-accent-strong">Exercise · </span>
              {exercise}
              <span className="ml-2 text-muted">({duration})</span>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    "in-progress": {
      label: "in progress",
      cls: "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn-soft-fg)] border-[var(--color-warn-soft-fg)]/30",
    },
    locked: {
      label: "locked",
      cls: "bg-bg/60 text-muted border-line",
    },
    done: {
      label: "done",
      cls: "bg-accent/10 text-accent-strong border-accent/30",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function SurfaceTile({
  audience,
  title,
  body,
  links,
}: {
  audience: string;
  title: string;
  body: string;
  links: { href: string; label: string; primary?: boolean }[];
}) {
  return (
    <li>
      <article className="rounded-[var(--radius-lg)] border border-line bg-panel p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">
          For {audience}
        </p>
        <h3 className="mt-1 font-display text-lg text-accent-strong">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text/80">{body}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`inline-block rounded-[var(--radius-md)] border px-2 py-1 text-[11px] font-bold transition-colors ${
                  link.primary
                    ? "border-accent bg-accent/10 text-accent-strong hover:bg-accent/20"
                    : "border-line bg-bg/50 text-text/80 hover:border-accent hover:text-accent-strong"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </li>
  );
}

function DocTile({
  file,
  title,
  body,
}: {
  file: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <a
        href={REPO_DOC(file)}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4 hover:border-accent"
      >
        <p className="font-display text-lg text-accent-strong">{title}</p>
        <p className="mt-1 text-sm text-text/80">{body}</p>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted">
          docs/{file}
        </p>
      </a>
    </li>
  );
}
