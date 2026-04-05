"use client";

import { useState, useEffect } from "react";
import { NAV_LINKS, BOOKING_URL } from "@/lib/constants";
import { scrollToSection } from "@/lib/smoothScroll";
import { Button } from "@/components/ui/Button";
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
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-xl font-bold text-text-primary tracking-tight"
        >
          Jontri
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

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/sign-in"
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Dashboard
          </a>
          <Button href={BOOKING_URL} external className="text-xs px-4 py-2">
            Book a Call
          </Button>
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
            <a
              href="/sign-in"
              onClick={() => setIsOpen(false)}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
            >
              Dashboard
            </a>
            <Button
              href={BOOKING_URL}
              external
              className="text-xs px-4 py-2 mt-2 w-full"
            >
              Book a Call
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
