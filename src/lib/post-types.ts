/**
 * Post value shapes shared by the database layer and the UI.
 *
 * These live in lib rather than alongside the Drizzle schema for the same
 * reason the certificate field types do: the composer and the reading view
 * both need them, and the ESLint boundary rightly stops UI code importing
 * from src/server/schema. The schema imports these; nothing flows back.
 */

/** A headline figure on a case study, e.g. { label: "Students", value: "120" }. */
export type PostOutcome = { label: string; value: string };

export type PostKind = "article" | "case_study";
export type PostStatus = "draft" | "published" | "archived";
