import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedOnScroll } from "@/components/ui/AnimatedOnScroll";
import { ContactForm } from "@/components/ui/ContactForm";
import { Button } from "@/components/ui/Button";
import { BOOKING_URL } from "@/lib/constants";
import { LuMail, LuCalendar } from "react-icons/lu";

export function ContactSection() {
  return (
    <SectionWrapper id="contact">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          Get In Touch
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Let&apos;s build something intelligent together.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <AnimatedOnScroll direction="left">
          <ContactForm />
        </AnimatedOnScroll>

        <AnimatedOnScroll direction="right">
          <div className="rounded-xl bg-bg-card border border-border p-8 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <LuCalendar size={24} className="text-accent" />
              <h3 className="text-xl font-semibold text-text-primary">
                Prefer a conversation?
              </h3>
            </div>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Book a free 30-minute consultation to discuss how AI automation can
              transform your business. No commitments, just insights.
            </p>
            <Button href={BOOKING_URL} external className="w-full">
              Book a Free Consultation
            </Button>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-text-secondary">
                <LuMail size={18} className="text-accent" />
                <a
                  href="mailto:hello@jontri.com"
                  className="hover:text-text-primary transition-colors"
                >
                  hello@jontri.com
                </a>
              </div>
            </div>
          </div>
        </AnimatedOnScroll>
      </div>
    </SectionWrapper>
  );
}
