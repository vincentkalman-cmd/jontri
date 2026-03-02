import { AnimatedOnScroll } from "./AnimatedOnScroll";

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  index: number;
  isLast: boolean;
}

export function ProcessStep({
  step,
  title,
  description,
  index,
  isLast,
}: ProcessStepProps) {
  return (
    <AnimatedOnScroll delay={index * 0.15} className="relative">
      <div className="flex flex-col items-center text-center">
        {/* Step number */}
        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white font-bold text-lg mb-4">
          {step}
        </div>

        {/* Connecting line (desktop) */}
        {!isLast && (
          <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-[2px] bg-border" />
        )}

        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
    </AnimatedOnScroll>
  );
}
