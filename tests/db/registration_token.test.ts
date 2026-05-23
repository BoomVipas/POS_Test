// Wave 41j — registration-token hardening (findings D5, D6).
//
// D5: claim_registration_token raised three distinguishable errors — "token
//     not found", "token already claimed", "token expired" — letting a caller
//     enumerate which tokens exist / are live. All token-failure paths must
//     return one indistinguishable generic error.
// D6: create_registration_token shaped a base64 token but only truncated when
//     length >= 16; a strip-heavy roll could be inserted shorter than 16. The
//     generator must re-roll until the floor holds.
//
// Runs the real plpgsql in pglite (see helpers/pglite.ts).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { bootDb, createOrder, seedWorkspace, type SeededWorkspace } from "./helpers/pglite";

let db: PGlite;
let ws: SeededWorkspace;
let orderId: string;

beforeAll(async () => {
  db = await bootDb([
    "create_order.sql",
    "create_registration_token.sql",
    "claim_registration_token.sql",
  ]);
  ws = await seedWorkspace(db);
  orderId = await createOrder(db, {
    workspace_id: ws.workspaceId,
    event_id: ws.eventId,
    payment_method: "cash",
    items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
  });
});

afterAll(async () => {
  await db.close();
});

/** Insert a token row directly so D5 can stage not-found/claimed/expired states. */
async function insertToken(opts: {
  token: string;
  claimed?: boolean;
  expired?: boolean;
}): Promise<void> {
  await db.query(
    `insert into public.customer_registration_tokens
       (workspace_id, order_id, token, expires_at, claimed_at)
     values ($1, $2, $3,
       case when $5 then now() - interval '1 day' else now() + interval '90 days' end,
       case when $4 then now() else null end)`,
    [ws.workspaceId, orderId, opts.token, opts.claimed ?? false, opts.expired ?? false],
  );
}

async function claimError(token: string): Promise<string> {
  const payload = { customer: { display_name: "Test" }, contacts: [], pets: [] };
  try {
    await db.query(`select public.claim_registration_token($1, $2::jsonb)`, [
      token,
      JSON.stringify(payload),
    ]);
    throw new Error("EXPECTED_CLAIM_TO_THROW");
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "EXPECTED_CLAIM_TO_THROW") throw e;
    return msg;
  }
}

describe("claim_registration_token de-oracle (Wave 41j, D5)", () => {
  it("returns the same generic error for not-found, claimed, and expired tokens", async () => {
    await insertToken({ token: "claimed-token-0001", claimed: true });
    await insertToken({ token: "expired-token-0001", expired: true });

    const notFound = await claimError("does-not-exist-0001");
    const claimed = await claimError("claimed-token-0001");
    const expired = await claimError("expired-token-0001");

    // All three must be byte-identical — no path may reveal which state it hit.
    expect(claimed).toBe(notFound);
    expect(expired).toBe(notFound);
    // And must not leak the specific reason.
    expect(notFound).not.toMatch(/not found|already claimed|expired/i);
    expect(notFound).toMatch(/invalid token/i);
  });

  it("still accepts a valid, unclaimed, unexpired token", async () => {
    await insertToken({ token: "valid-token-000001" });
    const r = await db.query<{ cid: string }>(
      `select public.claim_registration_token($1, $2::jsonb) as cid`,
      ["valid-token-000001", JSON.stringify({ customer: { display_name: "OK" }, contacts: [], pets: [] })],
    );
    expect(r.rows[0].cid).toBeTruthy();
  });
});

describe("create_registration_token generator floor (Wave 41j, D6)", () => {
  // Deterministically force the first random draw to be strip-heavy (all 0xFF →
  // base64 all '/' → empty after stripping). The buggy generator only truncated
  // when length >= 16, so it would emit that empty/short token; the fix must
  // re-roll until the 16-char floor holds. The shim returns clean bytes after
  // the forced rolls, so a correct generator terminates.
  async function forceStripHeavyRolls(n: number): Promise<void> {
    await db.exec(`alter sequence public._grb_call_no restart with 1;`);
    await db.exec(`set test.strip_heavy_rolls = ${n};`);
  }
  async function clearStripHeavy(): Promise<void> {
    await db.exec(`set test.strip_heavy_rolls = 0;`);
  }

  it("re-rolls past a strip-heavy draw instead of issuing a short token", async () => {
    await forceStripHeavyRolls(1);
    try {
      const r = await db.query<{ t: string }>(
        `select public.create_registration_token($1) as t`,
        [orderId],
      );
      expect(r.rows[0].t.length).toBeGreaterThanOrEqual(16);
    } finally {
      await clearStripHeavy();
    }
  });

  it("survives several consecutive strip-heavy draws", async () => {
    await forceStripHeavyRolls(3);
    try {
      const r = await db.query<{ t: string }>(
        `select public.create_registration_token($1) as t`,
        [orderId],
      );
      expect(r.rows[0].t.length).toBe(16);
    } finally {
      await clearStripHeavy();
    }
  });

  it("records token_length >= 16 in the audit log", async () => {
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_logs
         where action = 'create_registration_token'
           and (new_value->>'token_length')::int < 16`,
    );
    expect(r.rows[0].n).toBe(0);
  });
});
