import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ProcessSection } from "@/components/ProcessSection";
import { AboutSection } from "@/components/AboutSection";
import { ResultsSection } from "@/components/ResultsSection";
import { ContactSection } from "@/components/ContactSection";
import { LeadMagnetSection } from "@/components/LeadMagnetSection";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <ProcessSection />
        <AboutSection />
        <ResultsSection />
        <LeadMagnetSection />
        <ContactSection />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
