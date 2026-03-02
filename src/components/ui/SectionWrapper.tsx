interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  alternate?: boolean;
}

export function SectionWrapper({
  id,
  children,
  className = "",
  alternate = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 py-20 px-4 sm:px-6 lg:px-8 ${
        alternate ? "bg-bg-secondary" : "bg-bg-primary"
      } ${className}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
