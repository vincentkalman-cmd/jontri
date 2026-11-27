import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The site-score endpoint hands the browser a signed copy of the scraped site summary.
 * The demo chat endpoint only answers from a summary it signed itself, so the chatbot
 * can't be pointed at arbitrary instructions/content.
 */
export interface DemoPayload {
  site: string;
  name: string;
  knowledge: string;
  exp: number; // epoch ms
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function createDemoToken(p: Omit<DemoPayload, "exp">, secret: string, ttlMs = 60 * 60 * 1000): string {
  const body = b64(JSON.stringify({ ...p, exp: Date.now() + ttlMs }));
  return `${body}.${sign(body, secret)}`;
}

export function verifyDemoToken(token: unknown, secret: string): DemoPayload | null {
  if (typeof token !== "string" || token.length > 40_000) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(unb64(body)) as DemoPayload;
    if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
