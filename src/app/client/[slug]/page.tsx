import type { Metadata } from "next";
import { LuLock } from "react-icons/lu";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageGlow } from "@/components/site/ui";

export const metadata: Metadata = { title: "Client portal", robots: { index: false, follow: false } };

/** Old /client/<slug> links: portals now live at a private /p/<token> link, so show no client data here. */
export default function OldPortalLink() {
  return (
    <>
      <SiteNav minimal />
      <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-bg-primary flex items-center justify-center px-4">
        <PageGlow />
        <div className="relative text-center max-w-md">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <LuLock size={26} aria-hidden />
          </div>
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-text-primary mb-3">Your portal has a new private link</h1>
          <p className="text-text-secondary">Use the link Jontri emailed you. Can&apos;t find it? Email hello@jontri.com and we&apos;ll resend it.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
