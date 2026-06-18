import { z } from "zod";
import { isValidIndianMobile, extractIndianMobileDigits } from "@/lib/phoneUtils";
import { computeSubscriptionSchedule } from "@/lib/subscriptionSchedule";

const guestNameSchema = z
  .string()
  .trim()
  .min(2, "Customer name must be at least 2 characters.")
  .max(80, "Name too long.")
  .refine((v) => /[a-zA-Z\u0900-\u097F]/.test(v), "Customer name must include letters.");

const indianPhoneSchema = z
  .string()
  .trim()
  .refine((v) => isValidIndianMobile(extractIndianMobileDigits(v)), {
    message: "Enter a valid 10-digit Indian mobile number.",
  });

const optionalIndianPhoneSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || isValidIndianMobile(extractIndianMobileDigits(v)), {
    message: "Enter a valid 10-digit Indian mobile number.",
  });

const slugSchema = z
  .string({ required_error: "Customer site URL (slug) is required." })
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters.")
  .max(60, "Slug too long.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only use lowercase letters, numbers, and hyphens.");

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Name is required." })
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name too long.")
    .trim()
    .refine((v) => /[a-zA-Z\u0900-\u097F]/.test(v), "Name must include letters."),
  email: z
    .string({ required_error: "Email is required." })
    .email("Invalid email address.")
    .max(100, "Email too long.")
    .toLowerCase()
    .trim(),
  phone: optionalIndianPhoneSchema,
  password: z
    .string({ required_error: "Password is required." })
    .min(6, "Password must be at least 6 characters.")
    .max(72, "Password too long."),
  restaurantName: z
    .string({ required_error: "Restaurant name is required." })
    .min(2, "Restaurant name is required.")
    .max(100)
    .trim(),
  slug: slugSchema,
});

export const customerUpsertSchema = z.object({
  name: guestNameSchema,
  phone: indianPhoneSchema,
  email: z.union([z.literal(""), z.string().email("Invalid email address.")]).optional(),
  notes: z.string().trim().max(500).optional(),
});

const restaurantNameSchema = z
  .string()
  .trim()
  .min(2, "Restaurant name is required.")
  .max(100, "Restaurant name too long.")
  .refine((v) => /[a-zA-Z\u0900-\u097F]/.test(v), "Restaurant name must include letters.");

export const superAdminRestaurantCreateSchema = z.object({
  name: restaurantNameSchema,
  slug: slugSchema,
  ownerName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /[a-zA-Z\u0900-\u097F]/.test(v), "Owner name must include letters."),
  ownerEmail: z.string().email("Invalid email address.").toLowerCase().trim(),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters.").max(72),
  phone: optionalIndianPhoneSchema,
  plan: z.enum(["free", "starter", "pro", "enterprise"], { message: "Invalid plan." }),
  address: z.string().trim().max(200).optional(),
  status: z.enum(["active", "inactive", "suspended"], { message: "Invalid status." }),
});

const planLimitValueSchema = z.number().int().min(-1, "Limit must be -1 (unlimited) or a whole number ≥ -1.");

export const superAdminPlanUpsertSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Plan name is required.")
    .max(60, "Plan name too long.")
    .refine((v) => /[a-zA-Z0-9]/.test(v), "Plan name must include letters or numbers."),
  monthlyPrice: z
    .number({ invalid_type_error: "Monthly price is required." })
    .min(0, "Monthly price cannot be negative.")
    .max(999999, "Monthly price is too large."),
  yearlyPrice: z
    .number({ invalid_type_error: "Yearly price is required." })
    .min(0, "Yearly price cannot be negative.")
    .max(999999, "Yearly price is too large."),
  billingCycle: z.enum(["monthly", "yearly"], { message: "Billing cycle must be monthly or yearly." }),
  description: z.string().trim().max(500).optional(),
  features: z.array(z.string().trim().min(1)).max(50).optional(),
  limits: z
    .object({
      staff: planLimitValueSchema,
      tables: planLimitValueSchema,
      menuItems: planLimitValueSchema,
      orders: planLimitValueSchema,
    })
    .optional(),
});

export const superAdminPlanPatchSchema = superAdminPlanUpsertSchema.partial();

export const superAdminAssignPlanSchema = z
  .object({
    restaurantId: z.string().trim().min(1, "Select a restaurant."),
    planSlug: z.string().trim().min(1, "Select a plan."),
    billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    trialDays: z.preprocess(
      (v) => (v === "" || v == null ? 0 : Number(v)),
      z
        .number({ invalid_type_error: "Trial days must be a number." })
        .int("Trial days must be a whole number.")
        .min(0, "Trial days cannot be negative.")
        .max(90, "Trial days cannot exceed 90.")
    ),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && !data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Set a start date when specifying an end date.",
      });
    }
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (Number.isNaN(start.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startDate"],
          message: "Invalid start date.",
        });
      }
      if (Number.isNaN(end.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "Invalid end date.",
        });
      } else if (!Number.isNaN(start.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "End date must be on or after start date.",
        });
      } else if (!Number.isNaN(start.getTime()) && data.trialDays > 0) {
        const schedule = computeSubscriptionSchedule({
          startDate: data.startDate,
          billingCycle: data.billingCycle,
          trialDays: data.trialDays,
        });
        if (end < schedule.billingStart) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "End date must be after the trial period.",
          });
        }
      }
    }
  });

export const superAdminRestaurantUpdateSchema = z.object({
  name: restaurantNameSchema,
  slug: slugSchema,
  phone: optionalIndianPhoneSchema,
  plan: z.enum(["free", "starter", "pro", "enterprise"], { message: "Invalid plan." }),
  address: z.string().trim().max(200).optional(),
});

/** Status toggle from Super Admin restaurants list — PATCH body is only { status }. */
export const superAdminRestaurantStatusPatchSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"], { message: "Invalid status." }),
});

export const staffCreateSchema = z.object({
  name: guestNameSchema,
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters.").max(72),
  role: z.preprocess(
    (v) => String(v ?? "").toLowerCase(),
    z.enum(["manager", "waiter", "chef"], { message: "Role must be manager, waiter, or chef." }),
  ),
  phone: optionalIndianPhoneSchema,
});

export const reservationCreateSchema = z.object({
  customerName: guestNameSchema,
  phone: optionalIndianPhoneSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date (YYYY-MM-DD)."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time (HH:MM)."),
  guests: z.number().int().min(1).max(50).optional(),
  tableNumber: z.string().trim().max(20).optional(),
  area: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
});

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required.").max(120),
  category: z.string().trim().max(60).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().trim().min(1, "Unit is required.").max(30),
  reorderLevel: z.number().int().min(0).optional(),
  supplier: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const menuCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(80),
  description: z.string().trim().max(300).optional(),
});

const priceField = z.preprocess(
  (v) => (v === "" || v == null ? NaN : Number(v)),
  z
    .number({ invalid_type_error: "Price is required." })
    .nonnegative("Price cannot be negative.")
    .max(999999, "Price is too large.")
);

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required.").max(120),
  categoryId: z.string().trim().min(1, "Category is required."),
  price: priceField,
  description: z.string().trim().max(500).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const tableSchema = z.object({
  tableNumber: z
    .string()
    .trim()
    .min(1, "Table number is required.")
    .max(20, "Table number is too long."),
  capacity: z
    .number({ invalid_type_error: "Capacity is required." })
    .int("Capacity must be a whole number.")
    .min(1, "Capacity must be at least 1.")
    .max(50, "Capacity cannot exceed 50."),
  categoryId: z.string().trim().min(1, "Select a floor area.").optional(),
});

export const tableAreaSchema = z.object({
  name: z.string().trim().min(1, "Area name is required.").max(80),
  description: z.string().trim().max(300).optional(),
});

export const supportTicketCreateSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(120),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(5000),
  priority: z.enum(["low", "medium", "high", "urgent"], { message: "Invalid priority." }),
});

export const staffUpdateSchema = z.object({
  name: guestNameSchema,
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
  phone: optionalIndianPhoneSchema,
  role: z.preprocess(
    (v) => String(v ?? "").toLowerCase(),
    z.enum(["manager", "waiter", "chef"], { message: "Role must be manager, waiter, or chef." })
  ),
});

export const printerConfigSchema = z.object({
  name: z.string().trim().min(1, "Printer name is required.").max(60),
  type: z.enum(["network", "bluetooth", "usb"]),
  ipAddress: z.string().trim().max(45).optional(),
  port: z.string().trim().max(6).optional(),
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
  note: z.string().trim().max(200).optional(),
});

export const orderCreateSchema = z
  .object({
    items: z.array(orderItemSchema).min(1, "At least one item is required."),
    orderType: z.enum(["dine-in", "takeaway", "delivery"], { message: "Invalid orderType." }),
    tableNumber: z.string().trim().nullable().optional(),
    customer: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
    subtotal: z.number().nonnegative().optional(),
    taxAmount: z.number().nonnegative().optional(),
    serviceCharge: z.number().nonnegative().optional(),
    taxPercent: z.number().nonnegative().optional(),
    serviceChargePercent: z.number().nonnegative().optional(),
    paymentMethod: z
      .enum(["cod", "cashCounter", "upi", "card", "netBanking", "wallet", "payLater", "bankTransfer"])
      .optional(),
    paymentStatus: z.enum(["paid", "pending", "initiated", "processing", "failed"]).optional(),
  })
  .superRefine((data, ctx) => {
    const customer = String(data.customer ?? "").trim();
    const table = data.tableNumber != null ? String(data.tableNumber).trim() : "";

    if (data.orderType === "dine-in") {
      if (!table) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tableNumber"],
          message: "Table is required for dine-in orders.",
        });
      }
      if (!customer || customer === "Walk-in") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customer"],
          message: "Customer is required for dine-in orders.",
        });
      }
    }

    if (data.orderType === "takeaway") {
      if (!customer || customer === "Walk-in") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customer"],
          message: "Customer is required for takeaway orders.",
        });
      }
    }

    if (data.orderType === "delivery") {
      const nameResult = guestNameSchema.safeParse(customer);
      if (!nameResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customer"],
          message: nameResult.error.issues[0]?.message ?? "Customer name is required.",
        });
      }
      const notes = String(data.notes ?? "").trim();
      const addressPart = notes.includes("Address:")
        ? notes.split("Address:").pop()?.trim() ?? ""
        : notes;
      if (!addressPart || addressPart.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notes"],
          message: "Delivery address is required.",
        });
      }
    }
  });

export const orderPatchSchema = z.object({
  status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentStatus: z.enum(["paid", "pending", "initiated", "processing", "failed"]).optional(),
});

const customerCheckoutInfoSchema = z
  .object({
    name: guestNameSchema,
    phone: z.string().optional().default(""),
    email: z.union([z.string().email("Invalid email address."), z.literal("")]).optional().default(""),
    address: z.string().optional(),
    tableNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const rawPhone = String(data.phone ?? "").trim();
    const digits = rawPhone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);
    const phoneOk = /^[6-9]\d{9}$/.test(digits);
    const em = String(data.email ?? "").trim();
    const emailOk = em.length > 0 && z.string().email().safeParse(em).success;
    if (!phoneOk && !emailOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a valid mobile number or email for contact.",
        path: ["phone"],
      });
    }
    if (rawPhone && !phoneOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid 10-digit Indian mobile number.",
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
  paymentMethod: z
    .enum(["cod", "cashCounter", "upi", "card", "netBanking", "wallet", "payLater", "bankTransfer"], {
      message: "Invalid payment method.",
    })
    .optional()
    .default("cod"),
  customer: customerCheckoutInfoSchema,
  notes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(40).optional(),
  pointsRedeemed: z.number().int().nonnegative().optional(),
  scheduleFor: z.string().trim().max(40).optional(),
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
