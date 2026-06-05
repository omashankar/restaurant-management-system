"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

const LANG_LABELS = {
  en: "English",
  hi: "हिंदी",
};

const LANG_FLAGS = {
  en: "🇬🇧",
  hi: "🇮🇳",
};

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, availableLanguages } = useLanguage();

  return (
    <div className={`${adminSurface.btnIcon} !inline-flex gap-1 !px-2.5`}>
      <Globe className={`size-3.5 shrink-0 ${adminSurface.muted}`} />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className={`cursor-pointer appearance-none bg-transparent pr-1 text-sm outline-none transition-colors ${adminSurface.body}`}
        aria-label="Select language"
      >
        {availableLanguages.map((l) => (
          <option key={l} value={l}>
            {compact ? LANG_FLAGS[l] : `${LANG_FLAGS[l]} ${LANG_LABELS[l]}`}
          </option>
        ))}
      </select>
    </div>
  );
}
