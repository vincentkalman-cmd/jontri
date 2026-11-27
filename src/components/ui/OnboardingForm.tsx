"use client";

import { useState, type FormEvent } from "react";
import { LuCheck, LuArrowRight, LuArrowLeft } from "react-icons/lu";
import { TIERS, getTierServices } from "@/lib/tiers";
import { TERMS, TERMS_VERSION } from "@/lib/terms";
import { detailFieldsFor, type DetailField, type PackageId, type SetupDetails } from "@/lib/onboarding-intake";
import { inputCls, primaryBtn, ghostBtn } from "@/components/site/ui";

const STEPS = ["Your business", "Package", "Setup details", "Review & accept"] as const;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const FIELD_META: Record<DetailField, { label: string; placeholder: string; textarea?: boolean; type?: string }> = {
  servicesOffered: { label: "What services do you offer?", placeholder: "e.g. Open and enclosed car shipping, dealer transfers, snowbird moves", textarea: true },
  businessHours: { label: "Business hours", placeholder: "e.g. Mon–Sat 8am–6pm" },
  bookingUrl: { label: "Booking or quote link (optional)", placeholder: "https://…", type: "url" },
  transferNumber: { label: "Number to transfer urgent calls to (optional)", placeholder: "+1 720 555 0100", type: "tel" },
  leadEmail: { label: "Where should new leads be emailed? (optional)", placeholder: "Defaults to your email", type: "email" },
  brandColor: { label: "Brand color (optional)", placeholder: "#35E0C2" },
  googleBusinessUrl: { label: "Google Business Profile link (optional)", placeholder: "https://g.page/…", type: "url" },
  targetArea: { label: "Area you serve", placeholder: "e.g. Denver metro, Colorado" },
};

const emptyDetails: SetupDetails = { servicesOffered: "", businessHours: "", bookingUrl: "", transferNumber: "", leadEmail: "", brandColor: "", googleBusinessUrl: "", targetArea: "" };

const PACKAGE_OPTIONS: { id: PackageId; name: string; price: string; sub: string }[] = [
  ...TIERS.map((t) => ({ id: t.id as PackageId, name: t.name, price: t.id === "tier-3" ? "Custom pricing" : `${t.price}/mo`, sub: t.subtitle })),
  { id: "custom", name: "Just one or two services", price: "Quoted for you", sub: "Pick what you need on a call" },
];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState({ contactName: "", businessName: "", email: "", phone: "", website: "", industry: "" });
  const [packageId, setPackageId] = useState<PackageId | "">("");
  const [details, setDetails] = useState<SetupDetails>(emptyDetails);
  const [acceptName, setAcceptName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ portalUrl: string; stage: string } | null>(null);

  const services = packageId && packageId !== "custom" ? getTierServices(packageId) : [];
  const fields = detailFieldsFor(services);

  function check(s: number): string {
    if (s === 0) {
      if (!biz.contactName.trim() || !biz.businessName.trim() || !biz.phone.trim() || !biz.industry.trim()) return "Please fill in your name, business, phone and industry.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(biz.email.trim())) return "Please enter a valid email address.";
    }
    if (s === 1 && !packageId) return "Please choose a package.";
    if (s === 2) {
      if (fields.includes("servicesOffered") && !details.servicesOffered.trim()) return "Tell us what services you offer so your AI can answer correctly.";
      if (fields.includes("businessHours") && !details.businessHours.trim()) return "Please add your business hours.";
    }
    if (s === 3 && (!agreed || acceptName.trim().length < 2)) return "Type your full name and check the box to accept.";
    return "";
  }

  function next() {
    const e = check(step);
    setError(e);
    if (!e) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      next();
      return;
    }
    const msg = check(3);
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...biz, packageId, details, acceptName, agreed, termsVersion: TERMS_VERSION }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(data);
    } catch {
      setError("Couldn't reach us. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6" role="status">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink">
          <LuCheck size={28} aria-hidden />
        </div>
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-text-primary mb-3">You&apos;re in.</h2>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          {done.stage === "proposal" ? "We'll put together your custom proposal. " : "Next step: book your kickoff call. "}
          We just emailed your private portal link. You can also open it now and bookmark it.
        </p>
        <a href={done.portalUrl} className={`${primaryBtn} ${focusRing}`}>
          Open my portal <LuArrowRight size={18} aria-hidden />
        </a>
      </div>
    );
  }

  const bizField = (name: keyof typeof biz, label: string, type = "text", autoComplete?: string) => (
    <div>
      <label htmlFor={`ob-${name}`} className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
      </label>
      <input id={`ob-${name}`} type={type} autoComplete={autoComplete} value={biz[name]} onChange={(e) => setBiz({ ...biz, [name]: e.target.value })} className={inputCls} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <ol className="flex items-center justify-center gap-2 mb-8" aria-label="Sign-up steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                i === step ? "bg-accent text-accent-ink" : i < step ? "bg-accent/25 text-accent" : "bg-white/[.04] text-text-muted"
              }`}
            >
              {i < step ? <LuCheck size={14} aria-hidden /> : i + 1}
            </span>
            <span className={`hidden sm:inline text-xs ${i === step ? "text-text-primary" : "text-text-muted"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="w-4 sm:w-6 h-px bg-white/15" aria-hidden />}
          </li>
        ))}
      </ol>
      <p className="sm:hidden text-center text-sm text-text-secondary -mt-4 mb-6">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bizField("contactName", "Your full name", "text", "name")}
          {bizField("businessName", "Business name", "text", "organization")}
          {bizField("email", "Email", "email", "email")}
          {bizField("phone", "Phone", "tel", "tel")}
          {bizField("website", "Website (optional)", "url", "url")}
          {bizField("industry", "Industry", "text")}
        </div>
      )}

      {step === 1 && (
        <fieldset>
          <legend className="sr-only">Choose a package</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACKAGE_OPTIONS.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer rounded-2xl p-5 transition-[box-shadow,background-color,transform] duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-0.5 active:scale-[.99] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  packageId === p.id ? "bg-accent/10 shadow-[inset_0_0_0_2px_var(--color-accent)]" : "bg-white/[.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-white/[.05]"
                }`}
              >
                <input type="radio" name="package" value={p.id} checked={packageId === p.id} onChange={() => setPackageId(p.id)} className="sr-only" />
                <span className="block text-text-primary font-bold">{p.name}</span>
                <span className="block text-accent font-semibold text-sm mt-1">{p.price}</span>
                <span className="block text-text-muted text-xs mt-1">{p.sub}</span>
              </label>
            ))}
          </div>
          {(packageId === "tier-3" || packageId === "custom") && <p className="mt-4 text-sm text-text-secondary">No payment today. We&apos;ll send a proposal after a quick call.</p>}
        </fieldset>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {fields.length === 0 && <p className="text-text-secondary text-sm">Nothing else needed right now. We&apos;ll go over the details on your call.</p>}
          {fields.map((f) => {
            const m = FIELD_META[f];
            return (
              <div key={f}>
                <label htmlFor={`ob-${f}`} className="block text-sm font-medium text-text-secondary mb-1.5">
                  {m.label}
                </label>
                {m.textarea ? (
                  <textarea id={`ob-${f}`} rows={3} value={details[f]} placeholder={m.placeholder} onChange={(e) => setDetails({ ...details, [f]: e.target.value })} className={inputCls} />
                ) : (
                  <input id={`ob-${f}`} type={m.type || "text"} value={details[f]} placeholder={m.placeholder} onChange={(e) => setDetails({ ...details, [f]: e.target.value })} className={inputCls} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white/[.03] p-5 text-sm text-text-secondary">
            <p>
              <span className="text-text-primary font-semibold">{biz.businessName}</span> · {biz.contactName} · {biz.email}
            </p>
            <p className="mt-1">
              Package: <span className="text-text-primary">{PACKAGE_OPTIONS.find((p) => p.id === packageId)?.name}</span>
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-2xl bg-bg-primary p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] text-sm" tabIndex={0} aria-label="Service terms">
            <h3 className="text-text-primary font-bold mb-3">Service terms</h3>
            {TERMS.map((t, i) => (
              <p key={t.title} className="text-text-secondary mb-3">
                <span className="text-text-primary font-semibold">
                  {i + 1}. {t.title}.
                </span>{" "}
                {t.body}
              </p>
            ))}
          </div>
          <div>
            <label htmlFor="ob-accept" className="block text-sm font-medium text-text-secondary mb-1.5">
              Type your full name to sign
            </label>
            <input id="ob-accept" value={acceptName} onChange={(e) => setAcceptName(e.target.value)} autoComplete="name" className={inputCls} />
          </div>
          <label className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className={`mt-0.5 h-5 w-5 flex-shrink-0 accent-[var(--color-accent)] cursor-pointer ${focusRing}`} />
            I agree to the service terms above on behalf of {biz.businessName || "my business"}.
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep((s) => s - 1);
            }}
            className={`${ghostBtn} ${focusRing}`}
          >
            <LuArrowLeft size={18} aria-hidden /> Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button key="continue" type="button" onClick={next} className={`${primaryBtn} ${focusRing}`}>
            Continue <LuArrowRight size={18} aria-hidden />
          </button>
        ) : (
          <button key="submit" type="submit" disabled={submitting} className={`${primaryBtn} ${focusRing}`}>
            {submitting ? "Submitting…" : "Accept and sign up"}
          </button>
        )}
      </div>
    </form>
  );
}
