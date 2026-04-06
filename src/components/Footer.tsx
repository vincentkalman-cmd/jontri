import { NAV_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Jontri Consulting
            </h3>
            <p className="text-sm text-text-secondary">
              AI-powered business consulting that increases income and decreases
              expenses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/onboarding"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Client Onboarding
                </a>
              </li>
              <li>
                <a
                  href="/sign-in"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Client Portal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-text-muted text-sm">
          &copy; {new Date().getFullYear()} Jontri Consulting. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
