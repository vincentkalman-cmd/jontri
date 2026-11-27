import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedOnScroll } from "@/components/ui/AnimatedOnScroll";
import { OnboardingForm } from "@/components/ui/OnboardingForm";
import { LuFileText, LuShieldCheck, LuClock } from "react-icons/lu";
import { Kicker, PageGlow, panelCls } from "@/components/site/ui";

export function OnboardingSection() {
  return (
    <SectionWrapper id="onboarding" className="relative overflow-hidden">
      <PageGlow />
      <div className="relative text-center mb-12">
        <Kicker>Client onboarding</Kicker>
        <h1 className="mt-4 mb-5 text-4xl sm:text-6xl font-extrabold tracking-[-0.04em] leading-[0.98] text-text-primary">
          Let&apos;s get your <span className="text-accent">AI crew</span> started.
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Ready to get started? Fill out your information below and we&apos;ll generate
          a service agreement tailored to your needs.
        </p>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
        <AnimatedOnScroll direction="up" delay={0}>
          <div className={`${panelCls} p-6 text-left h-full`}>
            <LuFileText size={26} className="text-accent mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Instant Contract</h3>
            <p className="text-text-secondary text-sm">
              Your service agreement is generated automatically as a Word document, ready to review and sign.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="up" delay={0.1}>
          <div className={`${panelCls} p-6 text-left h-full`}>
            <LuShieldCheck size={26} className="text-accent mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Secure & Private</h3>
            <p className="text-text-secondary text-sm">
              Your information is encrypted and only used to prepare your agreement. We never share your data.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="up" delay={0.2}>
          <div className={`${panelCls} p-6 text-left h-full`}>
            <LuClock size={26} className="text-accent mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Quick Setup</h3>
            <p className="text-text-secondary text-sm">
              Complete the form in under 5 minutes. Our team will follow up within 24 hours to kick things off.
            </p>
          </div>
        </AnimatedOnScroll>
      </div>

      <AnimatedOnScroll direction="up">
        <div className={`relative max-w-3xl mx-auto ${panelCls} p-6 sm:p-10`}>
          <OnboardingForm />
        </div>
      </AnimatedOnScroll>
    </SectionWrapper>
  );
}
