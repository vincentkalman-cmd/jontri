"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { BOOKING_URL } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-end/10 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
        >
          AI Automation That Grows{" "}
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
            Your Bottom Line
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          We help businesses increase income and decrease expenses through
          intelligent AI automation — delivering measurable results, not just
          technology.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button href={BOOKING_URL} external>
            Book a Free Consultation
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              document
                .querySelector("#process")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            See How It Works
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
