import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { verifyCertificate } from "./certificates";
import { generateCertificateCode } from "@/lib/certificate-code";
import {
  CLEANUP_TIMEOUT,
  deleteAuthUsersByIds,
  deleteEventsByIds,
  deleteTemplatesByIds,
} from "@/test/cleanup";

/**
 * verifyCertificate is the one certificate function with no auth guard — it is
 * public by design — so it is directly testable and worth testing hard. The
 * admin-guarded functions call requireAdmin, which needs a request context.
 */

const userIds: string[] = [];
const eventIds: string[] = [];
const templateIds: string[] = [];

async function fixture(opts: { revoked?: boolean } = {}) {
  const userId = crypto.randomUUID();
  await db.execute(sql`
    insert into auth.users
      (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (${userId}, '00000000-0000-0000-0000-000000000000', 'authenticated',
            'authenticated', ${`cert-${userId}@test.dev`},
            ${'{"full_name":"Fixture User"}'}::jsonb, now(), now())
  `);
  userIds.push(userId);

  const [event] = await db.execute(sql`
    insert into events (slug, title, starts_at, ends_at, status)
    values (${`cert-ev-${userId}`}, 'Fixture Event',
            '2025-10-27T09:00:00Z', '2025-10-27T12:00:00Z', 'completed')
    returning id
  `);
  eventIds.push(event.id as string);

  const [template] = await db.execute(sql`
    insert into certificate_templates
      (name, background_url, background_width, background_height, fields)
    values ('Fixture', 'https://example.com/bg.png', 2000, 1414, '[]'::jsonb)
    returning id
  `);
  templateIds.push(template.id as string);

  const code = generateCertificateCode();
  await db.execute(sql`
    insert into certificates
      (code, template_id, event_id, user_id, recipient_name, event_title,
       event_date, revoked_at, revoked_reason)
    values (${code}, ${template.id}, ${event.id}, ${userId},
            'Ayesha Khan', 'SPARKx Talk', '2025-10-27T09:00:00Z',
            ${opts.revoked ? new Date().toISOString() : null},
            ${opts.revoked ? "Issued in error" : null})
  `);

  return { code, userId };
}

afterAll(async () => {
  await deleteAuthUsersByIds(userIds);
  await deleteEventsByIds(eventIds);
  await deleteTemplatesByIds(templateIds);
}, CLEANUP_TIMEOUT);

describe("verifyCertificate", () => {
  it("confirms a genuine certificate", async () => {
    const { code } = await fixture();
    const result = await verifyCertificate(code);

    expect(result.status).toBe("valid");
    if (result.status === "not_found") throw new Error("unreachable");
    expect(result.recipientName).toBe("Ayesha Khan");
    expect(result.eventTitle).toBe("SPARKx Talk");
    expect(result.code).toBe(code);
  });

  it("never exposes anything beyond what is printed on the certificate", async () => {
    // Anyone with a code can call this, so it must not leak the holder's
    // email, user id, or any other attendee of the event.
    const { code } = await fixture();
    const result = await verifyCertificate(code);
    const keys = Object.keys(result);

    expect(keys).not.toContain("userId");
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("id");
    expect(keys.sort()).toEqual(
      [
        "code",
        "eventDate",
        "eventTitle",
        "issuedAt",
        "recipientName",
        "revokedReason",
        "status",
      ].sort(),
    );
  });

  it("reports a revoked certificate as revoked, not missing", async () => {
    // 404ing a revoked certificate would leave the holder unable to tell a
    // typo from a withdrawal.
    const { code } = await fixture({ revoked: true });
    const result = await verifyCertificate(code);

    expect(result.status).toBe("revoked");
    if (result.status === "not_found") throw new Error("unreachable");
    expect(result.revokedReason).toBe("Issued in error");
  });

  it("accepts a code typed loosely", async () => {
    const { code } = await fixture();
    const body = code.replace("SPARK-", "").replace("-", "");

    expect((await verifyCertificate(code.toLowerCase())).status).toBe("valid");
    expect((await verifyCertificate(` ${code} `)).status).toBe("valid");
    expect((await verifyCertificate(body)).status).toBe("valid");
  });

  it("returns not_found for unknown or malformed codes", async () => {
    expect((await verifyCertificate("SPARK-ZZZZ-ZZZZ")).status).toBe("not_found");
    expect((await verifyCertificate("")).status).toBe("not_found");
    expect((await verifyCertificate("nonsense")).status).toBe("not_found");
  });

  it("is not vulnerable to SQL injection through the code", async () => {
    const result = await verifyCertificate("'; drop table certificates; --");
    expect(result.status).toBe("not_found");

    // The table must still exist.
    const rows = await db.execute(
      sql`select count(*)::int as n from certificates`,
    );
    expect(typeof rows[0].n).toBe("number");
  });
});
