import { describe, expect, it } from "vitest";
import { isPublic } from "./proxy";

/**
 * The middleware allowlist decides what a signed-out visitor can reach. It is
 * a plain array, so a route can silently fall off it, and the failure mode is
 * asymmetric: forgetting to add a route quietly breaks a public feature, while
 * adding the wrong one quietly exposes private data.
 *
 * /verify was originally missing, which redirected employers checking a
 * certificate to a login page and defeated the whole feature.
 */
describe("public routes", () => {
  it("lets anyone verify a certificate without an account", () => {
    // The entire point: the person checking a certificate is an employer or a
    // university, and they will never have a login here.
    expect(isPublic("/verify")).toBe(true);
    expect(isPublic("/verify/SPARK-A7K2-9QX4")).toBe(true);
  });

  it("keeps the marketing site open", () => {
    for (const path of [
      "/",
      "/mission",
      "/alliance",
      "/events",
      "/events/sparkx-talk",
      "/highlights",
      "/legal",
      "/jobs",
      "/products",
      "/research",
      "/sponsorship",
    ]) {
      expect(isPublic(path), path).toBe(true);
    }
  });

  it("keeps the auth screens reachable when signed out", () => {
    expect(isPublic("/login")).toBe(true);
    expect(isPublic("/signup")).toBe(true);
    expect(isPublic("/auth/callback")).toBe(true);
  });

  it("protects the holder's own certificate copy", () => {
    // The public result at /verify shows what is printed on the certificate.
    // The downloadable artwork is the holder's, and stays private.
    expect(isPublic("/certificates/SPARK-A7K2-9QX4")).toBe(false);
  });

  it("protects member and admin areas", () => {
    for (const path of [
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/certificates",
      "/admin",
      "/admin/events",
      "/admin/members",
      "/admin/certificates",
      "/admin/certificates/issue",
    ]) {
      expect(isPublic(path), path).toBe(false);
    }
  });

  it("does not treat a prefix as a path boundary", () => {
    // "/verifying-something" must not slip through on the strength of
    // starting with "/verify".
    expect(isPublic("/verifyer")).toBe(false);
    expect(isPublic("/adminx")).toBe(false);
    expect(isPublic("/eventsomething")).toBe(false);
  });
});
