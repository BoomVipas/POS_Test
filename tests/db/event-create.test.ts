// Repro for the "/app/events new event errors on any input" bug (Problemiesd,
// manual test). createEvent did `.insert(...).select("id").single()`; under RLS
// the select-back can fail (same class the apply-insert fix #87fe597 hit), and
// the returned id is unused. This pins that an owner CAN insert an event under
// the real RLS policies and read it back as a member — the insert-only path.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  bootRlsDb,
  seedWorkspace,
  actAs,
  actAsSuperuser,
} from "./helpers/pglite";

let db: PGlite;

beforeAll(async () => {
  db = await bootRlsDb([]);
});

afterAll(async () => {
  await db.close();
});

describe("event create under RLS (Problemiesd bug)", () => {
  it("an owner can insert an event and a member can read it (insert-only path)", async () => {
    const ws = await seedWorkspace(db);
    await actAs(db, ws.userId); // act as the workspace owner under RLS

    await db.exec(
      `insert into public.events
         (workspace_id, name, venue, start_date, end_date, status)
       values ('${ws.workspaceId}', 'Pet Expo 2026', null,
               '2026-07-30', '2026-08-02', 'planned')`,
    );

    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from public.events
         where workspace_id = $1 and name = 'Pet Expo 2026'`,
      [ws.workspaceId],
    );
    expect(r.rows[0].n).toBe(1);

    await actAsSuperuser(db);
  });

  it("a non-member cannot insert an event (RLS WITH CHECK holds)", async () => {
    const ws = await seedWorkspace(db);
    // a fresh authed user with NO membership in ws
    const u = await db.query<{ id: string }>(
      `insert into auth.users default values returning id`,
    );
    await actAs(db, u.rows[0].id);
    await expect(
      db.exec(
        `insert into public.events
           (workspace_id, name, venue, start_date, end_date, status)
         values ('${ws.workspaceId}', 'Sneaky', null,
                 '2026-07-30', '2026-08-02', 'planned')`,
      ),
    ).rejects.toThrow();
    await actAsSuperuser(db);
  });
});
