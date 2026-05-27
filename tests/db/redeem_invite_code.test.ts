// DD-36 / DD-38 — redeem_invite_code RPC (workspace + owner-membership creation).
//
// The register flow (DD-33–38) calls this security-definer RPC after creating
// the auth user, to turn a valid invite into a live workspace transactionally.
// It was previously untested; these pglite cases pin the happy path and every
// guard (auth required, invalid/used/cancelled/expired code, one-workspace-per-
// owner, slug format) so a future change can't silently weaken it.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { bootDb } from "./helpers/pglite";

let db: PGlite;
let seq = 0;

beforeAll(async () => {
  db = await bootDb(["redeem_invite_code.sql"]);
});

afterAll(async () => {
  await db.close();
});

async function newUser(): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into auth.users default values returning id`,
  );
  return r.rows[0].id;
}

/** Seed an application + invite code (unique email/code per call). */
async function seedInvite(opts: {
  code: string;
  brand?: string;
  status?: string;
  days?: number;
}): Promise<void> {
  seq++;
  const email = `seller${seq}@example.com`;
  await db.query(
    `
    with a as (
      insert into public.applications(owner_name, phone, email, brand_name, product_category, status)
      values ('Owner', '0800000000', $1, $2, 'toys', 'invited') returning id
    )
    insert into public.invite_codes(application_id, code, email, brand_name, status, expires_at)
    select a.id, $3, $1, $2, $4, now() + make_interval(days => $5::int) from a
  `,
    [email, opts.brand ?? "Brand", opts.code, opts.status ?? "active", opts.days ?? 14],
  );
}

/** Create a fresh user (sets auth.uid()) + a fresh active invite. */
async function freshScenario(opts: Partial<{ status: string; days: number }> = {}) {
  seq++;
  const code = `CATBOOTH-T${seq}AA-BBBB`;
  const brand = `Brand ${seq}`;
  const uid = await newUser();
  await seedInvite({ code, brand, status: opts.status, days: opts.days });
  await db.exec(`set test.user_id = '${uid}'`);
  return { uid, code, brand };
}

async function redeem(code: string, brand: string, slug: string): Promise<string> {
  const r = await db.query<{ wid: string }>(
    `select public.redeem_invite_code($1, $2, $3) as wid`,
    [code, brand, slug],
  );
  return r.rows[0].wid;
}

async function scalar<T>(sql: string, params: unknown[] = []): Promise<T> {
  const r = await db.query<{ v: T }>(sql, params);
  return r.rows[0]?.v;
}

describe("redeem_invite_code — happy path (DD-36/38)", () => {
  it("creates the workspace, owner membership, marks the code used, registers the application, audits", async () => {
    const { uid, code, brand } = await freshScenario();
    const wid = await redeem(code, brand, "brand-happy");
    expect(wid).toMatch(/^[0-9a-f-]{36}$/);

    expect(
      await scalar<string>(
        `select owner_user_id as v from public.workspaces where id = $1`,
        [wid],
      ),
    ).toBe(uid);
    expect(
      await scalar<string>(`select slug as v from public.workspaces where id = $1`, [
        wid,
      ]),
    ).toBe("brand-happy");

    expect(
      await scalar<string>(
        `select role as v from public.workspace_members where workspace_id = $1 and user_id = $2`,
        [wid, uid],
      ),
    ).toBe("owner");

    expect(
      await scalar<string>(
        `select status as v from public.invite_codes where code = $1`,
        [code],
      ),
    ).toBe("used");
    expect(
      await scalar<string>(
        `select used_by_user_id as v from public.invite_codes where code = $1`,
        [code],
      ),
    ).toBe(uid);

    // The linked application flips to 'registered'.
    expect(
      await scalar<number>(
        `select count(*)::int as v from public.applications where status = 'registered'`,
      ),
    ).toBeGreaterThanOrEqual(1);

    // An audit row was written in the same transaction.
    expect(
      await scalar<number>(
        `select count(*)::int as v from public.audit_logs where action = 'redeem_invite_code' and target_id = $1`,
        [wid],
      ),
    ).toBe(1);
  });
});

describe("redeem_invite_code — guards", () => {
  it("requires an authenticated user", async () => {
    await freshScenario();
    await db.exec(`set test.user_id = ''`);
    await expect(redeem("CATBOOTH-NOPE-AAAA", "B", "no-auth")).rejects.toThrow(
      /auth required/,
    );
  });

  it("rejects an unknown code", async () => {
    await freshScenario();
    await expect(redeem("CATBOOTH-XXXX-XXXX", "B", "unknown-code")).rejects.toThrow(
      /invalid code/,
    );
  });

  it("rejects a code that was already used", async () => {
    const a = await freshScenario();
    await redeem(a.code, a.brand, "used-first");
    // A different user tries the same code.
    const u2 = await newUser();
    await db.exec(`set test.user_id = '${u2}'`);
    await expect(redeem(a.code, a.brand, "used-second")).rejects.toThrow(
      /already used/,
    );
  });

  it("rejects a cancelled code", async () => {
    const s = await freshScenario({ status: "cancelled" });
    await expect(redeem(s.code, s.brand, "cancelled")).rejects.toThrow(/cancelled/);
  });

  it("rejects an expired code without pretending to lazily persist status='expired'", async () => {
    const s = await freshScenario({ days: -1 });
    await expect(redeem(s.code, s.brand, "expired")).rejects.toThrow(/expired/);
    // Expiry is enforced by expires_at. The old lazy status flip was dead code:
    // it ran immediately before RAISE, so PostgreSQL rolled it back.
    expect(
      await scalar<string>(
        `select status as v from public.invite_codes where code = $1`,
        [s.code],
      ),
    ).toBe("active");
  });

  it("rejects a second workspace for an owner who already has one", async () => {
    const a = await freshScenario();
    await redeem(a.code, a.brand, "owner-one");
    // Same user, a second valid invite.
    const code2 = `CATBOOTH-DUP${seq}-CCCC`;
    await seedInvite({ code: code2, brand: a.brand });
    await db.exec(`set test.user_id = '${a.uid}'`);
    await expect(redeem(code2, a.brand, "owner-two")).rejects.toThrow(
      /already owns a workspace/,
    );
  });

  it("rejects an invalid slug format", async () => {
    const s = await freshScenario();
    await expect(redeem(s.code, s.brand, "Bad Slug!")).rejects.toThrow(
      /invalid slug format/,
    );
  });
});
