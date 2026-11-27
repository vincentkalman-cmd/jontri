import Link from "next/link";
/** Site-wide footer, identical on every page (styles live in home.css under .jh). */
export function SiteFooter() {
  return (
    <div className="jh">
      <footer>
        <div className="wrap">
          <Link className="logo" href="/" style={{ margin: 0 }}>
            <i aria-hidden />
            jontri
          </Link>
          <div>
            © {new Date().getFullYear()} Jontri ·{" "}
            <a href="mailto:hello@jontri.com" style={{ marginLeft: 0 }}>
              hello@jontri.com
            </a>
            <Link href="/sign-in">Client login</Link>
            <Link href="/onboarding">Onboarding</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
