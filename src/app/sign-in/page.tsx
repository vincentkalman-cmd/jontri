"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LuMail, LuArrowLeft } from "react-icons/lu";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageGlow, Kicker, primaryBtn, inputCls, panelCls } from "@/components/site/ui";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-bg-primary flex items-center justify-center px-4 py-16">
        <PageGlow />
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <Kicker>Client portal</Kicker>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-none text-text-primary">
              Welcome back.
            </h1>
            <p className="text-text-secondary mt-4">Sign in to manage your AI crew.</p>
          </div>

          {showForgot ? (
            <div className={`${panelCls} p-7 text-center`}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <LuMail size={22} aria-hidden />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Reset your password</h2>
              <p className="text-text-secondary text-sm mb-6">
                Email us and we&apos;ll reset it for you, usually within a few hours.
              </p>
              <a href="mailto:vincent@jontri.com?subject=Password%20Reset%20Request" className={primaryBtn}>
                Email vincent@jontri.com
              </a>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="mt-6 mx-auto flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <LuArrowLeft size={14} aria-hidden /> Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={`${panelCls} p-7 space-y-5`}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`${inputCls} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#FF9B8A]" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
                {loading ? "Signing in…" : "Sign in →"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-text-muted text-sm mt-6">
            Not a client yet?{" "}
            <Link href="/#demo" className="text-accent-light hover:text-accent transition-colors">
              See what we build →
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
