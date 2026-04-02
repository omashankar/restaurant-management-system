"use client";

export default function SettingsFormSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
