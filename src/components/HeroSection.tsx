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

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[8%] w-16 h-16 border border-border/30 rounded-lg rotate-45 opacity-20" />
        <div className="absolute top-[30%] right-[5%] w-8 h-8 border border-accent/20 rounded-full opacity-30" />
        <div className="absolute top-[55%] left-[15%] w-3 h-3 bg-text-muted/20 rounded-full" />
        <div className="absolute top-[35%] right-[12%] w-2 h-2 bg-accent/30 rounded-full" />
        <div className="absolute bottom-[25%] left-[5%] w-12 h-12 bg-accent/5 rounded-lg rotate-45" />
        <div className="absolute bottom-[15%] right-[3%] w-20 h-20 border border-border/20 rounded-2xl rotate-12 opacity-15" />
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
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-5 py-2 text-sm font-medium text-accent mb-8">
            <span className="w-2 h-2 rounded-full bg-accent" />
            AI-Powered Business Consulting
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight"
        >
          <span className="italic">Your Business.</span>
          <br />
          <span className="bg-gradient-to-r from-gradient-start via-purple-400 to-amber-400 bg-clip-text text-transparent italic">
            Automated.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-4 text-xl sm:text-2xl font-semibold text-text-primary"
        >
          More Revenue. Less Overhead.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-4 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          We implement AI solutions that replace repetitive work, power your
          marketing and sales, and build smarter digital experiences — so your
          team can focus on growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button href={BOOKING_URL} external>
            Get Your Free Strategy Session
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

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="mt-16 flex items-center justify-center gap-8 sm:gap-12 text-sm text-text-muted"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>150+ Businesses</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>98% Retention</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>3x Revenue Avg.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
