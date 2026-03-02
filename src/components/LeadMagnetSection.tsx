import { AnimatedOnScroll } from "@/components/ui/AnimatedOnScroll";
import { LeadCaptureForm } from "@/components/ui/LeadCaptureForm";
import { LuFileCheck, LuZap, LuClock } from "react-icons/lu";

const benefits = [
  { icon: LuFileCheck, text: "10 actionable audit points for your business" },
  { icon: LuZap, text: "Identify your biggest AI automation opportunities" },
  { icon: LuClock, text: "Takes only 15 minutes to complete" },
];

export function LeadMagnetSection() {
  return (
    <section className="scroll-mt-20 py-20 px-4 sm:px-6 lg:px-8 bg-bg-primary relative overflow-hidden">
      {/* Accent glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl relative z-10">
        <AnimatedOnScroll>
          <div className="rounded-2xl border border-border-accent bg-bg-card p-8 sm:p-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
              Free Resource
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Is Your Business Ready for AI?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              Download our free <strong className="text-text-primary">10-Point AI Readiness Audit Checklist</strong> and
              discover exactly where AI automation can save you money and drive
              new revenue.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
              {benefits.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 text-sm text-text-secondary"
                >
                  <item.icon size={16} className="text-accent flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="max-w-lg mx-auto">
              <LeadCaptureForm />
            </div>
          </div>
        </AnimatedOnScroll>
      </div>
    </section>
  );
}
