import { describe, expect, it } from "vitest";
import { isAdminRole, isModeratorRole } from "./auth";

describe("role predicates", () => {
  it("treats admin as admin", () => {
    expect(isAdminRole("admin")).toBe(true);
  });

  it("does not treat member or moderator as admin", () => {
    expect(isAdminRole("member")).toBe(false);
    expect(isAdminRole("moderator")).toBe(false);
  });

  it("treats both moderator and admin as moderator-capable", () => {
    expect(isModeratorRole("moderator")).toBe(true);
    expect(isModeratorRole("admin")).toBe(true);
    expect(isModeratorRole("member")).toBe(false);
  });

  it("rejects null, undefined, and unknown roles", () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isModeratorRole(null)).toBe(false);
    // An unrecognised role must never be treated as privileged.
    expect(isAdminRole("superuser")).toBe(false);
    expect(isModeratorRole("Admin")).toBe(false);
  });
});
