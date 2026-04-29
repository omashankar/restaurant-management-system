"use client";

import { getIcon } from "@/lib/iconMap";
import { useEffect, useState } from "react";

/**
 * DynamicLandingSections
 *
 * Fetches sections from /api/landing-sections and renders them.
 * Each section stores only an icon name (string) in the DB —
 * resolved to a lucide-react component via getIcon() with Circle fallback.
 */
export default function DynamicLandingSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSections() {
      try {
        const res = await fetch("/api/landing-sections");
        const data = await res.json();
        if (data.success) setSections(data.sections);
      } catch {
        // silently fail — section just won't render
      } finally {
        setLoading(false);
      }
    }
    fetchSections();
  }, []);

  if (loading || sections.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => {
            const Icon = getIcon(section.icon); // fallback to Circle if invalid
            return (
              <article
                key={section.id}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/50"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {section.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
