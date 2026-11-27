import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** True for loopback, private, link-local, CGNAT, multicast and other non-public addresses. */
export function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    if (s === "::" || s === "::1") return true;
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIp(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s);
  }
  return true;
}

/** Normalize user input like "summit.com" into an https URL, or null if unusable. */
export function normalizeUserUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password) return null;
    if (u.port && u.port !== "80" && u.port !== "443") return null;
    if (!u.hostname.includes(".") || u.hostname.endsWith(".local") || u.hostname.endsWith(".internal")) return null;
    if (isIP(u.hostname.replace(/^\[|\]$/g, ""))) return null;
    return u;
  } catch {
    return null;
  }
}

async function assertPublicHost(hostname: string) {
  const addrs = await lookup(hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isBlockedIp(a.address))) {
    throw new Error("URL not allowed");
  }
}

export interface SafeFetchResult {
  finalUrl: string;
  status: number;
  html: string;
  responseMs: number;
}

/**
 * Fetch a public web page for analysis. Re-validates every redirect hop,
 * caps size and time, and only returns HTML.
 */
export async function safeFetchPage(
  start: URL,
  opts: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {},
): Promise<SafeFetchResult> {
  const { timeoutMs = 8000, maxBytes = 1_500_000, maxRedirects = 4 } = opts;
  let url = start;
  const t0 = Date.now();
  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertPublicHost(url.hostname);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JontriSiteCheck/1.0; +https://jontri.com)", Accept: "text/html" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Bad redirect");
      const next = new URL(loc, url);
      if (next.protocol !== "https:" && next.protocol !== "http:") throw new Error("URL not allowed");
      url = next;
      continue;
    }
    const responseMs = Date.now() - t0;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) throw new Error("That address didn't return a web page");
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) { await reader.cancel(); break; }
        chunks.push(value);
      }
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { finalUrl: url.toString(), status: res.status, html, responseMs };
  }
  throw new Error("Too many redirects");
}

/** HEAD-ish check for a small text file (e.g. /llms.txt) on the same public host. */
export async function publicFileExists(base: URL, path: string): Promise<boolean> {
  try {
    const u = new URL(path, base);
    await assertPublicHost(u.hostname);
    const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(4000) });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") || "";
    await res.body?.cancel();
    return type.includes("text/plain") || type.includes("text/markdown");
  } catch {
    return false;
  }
}
