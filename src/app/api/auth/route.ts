import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = base64url(
    crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = base64url(
      crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest()
    );
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// POST /api/auth — sign in
export async function POST(request: NextRequest) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }
  if (!JWT_SECRET) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const { email, password } = await request.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signJwt(
    { sub: email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    JWT_SECRET
  );

  const response = NextResponse.json({ success: true });

  response.cookies.set("jontri_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

// DELETE /api/auth — sign out
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("jontri_session");
  return response;
}

// GET /api/auth — check session
export async function GET(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
  const session = request.cookies.get("jontri_session");
  if (!session?.value || !verifyJwt(session.value, JWT_SECRET)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
