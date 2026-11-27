"use client";

import { useEffect } from "react";

/** Adds `.in` to `.reveal` elements (and `.go` to #journey) as they scroll into view. */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".jh .reveal, .jh #journey");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in", "go"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          if (e.target.id === "journey") e.target.classList.add("go");
          io.unobserve(e.target);
        }),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
