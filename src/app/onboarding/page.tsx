import { Navbar } from "@/components/Navbar";
import { OnboardingSection } from "@/components/OnboardingSection";
import { Footer } from "@/components/Footer";

export default function OnboardingPage() {
  return (
    <>
      <Navbar />
      <main>
        <OnboardingSection />
      </main>
      <Footer />
    </>
  );
}
