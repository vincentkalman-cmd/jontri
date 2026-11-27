import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Kicker, PageGlow, primaryBtn, ghostBtn } from "@/components/site/ui";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-bg-primary flex items-center justify-center px-6 py-20">
        <PageGlow />
        <div className="relative max-w-lg w-full text-center">
          <Kicker>404 · Not found</Kicker>
          <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold tracking-[-0.04em] leading-none text-text-primary">
            This page <span className="text-accent">missed the call.</span>
          </h1>
          <p className="mt-5 text-text-secondary text-lg">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/" className={primaryBtn}>
              Back to home
            </Link>
            <Link href="/#demo" className={ghostBtn}>
              Try the live demo →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
