import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants";
import { FaLinkedin, FaXTwitter, FaInstagram } from "react-icons/fa6";

const socialIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  LinkedIn: FaLinkedin,
  Twitter: FaXTwitter,
  Instagram: FaInstagram,
};

export function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Jontri
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
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">
              Follow Us
            </h4>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => {
                const Icon = socialIconMap[social.platform];
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.platform}`}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-card border border-border text-text-secondary hover:text-accent hover:border-border-accent transition-all"
                  >
                    {Icon && <Icon size={18} />}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-text-muted text-sm">
          &copy; {new Date().getFullYear()} Jontri. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
