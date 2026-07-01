import assert from "node:assert/strict";
import test from "node:test";
import {
  SMTP_SECRET_MASK,
  buildEffectiveSmtpConfig,
  detectBrevoSmtpIssues,
  formatSmtpError,
  isSmtpPasswordMask,
  normalizeSmtpHost,
  normalizeSmtpSecure,
  sanitizeSmtpSettings,
  mergeSmtpPasswordForSave,
} from "../src/lib/smtpConfig.js";

test("normalizeSmtpHost fixes common Brevo typos", () => {
  assert.equal(normalizeSmtpHost("serversmtp-relay.brevo.com"), "smtp-relay.brevo.com");
  assert.equal(normalizeSmtpHost("server.smtp-relay.brevo.com"), "smtp-relay.brevo.com");
  assert.equal(normalizeSmtpHost("  SMTP-RELAY.BREVO.COM  "), "smtp-relay.brevo.com");
  assert.equal(normalizeSmtpHost(""), "");
});

test("buildEffectiveSmtpConfig resolves masked password from stored settings", () => {
  const result = buildEffectiveSmtpConfig(
    {
      smtpHost: "serversmtp-relay.brevo.com",
      smtpUser: "user@example.com",
      smtpPort: 587,
      smtpPassword: SMTP_SECRET_MASK,
      secure: false,
    },
    { smtpPassword: "stored-secret" },
  );
  assert.equal(result.ok, true);
  assert.equal(result.effective.smtpHost, "smtp-relay.brevo.com");
  assert.equal(result.effective.smtpPassword, "stored-secret");
});

test("buildEffectiveSmtpConfig returns 400 when password missing", () => {
  const result = buildEffectiveSmtpConfig(
    { smtpHost: "smtp.example.com", smtpUser: "user@example.com", smtpPassword: "" },
    {},
  );
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.match(result.error, /password/i);
});

test("normalizeSmtpSecure matches port conventions", () => {
  assert.equal(normalizeSmtpSecure(587, true), false);
  assert.equal(normalizeSmtpSecure(465, false), true);
  assert.equal(normalizeSmtpSecure(2525, true), false);
});

test("buildEffectiveSmtpConfig forces secure off for port 587", () => {
  const result = buildEffectiveSmtpConfig(
    {
      smtpHost: "smtp-relay.brevo.com",
      smtpUser: "user@example.com",
      smtpPort: 587,
      smtpPassword: "secret",
      secure: true,
    },
    {},
  );
  assert.equal(result.ok, true);
  assert.equal(result.effective.secure, false);
});

test("formatSmtpError maps wrong version number to SSL hint", () => {
  const msg = formatSmtpError(
    new Error("40420000:error:0A00010B:SSL routines:tls_validate_record_header:wrong version number"),
  );
  assert.match(msg, /port 587/i);
  assert.match(msg, /SSL\/TLS.*OFF/i);
});

test("isSmtpPasswordMask detects placeholders", () => {
  assert.equal(isSmtpPasswordMask("********"), true);
  assert.equal(isSmtpPasswordMask("••••••••"), true);
  assert.equal(isSmtpPasswordMask("xsmtpsib-abc"), false);
});

test("detectBrevoSmtpIssues rejects API key as password", () => {
  const msg = detectBrevoSmtpIssues({
    smtpHost: "smtp-relay.brevo.com",
    smtpUser: "a@b.com",
    smtpPassword: "xkeysib-abc123",
  });
  assert.match(msg, /API key/i);
});

test("formatSmtpError maps Brevo SMTP not activated", () => {
  const msg = formatSmtpError(
    new Error("Message failed: 502 5.7.0 Your SMTP account is not yet activated. Please contact us at contact@sendinblue.com"),
  );
  assert.match(msg, /not activated/i);
  assert.match(msg, /brevo/i);
});

test("sanitizeSmtpSettings normalizes host port and secure", () => {
  const out = sanitizeSmtpSettings(
    {
      smtpHost: "serversmtp-relay.brevo.com",
      smtpPort: 587,
      secure: true,
      smtpUser: " 9c7521001@smtp-brevo.com ",
      smtpPassword: "key-abc",
      enabled: true,
    },
    { smtpPort: 587, secure: false, enabled: false },
  );
  assert.equal(out.smtpHost, "smtp-relay.brevo.com");
  assert.equal(out.secure, false);
  assert.equal(out.smtpUser, "9c7521001@smtp-brevo.com");
  assert.equal(out.smtpPassword, "key-abc");
  assert.equal(out.enabled, true);
});

test("mergeSmtpPasswordForSave keeps stored password for mask", () => {
  const merged = mergeSmtpPasswordForSave(
    { smtpPassword: "wrong" },
    "********",
    "stored-secret",
  );
  assert.equal(merged.smtpPassword, "stored-secret");
});

test("formatSmtpError maps ENOTFOUND to actionable message", () => {
  const msg = formatSmtpError(
    new Error("getaddrinfo ENOTFOUND serversmtp-relay.brevo.com"),
    "serversmtp-relay.brevo.com",
  );
  assert.match(msg, /Cannot reach mail server/i);
  assert.match(msg, /smtp-relay\.brevo\.com/i);
});
