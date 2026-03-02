import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { SERVICES } from "@/lib/constants";

export function ServicesSection() {
  return (
    <SectionWrapper id="services">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          What We Do
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          AI solutions designed for real business impact — from automating
          workflows to unlocking new revenue streams.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service, i) => (
          <ServiceCard key={service.title} {...service} index={i} />
        ))}
      </div>
    </SectionWrapper>
  );
}
