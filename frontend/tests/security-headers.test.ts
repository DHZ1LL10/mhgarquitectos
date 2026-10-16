import assert from "node:assert/strict";
import test from "node:test";
import config, { buildContentSecurityPolicy } from "../next.config.ts";

test("development CSP allows eval required by Next.js dev mode", () => {
  assert.match(buildContentSecurityPolicy("development"), /script-src[^;]*'unsafe-eval'/);
});

test("production CSP does not allow unsafe-eval", () => {
  assert.doesNotMatch(buildContentSecurityPolicy("production"), /'unsafe-eval'/);
});

test("staging CSP does not allow unsafe-eval", () => {
  assert.doesNotMatch(buildContentSecurityPolicy("staging"), /'unsafe-eval'/);
});

test("staging security headers preserve the legacy external dependencies", async () => {
  assert.equal(typeof config.headers, "function");
  const rules = await config.headers!();
  const headers = Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Permissions-Policy"], /geolocation=\(self\)/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/unpkg\.com/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/fonts\.googleapis\.com/);
  assert.match(headers["Content-Security-Policy"], /frame-src https:\/\/www\.google\.com/);
});
