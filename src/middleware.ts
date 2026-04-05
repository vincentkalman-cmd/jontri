import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function verifyJwt(token: string, secret: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [header, body, sig] = parts;
    const expectedSig = base64url(
      crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest()
    );
    if (sig !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard and client API routes
  const protectedPaths = ["/dashboard", "/api/clients"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  const session = request.cookies.get("jontri_session");

  if (!session?.value || !secret || !verifyJwt(session.value, secret)) {
    // API routes get a 401, pages get redirected to sign-in
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/clients/:path*"],
  // Note: /client/:path* and /api/client-portal are intentionally NOT matched — they are public
};
