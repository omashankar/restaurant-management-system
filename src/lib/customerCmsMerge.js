/** Deep-merge CMS section with defaults (client-safe). */
export function mergeCmsSection(defaults, stored) {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return defaults;
  }
  if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) {
    return stored;
  }
  const out = { ...defaults };
  for (const key of Object.keys(stored)) {
    const defVal = defaults[key];
    const val = stored[key];
    if (val === undefined) continue;
    if (Array.isArray(defVal)) {
      out[key] = Array.isArray(val) && val.length > 0 ? val : defVal;
    } else if (defVal && typeof defVal === "object" && !Array.isArray(defVal)) {
      out[key] = mergeCmsSection(defVal, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export function pickSectionHeaders(cms, sectionKey, fallbacks) {
  const h = cms?.home?.sectionHeaders?.[sectionKey];
  return {
    badge: h?.badge?.trim() || fallbacks.badge,
    title: h?.title?.trim() || fallbacks.title,
    subtitle: h?.subtitle?.trim() || fallbacks.subtitle,
    actionLabel: h?.actionLabel?.trim() || fallbacks.actionLabel || "",
  };
}
