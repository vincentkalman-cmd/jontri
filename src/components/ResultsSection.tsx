import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { StatCounter } from "@/components/ui/StatCounter";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { STATS, TESTIMONIALS } from "@/lib/constants";

export function ResultsSection() {
  return (
    <SectionWrapper id="results" alternate>
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          Proven Results
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Real impact, real numbers — see what AI automation delivers.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {STATS.map((stat) => (
          <StatCounter key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((testimonial, i) => (
          <TestimonialCard key={testimonial.author} {...testimonial} index={i} />
        ))}
      </div>
    </SectionWrapper>
  );
}
