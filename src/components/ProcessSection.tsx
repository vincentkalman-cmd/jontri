import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ProcessStep } from "@/components/ui/ProcessStep";
import { PROCESS_STEPS } from "@/lib/constants";

export function ProcessSection() {
  return (
    <SectionWrapper id="process" alternate>
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          How It Works
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          From discovery to delivery in four proven steps.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {PROCESS_STEPS.map((step, i) => (
          <ProcessStep
            key={step.step}
            {...step}
            index={i}
            isLast={i === PROCESS_STEPS.length - 1}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
