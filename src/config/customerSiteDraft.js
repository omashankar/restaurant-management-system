import { CUSTOMER_SITE_TABS_BY_ID } from "@/config/customerSiteTabs";

/** CMS draft section ids that belong to a sidebar tab */
const TAB_DRAFT_SECTIONS = {
  theme: ["theme", "social"],
};

export function tabHasUnpublishedDraft(tabId, draftSections = []) {
  const set = new Set(draftSections);
  const extra = TAB_DRAFT_SECTIONS[tabId];
  if (extra) return extra.some((s) => set.has(s));
  const tab = CUSTOMER_SITE_TABS_BY_ID[tabId];
  const section = tab?.saveSection ?? tabId;
  return set.has(section);
}

export function publishHeadlineForSection(section) {
  const tab = CUSTOMER_SITE_TABS_BY_ID[section];
  if (tab?.headline) return tab.headline;
  if (section === "social") return "Social links";
  return section;
}
