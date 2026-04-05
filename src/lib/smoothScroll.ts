export function scrollToSection(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
) {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (window.location.pathname !== "/") {
    window.location.href = "/" + href;
  }
}
