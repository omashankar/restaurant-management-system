import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/authCookies";

/* ══════════════════════════════════════════════════════════
   ROLE → ALLOWED PATH PREFIXES
   Each role can ONLY access paths listed here.
   super_admin has full access including /super-admin/*.
══════════════════════════════════════════════════════════ */
const ROLE_PATHS = {
  super_admin: [
    "/super-admin",
    "/admin", "/dashboard", "/pos", "/orders", "/menu",
    "/tables", "/reservations", "/customers", "/staff",
    "/inventory", "/analytics", "/settings", "/billing",
    "/support-tickets", "/kitchen", "/profile",
    "/onboarding", "/qr-menu", "/whatsapp", "/printer-settings",
  ],
  admin: [
    "/admin", "/dashboard", "/pos", "/orders", "/menu",
    "/tables", "/reservations", "/customers", "/staff",
    "/inventory", "/analytics", "/settings", "/billing",
    "/support-tickets", "/kitchen", "/profile",
    "/onboarding", "/qr-menu", "/whatsapp", "/printer-settings",
  ],
  manager: [
    "/manager", "/dashboard", "/pos", "/orders", "/menu",
    "/tables", "/reservations", "/customers",
    "/inventory", "/analytics", "/support-tickets", "/profile",
  ],
  waiter: ["/waiter", "/pos", "/orders", "/tables", "/reservations", "/customers", "/support-tickets", "/profile"],
  chef: ["/chef", "/kitchen", "/orders", "/support-tickets", "/profile"],
};

/* ── Role home (redirect after login or unauthorized access) ── */
const ROLE_HOME = {
  super_admin: "/super-admin/dashboard",
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  waiter: "/waiter/dashboard",
  chef: "/chef/dashboard",
};

/* ── Public paths — no auth needed ── */
const PUBLIC_PATHS = [
  "/",
  "/r",           // multi-restaurant selector + slug routes
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/home",
  "/order",
  "/account",
  "/verify-email",
  "/privacy",
  "/terms",
];

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/landing-sections"];
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret";

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function verifyJwt(token) {
  try {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) return null;

    const header = JSON.parse(decodeBase64Url(headerPart));
    if (header.alg !== "HS256") return null;

    const key = await importHmacKey(JWT_SECRET);
    const signingInput = `${headerPart}.${payloadPart}`;
    const signatureBytes = Uint8Array.from(
      decodeBase64Url(signaturePart),
      (ch) => ch.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(signingInput)
    );
    if (!valid) return null;

    return JSON.parse(decodeBase64Url(payloadPart));
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── Multi-restaurant: /r/[slug]/* routing ──
  // /r/pizza-palace/order/menu  →  rewrite to /order/menu + set x-restaurant-slug header + cookie
  const slugMatch = pathname.match(/^\/r\/([^/]+)(\/.*)?$/);
  if (slugMatch) {
    const slug = slugMatch[1].toLowerCase();
    const rest = slugMatch[2] ?? "/home";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-restaurant-slug", slug);

    const url = request.nextUrl.clone();
    url.pathname = rest;

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });

    // Cookie set karo taaki browser-side API calls bhi slug jaanein
    // SameSite=Lax, HttpOnly=false (client JS ko bhi chahiye)
    response.cookies.set("x-restaurant-slug", slug, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  }

  // API routes are guarded inside each route handler via verifyToken/role checks.
  // Let API requests pass through middleware to avoid redirecting fetch() calls.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  /* ── 1. Allow public paths ── */
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  /* ── 2. Allow static assets ── */
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  /* ── 3. No token → redirect to login (remember original path) ── */
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verifyJwt(token);

  /* ── 4. Invalid token → clear cookie + redirect to login ── */
  if (!payload?.role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  /* ── 5. Expired token → clear cookie + redirect to login ── */
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  const { role } = payload;

  /* ── 6. /super-admin/* → ONLY super_admin allowed ── */
  if (pathname.startsWith("/super-admin")) {
    if (role !== "super_admin") {
      const url = new URL("/unauthorized", request.url);
      url.searchParams.set("role", role);
      url.searchParams.set("path", pathname);
      url.searchParams.set("reason", "super_admin_only");
      return NextResponse.redirect(url);
    }
    // super_admin — allow through
    const res = NextResponse.next();
    res.headers.set("x-user-id", payload.id ?? "");
    res.headers.set("x-user-role", role);
    return res;
  }

  /* ── 7. RBAC: check role's allowed paths ── */
  const allowed = ROLE_PATHS[role] ?? [];
  const canAccess = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!canAccess) {
    const url = new URL("/unauthorized", request.url);
    url.searchParams.set("role", role);
    url.searchParams.set("path", pathname);
    return NextResponse.redirect(url);
  }

  /* ── 8. Authorized — attach user info to request headers ── */
  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.id ?? "");
  res.headers.set("x-user-role", role);
  res.headers.set("x-restaurant-id", payload.restaurantId ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
