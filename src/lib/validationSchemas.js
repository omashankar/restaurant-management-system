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

export const orderItemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  qty: z.number().int().positive("Item quantity must be positive."),
  price: z.number().nonnegative("Item price cannot be negative."),
  menuItemId: z.string().optional(),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required."),
  orderType: z.enum(["dine-in", "takeaway", "delivery"], { message: "Invalid orderType." }),
  tableNumber: z.string().trim().nullable().optional(),
  customer: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const orderPatchSchema = z.object({
  status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]).optional(),
  notes: z.string().trim().max(500).optional(),
});

const customerCheckoutInfoSchema = z
  .object({
    name: z.string().min(1, "Customer name is required."),
    phone: z.string().optional().default(""),
    email: z.union([z.string().email("Invalid email address."), z.literal("")]).optional().default(""),
    address: z.string().optional(),
    tableNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const phoneOk = String(data.phone ?? "").trim().length > 0;
    const em = String(data.email ?? "").trim();
    const emailOk = em.length > 0 && z.string().email().safeParse(em).success;
    if (!phoneOk && !emailOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a phone number or a valid email for contact.",
        path: ["phone"],
      });
    }
  });

export const customerCheckoutSchema = z.object({
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Item name is required."),
    price: z.number().nonnegative("Item price cannot be negative."),
    qty: z.number().int().positive("Item quantity must be positive."),
  })).min(1, "At least one item is required."),
  orderType: z.enum(["dine-in", "takeaway", "delivery"], { message: "Invalid orderType." }),
  customer: customerCheckoutInfoSchema,
  notes: z.string().trim().max(500).optional(),
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
