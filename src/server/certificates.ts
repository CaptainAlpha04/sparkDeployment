import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  certificates,
  certificateTemplates,
  checkIns,
  events,
  profiles,
  registrations,
  type Certificate,
  type CertificateTemplate,
  type TemplateField,
} from "./schema";
import { requireAdmin, requireUser } from "./auth";
import { generateCertificateCode, normalizeCode } from "@/lib/certificate-code";

/* ── Templates ─────────────────────────────────────────────────────────── */

export async function listTemplates(): Promise<CertificateTemplate[]> {
  await requireAdmin();
  return db
    .select()
    .from(certificateTemplates)
    .orderBy(desc(certificateTemplates.updatedAt));
}

export async function getTemplate(id: string): Promise<CertificateTemplate | null> {
  await requireAdmin();
  const [row] = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.id, id))
    .limit(1);
  return row ?? null;
}

export async function createTemplate(input: {
  name: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: TemplateField[];
  eventId?: string | null;
}): Promise<CertificateTemplate> {
  const admin = await requireAdmin();
  const [row] = await db
    .insert(certificateTemplates)
    .values({ ...input, createdBy: admin.id })
    .returning();
  return row;
}

export async function updateTemplate(
  id: string,
  input: { name?: string; fields?: TemplateField[]; eventId?: string | null },
): Promise<CertificateTemplate> {
  await requireAdmin();
  const [row] = await db
    .update(certificateTemplates)
    .set(input)
    .where(eq(certificateTemplates.id, id))
    .returning();
  if (!row) throw new Error("Template not found");
  return row;
}

export async function deleteTemplate(id: string): Promise<void> {
  await requireAdmin();
  // The FK from certificates uses ON DELETE RESTRICT, so this throws rather
  // than orphaning issued certificates. Surfaced as a readable message.
  const [used] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(certificates)
    .where(eq(certificates.templateId, id));

  if (used.n > 0) {
    throw new Error(
      `This template has issued ${used.n} certificate(s) and cannot be deleted.`,
    );
  }

  await db.delete(certificateTemplates).where(eq(certificateTemplates.id, id));
}

/* ── Issuance ──────────────────────────────────────────────────────────── */

export type IssuanceCandidate = {
  userId: string;
  recipientName: string;
  alreadyIssued: boolean;
};

/**
 * Who is eligible for a certificate for this event.
 *
 * Eligibility is CHECK-IN, not registration. Registering and not turning up
 * must not earn a certificate, otherwise the credential means nothing.
 */
export async function listIssuanceCandidates(
  eventId: string,
): Promise<IssuanceCandidate[]> {
  await requireAdmin();

  const rows = await db
    .select({
      userId: registrations.userId,
      fullName: profiles.fullName,
      certificateId: certificates.id,
    })
    .from(checkIns)
    .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
    .innerJoin(profiles, eq(registrations.userId, profiles.id))
    .leftJoin(
      certificates,
      and(
        eq(certificates.eventId, registrations.eventId),
        eq(certificates.userId, registrations.userId),
        isNull(certificates.revokedAt),
      ),
    )
    .where(eq(registrations.eventId, eventId));

  return rows.map((r) => ({
    userId: r.userId,
    recipientName: r.fullName ?? "Member",
    alreadyIssued: r.certificateId !== null,
  }));
}

async function insertWithUniqueCode(
  values: Omit<typeof certificates.$inferInsert, "code">,
): Promise<Certificate> {
  // The unique index on `code` is the real guarantee; this retries the
  // astronomically unlikely collision rather than failing the whole batch.
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await db
      .insert(certificates)
      .values({ ...values, code: generateCertificateCode() })
      .onConflictDoNothing({ target: certificates.code })
      .returning();
    if (row) return row;
  }
  throw new Error("Could not allocate a unique certificate code");
}

/**
 * Issues certificates to every checked-in attendee who does not already hold
 * one. Idempotent: running it twice does not produce duplicates.
 */
export async function issueCertificatesForEvent(
  eventId: string,
  templateId: string,
): Promise<{ issued: number; skipped: number }> {
  const admin = await requireAdmin();

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new Error("Event not found");

  const [template] = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.id, templateId))
    .limit(1);
  if (!template) throw new Error("Template not found");

  const candidates = await listIssuanceCandidates(eventId);
  const pending = candidates.filter((c) => !c.alreadyIssued);

  for (const candidate of pending) {
    await insertWithUniqueCode({
      templateId,
      eventId,
      userId: candidate.userId,
      // Snapshotted — see the schema comment. A later profile rename must not
      // alter an already-awarded certificate.
      recipientName: candidate.recipientName,
      eventTitle: event.title,
      eventDate: event.startsAt,
      issuedBy: admin.id,
    });
  }

  return {
    issued: pending.length,
    skipped: candidates.length - pending.length,
  };
}

export async function revokeCertificate(
  id: string,
  reason: string,
): Promise<Certificate> {
  await requireAdmin();
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("A reason is required to revoke a certificate");

  const [row] = await db
    .update(certificates)
    .set({ revokedAt: new Date(), revokedReason: trimmed })
    .where(eq(certificates.id, id))
    .returning();

  if (!row) throw new Error("Certificate not found");
  return row;
}

/* ── Verification (PUBLIC) ─────────────────────────────────────────────── */

export type VerificationResult =
  | { status: "not_found" }
  | {
      status: "valid" | "revoked";
      recipientName: string;
      eventTitle: string;
      eventDate: Date;
      issuedAt: Date;
      code: string;
      revokedReason: string | null;
    };

/**
 * Public certificate lookup. No authentication — that is the point.
 *
 * Returns only what is already printed on the certificate itself. It must
 * never expose the holder's email, user id, or any other event attendee,
 * since anyone with a code can call this.
 *
 * A revoked certificate reports `revoked` rather than `not_found`: silently
 * 404ing a revoked credential would leave the holder unable to tell a typo
 * from a withdrawal.
 */
export async function verifyCertificate(
  rawCode: string,
): Promise<VerificationResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { status: "not_found" };

  const [row] = await db
    .select({
      code: certificates.code,
      recipientName: certificates.recipientName,
      eventTitle: certificates.eventTitle,
      eventDate: certificates.eventDate,
      issuedAt: certificates.issuedAt,
      revokedAt: certificates.revokedAt,
      revokedReason: certificates.revokedReason,
    })
    .from(certificates)
    .where(eq(certificates.code, code))
    .limit(1);

  if (!row) return { status: "not_found" };

  return {
    status: row.revokedAt ? "revoked" : "valid",
    code: row.code,
    recipientName: row.recipientName,
    eventTitle: row.eventTitle,
    eventDate: row.eventDate,
    issuedAt: row.issuedAt,
    revokedReason: row.revokedReason,
  };
}

/* ── Member view ───────────────────────────────────────────────────────── */

export type MyCertificate = Certificate & {
  template: CertificateTemplate;
};

export async function getMyCertificates(): Promise<MyCertificate[]> {
  const me = await requireUser();

  const rows = await db
    .select({ certificate: certificates, template: certificateTemplates })
    .from(certificates)
    .innerJoin(
      certificateTemplates,
      eq(certificates.templateId, certificateTemplates.id),
    )
    // Scoped to the caller's own id, taken from the verified session — never
    // from a parameter.
    .where(eq(certificates.userId, me.id))
    .orderBy(desc(certificates.issuedAt));

  return rows.map((r) => ({ ...r.certificate, template: r.template }));
}

export async function getCertificateForRender(
  code: string,
): Promise<{ certificate: Certificate; template: CertificateTemplate } | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const [row] = await db
    .select({ certificate: certificates, template: certificateTemplates })
    .from(certificates)
    .innerJoin(
      certificateTemplates,
      eq(certificates.templateId, certificateTemplates.id),
    )
    .where(eq(certificates.code, normalized))
    .limit(1);

  return row ?? null;
}
