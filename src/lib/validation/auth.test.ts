import { describe, expect, it } from "vitest";
import { signUpSchema, signInSchema } from "./auth";
import { profileUpdateSchema } from "./profile";

const valid = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Str0ng!pass",
  confirmPassword: "Str0ng!pass",
};

describe("signUpSchema", () => {
  it("accepts a valid signup", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(
      signUpSchema.safeParse({ ...valid, confirmPassword: "other" }).success,
    ).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: "Ab1!", confirmPassword: "Ab1!" })
        .success,
    ).toBe(false);
  });

  it("requires upper, lower, digit, and symbol", () => {
    for (const pw of ["alllowercase1!", "ALLUPPERCASE1!", "NoDigits!!!", "NoSymbol123"]) {
      expect(
        signUpSchema.safeParse({ ...valid, password: pw, confirmPassword: pw }).success,
      ).toBe(false);
    }
  });

  it("rejects a malformed email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(
      false,
    );
  });
});

describe("signInSchema", () => {
  it("accepts email and non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(
      true,
    );
  });

  it("rejects an empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(
      false,
    );
  });
});

describe("profileUpdateSchema", () => {
  it("accepts a full valid profile", () => {
    expect(
      profileUpdateSchema.safeParse({
        fullName: "Ada Lovelace",
        university: "NUST",
        degree: "BSCS",
        phone: "03001234567",
        gradYear: 2027,
        bio: "Builder.",
      }).success,
    ).toBe(true);
  });

  it("rejects an implausible graduation year", () => {
    expect(profileUpdateSchema.safeParse({ fullName: "A B", gradYear: 1800 }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ fullName: "A B", gradYear: 3000 }).success).toBe(false);
  });

  it("strips email and role so a form post cannot escalate privileges", () => {
    const r = profileUpdateSchema.safeParse({
      fullName: "A B",
      email: "attacker@example.com",
      role: "admin",
    });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("email");
    expect(r.data).not.toHaveProperty("role");
  });
});
