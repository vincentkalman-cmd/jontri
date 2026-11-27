/** Pull contact details a chat visitor typed (email and/or phone). */
export function extractContact(text: string): { email?: string; phone?: string } | null {
  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
  const phoneMatch = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/);
  const phone = phoneMatch?.[0]?.trim();
  if (!email && !phone) return null;
  return { ...(email ? { email } : {}), ...(phone ? { phone } : {}) };
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Plain HTML email body summarizing a chatbot lead + recent transcript. */
export function leadEmailHtml(
  businessName: string,
  contact: { email?: string; phone?: string },
  transcript: { role: string; content: string }[],
): string {
  const rows = transcript
    .slice(-10)
    .map(
      (m) =>
        `<p style="margin:0 0 8px"><b>${m.role === "assistant" ? "Assistant" : "Visitor"}:</b> ${escapeHtml(m.content).slice(0, 1500)}</p>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
<h2 style="margin:0 0 12px">New website chat lead for ${escapeHtml(businessName)}</h2>
${contact.email ? `<p><b>Email:</b> <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>` : ""}
${contact.phone ? `<p><b>Phone:</b> <a href="tel:${escapeHtml(contact.phone)}">${escapeHtml(contact.phone)}</a></p>` : ""}
<h3 style="margin:16px 0 8px">Conversation</h3>${rows}
<p style="color:#888;font-size:12px;margin-top:16px">Sent by your AI website assistant · Jontri</p></div>`;
}
