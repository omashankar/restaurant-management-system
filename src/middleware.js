import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/authCookies";

/* Role → allowed path prefixes */
const ROLE_PATHS = {
  admin:   ["/dashboard", "/pos", "/orders", "/menu", "/tables", "/reservations",
            "/customers", "/staff", "/inventory", "/analytics", "/settings",
            "/kitchen", "/profile"],
  manager: ["/dashboard", "/pos", "/orders", "/menu", "/tables", "/reservations",
            "/customers", "/inventory", "/analytics", "/profile"],
  waiter:  ["/pos", "/orders", "/tables", "/reservations", "/customers", "/profile"],
  chef:    ["/kitchen", "/orders", "/profile"],
};

const PUBLIC = ["/", "/login", "/signup", "/home", "/order", "/api"];

/** Decode JWT payload without verification (Edge-safe) — verification happens in API routes */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public & static paths
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  // Check token expiry
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  // RBAC
  const allowed = ROLE_PATHS[payload.role] ?? [];
  const canAccess = allowed.some((p) => pathname.startsWith(p));

  if (!canAccess) {
    const redirectMap = { admin: "/dashboard", manager: "/dashboard", waiter: "/pos", chef: "/kitchen" };
    return NextResponse.redirect(new URL(redirectMap[payload.role] ?? "/", request.url));
  }

  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.id ?? "");
  res.headers.set("x-user-role", payload.role);
  res.headers.set("x-restaurant-id", payload.restaurantId ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
