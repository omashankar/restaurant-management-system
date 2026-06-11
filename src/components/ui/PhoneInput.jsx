"use client";

import {
  extractIndianMobileDigits,
  sanitizeIndianMobileDigits,
} from "@/lib/phoneUtils";
import { phoneInputProps } from "@/lib/formInputTypes";
import { raInputCls } from "@/config/restaurantAdminTheme";

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

const standaloneFieldCls = raInputCls;

/**
 * Indian mobile (+91 prefix, 10 digits). Letters are stripped — only digits 0–9.
 */
export default function PhoneInput({
  id,
  label,
  labelClassName = "admin-surface-label mb-1 block",
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
    "flex items-center overflow-hidden rounded-xl border admin-shell-border bg-[var(--admin-control)] transition-colors",
    error
      ? "border-red-500/50 focus-within:border-red-500/50"
      : "focus-within-ra-primary",
    disabled ? "pointer-events-none opacity-50" : "",
    label && !labelHasMargin ? "mt-1.5" : "",
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // Never pass full field styles (border, rounded, bg) on inputClassName — shell owns the box.
  const innerCls = [
    "min-w-0 flex-1 border-0 bg-transparent pl-2 pr-3 shadow-none outline-none ring-0 placeholder:admin-surface-faint focus:ring-0",
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
