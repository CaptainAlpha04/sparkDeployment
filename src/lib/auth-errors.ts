/**
 * Turns Supabase auth failures into something a person can act on.
 *
 * This exists because of a compounding failure we actually hit. Supabase's
 * built-in mailer is capped at a couple of messages an hour on the free tier,
 * so at an event where several people sign up together, everyone after the
 * first is refused with `over_email_send_rate_limit`. They never receive a
 * confirmation mail. They then try to sign in, and the sign-in path reported
 * every failure as "Incorrect email or password" — so the message told them to
 * check a password that was perfectly correct.
 *
 * Two rules here:
 *
 * `invalid_credentials` stays deliberately vague. Distinguishing "no such
 * user" from "wrong password" is an account-enumeration oracle and the message
 * is actionable either way: check what you typed.
 *
 * Everything else is named. `email_not_confirmed` does technically confirm an
 * account exists, which is the trade being made knowingly: signup already
 * discloses that with "User already registered", and a user who cannot be told
 * to check their inbox is simply stuck.
 */

export type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

/** Shown when the mailer is refusing, which is a configuration problem, not the user's. */
export const EMAIL_RATE_LIMITED =
  "We could not send the confirmation email just now. Continue with Google, or try again in a few minutes.";

const BY_CODE: Record<string, string> = {
  invalid_credentials: "Incorrect email or password",
  email_not_confirmed:
    "Confirm your email first. Check your inbox, and your spam folder, for the link we sent.",
  over_email_send_rate_limit: EMAIL_RATE_LIMITED,
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  user_already_exists: "That email already has an account. Sign in instead.",
  email_exists: "That email already has an account. Sign in instead.",
  weak_password: "Pick a stronger password.",
  email_address_invalid: "That email address was rejected. Check it for typos.",
  signup_disabled: "New accounts are closed at the moment.",
  validation_failed: "Check the details you entered.",
  same_password: "That is already your password.",
  over_sms_send_rate_limit: "Too many attempts. Wait a few minutes and try again.",
};

/**
 * Some deployments still return only a message. Matched on substrings that
 * Supabase has used, lowercased, so casing changes upstream do not silently
 * turn a known error back into the generic fallback.
 */
const BY_MESSAGE: [RegExp, string][] = [
  [/email rate limit exceeded/i, EMAIL_RATE_LIMITED],
  [/for security purposes.*(\d+) seconds/i, "Too many attempts. Wait a minute and try again."],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/user already registered/i, BY_CODE.user_already_exists],
  [/password should be at least/i, BY_CODE.weak_password],
  [/unable to validate email address/i, BY_CODE.email_address_invalid],
];

const FALLBACK = "Something went wrong. Please try again.";

export function authErrorMessage(error: AuthErrorLike | null | undefined): string {
  if (!error) return FALLBACK;

  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];

  const message = error.message ?? "";
  for (const [pattern, text] of BY_MESSAGE) {
    if (pattern.test(message)) return text;
  }

  // 429 with an unrecognised code is still a rate limit, and saying so beats
  // the generic fallback.
  if (error.status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }

  return FALLBACK;
}

/** True when the failure is the mailer refusing, not anything the user did. */
export function isEmailRateLimit(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "over_email_send_rate_limit" ||
    /email rate limit exceeded/i.test(error.message ?? "")
  );
}
