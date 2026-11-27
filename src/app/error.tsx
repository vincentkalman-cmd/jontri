"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Kicker, PageGlow, primaryBtn, ghostBtn } from "@/components/site/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteNav />
      <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-bg-primary flex items-center justify-center px-6 py-20">
        <PageGlow />
        <div className="relative max-w-lg w-full text-center">
          <Kicker>Error</Kicker>
          <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold tracking-[-0.04em] leading-none text-text-primary">
            Something went wrong.
          </h1>
          <p className="mt-5 text-text-secondary text-lg">We hit an unexpected issue. Try again, or head back home.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className={primaryBtn}>
              Try again
            </button>
            <Link href="/" className={ghostBtn}>
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
