export function scrollToSection(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
) {
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
