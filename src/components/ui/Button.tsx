import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent-glow",
  secondary:
    "border border-accent text-accent hover:bg-accent hover:text-white",
  ghost: "text-text-secondary hover:text-text-primary",
};

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
  external,
  type = "button",
  disabled,
}: ButtonProps) {
  const base = `inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold
    transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
    focus:ring-offset-bg-primary`;

  const classes = `${base} ${variantStyles[variant]} ${className}`;

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} type={type} disabled={disabled} className={`${classes} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {children}
    </button>
  );
}
