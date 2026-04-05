"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";

interface OnboardingData {
  clientName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  services: string[];
  projectDescription: string;
  currentTools: string;
  monthlyBudget: string;
  timeline: string;
  goals: string;
  specialRequirements: string;
}

const SERVICE_OPTIONS = [
  "AI Chatbot / Virtual Assistant",
  "AI Voice Agent",
  "Automated Lead Capture & Nurture",
  "Smart Scheduling & Dispatch",
  "Review & Reputation Management",
  "Workflow & Back-Office Automation",
  "Social Media Automation",
  "Custom AI Solution",
];

const INDUSTRY_OPTIONS = ["HVAC", "Plumbing", "Spa & Wellness", "Construction", "Veterinary Services", "Other"];
const BUDGET_OPTIONS = ["Under $1,000/mo", "$1,000 - $2,500/mo", "$2,500 - $5,000/mo", "$5,000 - $10,000/mo", "$10,000+/mo"];
const TIMELINE_OPTIONS = ["ASAP", "Within 2 weeks", "Within 1 month", "Within 3 months", "Flexible"];

type FormErrors = Partial<Record<keyof OnboardingData, string>>;

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<OnboardingData>({
    clientName: "", businessName: "", email: "", phone: "", address: "",
    industry: "", services: [], projectDescription: "", currentTools: "",
    monthlyBudget: "", timeline: "", goals: "", specialRequirements: "",
  });

  const inputClasses = "w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";
  const selectClasses = `${inputClasses} appearance-none cursor-pointer`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof OnboardingData]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleServiceToggle(service: string) {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service) ? prev.services.filter((s) => s !== service) : [...prev.services, service],
    }));
    if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }));
  }

  function validateStep(s: number): boolean {
    const newErrors: FormErrors = {};
    if (s === 1) {
      if (!formData.clientName.trim()) newErrors.clientName = "Full name is required";
      if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
      if (!formData.email.trim()) { newErrors.email = "Email is required"; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = "Please enter a valid email"; }
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!formData.industry) newErrors.industry = "Please select your industry";
    }
    if (s === 2) {
      if (formData.services.length === 0) newErrors.services = "Select at least one service";
      if (!formData.projectDescription.trim()) newErrors.projectDescription = "Please describe your project";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() { if (validateStep(step)) setStep((s) => s + 1); }
  function prevStep() { setStep((s) => s - 1); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Jontri_Contract_${formData.businessName.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStep(4);
    } catch { setErrors({ specialRequirements: "Something went wrong. Please try again." }); }
    finally { setSubmitting(false); }
  }

  if (step === 4) {
    return (
      <div className="rounded-xl bg-bg-card border border-border p-8 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-2xl font-bold text-accent mb-2">Contract Generated!</h3>
        <p className="text-text-secondary mb-4">Your contract has been downloaded. We&apos;ll also send a copy to{" "}<span className="text-text-primary">{formData.email}</span>.</p>
        <p className="text-text-muted text-sm">A team member will reach out within 24 hours to review the agreement.</p>
      </div>
    );
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s === step ? "bg-accent text-white" : s < step ? "bg-accent/30 text-accent" : "bg-bg-card border border-border text-text-muted"}`}>{s < step ? "✓" : s}</div>
          {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-accent/50" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  const stepLabels = ["Client Information", "Project Details", "Goals & Review"];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {stepIndicator}
      <p className="text-center text-text-secondary text-sm mb-6">Step {step} of 3 &mdash; {stepLabels[step - 1]}</p>

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ob-clientName" className="block text-sm font-medium text-text-primary mb-1.5">Full Name <span className="text-accent">*</span></label>
              <input type="text" id="ob-clientName" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="John Smith" className={inputClasses} />
              {errors.clientName && <p className="mt-1 text-sm text-red-400">{errors.clientName}</p>}
            </div>
            <div>
              <label htmlFor="ob-businessName" className="block text-sm font-medium text-text-primary mb-1.5">Business Name <span className="text-accent">*</span></label>
              <input type="text" id="ob-businessName" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="ABC Plumbing LLC" className={inputClasses} />
              {errors.businessName && <p className="mt-1 text-sm text-red-400">{errors.businessName}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ob-email" className="block text-sm font-medium text-text-primary mb-1.5">Email <span className="text-accent">*</span></label>
              <input type="email" id="ob-email" name="email" value={formData.email} onChange={handleChange} placeholder="john@abcplumbing.com" className={inputClasses} />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="ob-phone" className="block text-sm font-medium text-text-primary mb-1.5">Phone <span className="text-accent">*</span></label>
              <input type="tel" id="ob-phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" className={inputClasses} />
              {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="ob-address" className="block text-sm font-medium text-text-primary mb-1.5">Business Address</label>
            <input type="text" id="ob-address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, City, State ZIP" className={inputClasses} />
          </div>
          <div>
            <label htmlFor="ob-industry" className="block text-sm font-medium text-text-primary mb-1.5">Industry <span className="text-accent">*</span></label>
            <select id="ob-industry" name="industry" value={formData.industry} onChange={handleChange} className={selectClasses}>
              <option value="">Select your industry</option>
              {INDUSTRY_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
            {errors.industry && <p className="mt-1 text-sm text-red-400">{errors.industry}</p>}
          </div>
          <div className="flex justify-end"><Button type="button" onClick={nextStep}>Next Step &rarr;</Button></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Services Needed <span className="text-accent">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_OPTIONS.map((service) => (
                <button key={service} type="button" onClick={() => handleServiceToggle(service)} className={`text-left px-4 py-3 rounded-lg border transition-colors text-sm ${formData.services.includes(service) ? "border-accent bg-accent/10 text-accent" : "border-border bg-bg-card text-text-secondary hover:border-text-muted"}`}>
                  {formData.services.includes(service) ? "✓ " : ""}{service}
                </button>
              ))}
            </div>
            {errors.services && <p className="mt-1 text-sm text-red-400">{errors.services}</p>}
          </div>
          <div>
            <label htmlFor="ob-projectDescription" className="block text-sm font-medium text-text-primary mb-1.5">Describe Your Project <span className="text-accent">*</span></label>
            <textarea id="ob-projectDescription" name="projectDescription" value={formData.projectDescription} onChange={handleChange} placeholder="Tell us what you are looking to automate..." rows={4} className={`${inputClasses} resize-none`} />
            {errors.projectDescription && <p className="mt-1 text-sm text-red-400">{errors.projectDescription}</p>}
          </div>
          <div>
            <label htmlFor="ob-currentTools" className="block text-sm font-medium text-text-primary mb-1.5">Current Tools / Software</label>
            <input type="text" id="ob-currentTools" name="currentTools" value={formData.currentTools} onChange={handleChange} placeholder="e.g., ServiceTitan, Jobber, QuickBooks..." className={inputClasses} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ob-monthlyBudget" className="block text-sm font-medium text-text-primary mb-1.5">Monthly Budget</label>
              <select id="ob-monthlyBudget" name="monthlyBudget" value={formData.monthlyBudget} onChange={handleChange} className={selectClasses}>
                <option value="">Select budget range</option>
                {BUDGET_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="ob-timeline" className="block text-sm font-medium text-text-primary mb-1.5">Desired Timeline</label>
              <select id="ob-timeline" name="timeline" value={formData.timeline} onChange={handleChange} className={selectClasses}>
                <option value="">Select timeline</option>
                {TIMELINE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={prevStep}>&larr; Back</Button>
            <Button type="button" onClick={nextStep}>Next Step &rarr;</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="ob-goals" className="block text-sm font-medium text-text-primary mb-1.5">What does success look like for you?</label>
            <textarea id="ob-goals" name="goals" value={formData.goals} onChange={handleChange} placeholder="e.g., Reduce missed calls by 50%, automate appointment booking..." rows={3} className={`${inputClasses} resize-none`} />
          </div>
          <div>
            <label htmlFor="ob-specialRequirements" className="block text-sm font-medium text-text-primary mb-1.5">Special Requirements or Notes</label>
            <textarea id="ob-specialRequirements" name="specialRequirements" value={formData.specialRequirements} onChange={handleChange} placeholder="Anything else we should know..." rows={3} className={`${inputClasses} resize-none`} />
            {errors.specialRequirements && <p className="mt-1 text-sm text-red-400">{errors.specialRequirements}</p>}
          </div>
          <div className="rounded-lg border border-border bg-bg-card p-6 space-y-3">
            <h4 className="text-lg font-semibold text-text-primary mb-2">Review Your Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-text-muted">Name:</span> <span className="text-text-primary">{formData.clientName}</span></div>
              <div><span className="text-text-muted">Business:</span> <span className="text-text-primary">{formData.businessName}</span></div>
              <div><span className="text-text-muted">Email:</span> <span className="text-text-primary">{formData.email}</span></div>
              <div><span className="text-text-muted">Phone:</span> <span className="text-text-primary">{formData.phone}</span></div>
              <div><span className="text-text-muted">Industry:</span> <span className="text-text-primary">{formData.industry}</span></div>
              <div><span className="text-text-muted">Budget:</span> <span className="text-text-primary">{formData.monthlyBudget || "Not specified"}</span></div>
              <div><span className="text-text-muted">Timeline:</span> <span className="text-text-primary">{formData.timeline || "Not specified"}</span></div>
            </div>
            <div className="pt-2">
              <span className="text-text-muted text-sm">Services:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.services.map((s) => (<span key={s} className="text-xs bg-accent/15 text-accent px-2 py-1 rounded-full">{s}</span>))}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={prevStep}>&larr; Back</Button>
            <Button type="submit">{submitting ? "Generating Contract..." : "Generate Contract & Submit"}</Button>
          </div>
        </div>
      )}
    </form>
  );
}