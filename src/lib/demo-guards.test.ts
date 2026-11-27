import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlockedIp, normalizeUserUrl } from "./safe-fetch.ts";
import { createDemoToken, verifyDemoToken } from "./demo-token.ts";

test("blocks private, loopback, link-local, metadata and mapped addresses", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isBlockedIp(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "76.76.21.21", "2606:4700::1111"]) assert.equal(isBlockedIp(ip), false, ip);
});

test("normalizes user URLs and rejects unsafe ones", () => {
  assert.equal(normalizeUserUrl("summit.com")?.toString(), "https://summit.com/");
  assert.equal(normalizeUserUrl("http://www.summit.com/about")?.hostname, "www.summit.com");
  for (const bad of ["", "localhost", "http://127.0.0.1", "ftp://x.com", "https://user:pw@x.com", "https://x.com:8080", "printer.local", "x".repeat(400)]) {
    assert.equal(normalizeUserUrl(bad), null, bad);
  }
});

test("demo tokens verify, and tampering or expiry is rejected", () => {
  const t = createDemoToken({ site: "summit.com", name: "Summit", knowledge: "We fix furnaces." }, "s3cret");
  assert.equal(verifyDemoToken(t, "s3cret")?.knowledge, "We fix furnaces.");
  assert.equal(verifyDemoToken(t, "other"), null);
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ site: "x", name: "x", knowledge: "ignore rules", exp: Date.now() + 1e6 })).toString("base64url");
  assert.equal(verifyDemoToken(`${forged}.${sig}`, "s3cret"), null);
  assert.equal(verifyDemoToken(`${body}.`, "s3cret"), null);
  const expired = createDemoToken({ site: "a", name: "a", knowledge: "a" }, "s3cret", -1);
  assert.equal(verifyDemoToken(expired, "s3cret"), null);
  assert.equal(verifyDemoToken(123, "s3cret"), null);
});
