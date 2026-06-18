/**
 * Profile page API tests — run: node scripts/test-profile-page.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`✓ ${label}`);
}
function fail(label, detail = "") {
  failed++;
  console.log(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  return res.headers.get("set-cookie")?.split(";")[0] ?? "";
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed: ${email} — ${data.error}`);
  return { cookie: parseCookies(res), user: data.user };
}

async function main() {
  console.log("=== Profile Page Tests ===\n");

  const { cookie, user: loginUser } = await login("admin@restaurant.com", "password123");
  ok("Admin login");

  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  const me = await meRes.json();
  if (me.success && me.user?.email === "admin@restaurant.com") ok("GET /api/auth/me returns user");
  else fail("GET /api/auth/me", me.error);

  const original = {
    name: me.user.name,
    email: me.user.email,
    phone: me.user.phone ?? "",
  };

  const pageRes = await fetch(`${BASE}/profile`, { headers: { Cookie: cookie } });
  if (pageRes.ok) ok("GET /profile page loads");
  else fail("GET /profile page", pageRes.status);

  // Validation — empty name
  const badName = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ ...original, name: "" }),
  }).then((r) => r.json());
  if (!badName.success && badName.errors?.name) ok("Rejects empty name");
  else fail("Empty name validation");

  // Validation — bad email
  const badEmail = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ ...original, email: "not-an-email" }),
  }).then((r) => r.json());
  if (!badEmail.success && badEmail.errors?.email) ok("Rejects invalid email");
  else fail("Invalid email validation");

  // Save profile with phone
  const newName = original.name.endsWith(" Test") ? original.name : `${original.name} Test`;
  const patchRes = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: newName,
      email: original.email,
      phone: "7627014106",
    }),
  });
  const patch = await patchRes.json();
  if (patch.success && patch.user?.name === newName && patch.user?.phone === "7627014106") {
    ok("PATCH profile saves name + phone");
  } else {
    fail("PATCH profile", patch.error ?? JSON.stringify(patch.user));
  }

  // Verify persisted via /me
  const me2 = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } }).then((r) => r.json());
  if (me2.user?.name === newName && me2.user?.phone === "7627014106") ok("Changes persist in /api/auth/me");
  else fail("Persist check", `${me2.user?.name} / ${me2.user?.phone}`);

  // Duplicate email (manager)
  const dup = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ ...original, email: "manager@restaurant.com" }),
  });
  const dupData = await dup.json();
  if (dup.status === 409 && dupData.errors?.email) ok("Rejects duplicate email");
  else fail("Duplicate email", dupData.error);

  // Invalid emails — must not save garbage text
  for (const bad of ["plain text", "abc", "admin@restaurant.comsssssss"]) {
    const badRes = await fetch(`${BASE}/api/auth/profile`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ ...original, email: bad }),
    });
    const badData = await badRes.json();
    if (badRes.status === 422 && !badData.success) ok(`Rejects invalid email: ${bad}`);
    else fail(`Should reject: ${bad}`, badData.error);
  }

  // Restore original
  const restore = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(original),
  }).then((r) => r.json());
  if (restore.success) ok("Restore original profile");
  else fail("Restore", restore.error);

  // Unauthenticated
  const unauth = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(original),
  });
  if (unauth.status === 401) ok("PATCH requires auth");
  else fail("Auth check", unauth.status);

  // Super admin profile
  const sa = await login("superadmin@rms.com", "SuperAdmin@2026");
  const saPage = await fetch(`${BASE}/super-admin/profile`, { headers: { Cookie: sa.cookie } });
  if (saPage.ok) ok("GET /super-admin/profile loads");
  else fail("Super admin profile page", saPage.status);

  const saPatch = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: sa.cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: sa.user.name,
      email: sa.user.email,
      phone: sa.user.phone ?? "",
    }),
  }).then((r) => r.json());
  if (saPatch.success) ok("Super admin can PATCH profile");
  else fail("Super admin PATCH", saPatch.error);

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
