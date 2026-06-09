"use client";

import { customerClasses } from "@/lib/customerTheme";
import {
  extractIndianMobileDigits,
  isValidIndianMobile,
  sanitizeIndianMobileDigits,
} from "@/lib/phoneUtils";

/**
 * Single-field mobile input with fixed +91 prefix (matches customer booking UX).
 */
export default function CustomerMobileInput({
  id = "mobile",
  label = "Mobile number",
  required = false,
  value = "",
  onChange,
  error,
  labelClassName = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-customer-muted",
  className,
}) {
  const digits = extractIndianMobileDigits(value);
  const showError = error ?? (digits.length > 0 && !isValidIndianMobile(digits));

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required ? " *" : ""}
      </label>
      <div className={`${customerClasses.fieldWrap} ct-field-wrap--prefix`}>
        <span className="ct-field-prefix" aria-hidden>
          +91
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={digits}
          onChange={(e) => onChange?.(sanitizeIndianMobileDigits(e.target.value))}
          placeholder="1234 567890"
          className={customerClasses.field}
          maxLength={10}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
        />
      </div>
      {showError ? (
        <p id={`${id}-error`} className={`mt-1 text-[11px] ${customerClasses.textDanger}`}>
          {error || "Enter a valid 10-digit mobile number."}
        </p>
      ) : null}
    </div>
  );
}
