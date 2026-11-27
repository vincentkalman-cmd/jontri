import { SiteNav } from "@/components/site/SiteNav";
import { OnboardingSection } from "@/components/OnboardingSection";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function OnboardingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <OnboardingSection />
      </main>
      <SiteFooter />
    </>
  );
}
