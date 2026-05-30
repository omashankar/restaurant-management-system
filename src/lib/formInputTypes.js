/** HTML input attributes for numeric / phone fields (use with spread on `<input />`). */

export function phoneInputProps(overrides = {}) {
  return {
    type: "tel",
    inputMode: "numeric",
    autoComplete: "tel-national",
    ...overrides,
  };
}

export function otpInputProps(overrides = {}) {
  return {
    type: "tel",
    inputMode: "numeric",
    autoComplete: "one-time-code",
    pattern: "[0-9]*",
    ...overrides,
  };
}

export function pincodeInputProps(overrides = {}) {
  return {
    type: "tel",
    inputMode: "numeric",
    pattern: "[0-9]*",
    ...overrides,
  };
}

export function intInputProps({ min, max, step } = {}) {
  return {
    type: "number",
    inputMode: "numeric",
    ...(min != null ? { min } : {}),
    ...(max != null ? { max } : {}),
    ...(step != null ? { step } : {}),
  };
}

export function decimalInputProps({ min, max, step = "any" } = {}) {
  return {
    type: "number",
    inputMode: "decimal",
    step,
    ...(min != null ? { min } : {}),
    ...(max != null ? { max } : {}),
  };
}
