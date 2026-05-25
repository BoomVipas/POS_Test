// DD-26 — approve_application / reject_application RPCs.
//
// These run the real plpgsql under pglite (same harness as redeem_invite_code)
// so the admin gate, the atomic invite-code mint, the application status flip,
// the audit row, and the pending-only guard are exercised for real — not
// asserted against a SQL-string mock.
//
// The return value is read via to_jsonb(func()) on purpose: `(func()).*` would
// re-evaluate the (INSERTing) function once per output column — a classic
// Postgres footgun — whereas to_jsonb evaluates it exactly once.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { bootDb } from "./helpers/pglite";

let db: PGlite;
let seq = 0;

beforeAll(async () => {
  db = await bootDb(["approve_application.sql", "reject_application.sql"]);
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

async function newAdmin(): Promise<string> {
  const uid = await newUser();
  await db.query(`insert into public.admin_users(user_id) values ($1)`, [uid]);
  return uid;
}

async function seedApplication(
  status = "pending",
): Promise<{ id: string; email: string; brand: string }> {
  seq++;
  const email = `applicant${seq}@example.com`;
  const brand = `Brand ${seq}`;
  const r = await db.query<{ id: string }>(
    `insert into public.applications(owner_name, phone, email, brand_name, product_category, status)
     values ('Owner', '0800000000', $1, $2, 'toys', $3) returning id`,
    [email, brand, status],
  );
  return { id: r.rows[0].id, email, brand };
}

async function actAs(uid: string): Promise<void> {
  await db.exec(`set test.user_id = '${uid}'`);
}

type InviteRow = {
  code: string;
  email: string;
  brand_name: string;
  status: string;
  application_id: string;
  created_by: string | null;
  expires_at: string;
};

async function approve(appId: string, code: string): Promise<InviteRow> {
  const r = await db.query<{ rec: InviteRow }>(
    `select to_jsonb(public.approve_application($1, $2)) as rec`,
    [appId, code],
  );
  return r.rows[0].rec;
}

async function reject(appId: string): Promise<void> {
  await db.query(`select public.reject_application($1)`, [appId]);
}

async function scalar<T>(sql: string, params: unknown[] = []): Promise<T> {
  const r = await db.query<{ v: T }>(sql, params);
  return r.rows[0]?.v;
}

describe("approve_application — happy path", () => {
  it("mints the invite from the application, flips it to 'invited', and audits", async () => {
    const admin = await newAdmin();
    const app = await seedApplication();
    await actAs(admin);

    const code = `CATBOOTH-A${seq}AA-BBBB`;
    const invite = await approve(app.id, code);

    // Returned row carries the application's email/brand and is active.
    expect(invite.code).toBe(code);
    expect(invite.email).toBe(app.email);
    expect(invite.brand_name).toBe(app.brand);
    expect(invite.status).toBe("active");
    expect(invite.application_id).toBe(app.id);
    expect(invite.created_by).toBe(admin);
    expect(Date.parse(invite.expires_at)).toBeGreaterThan(Date.now());

    // Persisted invite row.
    expect(
      await scalar<string>(
        `select status as v from public.invite_codes where code = $1`,
        [code],
      ),
    ).toBe("active");

    // Application flipped to 'invited' and stamped with the reviewer.
    expect(
      await scalar<string>(
        `select status as v from public.applications where id = $1`,
        [app.id],
      ),
    ).toBe("invited");
    expect(
      await scalar<string>(
        `select reviewed_by as v from public.applications where id = $1`,
        [app.id],
      ),
    ).toBe(admin);

    // Audit row in the same transaction.
    expect(
      await scalar<number>(
        `select count(*)::int as v from public.audit_logs
           where action = 'approve_application' and target_id = $1`,
        [app.id],
      ),
    ).toBe(1);
  });
});

describe("approve_application — guards", () => {
  it("requires an authenticated user", async () => {
    const app = await seedApplication();
    await db.exec(`set test.user_id = ''`);
    await expect(approve(app.id, `CATBOOTH-N${seq}NO-AAAA`)).rejects.toThrow(
      /auth required/,
    );
  });

  it("requires an admin", async () => {
    const plain = await newUser();
    const app = await seedApplication();
    await actAs(plain);
    await expect(approve(app.id, `CATBOOTH-P${seq}LN-AAAA`)).rejects.toThrow(
      /admin required/,
    );
    // Nothing was minted.
    expect(
      await scalar<number>(
        `select count(*)::int as v from public.invite_codes where application_id = $1`,
        [app.id],
      ),
    ).toBe(0);
  });

  it("rejects a non-existent application", async () => {
    const admin = await newAdmin();
    await actAs(admin);
    await expect(
      approve("00000000-0000-0000-0000-000000000000", `CATBOOTH-Z${seq}ZZ-AAAA`),
    ).rejects.toThrow(/application not found/);
  });

  it("refuses to approve twice (pending-only guard blocks a double-click)", async () => {
    const admin = await newAdmin();
    const app = await seedApplication();
    await actAs(admin);
    await approve(app.id, `CATBOOTH-D${seq}B1-AAAA`);
    await expect(approve(app.id, `CATBOOTH-D${seq}B2-AAAA`)).rejects.toThrow(
      /only pending/,
    );
    // Still exactly one code for that application.
    expect(
      await scalar<number>(
        `select count(*)::int as v from public.invite_codes where application_id = $1`,
        [app.id],
      ),
    ).toBe(1);
  });

  it("propagates a unique-code collision (the caller's retry path is real)", async () => {
    const admin = await newAdmin();
    const app1 = await seedApplication();
    const app2 = await seedApplication();
    await actAs(admin);
    const dupe = `CATBOOTH-U${seq}NQ-AAAA`;
    await approve(app1.id, dupe);
    await expect(approve(app2.id, dupe)).rejects.toThrow(/duplicate|unique/i);
  });
});

describe("reject_application", () => {
  it("flips a pending application to 'rejected' and audits", async () => {
    const admin = await newAdmin();
    const app = await seedApplication();
    await actAs(admin);
    await reject(app.id);

    expect(
      await scalar<string>(
        `select status as v from public.applications where id = $1`,
        [app.id],
      ),
    ).toBe("rejected");
    expect(
      await scalar<string>(
        `select reviewed_by as v from public.applications where id = $1`,
        [app.id],
      ),
    ).toBe(admin);
    expect(
      await scalar<number>(
        `select count(*)::int as v from public.audit_logs
           where action = 'reject_application' and target_id = $1`,
        [app.id],
      ),
    ).toBe(1);
  });

  it("requires an admin", async () => {
    const plain = await newUser();
    const app = await seedApplication();
    await actAs(plain);
    await expect(reject(app.id)).rejects.toThrow(/admin required/);
  });

  it("only acts on pending applications", async () => {
    const admin = await newAdmin();
    const app = await seedApplication("rejected");
    await actAs(admin);
    await expect(reject(app.id)).rejects.toThrow(/only pending/);
  });
});
