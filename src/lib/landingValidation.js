import { emailError, optionalIndianPhoneError } from "@/lib/formValidation";

const LIMITS = {
  short: 80,
  headline: 120,
  title: 120,
  body: 500,
  cta: 40,
  metaTitle: 70,
  metaDescription: 160,
  company: 80,
  anchor: 40,
};

function trim(value) {
  return String(value ?? "").trim();
}

function requiredText(value, label, max = LIMITS.headline) {
  const v = trim(value);
  if (!v) return `${label} is required.`;
  if (v.length > max) return `${label} must be ${max} characters or less.`;
  return null;
}

function optionalText(value, label, max) {
  const v = trim(value);
  if (!v) return null;
  if (v.length > max) return `${label} must be ${max} characters or less.`;
  return null;
}

function optionalCtaText(value, label) {
  const v = trim(value);
  if (!v) return null;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > LIMITS.cta) return `${label} must be ${LIMITS.cta} characters or less.`;
  return null;
}

/** Internal path (#anchor, /path) or http(s) URL */
export function optionalLinkError(value, label) {
  const v = trim(value);
  if (!v) return null;
  if (v.startsWith("/") || v.startsWith("#")) return null;
  try {
    const u = new URL(v);
    if (!["http:", "https:"].includes(u.protocol)) {
      return `${label} must start with /, #, or https://`;
    }
  } catch {
    return `Enter a valid ${label} (e.g. /signup or https://…).`;
  }
  return null;
}

function optionalImageUrlError(value, label = "Image URL") {
  const v = trim(value);
  if (!v) return null;
  if (v.startsWith("/")) return null;
  return optionalLinkError(v, label);
}

function errorsToResult(errors) {
  const first = Object.values(errors).find(Boolean);
  return { valid: !first, errors, message: first ?? null };
}

export function validateLandingHero(data) {
  const errors = {};
  errors.headline =
    requiredText(data?.headline, "Headline", LIMITS.headline) ?? "";
  errors.badge = optionalText(data?.badge, "Badge text", LIMITS.short) ?? "";
  errors.subheadline =
    optionalText(data?.subheadline, "Sub-headline", LIMITS.body) ?? "";
  errors.ctaPrimary = optionalCtaText(data?.ctaPrimary, "Primary CTA text") ?? "";
  errors.ctaSecondary =
    optionalCtaText(data?.ctaSecondary, "Secondary CTA text") ?? "";
  return errorsToResult(errors);
}

export function validateLandingNavbar(data) {
  const errors = {};
  errors.logoText =
    requiredText(data?.logo?.text, "Logo text", LIMITS.company) ?? "";
  errors.logoIconUrl =
    optionalImageUrlError(data?.logo?.iconUrl, "Logo icon URL") ?? "";

  const primary = data?.ctaPrimary ?? {};
  const secondary = data?.ctaSecondary ?? {};
  errors.ctaPrimaryLabel = optionalCtaText(primary.label, "Primary CTA label") ?? "";
  errors.ctaPrimaryHref = optionalLinkError(primary.href, "Primary CTA URL") ?? "";
  if (trim(primary.label) && !trim(primary.href)) {
    errors.ctaPrimaryHref = "Primary CTA URL is required when label is set.";
  }
  errors.ctaSecondaryLabel =
    optionalCtaText(secondary.label, "Secondary CTA label") ?? "";
  errors.ctaSecondaryHref = optionalLinkError(secondary.href, "Secondary CTA URL") ?? "";
  if (trim(secondary.label) && !trim(secondary.href)) {
    errors.ctaSecondaryHref = "Secondary CTA URL is required when label is set.";
  }

  const links = Array.isArray(data?.links) ? data.links : [];
  links.forEach((link, i) => {
    const label = trim(link?.label);
    const href = trim(link?.href);
    if (label && !href) errors[`link_${i}_href`] = `Link ${i + 1}: URL is required.`;
    if (href && !label) errors[`link_${i}_label`] = `Link ${i + 1}: Label is required.`;
    const hrefErr = href ? optionalLinkError(href, `Link ${i + 1} URL`) : null;
    if (hrefErr) errors[`link_${i}_href`] = hrefErr;
  });

  return errorsToResult(errors);
}

export function validateLandingAbout(data) {
  const errors = {};
  errors.headline =
    requiredText(data?.headline, "Headline", LIMITS.headline) ?? "";
  errors.description =
    optionalText(data?.description, "Description", LIMITS.body) ?? "";
  errors.imageUrl = optionalImageUrlError(data?.imageUrl) ?? "";
  return errorsToResult(errors);
}

export function validateLandingContact(data) {
  const errors = {};
  errors.email = emailError(data?.email) ?? "";
  errors.phone = optionalIndianPhoneError(data?.phone) ?? "";
  errors.address = optionalText(data?.address, "Address", 200) ?? "";
  errors.mapUrl = optionalLinkError(data?.mapUrl, "Map URL") ?? "";
  return errorsToResult(errors);
}

export function validateLandingFooter(data) {
  const errors = {};
  errors.companyName =
    requiredText(data?.companyName, "Company name", LIMITS.company) ?? "";
  errors.email = data?.email ? emailError(data.email, { required: false }) ?? "" : "";
  errors.phone = optionalIndianPhoneError(data?.phone) ?? "";
  errors.tagline = optionalText(data?.tagline, "Tagline", LIMITS.short) ?? "";
  return errorsToResult(errors);
}

export function validateLandingSeo(data) {
  const errors = {};
  errors.title = optionalText(data?.title, "Meta title", LIMITS.metaTitle) ?? "";
  errors.description =
    optionalText(data?.description, "Meta description", LIMITS.metaDescription) ?? "";
  errors.keywords = optionalText(data?.keywords, "Keywords", 200) ?? "";
  errors.ogImage = optionalImageUrlError(data?.ogImage, "Open Graph image URL") ?? "";
  const currency = trim(data?.priceCurrency);
  if (currency && !/^[A-Za-z]{3}$/.test(currency)) {
    errors.priceCurrency = "Use a 3-letter currency code (e.g. INR, USD).";
  }
  return errorsToResult(errors);
}

export function validateLandingCta(data) {
  const errors = {};
  errors.title = optionalText(data?.title, "Title", LIMITS.title) ?? "";
  errors.description =
    optionalText(data?.description, "Description", LIMITS.body) ?? "";
  errors.primaryCtaLabel =
    optionalCtaText(data?.primaryCtaLabel, "Primary button label") ?? "";
  errors.primaryCtaHref =
    optionalLinkError(data?.primaryCtaHref, "Primary URL") ?? "";
  if (trim(data?.primaryCtaLabel) && !trim(data?.primaryCtaHref)) {
    errors.primaryCtaHref = "Primary URL is required when button label is set.";
  }
  errors.secondaryCtaLabel =
    optionalCtaText(data?.secondaryCtaLabel, "Secondary button label") ?? "";
  errors.secondaryCtaHref =
    optionalLinkError(data?.secondaryCtaHref, "Secondary URL") ?? "";
  if (trim(data?.secondaryCtaLabel) && !trim(data?.secondaryCtaHref)) {
    errors.secondaryCtaHref = "Secondary URL is required when button label is set.";
  }
  return errorsToResult(errors);
}

export function validateLandingDemo(data) {
  const errors = {};
  const anchor = trim(data?.sectionId);
  if (anchor && !/^[a-z][a-z0-9-]*$/i.test(anchor)) {
    errors.sectionId =
      "Anchor ID must start with a letter and use only letters, numbers, and hyphens.";
  }
  errors.title = optionalText(data?.title, "Title", LIMITS.title) ?? "";
  errors.subtext = optionalText(data?.subtext, "Subtext", LIMITS.body) ?? "";
  return errorsToResult(errors);
}

export function validateLandingSection(section, data) {
  switch (section) {
    case "hero":
      return validateLandingHero(data);
    case "navbar":
      return validateLandingNavbar(data);
    case "about":
      return validateLandingAbout(data);
    case "contact":
      return validateLandingContact(data);
    case "footer":
      return validateLandingFooter(data);
    case "seo":
      return validateLandingSeo(data);
    case "cta":
      return validateLandingCta(data);
    case "demo":
      return validateLandingDemo(data);
    case "features":
    case "roles":
    case "testimonials":
      return validateLandingArraySection(section, data);
    default:
      return { valid: true, errors: {}, message: null };
  }
}

function validateLandingArraySection(section, data) {
  if (!Array.isArray(data)) {
    return {
      valid: false,
      errors: {},
      message: `${section} must be a list.`,
    };
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (section === "features" && !trim(item?.title)) {
      return { valid: false, errors: {}, message: `Feature ${i + 1}: title is required.` };
    }
    if (section === "roles" && !trim(item?.role)) {
      return { valid: false, errors: {}, message: `Role ${i + 1}: name is required.` };
    }
    if (section === "testimonials") {
      if (!trim(item?.name)) {
        return { valid: false, errors: {}, message: `Testimonial ${i + 1}: name is required.` };
      }
      if (!trim(item?.quote)) {
        return { valid: false, errors: {}, message: `Testimonial ${i + 1}: quote is required.` };
      }
    }
  }
  return { valid: true, errors: {}, message: null };
}

/** Server-side: returns error string or null (matches landingService VALIDATORS) */
export function validateLandingSectionServer(section, data) {
  const result = validateLandingSection(section, data);
  if (result.valid) return null;
  return result.message ?? "Invalid section data.";
}
