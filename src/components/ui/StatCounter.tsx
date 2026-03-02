"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

interface StatCounterProps {
  value: number;
  suffix: string;
  label: string;
}

export function StatCounter({ value, suffix, label }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setCount(start);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-bold text-accent">
        {count}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-text-secondary">{label}</div>
    </div>
  );
}
