"use client";

import { raInputCls } from "@/config/restaurantAdminTheme";

export default function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  options,
  multiline = false,
  min,
  max,
  step,
  error,
}) {
  const borderCls = error ? "border-red-500/50" : "border-zinc-800";
  const fieldCls = `${raInputCls} border ${borderCls} bg-zinc-950/80 focus-ra-primary`;
  const inputMode =
    type === "number"
      ? step != null && String(step).includes(".")
        ? "decimal"
        : "numeric"
      : type === "tel"
        ? "numeric"
        : undefined;
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldCls}
          aria-invalid={error ? true : undefined}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${fieldCls} resize-none`}
          aria-invalid={error ? true : undefined}
        />
      ) : (
        <input
          type={type}
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldCls}
          aria-invalid={error ? true : undefined}
        />
      )}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
