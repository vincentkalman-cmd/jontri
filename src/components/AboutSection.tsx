import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedOnScroll } from "@/components/ui/AnimatedOnScroll";
import { LuTarget, LuCpu, LuUsers } from "react-icons/lu";

const highlights = [
  {
    icon: LuTarget,
    title: "Results-Driven",
    description:
      "Every engagement is measured by tangible business outcomes — not just technology delivered.",
  },
  {
    icon: LuCpu,
    title: "AI-First Approach",
    description:
      "We leverage cutting-edge AI to solve real problems, not chase trends.",
  },
  {
    icon: LuUsers,
    title: "Industry Experts",
    description:
      "Our team combines deep AI expertise with decades of business consulting experience.",
  },
];

export function AboutSection() {
  return (
    <SectionWrapper id="about">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <AnimatedOnScroll direction="left">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">
            About Jontri Consulting
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Jontri Consulting was founded on a simple belief: AI should work for your
            business, not the other way around. We partner with companies to
            identify where intelligent automation can make the biggest impact —
            increasing revenue and cutting costs simultaneously.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Our team of AI specialists and business strategists brings a unique
            blend of technical depth and commercial acumen. We don&apos;t just build
            AI — we build AI that pays for itself.
          </p>
        </AnimatedOnScroll>

        <div className="space-y-6">
          {highlights.map((item, i) => (
            <AnimatedOnScroll key={item.title} delay={i * 0.15} direction="right">
              <div className="flex gap-4 p-4 rounded-xl bg-bg-card border border-border">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent">
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </div>
            </AnimatedOnScroll>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
