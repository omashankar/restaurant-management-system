"use client";

export default function ToggleSwitch({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-200">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
