import { AnimatedOnScroll } from "./AnimatedOnScroll";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  index: number;
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  index,
}: TestimonialCardProps) {
  return (
    <AnimatedOnScroll delay={index * 0.15}>
      <div className="rounded-xl bg-bg-card border border-border p-6 h-full border-l-4 border-l-accent">
        <p className="text-text-secondary leading-relaxed mb-4 italic">
          &ldquo;{quote}&rdquo;
        </p>
        <div>
          <p className="font-semibold text-text-primary">{author}</p>
          <p className="text-sm text-text-muted">
            {role}, {company}
          </p>
        </div>
      </div>
    </AnimatedOnScroll>
  );
}
