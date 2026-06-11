/** Customer storefront light/dark — document sync + mode-switch guard (no border flash). */

let modeSwitchGuardTimer = null;

function endCustomerModeSwitchGuard() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const clear = () => {
    delete root.dataset.customerModeSwitching;
    modeSwitchGuardTimer = null;
  };
  if (modeSwitchGuardTimer) {
    window.clearTimeout(modeSwitchGuardTimer);
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modeSwitchGuardTimer = window.setTimeout(clear, 400);
    });
  });
}

/** Suppress color/border transitions while CSS variables and .customer-dark flip. */
export function beginCustomerModeSwitch() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.customerModeSwitching = "";
}

export function syncCustomerDocumentMode(mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const next = mode === "dark" ? "dark" : "light";
  const previous = root.dataset.customerMode;
  const isModeChange = Boolean(previous && previous !== next);

  if (isModeChange) {
    beginCustomerModeSwitch();
  }

  root.dataset.customerMode = next;
  root.style.colorScheme = next;

  if (next === "dark") {
    root.dataset.customerDark = "true";
  } else {
    delete root.dataset.customerDark;
  }

  if (isModeChange) {
    endCustomerModeSwitchGuard();
  }
}
