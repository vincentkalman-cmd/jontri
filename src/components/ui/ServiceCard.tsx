import {
  LuBotMessageSquare,
  LuTrendingUp,
  LuPiggyBank,
  LuBrain,
  LuChartBar,
  LuShield,
} from "react-icons/lu";
import { AnimatedOnScroll } from "./AnimatedOnScroll";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  BotMessageSquare: LuBotMessageSquare,
  TrendingUp: LuTrendingUp,
  PiggyBank: LuPiggyBank,
  Brain: LuBrain,
  BarChart3: LuChartBar,
  Shield: LuShield,
};

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  index: number;
}

export function ServiceCard({ icon, title, description, index }: ServiceCardProps) {
  const Icon = iconMap[icon];

  return (
    <AnimatedOnScroll delay={index * 0.1}>
      <div className="group rounded-xl bg-bg-card border border-border p-6 transition-all duration-300 hover:border-border-accent hover:bg-bg-card-hover hover:scale-[1.02] h-full">
        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent">
          {Icon && <Icon size={24} />}
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </AnimatedOnScroll>
  );
}
