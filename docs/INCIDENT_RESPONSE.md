# Incident Response

Lightweight playbook for the pilot. Will get more formal when the user count is past 5.

## Severity

| Severity | Symptom | Response time |
|---|---|---|
| **SEV-1** | Cannot record sales at any pilot booth | Immediate — within 15 min |
| **SEV-2** | One workspace can't sell, others fine | Within 1 hour |
| **SEV-3** | Wrong total / display bug, sale recorded correctly | Same day |
| **SEV-4** | Cosmetic, low-volume | Next business day |

## On-call

During the pilot, the founder is on-call during all event days. Pilot clients get a Line/WhatsApp number and use it.

## Common SEV-1 causes (anticipate)

1. **Supabase outage** — check https://status.supabase.com. If down, no fix on our side; communicate with the affected booth, suggest paper backup, log the loss.
2. **Vercel build broken** — rollback via Vercel dashboard → Promote previous deployment. Takes seconds.
3. **Auth broken (can't log in)** — check Supabase Auth logs. Reset rate-limit if applicable. Verify env vars haven't drifted.
4. **Inventory rejected (insufficient stock)** — staff likely closed a sale before adjusting stock. Use one of the actual in-app paths first; the SQL fallback below is a last resort.
   - **`/app/stock-count`** (Wave 33) — open a count session, enter the physical count, commit. Logs a variance reason automatically. Best for end-of-day reconciliation.
   - **`/app/inventory/samples`** (Wave 39b) — only if the issue is that units are stuck in the sample bucket. Use `Return` to move sample units back to sellable.
   - **`/app/setup/products`** — for one-off adjustments tied to a specific SKU.
   - **SQL fallback** (only if the UI is also down):
     ```sql
     update public.event_inventory
       set current_qty = current_qty + 5
       where event_id = '...' and product_id = '...';
     insert into public.audit_logs (workspace_id, user_id, action, table_name, new_value)
       values ('...', '...', 'manual_inventory_fix', 'event_inventory',
               jsonb_build_object('reason', 'SEV-1 fix', 'delta', 5));
     ```
     Audit log row is required so the fix is traceable.

## After-incident

For every SEV-1 or SEV-2, write a postmortem in `docs/postmortems/YYYY-MM-DD-slug.md`:

```
# YYYY-MM-DD — short title

## Impact
- workspaces affected, time window, sales lost

## Detection
- how we found out, time-to-detect

## Cause
- root cause; not just the proximate trigger

## Resolution
- what fixed it, how long it took

## Action items
- [ ] preventative fix
- [ ] better detection
- [ ] better mitigation
```

## Backups

Supabase auto-backs-up Postgres daily. For pilot we can rely on that. After pilot, set up point-in-time recovery and weekly export snapshots into cold storage.

## Comms

Pilot clients receive a status update within 30 min of any SEV-1 they're affected by. Even if no fix is in hand yet — they need to know we're aware.
