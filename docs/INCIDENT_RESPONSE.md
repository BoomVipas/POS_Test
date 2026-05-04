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
4. **Inventory rejected (insufficient stock)** — staff likely closed a sale before adjusting stock. Adjust inventory via `/app/inventory` (DD-95) or via SQL editor:
   ```sql
   update public.event_inventory
     set current_qty = current_qty + 5
     where event_id = '...' and product_id = '...';
   ```
   Then audit_log a manual reason.

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
