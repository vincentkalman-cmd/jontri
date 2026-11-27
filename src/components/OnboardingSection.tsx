import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedOnScroll } from "@/components/ui/AnimatedOnScroll";
import { OnboardingForm } from "@/components/ui/OnboardingForm";
import { LuFileText, LuShieldCheck, LuListChecks } from "react-icons/lu";
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
          Tell us about your business, pick a package and accept the terms. Takes about 5 minutes.
        </p>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
        <AnimatedOnScroll direction="up" delay={0}>
          <div className={`${panelCls} p-6 text-left h-full`}>
            <LuFileText size={26} className="text-accent mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Sign in one click</h3>
            <p className="text-text-secondary text-sm">
              Review the terms and sign by typing your name. No printing or scanning.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="up" delay={0.1}>
          <div className={`${panelCls} p-6 text-left h-full`}>
            <LuShieldCheck size={26} className="text-accent mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Secure & Private</h3>
            <p className="text-text-secondary text-sm">
              Your information is only used to set up your services. We never sell or share it.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="up" delay={0.2}>
          <div className={`${panelCls} p-6 text-left h-full`}>
            <LuListChecks size={26} className="text-accent mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Track every step</h3>
            <p className="text-text-secondary text-sm">
              You get a private portal link that shows exactly where your setup is.
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
