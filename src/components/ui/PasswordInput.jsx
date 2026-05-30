"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const defaultInputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pr-11 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20";

/**
 * Password field with show / hide toggle (auth & admin forms).
 */
export default function PasswordInput({
  id,
  label,
  labelClassName = "text-xs font-medium uppercase tracking-wider text-zinc-500",
  required = false,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  className,
  inputClassName = defaultInputCls,
  hint,
  error,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required ? <span className="text-red-400"> *</span> : null}
        </label>
      ) : null}
      <div className={label ? "relative mt-1.5" : "relative"}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint && id ? `${id}-hint` : null, error && id ? `${id}-error` : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {hint ? (
        <p id={id ? `${id}-hint` : undefined} className="mt-1 text-[11px] text-zinc-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
