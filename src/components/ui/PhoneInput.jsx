"use client";

import {
  extractIndianMobileDigits,
  sanitizeIndianMobileDigits,
} from "@/lib/phoneUtils";
import { phoneInputProps } from "@/lib/formInputTypes";

const SIZE_STYLES = {
  sm: {
    inner: "py-2 text-xs",
    prefix: "text-xs",
  },
  md: {
    inner: "py-2 text-sm",
    prefix: "text-sm",
  },
  lg: {
    inner: "py-3 text-sm",
    prefix: "text-sm",
  },
};

const standaloneFieldCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500/40";

/**
 * Indian mobile (+91 prefix, 10 digits). Letters are stripped — only digits 0–9.
 */
export default function PhoneInput({
  id,
  label,
  labelClassName = "mb-1 block text-xs font-medium text-zinc-500",
  required = false,
  value = "",
  onChange,
  className,
  inputClassName,
  wrapperClassName = "",
  error,
  showPrefix = true,
  size = "md",
  placeholder = "9876543210",
  disabled = false,
}) {
  const digits = extractIndianMobileDigits(value);
  const sz = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const labelHasMargin = /\bmb-\d/.test(labelClassName ?? "");

  const shellCls = [
    "flex items-center overflow-hidden rounded-xl border bg-zinc-950/60 transition-colors",
    error
      ? "border-red-500/50 focus-within:border-red-500/50"
      : "border-zinc-700 focus-within:border-emerald-500/40",
    disabled ? "pointer-events-none opacity-50" : "",
    label && !labelHasMargin ? "mt-1.5" : "",
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // Never pass full field styles (border, rounded, bg) on inputClassName — shell owns the box.
  const innerCls = [
    "min-w-0 flex-1 border-0 bg-transparent pl-2 pr-3 shadow-none outline-none ring-0 placeholder:text-zinc-500 focus:ring-0",
    sz.inner,
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const inputEl = (
    <input
      id={id}
      {...phoneInputProps()}
      value={digits}
      disabled={disabled}
      onChange={(e) => onChange?.(sanitizeIndianMobileDigits(e.target.value))}
      placeholder={placeholder}
      maxLength={10}
      className={showPrefix ? innerCls : (inputClassName ?? standaloneFieldCls)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
    />
  );

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required ? <span className="text-red-400"> *</span> : null}
        </label>
      ) : null}
      {showPrefix ? (
        <div className={shellCls}>
          <span
            className={`shrink-0 select-none pl-3 pr-1.5 font-medium tabular-nums text-zinc-500 ${sz.prefix}`}
          >
            +91
          </span>
          <span className="h-4 w-px shrink-0 bg-zinc-700" aria-hidden="true" />
          {inputEl}
        </div>
      ) : (
        <div className={label && !labelHasMargin ? "mt-1.5" : ""}>{inputEl}</div>
      )}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
