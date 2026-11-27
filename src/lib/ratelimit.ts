import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  const route = new URL(request.url).pathname;
  return `${route}::${ip}`;
}

export function rateLimit(
  request: NextRequest,
  opts: { limit: number; windowMs: number },
): NextResponse | null {
  const now = Date.now();
  const key = clientKey(request);
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  if (b.count >= opts.limit) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(opts.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(b.resetAt / 1000)),
        },
      },
    );
  }

  b.count += 1;
  return null;
}
