"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

  const inputClasses = "w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Sign In</h1>
            <p className="text-text-secondary text-sm mt-2">Access your Jontri automation dashboard</p>
          </div>

          {showForgot ? (
            <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
              <span className="text-4xl block mb-4">&#x1F4E7;</span>
              <h2 className="text-lg font-bold text-text-primary mb-2">Reset Your Password</h2>
              <p className="text-text-muted text-sm mb-6">
                Contact your Jontri account manager to reset your password:
              </p>
              <a
                href="mailto:vincent@jontri.com?subject=Password%20Reset%20Request"
                className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent-dark transition-colors"
              >
                Email vincent@jontri.com
              </a>
              <p className="text-text-muted text-xs mt-4">Or call us to get immediate assistance.</p>
              <button
                onClick={() => setShowForgot(false)}
                className="text-accent text-sm mt-4 hover:text-accent-dark transition-colors block mx-auto"
              >
                &larr; Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-xl p-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={inputClasses + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-accent text-sm hover:text-accent-dark transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-text-muted text-xs mt-6">
            Need access? Contact your Jontri account manager.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
