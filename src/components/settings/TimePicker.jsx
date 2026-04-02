"use client";

export default function TimePicker({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
