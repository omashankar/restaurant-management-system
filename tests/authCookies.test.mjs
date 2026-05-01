import test from "node:test";
import assert from "node:assert/strict";
import {
  REFRESH_COOKIE,
  TOKEN_COOKIE,
  clearRefreshTokenCookie,
  clearTokenCookie,
  setRefreshTokenCookie,
  setTokenCookie,
} from "../src/lib/authCookies.js";

function makeResponse() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("setTokenCookie sets auth cookie with default max age", () => {
  const res = setTokenCookie(makeResponse(), "abc123");
  const setCookie = res.headers.get("Set-Cookie");
  assert.ok(setCookie?.includes(`${TOKEN_COOKIE}=abc123`));
  assert.ok(setCookie?.includes("HttpOnly"));
  assert.ok(setCookie?.includes("Max-Age=604800"));
});

test("setTokenCookie supports rememberMe max age", () => {
  const res = setTokenCookie(makeResponse(), "abc123", true);
  const setCookie = res.headers.get("Set-Cookie");
  assert.ok(setCookie?.includes("Max-Age=2592000"));
});

test("refresh cookie helpers append and clear refresh token", () => {
  const withRefresh = setRefreshTokenCookie(makeResponse(), "refresh-1");
  const refreshHeader = withRefresh.headers.get("Set-Cookie");
  assert.ok(refreshHeader?.includes(`${REFRESH_COOKIE}=refresh-1`));

  const cleared = clearRefreshTokenCookie(makeResponse());
  const clearedHeader = cleared.headers.get("Set-Cookie");
  assert.ok(clearedHeader?.includes(`${REFRESH_COOKIE}=`));
  assert.ok(clearedHeader?.includes("Max-Age=0"));
});

test("clearTokenCookie expires auth cookie immediately", () => {
  const res = clearTokenCookie(makeResponse());
  const setCookie = res.headers.get("Set-Cookie");
  assert.ok(setCookie?.includes(`${TOKEN_COOKIE}=`));
  assert.ok(setCookie?.includes("Max-Age=0"));
});
