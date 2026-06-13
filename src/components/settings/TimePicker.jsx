"use client";

export function normalizeTimeInputValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.slice(0, 5);
}

export default function TimePicker({ label, value, onChange, disabled = false }) {
  const safeValue = normalizeTimeInputValue(value);

  return (
    <div>
      <label className="admin-surface-label mb-1.5 block">{label}</label>
      <input
        type="time"
        value={safeValue}
        onChange={(e) => onChange(normalizeTimeInputValue(e.target.value))}
        disabled={disabled}
        className="admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
