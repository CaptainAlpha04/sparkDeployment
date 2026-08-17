import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  isEmailRateLimit,
  EMAIL_RATE_LIMITED,
} from "./auth-errors";

/**
 * The codes here are the ones this project's Supabase instance actually
 * returned when probed, not ones taken from documentation.
 */
describe("authErrorMessage", () => {
  it("keeps bad credentials vague", () => {
    // Distinguishing "no such user" from "wrong password" is an enumeration
    // oracle, and the advice is the same either way.
    const unknownUser = authErrorMessage({
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });
    const wrongPassword = authErrorMessage({
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });

    expect(unknownUser).toBe("Incorrect email or password");
    expect(unknownUser).toBe(wrongPassword);
  });

  it("names the mailer rate limit instead of blaming the password", () => {
    // The bug this whole module exists for: the confirmation mail is never
    // sent, so sign-in fails, and the old code told the user their password
    // was wrong.
    expect(
      authErrorMessage({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
      }),
    ).toBe(EMAIL_RATE_LIMITED);
  });

  it("tells an unconfirmed user to check their inbox", () => {
    const message = authErrorMessage({
      code: "email_not_confirmed",
      message: "Email not confirmed",
    });
    expect(message).toMatch(/confirm your email/i);
    expect(message).not.toMatch(/incorrect/i);
  });

  it("falls back to the message when no code is supplied", () => {
    // Older clients and some endpoints return a message only.
    expect(authErrorMessage({ message: "email rate limit exceeded" })).toBe(
      EMAIL_RATE_LIMITED,
    );
    expect(authErrorMessage({ message: "User already registered" })).toMatch(
      /already has an account/i,
    );
  });

  it("treats an unrecognised 429 as a rate limit rather than a generic error", () => {
    expect(authErrorMessage({ status: 429, message: "???" })).toMatch(
      /too many attempts/i,
    );
  });

  it("never leaks a raw Supabase message", () => {
    // Signup used to surface error.message verbatim.
    const raw = "pq: duplicate key value violates unique constraint";
    expect(authErrorMessage({ message: raw })).not.toContain("pq:");
  });

  it("handles null and empty errors without throwing", () => {
    expect(authErrorMessage(null)).toMatch(/something went wrong/i);
    expect(authErrorMessage(undefined)).toMatch(/something went wrong/i);
    expect(authErrorMessage({})).toMatch(/something went wrong/i);
  });
});

describe("isEmailRateLimit", () => {
  it("recognises the limit by code and by message", () => {
    expect(isEmailRateLimit({ code: "over_email_send_rate_limit" })).toBe(true);
    expect(isEmailRateLimit({ message: "email rate limit exceeded" })).toBe(true);
  });

  it("does not fire on unrelated failures", () => {
    expect(isEmailRateLimit({ code: "invalid_credentials" })).toBe(false);
    expect(isEmailRateLimit(null)).toBe(false);
  });
});
