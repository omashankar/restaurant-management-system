"use client";

export default function TimePicker({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="admin-surface-label mb-1.5 block">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
