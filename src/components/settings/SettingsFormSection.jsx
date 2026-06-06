"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";

export default function SettingsFormSection({ title, description, children }) {
  return (
    <section className={`${adminSurface.cardSolid} p-4 sm:p-6`}>
      <div className="mb-5">
        <h2 className={`text-lg font-semibold ${adminSurface.title}`}>{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm ${adminSurface.muted}`}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
