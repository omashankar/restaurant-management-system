/**
 * Shared form validators — keep client + server messages aligned where possible.
 */
import { validatePlatformPassword } from "@/lib/platformPassword";
import {
  extractIndianMobileDigits,
  isValidIndianMobile,
} from "@/lib/phoneUtils";
import { optionalLinkError } from "@/lib/landingValidation";
import {
  customerUpsertSchema,
  inventoryItemSchema,
  menuCategorySchema,
  menuItemSchema,
  orderCreateSchema,
  printerConfigSchema,
  reservationCreateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  supportTicketCreateSchema,
  tableAreaSchema,
  tableSchema,
} from "@/lib/validationSchemas";
import { emailFormatError } from "@/lib/emailValidation";
import {
  computeBillingEndDate,
  computeSubscriptionSchedule,
  describeSubscriptionSchedule,
  formatDateInputValue,
  getAssignPlanSchedulePreview,
  parseTrialDaysValue,
  withAutoAssignEndDate,
} from "@/lib/subscriptionSchedule";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export {
  isValidGuestName,
  isValidEmail,
  isValidContactMessage,
  isValidGuestCount,
  validateCheckoutContact,
} from "@/lib/customerFormValidation";

export { validatePlatformPassword } from "@/lib/platformPassword";

export { isValidEmailAddress, emailFormatError } from "@/lib/emailValidation";

export function emailError(email, { required = true } = {}) {
  return emailFormatError(email, { required });
}

export function isValidPersonName(name, { min = 2, max = 80 } = {}) {
  const trimmed = String(name ?? "").trim();
  if (trimmed.length < min) return false;
  if (trimmed.length > max) return false;
  return /[a-zA-Z\u0900-\u097F]/.test(trimmed);
}

export function personNameError(name, label = "Name") {
  if (!String(name ?? "").trim()) return `${label} is required.`;
  if (!isValidPersonName(name)) {
    return `${label} must be at least 2 characters and include letters.`;
  }
  return null;
}

export function indianPhoneError(phone, { required = true } = {}) {
  const digits = extractIndianMobileDigits(phone);
  if (!digits) return required ? "Mobile number is required." : null;
  if (!isValidIndianMobile(digits)) {
    return "Enter a valid 10-digit Indian mobile number (starts with 6–9).";
  }
  return null;
}

export function optionalIndianPhoneError(phone) {
  const digits = extractIndianMobileDigits(phone);
  if (!digits) return null;
  if (!isValidIndianMobile(digits)) {
    return "Enter a complete 10-digit mobile number (starts with 6–9), or leave blank.";
  }
  return null;
}

export function slugError(slug) {
  const clean = String(slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
  if (!clean) return "Customer site URL (slug) is required.";
  if (clean.length < 2) return "Slug must be at least 2 characters.";
  if (!SLUG_RE.test(clean)) {
    return "Slug may only use lowercase letters, numbers, and hyphens.";
  }
  return null;
}

export function passwordBasicError(password, { min = 6, label = "Password" } = {}) {
  const pwd = String(password ?? "");
  if (!pwd) return `${label} is required.`;
  if (pwd.length < min) return `${label} must be at least ${min} characters.`;
  if (pwd.length > 72) return `${label} is too long.`;
  return null;
}

export function passwordMatchError(password, confirm) {
  if (String(password) !== String(confirm)) {
    return "Passwords do not match.";
  }
  return null;
}

export function priceError(price, { required = true } = {}) {
  if (price === "" || price == null) {
    return required ? "Price is required." : null;
  }
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return "Enter a valid price (0 or greater).";
  return null;
}

export function positiveIntError(value, label, { min = 1, max = 9999 } = {}) {
  const n = parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

export function reservationDateError(date) {
  if (!String(date ?? "").trim()) return "Date is required.";
  if (!DATE_RE.test(String(date).trim())) return "Use a valid date (YYYY-MM-DD).";
  return null;
}

export function reservationTimeError(time) {
  if (!String(time ?? "").trim()) return "Time is required.";
  if (!TIME_RE.test(String(time).trim())) return "Use a valid time (HH:MM).";
  return null;
}

export function subjectError(subject, { min = 3, required = false } = {}) {
  const trimmed = String(subject ?? "").trim();
  if (!trimmed) return required ? "Subject is required." : null;
  if (trimmed.length < min) return `Subject must be at least ${min} characters.`;
  return null;
}

export function messageError(message, { min = 10 } = {}) {
  const trimmed = String(message ?? "").trim();
  if (!trimmed) return "Message is required.";
  if (trimmed.length < min) return `Message must be at least ${min} characters.`;
  return null;
}

/** Default password rules (matches platformPassword when settings not loaded). */
export const DEFAULT_SIGNUP_PASSWORD_SECURITY = {
  minPasswordLength: 8,
  requireNumbers: true,
  requireSpecialChars: true,
};

export function platformPasswordError(password, security = DEFAULT_SIGNUP_PASSWORD_SECURITY) {
  const result = validatePlatformPassword(password, security);
  return result.valid ? null : result.error;
}

/** Per-field signup errors (empty string = ok). */
export function getSignupFieldErrors(
  { name, email, phone, password, restaurantName, slug },
  passwordSecurity = DEFAULT_SIGNUP_PASSWORD_SECURITY,
) {
  return {
    restaurantName: personNameError(restaurantName, "Restaurant name") ?? "",
    slug: slugError(slug) ?? "",
    name: personNameError(name, "Your name") ?? "",
    email: emailError(email) ?? "",
    phone: optionalIndianPhoneError(phone) ?? "",
    password: platformPasswordError(password, passwordSecurity) ?? "",
  };
}

/** Client signup — returns first error message or null */
export function validateSignupForm(fields, passwordSecurity = DEFAULT_SIGNUP_PASSWORD_SECURITY) {
  const errors = getSignupFieldErrors(fields, passwordSecurity);
  return Object.values(errors).find(Boolean) ?? null;
}

const OTP_SIX_DIGITS = /^\d{6}$/;

/** Sign-in / 2FA step field errors. */
export function getLoginFieldErrors({ email, password, needs2FA, otpCode }) {
  if (needs2FA) {
    const otp = String(otpCode ?? "").trim();
    return {
      email: "",
      password: "",
      otp: OTP_SIX_DIGITS.test(otp)
        ? ""
        : "Enter the 6-digit code from your authenticator app.",
    };
  }
  return {
    email: emailError(email) ?? "",
    password: password ? "" : "Password is required.",
    otp: "",
  };
}

export function validateLoginForm(fields) {
  const errors = getLoginFieldErrors(fields);
  return Object.values(errors).find(Boolean) ?? null;
}

/** Super Admin → Add Restaurant modal */
export function getRestaurantCreateFieldErrors(
  { name, slug, ownerName, ownerEmail, ownerPassword, phone },
  passwordSecurity = DEFAULT_SIGNUP_PASSWORD_SECURITY,
) {
  const ownerNameTrimmed = String(ownerName ?? "").trim();
  return {
    name: personNameError(name, "Restaurant name") ?? "",
    slug: slugError(slug) ?? "",
    ownerName:
      ownerNameTrimmed && !isValidPersonName(ownerNameTrimmed)
        ? "Owner name must be at least 2 characters and include letters."
        : "",
    ownerEmail: emailError(ownerEmail) ?? "",
    ownerPassword: platformPasswordError(ownerPassword, passwordSecurity) ?? "",
    phone: optionalIndianPhoneError(phone) ?? "",
  };
}

export function validateRestaurantCreateForm(fields, passwordSecurity) {
  const errors = getRestaurantCreateFieldErrors(fields, passwordSecurity);
  return Object.values(errors).find(Boolean) ?? null;
}

const EMPTY_RESTAURANT_EDIT_ERRORS = {
  name: "",
  slug: "",
  phone: "",
  address: "",
  plan: "",
};

/** Super Admin → Edit Restaurant modal */
export function getRestaurantEditFieldErrors({ name, slug, phone }) {
  return {
    name: personNameError(name, "Restaurant name") ?? "",
    slug: slugError(slug) ?? "",
    phone: optionalIndianPhoneError(phone) ?? "",
    address: "",
    plan: "",
  };
}

export function validateRestaurantEditForm(fields) {
  const errors = getRestaurantEditFieldErrors(fields);
  return Object.values(errors).find(Boolean) ?? null;
}

export { EMPTY_RESTAURANT_EDIT_ERRORS };

export function moneyFieldError(value, label) {
  const raw = String(value ?? "").trim();
  if (!raw) return `${label} is required.`;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return `Enter a valid ${label} (0 or greater).`;
  if (n > 999999) return `${label} is too large.`;
  return null;
}

export function planLimitFieldError(value, label) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^-?\d+$/.test(raw)) {
    return `${label} must be a whole number (-1 for unlimited).`;
  }
  const n = parseInt(raw, 10);
  if (n < -1) return `${label} must be -1 (unlimited) or 0 or greater.`;
  return null;
}

const EMPTY_PLAN_FORM_ERRORS = {
  name: "",
  monthlyPrice: "",
  yearlyPrice: "",
  billingCycle: "",
  description: "",
  features: "",
  limitsStaff: "",
  limitsTables: "",
  limitsMenuItems: "",
  limitsOrders: "",
};

/** Super Admin → Create / Edit Plan modal */
export function getPlanFormFieldErrors(form) {
  const nameTrimmed = String(form.name ?? "").trim();
  return {
    name:
      !nameTrimmed
        ? "Plan name is required."
        : nameTrimmed.length < 2
          ? "Plan name must be at least 2 characters."
          : !/[a-zA-Z0-9]/.test(nameTrimmed)
            ? "Plan name must include letters or numbers."
            : "",
    monthlyPrice: moneyFieldError(form.monthlyPrice, "Monthly price") ?? "",
    yearlyPrice: moneyFieldError(form.yearlyPrice, "Yearly price") ?? "",
    billingCycle:
      form.billingCycle && !["monthly", "yearly"].includes(form.billingCycle)
        ? "Select a valid billing cycle."
        : "",
    description: "",
    features: "",
    limitsStaff: planLimitFieldError(form.limits?.staff, "Staff") ?? "",
    limitsTables: planLimitFieldError(form.limits?.tables, "Tables") ?? "",
    limitsMenuItems: planLimitFieldError(form.limits?.menuItems, "Menu items") ?? "",
    limitsOrders: planLimitFieldError(form.limits?.orders, "Orders") ?? "",
  };
}

export function validatePlanForm(form) {
  const errors = getPlanFormFieldErrors(form);
  return Object.values(errors).find(Boolean) ?? null;
}

export function parsePlanLimitsFromForm(limits) {
  const parse = (v) => {
    const raw = String(v ?? "").trim();
    if (!raw) return -1;
    return parseInt(raw, 10);
  };
  return {
    staff: parse(limits?.staff),
    tables: parse(limits?.tables),
    menuItems: parse(limits?.menuItems),
    orders: parse(limits?.orders),
  };
}

export function buildPlanSubmitBody(form) {
  return {
    name: form.name.trim(),
    monthlyPrice: Number(form.monthlyPrice),
    yearlyPrice: Number(form.yearlyPrice),
    price:
      form.billingCycle === "yearly"
        ? Number(form.yearlyPrice)
        : Number(form.monthlyPrice),
    billingCycle: form.billingCycle,
    description: form.description.trim(),
    features: form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean),
    limits: parsePlanLimitsFromForm(form.limits),
  };
}

export { EMPTY_PLAN_FORM_ERRORS };

const EMPTY_ASSIGN_PLAN_ERRORS = {
  restaurantId: "",
  planSlug: "",
  startDate: "",
  endDate: "",
  trialDays: "",
};

/** Super Admin → Assign Plan to Restaurant */
export function getAssignPlanFieldErrors(form) {
  const trialRaw = String(form.trialDays ?? "").trim();
  let trialDaysError = "";
  if (trialRaw && !/^\d+$/.test(trialRaw)) {
    trialDaysError = "Trial days must be a whole number.";
  } else {
    const t = trialRaw === "" ? 0 : parseInt(trialRaw, 10);
    if (t < 0) trialDaysError = "Trial days cannot be negative.";
    else if (t > 90) trialDaysError = "Trial days cannot exceed 90.";
  }

  let startDateError = "";
  let endDateError = "";
  if (form.endDate && !form.startDate) {
    startDateError = "Set a start date when specifying an end date.";
  }
  if (form.startDate && form.endDate) {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      endDateError = "End date must be on or after start date.";
    }
    const trial = parseTrialDaysValue(form.trialDays);
    if (!endDateError && trial > 0 && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const schedule = computeSubscriptionSchedule({
        startDate: form.startDate,
        billingCycle: form.billingCycle,
        trialDays: trial,
      });
      if (end < schedule.billingStart) {
        endDateError = "End date must be after the trial period.";
      }
    }
  }

  return {
    restaurantId: form.restaurantId ? "" : "Select a restaurant.",
    planSlug: form.planSlug ? "" : "Select a plan.",
    startDate: startDateError,
    endDate: endDateError,
    trialDays: trialDaysError,
  };
}

export const EMPTY_ASSIGN_PLAN_FORM = {
  restaurantId: "",
  planSlug: "",
  billingCycle: "monthly",
  startDate: "",
  endDate: "",
  trialDays: "0",
};

/** Price for assign dropdown / preview — respects monthly vs yearly toggle. */
export function planPriceForBillingCycle(plan, billingCycle = "monthly") {
  const monthly = Number(plan?.monthlyPrice ?? plan?.price ?? 0);
  const yearly = Number(plan?.yearlyPrice ?? monthly * 12);
  return billingCycle === "yearly" ? yearly : monthly;
}

/** Add one billing period from billingStart (after trial). */
export function computeSubscriptionEndDate(startDate, billingCycle = "monthly") {
  return computeBillingEndDate(startDate, billingCycle);
}

export {
  describeSubscriptionSchedule,
  formatDateInputValue,
  getAssignPlanSchedulePreview,
  withAutoAssignEndDate,
};

export function buildAssignPlanSubmitBody(form) {
  const trialRaw = String(form.trialDays ?? "").trim();
  return {
    restaurantId: form.restaurantId,
    planSlug: form.planSlug,
    billingCycle: form.billingCycle === "yearly" ? "yearly" : "monthly",
    startDate: form.startDate || undefined,
    trialDays: trialRaw === "" ? 0 : parseInt(trialRaw, 10),
  };
}

export { EMPTY_ASSIGN_PLAN_ERRORS };

/** Client staff create */
export function validateStaffCreateForm({ name, email, password, role }) {
  return (
    personNameError(name) ||
    emailError(email) ||
    passwordBasicError(password) ||
    (!role ? "Role is required." : null)
  );
}

/** Client customer modal */
export function validateCustomerForm({ name, phone, email }) {
  return getCustomerFormFieldErrors({ name, phone, email }).message;
}

export const EMPTY_CUSTOMER_FORM_ERRORS = { name: "", phone: "", email: "" };

export function getCustomerFormFieldErrors({ name, phone, email }) {
  return zodFormValidation(
    customerUpsertSchema,
    {
      name: String(name ?? "").trim(),
      phone: extractIndianMobileDigits(phone),
      email: String(email ?? "").trim() || "",
    },
    EMPTY_CUSTOMER_FORM_ERRORS
  );
}

const EMPTY_POS_ORDER_ERRORS = {
  table: "",
  customer: "",
  deliveryName: "",
  deliveryPhone: "",
  deliveryAddress: "",
};

/** POS checkout — dine-in, takeaway, delivery */
export function getPosOrderFieldErrors({
  orderType,
  selectedTableId,
  selectedCustomer,
  delivery,
}) {
  const errors = { ...EMPTY_POS_ORDER_ERRORS };

  if (orderType === "dine-in") {
    if (!selectedTableId) errors.table = "Select an available table.";
    if (!selectedCustomer) errors.customer = "Select or add a customer.";
  } else if (orderType === "takeaway") {
    if (!selectedCustomer) errors.customer = "Select or add a customer.";
  } else if (orderType === "delivery") {
    errors.deliveryName = personNameError(delivery?.name, "Name") ?? "";
    errors.deliveryPhone = indianPhoneError(delivery?.phone) ?? "";
    const addr = String(delivery?.address ?? "").trim();
    if (!addr) errors.deliveryAddress = "Delivery address is required.";
    else if (addr.length < 5) {
      errors.deliveryAddress = "Enter a complete delivery address.";
    } else if (addr.length > 300) {
      errors.deliveryAddress = "Address must be 300 characters or less.";
    }
  }

  const message = Object.values(errors).find(Boolean) ?? null;
  return { valid: !message, errors, message };
}

export function validatePosOrderForm(params) {
  const result = getPosOrderFieldErrors(params);
  return result.message;
}

export { EMPTY_POS_ORDER_ERRORS };

const EMPTY_CREATE_ORDER_ERRORS = {
  items: "",
  tableNumber: "",
  customer: "",
  notes: "",
};

/** Orders page — New Order modal (aligned with orderCreateSchema) */
export function getCreateOrderFieldErrors({ form, cart }) {
  const errors = { ...EMPTY_CREATE_ORDER_ERRORS };

  if (!cart?.length) {
    errors.items = "Add at least one item.";
    return { valid: false, errors, message: errors.items };
  }

  const customerTrimmed = String(form.customer ?? "").trim();
  const result = orderCreateSchema.safeParse({
    items: cart.map((l) => ({
      name: l.name,
      qty: l.qty,
      price: l.price,
      menuItemId: l.id,
    })),
    orderType: form.orderType,
    tableNumber: form.tableNumber ? String(form.tableNumber).trim() : null,
    customer: customerTrimmed || undefined,
    notes: String(form.notes ?? "").trim(),
  });

  if (result.success) {
    return { valid: true, errors, message: null };
  }

  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key && key in errors && !errors[key]) errors[key] = issue.message;
  }

  const message =
    Object.values(errors).find(Boolean) ??
    result.error.issues[0]?.message ??
    "Fix the highlighted fields.";
  return { valid: false, errors, message };
}

export { EMPTY_CREATE_ORDER_ERRORS };

/** Map Zod issues into a field-errors object; optional extra field checks run first */
function zodFormValidation(schema, input, emptyErrors, extraFieldErrors = () => ({})) {
  const errors = { ...emptyErrors, ...extraFieldErrors() };
  const result = schema.safeParse(input);
  if (result.success) {
    const message = Object.values(errors).find(Boolean) ?? null;
    return { valid: !message, errors, message };
  }
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && key in errors && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  const message =
    Object.values(errors).find(Boolean) ??
    result.error.issues[0]?.message ??
    "Fix the highlighted fields.";
  return { valid: false, errors, message };
}

export const EMPTY_STAFF_FORM_ERRORS = {
  name: "",
  email: "",
  password: "",
  role: "",
  phone: "",
};

export function getStaffFormFieldErrors(form, { editing = false } = {}) {
  if (editing) {
    return zodFormValidation(
      staffUpdateSchema,
      {
        name: String(form.name ?? "").trim(),
        email: String(form.email ?? "").trim(),
        phone: extractIndianMobileDigits(form.phone),
        role: form.role,
      },
      { name: "", email: "", role: "", phone: "" }
    );
  }
  const errors = { ...EMPTY_STAFF_FORM_ERRORS };
  const pwdErr = passwordBasicError(form.password);
  if (pwdErr) errors.password = pwdErr;
  const base = zodFormValidation(
    staffCreateSchema,
    {
      name: String(form.name ?? "").trim(),
      email: String(form.email ?? "").trim(),
      password: String(form.password ?? ""),
      role: form.role,
      phone: extractIndianMobileDigits(form.phone),
    },
    { name: "", email: "", role: "", phone: "", password: "" }
  );
  if (pwdErr && !base.errors.password) base.errors.password = pwdErr;
  if (!base.valid || pwdErr) {
    return {
      valid: false,
      errors: { ...base.errors, password: base.errors.password || pwdErr || "" },
      message: pwdErr || base.message,
    };
  }
  return base;
}

export const EMPTY_RESERVATION_FORM_ERRORS = {
  customerName: "",
  phone: "",
  date: "",
  time: "",
  guests: "",
  tableNumber: "",
};

export function getReservationFormFieldErrors(form) {
  const guests = parseInt(String(form.guests ?? ""), 10);
  return zodFormValidation(
    reservationCreateSchema,
    {
      customerName: String(form.customerName ?? "").trim(),
      phone: extractIndianMobileDigits(form.phone),
      date: String(form.date ?? "").trim(),
      time: String(form.time ?? "").trim(),
      guests: Number.isNaN(guests) ? undefined : guests,
      tableNumber: String(form.tableNumber ?? "").trim() || undefined,
      area: String(form.area ?? "").trim() || undefined,
      notes: String(form.notes ?? "").trim() || undefined,
      status: form.status,
    },
    EMPTY_RESERVATION_FORM_ERRORS,
    () => {
      const extra = { ...EMPTY_RESERVATION_FORM_ERRORS };
      if (!String(form.tableNumber ?? "").trim()) {
        extra.tableNumber = "Table is required.";
      }
      if (!String(form.customerName ?? "").trim()) {
        extra.customerName = "Customer name is required.";
      }
      if (!extractIndianMobileDigits(form.phone)) {
        extra.phone = "Phone is required.";
      }
      return extra;
    }
  );
}

export const EMPTY_MENU_CATEGORY_ERRORS = { name: "", description: "" };

export function getMenuCategoryFieldErrors(form) {
  return zodFormValidation(menuCategorySchema, {
    name: String(form.name ?? "").trim(),
    description: String(form.description ?? "").trim() || undefined,
  }, EMPTY_MENU_CATEGORY_ERRORS);
}

export const EMPTY_MENU_ITEM_ERRORS = {
  name: "",
  categoryId: "",
  price: "",
  imageUrl: "",
};

export function getMenuItemFieldErrors(form) {
  const base = zodFormValidation(
    menuItemSchema,
    {
      name: String(form.name ?? "").trim(),
      categoryId: String(form.categoryId ?? "").trim(),
      price: form.price,
      description: String(form.description ?? "").trim() || undefined,
      status: form.status,
    },
    EMPTY_MENU_ITEM_ERRORS
  );
  if (!base.valid) return base;

  const imageUrl = String(form.imageUrl ?? "").trim();
  if (imageUrl) {
    const imgErr = optionalLinkError(imageUrl, "Image URL");
    if (imgErr) {
      return {
        valid: false,
        message: imgErr,
        errors: { ...base.errors, imageUrl: imgErr },
      };
    }
  }
  return base;
}

export const EMPTY_TABLE_ERRORS = {
  tableNumber: "",
  capacity: "",
  categoryId: "",
};

export function getTableFieldErrors(form) {
  const cap = parseInt(String(form.capacity ?? ""), 10);
  return zodFormValidation(
    tableSchema,
    {
      tableNumber: String(form.tableNumber ?? "").trim(),
      capacity: Number.isNaN(cap) ? NaN : cap,
      categoryId: String(form.categoryId ?? "").trim() || undefined,
    },
    EMPTY_TABLE_ERRORS,
    () => {
      const extra = { ...EMPTY_TABLE_ERRORS };
      if (!String(form.categoryId ?? "").trim()) {
        extra.categoryId = "Select a floor area.";
      }
      return extra;
    }
  );
}

export const EMPTY_TABLE_AREA_ERRORS = { name: "", description: "" };

export function getTableAreaFieldErrors(form) {
  return zodFormValidation(tableAreaSchema, {
    name: String(form.name ?? "").trim(),
    description: String(form.description ?? "").trim() || undefined,
  }, EMPTY_TABLE_AREA_ERRORS);
}

export const EMPTY_INVENTORY_FORM_ERRORS = {
  name: "",
  unit: "",
  quantity: "",
  reorderLevel: "",
};

export function getInventoryFormFieldErrors(form) {
  const quantity = parseInt(String(form.quantity ?? ""), 10);
  const reorderLevel = parseInt(String(form.reorderLevel ?? ""), 10);
  return zodFormValidation(
    inventoryItemSchema,
    {
      name: String(form.name ?? "").trim(),
      category: String(form.category ?? "").trim() || undefined,
      quantity: Number.isNaN(quantity) ? 0 : Math.max(0, quantity),
      unit: String(form.unit ?? "").trim(),
      reorderLevel: Number.isNaN(reorderLevel) ? 0 : Math.max(0, reorderLevel),
      supplier: String(form.supplier ?? "").trim() || undefined,
      notes: String(form.notes ?? "").trim() || undefined,
    },
    EMPTY_INVENTORY_FORM_ERRORS
  );
}

export const EMPTY_SUPPORT_TICKET_ERRORS = {
  subject: "",
  message: "",
};

export function getSupportTicketFieldErrors(form) {
  return zodFormValidation(supportTicketCreateSchema, {
    subject: String(form.subject ?? "").trim(),
    message: String(form.message ?? "").trim(),
    priority: form.priority ?? "medium",
  }, EMPTY_SUPPORT_TICKET_ERRORS);
}

export const EMPTY_PRINTER_ERRORS = { name: "", ipAddress: "" };

export function getPrinterFieldErrors(form) {
  const result = zodFormValidation(
    printerConfigSchema,
    {
      name: String(form.name ?? "").trim(),
      type: form.type ?? "network",
      ipAddress: String(form.ipAddress ?? "").trim() || undefined,
      port: String(form.port ?? "").trim() || undefined,
    },
    EMPTY_PRINTER_ERRORS
  );
  if (form.type === "network" && !String(form.ipAddress ?? "").trim()) {
    result.errors.ipAddress = "IP address is required for network printers.";
    result.valid = false;
    result.message = result.errors.ipAddress;
  }
  return result;
}

export const EMPTY_PROFILE_ERRORS = { name: "", email: "", phone: "" };

export const EMPTY_RECIPE_FORM_ERRORS = { name: "", menuItemId: "" };

export function getRecipeFormFieldErrors(form) {
  const errors = { ...EMPTY_RECIPE_FORM_ERRORS };
  if (!String(form.name ?? "").trim()) errors.name = "Recipe name is required.";
  if (!String(form.menuItemId ?? "").trim()) {
    errors.menuItemId = "Select a menu item for this recipe.";
  }
  const message = Object.values(errors).find(Boolean) ?? null;
  return { valid: !message, errors, message };
}

export function getProfileFormFieldErrors(form) {
  const errors = { ...EMPTY_PROFILE_ERRORS };
  errors.name = personNameError(form.name, "Name") ?? "";
  errors.email = emailError(form.email) ?? "";
  errors.phone = optionalIndianPhoneError(form.phone) ?? "";
  const message = Object.values(errors).find(Boolean) ?? null;
  return { valid: !message, errors, message };
}

/** Client reservation modal */
export function validateReservationForm(form) {
  return getReservationFormFieldErrors(form).message;
}
