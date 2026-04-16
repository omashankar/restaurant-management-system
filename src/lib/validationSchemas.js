import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Name is required." })
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name too long.")
    .trim(),
  email: z
    .string({ required_error: "Email is required." })
    .email("Invalid email address.")
    .max(100, "Email too long.")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required." })
    .min(6, "Password must be at least 6 characters.")
    .max(72, "Password too long."),
  role: z.enum(["admin", "manager", "waiter", "chef"], {
    required_error: "Role is required.",
    message: "Invalid role.",
  }),
  restaurantName: z.string().max(100).trim().optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .email("Invalid email address.")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required." })
    .min(1, "Password is required."),
  rememberMe: z.boolean().optional().default(false),
});

export const resendSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .email("Invalid email address.")
    .toLowerCase()
    .trim(),
});

/** Parse schema — returns data or throws first error message */
export function parseSchema(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? "Invalid input.";
    throw new Error(msg);
  }
  return result.data;
}
