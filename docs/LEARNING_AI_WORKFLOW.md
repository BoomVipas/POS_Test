# Working with AI Agents on MochiPOS

> Practical patterns for prompting Claude / Codex / GPT effectively on this codebase. Companion to [LEARNING.md](LEARNING.md).
> The skill that compounds most: **getting good output the first time** instead of iterating five times. Every section below is something a senior engineer working with AI would do automatically — written down so you can do it on day one.

---

## The mental model

You're not the engineer. You're the **product owner with veto power**. The AI is a fast, opinionated, sometimes-wrong junior engineer. Your job:

1. Tell the AI **what** to build and **why** (in business terms).
2. Let the AI propose a plan.
3. Read the plan and push back on bad parts.
4. Let the AI implement.
5. Read the diff and verify it matches what you agreed.
6. Test it yourself in the browser.

The single most expensive mistake: **skipping step 5**. AI confidently says "done" and you trust it without reading the diff. That's how bugs ship.

---

## Trigger phrases that work in this project

These are encoded in your memory (Claude/Codex know them):

| Phrase | What it triggers |
|---|---|
| **"run non-stop"** | Long-haul autonomous mode. Huge scope, ~5h end-to-end, no mid-run confirmation pauses. Use sparingly — only when scope is well-defined. |
| **"do whatever you want"** | Autonomous mode. Surface only blockers. Use after you've agreed on direction. |
| **"do it now"** | Execute end-to-end without confirmation pauses. |
| **"run end to end"** | Complete the full task without pausing for approval mid-way. |
| **"I will check when the last task already implement"** | Same — execute autonomously, you'll review afterward. |
| **"i think you can do it, review and merge them by yourself i believe in you"** | Self-review and merge — apply when there are open PRs you've already reviewed conceptually. |

Use these *carefully*. Each one trades safety for speed. For something risky (auth, money, RLS, migrations), prefer a planning phase first.

---

## Good prompt anatomy

```
[GOAL]      One sentence: what business outcome.
[WHY]       Why this matters / what triggered it.
[WHERE]     Files / areas / table / RPC affected.
[NOT-DOING] Anything explicitly out of scope.
[ACCEPTANCE] How you'll know it's done.
```

### Bad prompt

> "Add a duplicate product button"

The AI guesses scope: which page, what behavior on duplicate, does it copy stock too, does it deep-copy or shallow, does it open the edit modal afterward, etc. You'll iterate 4 times.

### Good prompt

> Goal: cashier can duplicate an existing product card on `/app/setup/products`. Why: at events, sellers often have variant SKUs that share most fields and it's faster to duplicate than to type all over.
>
> Where: `src/app/app/setup/products/CatalogManager.tsx`. Reuses the existing form modal.
>
> Not doing: doesn't copy stock counts (stock is per-event, not per-product). Doesn't auto-rename to "(copy)" — let cashier choose new name.
>
> Acceptance: clicking "Duplicate" on a row opens the existing form modal pre-filled with all product fields except `id` and `sku`. Saving creates a new product row. SKU validation prevents duplicate SKUs (existing rule).

The AI implements once, correctly.

---

## When to plan first vs implement directly

### Plan first if any of:
- Touches money, stock, payments, refunds, voids
- Touches auth, RLS, multi-tenant data
- Adds or changes a database table or RPC
- Crosses 3+ files
- You're not sure what the right approach is
- The change is reversible only with effort

### Implement directly if:
- Cosmetic change (text, padding, color)
- Single file, well-isolated
- You know exactly what you want and the AI has done similar before

### How to ask for a plan

> "Plan only — don't implement. Goal: [...]. List the files you'd touch, the functions you'd add/change, the tests you'd write, and any open questions. Keep it under 300 words."

Read the plan. Push back on:
- Anything that seems like overkill (premature abstraction, "let me also refactor...")
- Anything that drifts from your goal
- Missing safety checks (RLS? `workspace_id`? audit log?)
- Tests that won't catch regressions

Once aligned, say "Implement the plan."

---

## When to spawn subagents

Subagents (the `Agent` tool with `subagent_type`) are for parallelizable independent work or for protecting your main context window from a flood of tool results.

### Use a subagent for:
- Searching the codebase across 5+ files when you don't know where something is
- Independent research tasks while the main agent works on something else
- Reviewing a specific PR or area without polluting the main thread

### Don't use a subagent for:
- The main implementation task
- Anything where you want to see the agent's reasoning step-by-step
- A simple grep / file read

### How to ask

> "Spawn an Explore agent to find every place `workspace_id` is referenced in the codebase. Have it report back a categorized list."

The main agent delegates, you don't have to read all the search hits.

---

## How to review AI-generated code

When the AI says "done," do this in order:

### 1. Read the diff

Not the AI's summary — the actual diff. `git diff` or your editor's source-control panel. The summary describes intent; the diff is reality.

Look for:
- **Files you didn't expect.** "Why did it touch X?" Often a hint of scope creep.
- **Big diffs in unrelated areas.** AI sometimes "helpfully" reformats whole files.
- **New dependencies in `package.json`.** Always confirm before merging.
- **Removed lines you didn't agree to.**

### 2. Check the safety dimensions

For any change that touches data:

- [ ] Does every new query include `workspace_id`?
- [ ] Does every new table have RLS enabled + a policy?
- [ ] Does every new RPC check `is_workspace_member` before doing work?
- [ ] Does every money column use `bigint` (satang)?
- [ ] Does every new mutation write an audit log row?
- [ ] Does every Server Action validate input with Zod (or equivalent)?

If any answer is no, ask why.

### 3. Run it

- `npm test` — do tests pass?
- `npm run build` — does it build?
- `npm run dev` — does the feature actually work in the browser?

The AI doesn't always run these; you should.

### 4. Use the feature like a real cashier

For UI work, *use the feature* — don't just verify it renders. Click around, edit something, undo something, refresh the page, try the edge cases. AI often gets the happy path right and breaks the edge cases.

---

## Common AI failure modes in this stack

These are real patterns I've seen go wrong; preempt them by being specific.

### 1. Inventing files / functions / props
The AI hallucinates a function that doesn't exist (e.g., `import { foo } from '@/lib/foo'` when `foo` was never written). Always check imports against actual files.

### 2. Reinventing existing patterns
The AI writes a new helper instead of reusing an existing one. Before any new file, ask: *"Does a helper for this already exist? Search the codebase first."*

### 3. Forgetting `workspace_id`
The single most dangerous bug. AI writes `select * from products` and forgets the filter. RLS *should* save you, but defense-in-depth means the app code should explicitly filter too. Always grep new queries for `workspace_id`.

### 4. Skipping the demo-mode fallback
Everything in MochiPOS has a demo-mode path that works without Supabase. AI sometimes implements only the real path. Ask: *"Does this work in demo mode? If not, mirror the existing pattern."*

### 5. Premature abstraction
AI loves to extract "shared utility" code on the first occurrence. Three similar lines is fine; abstract on the third repeat, not the first. Push back if a "small fix" comes with new generic helpers.

### 6. Dropping tests
AI sometimes deletes failing tests instead of fixing them. Always check `tests/` for removals. Run `npm test` before merging.

### 7. Cosmetic creep
"Add a button" turns into "I also reorganized the layout, renamed three variables, and updated the tooltip text." Each of those might be fine but together they make the diff hard to review. Ask the AI to keep changes minimal.

### 8. Forgetting `"use client"` / `"use server"`
AI writes a client hook in a server component, or vice versa. The build error is clear, but only at build time. Add this to your review checklist.

### 9. Service role key in client code
The most catastrophic possible bug. `SUPABASE_SERVICE_ROLE_KEY` referenced from any file rendered on the client is a tenant-isolation breach. Always grep new code for `SERVICE_ROLE_KEY` and confirm only `src/lib/supabase/admin.ts` and server-only files import it.

### 10. JWT not refreshed
On long sessions, the JWT expires and the user gets RLS-denied. The middleware in `src/proxy.ts` handles this — make sure new server-side helpers use `createClient()` from `src/lib/supabase/server.ts` (not raw `createSupabaseClient`).

---

## How to brief an AI agent for a new session

When you start a fresh session (no prior context), give it the context it needs:

```
You're working on MochiPOS. Read these in order:

1. pos-for-sell/docs/ROADMAP.md (canonical direction)
2. pos-for-sell/CLAUDE.md (project execution rules)
3. pos-for-sell/TASKS.md (current state of work)
4. pos-for-sell/docs/PROJECT_VISION.md (pilot scope)

I'm a builder/founder, not a full-time programmer. Connect technical
choices to booth/business reality. Read pos-for-sell/CLAUDE.md
"Working with this user" section for tone.

Today's goal: [...]
```

A 4-line brief saves you from getting generic best-practice advice that ignores the specific architecture of this project.

---

## Common requests + the prompts that work

### "Add a feature"
```
Goal: [one sentence]
Why: [business reason]
Where: [files or area]
Acceptance: [how to know it's done]

Plan only first. Don't implement until I say go.
```

### "Fix a bug"
```
Bug: [what's broken]
How to reproduce: [steps]
Expected: [what should happen]
Actual: [what does happen]
Where I think it lives: [file:line, if you know]

Find the root cause first. Don't propose a fix until you've shown me
the line that's wrong.
```

### "Review a PR"
```
Review PR #N. Check for:
- Tenant isolation (workspace_id, RLS, is_workspace_member)
- Money safety (satang bigint, no floats)
- Demo-mode parity (does it work without Supabase?)
- Existing pattern reuse (anything reinventing?)
- Test coverage

Report any concerns under 300 words.
```

### "Explain this file"
```
Read [file]. Explain in booth terms what it does, who calls it, and
what could go wrong. Connect to one of the flows in
pos-for-sell/docs/LEARNING_FLOWS.md.
```

### "Help me understand this error"
```
Error: [paste the FULL message]
File: [path]:[line]
What I was doing: [one sentence]
Recent changes: [if any]

What does this error mean and what's the fix?
```

---

## When to NOT use AI

- When you're learning. Sometimes "let me struggle with this for 20 min" is the only way to build the muscle. AI shortcuts the struggle and you don't grow.
- When the change is trivial (rename, typo). Just edit it.
- When you don't know what you want. Use AI for execution, not for figuring out the answer in the first place. (Talk to a person, sketch on paper, walk around.)

---

## Bottom line

Treat AI like a fast intern. Brief well. Verify everything. Don't merge what you haven't read. The compounding effect of these habits is the difference between "AI made me 2× faster" and "AI shipped a SaaS that 5 sellers are paying for."
