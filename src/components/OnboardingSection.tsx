import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedOnScroll } from "@/components/ui/AnimatedOnScroll";
import { OnboardingForm } from "@/components/ui/OnboardingForm";
import { LuFileText, LuShieldCheck, LuClock } from "react-icons/lu";

export function OnboardingSection() {
  return (
    <SectionWrapper id="onboarding" alternate>
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          Client Onboarding
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Ready to get started? Fill out your information below and we&apos;ll generate
          a service agreement tailored to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <AnimatedOnScroll direction="up" delay={0}>
          <div className="rounded-xl bg-bg-card border border-border p-6 text-center">
            <LuFileText size={32} className="text-accent mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Instant Contract</h3>
            <p className="text-text-secondary text-sm">
              Your service agreement is generated automatically as a Word document, ready to review and sign.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="up" delay={0.1}>
          <div className="rounded-xl bg-bg-card border border-border p-6 text-center">
            <LuShieldCheck size={32} className="text-accent mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Secure & Private</h3>
            <p className="text-text-secondary text-sm">
              Your information is encrypted and only used to prepare your agreement. We never share your data.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="up" delay={0.2}>
          <div className="rounded-xl bg-bg-card border border-border p-6 text-center">
            <LuClock size={32} className="text-accent mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Quick Setup</h3>
            <p className="text-text-secondary text-sm">
              Complete the form in under 5 minutes. Our team will follow up within 24 hours to kick things off.
            </p>
          </div>
        </AnimatedOnScroll>
      </div>

      <AnimatedOnScroll direction="up">
        <div className="max-w-3xl mx-auto rounded-xl bg-bg-card border border-border p-6 sm:p-8">
          <OnboardingForm />
        </div>
      </AnimatedOnScroll>
    </SectionWrapper>
  );
}
