import Link from "next/link";
import { TalkToAI } from "@/components/home/TalkToAI";

const LINKS = [
  { href: "/#demo", label: "Try it" },
  { href: "/#services", label: "Services" },
  { href: "/#how", label: "How it works" },
  { href: "/#packages", label: "Packages" },
  { href: "/#faq", label: "FAQ" },
];

/** Site-wide header, identical on every page (styles live in home.css under .jh). */
export function SiteNav({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="jh site-bar">
      <nav aria-label="Main">
        <div className="wrap">
          <Link className="logo" href="/" aria-label="Jontri home">
            <i aria-hidden />
            jontri
          </Link>
          {!minimal && (
            <div className="links">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
          <div className="navr">
            {minimal ? (
              <Link className="login" href="/">
                ← Back to site
              </Link>
            ) : (
              <>
                <Link className="login" href="/sign-in">
                  Client login
                </Link>
                <TalkToAI />
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
