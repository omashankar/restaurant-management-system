"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { en } from "@/config/i18n/en";
import { hi } from "@/config/i18n/hi";

const TRANSLATIONS = { en, hi };
const LS_KEY = "rms-language";

const LanguageContext = createContext(null);

/**
 * Get a nested translation value by dot-notation key.
 * e.g. t("nav.dashboard") → "Dashboard" or "डैशबोर्ड"
 * Supports {variable} interpolation: t("onboarding.progress", { current: 1, total: 7 })
 */
function getTranslation(translations, key, vars = {}) {
  const parts = key.split(".");
  let value = translations;
  for (const part of parts) {
    if (value == null || typeof value !== "object") return key;
    value = value[part];
  }
  if (typeof value !== "string") return key;
  // Interpolate {variable} placeholders
  return value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored && TRANSLATIONS[stored]) setLangState(stored);
    } catch { /* ignore */ }
  }, []);

  const setLang = useCallback((newLang) => {
    if (!TRANSLATIONS[newLang]) return;
    setLangState(newLang);
    try { localStorage.setItem(LS_KEY, newLang); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key, vars = {}) => {
    return getTranslation(TRANSLATIONS[lang] ?? en, key, vars);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, availableLanguages: Object.keys(TRANSLATIONS) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
