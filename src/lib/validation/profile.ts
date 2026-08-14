import { z } from "zod";

/**
 * Self-service profile edit.
 *
 * SECURITY: `email` and `role` are deliberately absent. zod strips unknown
 * keys by default, so a crafted form post containing `role: "admin"` is
 * silently discarded rather than escalating. Asserted in profiles.test.ts.
 */
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120),
  university: z.string().max(160).optional().or(z.literal("")),
  degree: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  gradYear: z.coerce.number().int().min(1950).max(2100).optional(),
  bio: z.string().max(500).optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
