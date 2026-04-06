"use client";

import { useState, useEffect } from "react";
import { NAV_LINKS, BOOKING_URL } from "@/lib/constants";
import { scrollToSection } from "@/lib/smoothScroll";
import { LuMenu, LuX } from "react-icons/lu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg-primary/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <a
          href="/"
          className="text-xl tracking-tight"
        >
          <span className="text-accent font-medium">Jontri</span>{" "}
          <span className="text-text-primary font-bold">Consulting</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                scrollToSection(e, link.href);
              }}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors"
          >
            Book a Call
          </a>
          <a
            href="/onboarding"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Onboarding
          </a>
          <a
            href="/sign-in"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-text-primary p-2"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <LuX size={24} /> : <LuMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-bg-primary/95 backdrop-blur-md border-b border-border">
          <div className="flex flex-col px-4 py-4 gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  scrollToSection(e, link.href);
                  setIsOpen(false);
                }}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 mt-2">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors text-center"
              >
                Book a Call
              </a>
              <a
                href="/onboarding"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-center"
              >
                Onboarding
              </a>
              <a
                href="/sign-in"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-center"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
