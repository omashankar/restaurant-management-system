"use client";

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
    <div className="relative inline-flex items-center gap-1">
      <Globe className="size-3.5 text-zinc-500 shrink-0" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent text-sm text-zinc-400 outline-none hover:text-zinc-200 transition-colors pr-1"
        aria-label="Select language"
      >
        {availableLanguages.map((l) => (
          <option key={l} value={l} className="bg-zinc-900 text-zinc-100">
            {compact ? LANG_FLAGS[l] : `${LANG_FLAGS[l]} ${LANG_LABELS[l]}`}
          </option>
        ))}
      </select>
    </div>
  );
}
