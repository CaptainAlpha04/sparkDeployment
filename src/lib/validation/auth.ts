import { z } from "zod";

/**
 * Shared by client and server so validation cannot drift. The old app
 * validated password strength only in the browser, so the rules were
 * trivially bypassable by posting directly.
 */
const password = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[a-z]/, "One lowercase letter")
  .regex(/\d/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Please enter your name").max(120),
    email: z.email("Enter a valid email"),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
