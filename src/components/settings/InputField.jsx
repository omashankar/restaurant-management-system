"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
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
  const borderCls = error ? "border-red-500/50" : "";
  const fieldCls = `${raInputCls} ${borderCls}`.trim();
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
      <label className={adminSurface.label}>
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldCls}
          aria-invalid={error ? true : undefined}
        >
          {options.map((opt) => {
            const optionValue = typeof opt === "object" && opt !== null ? opt.value : opt;
            const optionLabel = typeof opt === "object" && opt !== null ? opt.label : opt;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
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
