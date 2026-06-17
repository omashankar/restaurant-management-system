function trimLandingText(value) {
  return String(value ?? "").trim();
}

function filterNonemptyLinks(links) {
  if (!Array.isArray(links)) return [];
  return links.filter((link) => trimLandingText(link?.label) || trimLandingText(link?.href));
}

/** Normalize section payload before client/server validation and save. */
export function sanitizeLandingSectionPayload(section, data) {
  if (data == null) return data;

  if (section === "navbar" && typeof data === "object") {
    return {
      ...data,
      logo: data.logo && typeof data.logo === "object" ? data.logo : {},
      links: filterNonemptyLinks(data.links),
    };
  }

  if (section === "footer" && typeof data === "object") {
    return {
      ...data,
      links: filterNonemptyLinks(data.links),
    };
  }

  if (section === "brands" && typeof data === "object") {
    return {
      ...data,
      items: (Array.isArray(data.items) ? data.items : [])
        .map(trimLandingText)
        .filter(Boolean),
    };
  }

  if (section === "problemSolution" && typeof data === "object") {
    return {
      ...data,
      problems: (Array.isArray(data.problems) ? data.problems : [])
        .map(trimLandingText)
        .filter(Boolean),
      solutionPoints: (Array.isArray(data.solutionPoints) ? data.solutionPoints : [])
        .map(trimLandingText)
        .filter(Boolean),
    };
  }

  if (section === "benefits" && typeof data === "object") {
    return {
      ...data,
      items: (Array.isArray(data.items) ? data.items : [])
        .map(trimLandingText)
        .filter(Boolean),
    };
  }

  if (section === "faq" && typeof data === "object") {
    return {
      ...data,
      items: (Array.isArray(data.items) ? data.items : []).filter(
        (item) => trimLandingText(item?.q) && trimLandingText(item?.a),
      ),
    };
  }

  if (section === "howItWorks" && typeof data === "object") {
    return {
      ...data,
      steps: (Array.isArray(data.steps) ? data.steps : []).filter(
        (step) => trimLandingText(step?.title) && trimLandingText(step?.text),
      ),
    };
  }

  if (section === "hero" && typeof data === "object") {
    const ctaPrimary =
      typeof data.ctaPrimary === "string"
        ? trimLandingText(data.ctaPrimary)
        : trimLandingText(data.ctaPrimary?.label);
    const ctaSecondary =
      typeof data.ctaSecondary === "string"
        ? trimLandingText(data.ctaSecondary)
        : trimLandingText(data.ctaSecondary?.label);

    return {
      ...data,
      badge: trimLandingText(data.badge),
      headline: trimLandingText(data.headline),
      subheadline: trimLandingText(data.subheadline),
      ctaPrimary,
      ctaSecondary,
      trialNote: trimLandingText(data.trialNote),
      stats: (Array.isArray(data.stats) ? data.stats : []).filter(
        (stat) => trimLandingText(stat?.value) && trimLandingText(stat?.label),
      ),
    };
  }

  if (section === "about" && typeof data === "object") {
    return {
      ...data,
      headline: trimLandingText(data.headline),
      description: trimLandingText(data.description),
      imageUrl: trimLandingText(data.imageUrl),
    };
  }

  return data;
}
