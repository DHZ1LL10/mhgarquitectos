import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "../next.config.ts";

test("development CSP allows eval required by Next.js dev mode", () => {
  assert.match(buildContentSecurityPolicy("development"), /script-src[^;]*'unsafe-eval'/);
});

test("production CSP does not allow unsafe-eval", () => {
  assert.doesNotMatch(buildContentSecurityPolicy("production"), /'unsafe-eval'/);
});

test("staging CSP does not allow unsafe-eval", () => {
  assert.doesNotMatch(buildContentSecurityPolicy("staging"), /'unsafe-eval'/);
});

test("staging security headers preserve the legacy external dependencies", () => {
  const headers = Object.fromEntries(
    buildSecurityHeaders("staging", "production").map(({ key, value }) => [key, value]),
  );
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Permissions-Policy"], /geolocation=\(self\)/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/unpkg\.com/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/fonts\.googleapis\.com/);
  assert.match(headers["Content-Security-Policy"], /frame-src https:\/\/www\.google\.com/);
  assert.equal(headers["X-Robots-Tag"], "noindex, nofollow");
});

test("production security headers never include noindex", () => {
  const headers = Object.fromEntries(
    buildSecurityHeaders("production", "production").map(({ key, value }) => [key, value]),
  );
  assert.equal(headers["X-Robots-Tag"], undefined);
  assert.doesNotMatch(headers["Content-Security-Policy"], /'unsafe-eval'/);
});
