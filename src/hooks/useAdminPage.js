"use client";

import { useLanguage } from "@/context/LanguageContext";

/** Page title/description from `pages.{id}.title` / `pages.{id}.description` */
export function useAdminPage(pageId) {
  const { t, lang } = useLanguage();
  const base = `pages.${pageId}`;
  return {
    t,
    lang,
    title: t(`${base}.title`),
    description: t(`${base}.description`),
  };
}
