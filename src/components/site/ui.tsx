/**
 * Shared Tailwind building blocks so secondary pages (sign-in, onboarding,
 * portal, 404) match the homepage's Dispatch Console look.
 */

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-[15px] font-bold text-accent-ink " +
  "shadow-[0_12px_34px_-10px_rgba(53,224,194,0.55),0_2px_6px_-2px_rgba(53,224,194,0.4)] " +
  "transition-[transform,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] " +
  "disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0 cursor-pointer";

export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white/[.04] px-5 py-3.5 text-[15px] font-bold text-text-primary " +
  "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] transition-[transform,background-color] duration-300 " +
  "ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-0.5 hover:bg-white/[.07] active:scale-[.98] cursor-pointer";

export const inputCls =
  "w-full rounded-xl bg-bg-primary px-4 py-3.5 text-text-primary placeholder:text-text-muted outline-none " +
  "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] focus:shadow-[inset_0_0_0_2px_var(--color-accent)] transition-shadow";

export const panelCls =
  "rounded-[22px] bg-gradient-to-b from-white/[.045] to-white/[.015] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_30px_70px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)]";

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-accent">
      <span className="h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" aria-hidden />
      {children}
    </span>
  );
}

/** Ambient aqua glow + faint grid, matching the homepage hero. */
export function PageGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(800px 420px at 75% 0%, rgba(53,224,194,.16), transparent 60%), radial-gradient(600px 380px at 0% 100%, rgba(90,170,255,.07), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 30%, #000 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, #000 20%, transparent 70%)",
        }}
      />
    </>
  );
}
