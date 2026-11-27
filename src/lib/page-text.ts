/** Readable text from an HTML page (scripts/styles/svg stripped), capped at 6k chars. */
export function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<\/(h[1-6]|p|li|div|section|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .split("\n").map((l) => l.trim()).filter((l) => l.length > 20)
    .join("\n")
    .slice(0, 6000);
}

/** JSON-LD @type values found in the page (scripts are stripped from page text, so detect them here). */
export function structuredDataTypes(html: string): string[] {
  const types = new Set<string>();
  for (const block of html.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || []) {
    for (const m of block.matchAll(/"@type"\s*:\s*(?:"([^"]+)"|\[([^\]]*)\])/g)) {
      if (m[1]) types.add(m[1]);
      if (m[2]) for (const t of m[2].matchAll(/"([^"]+)"/g)) types.add(t[1]);
    }
  }
  return [...types].slice(0, 20);
}
