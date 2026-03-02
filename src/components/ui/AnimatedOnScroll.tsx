"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

interface AnimatedOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function AnimatedOnScroll({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimatedOnScrollProps) {
  const offsets: Record<string, { x?: number; y?: number }> = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
