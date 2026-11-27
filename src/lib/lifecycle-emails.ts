/** Lifecycle email templates. Pure — no app imports. All inputs are escaped. */

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const subj = (v: string) => v.replace(/[\r\n]+/g, " ").slice(0, 150);

function shell(title: string, body: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#16171b;line-height:1.6">
<p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#22a58e;margin:0 0 8px">Jontri</p>
<h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
${body}
<p style="font-size:12px;color:#7a756d;margin-top:32px">Jontri · jontri.com</p>
</div>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${esc(href)}" style="display:inline-block;background:#35e0c2;color:#021a15;font-weight:700;padding:12px 20px;border-radius:10px;text-decoration:none">${esc(label)}</a></p>`;

export function ownerNewSignupEmail(p: { businessName: string; contactName: string; email: string; phone: string; packageName: string; stageLabel: string; dashboardUrl: string }) {
  return {
    subject: subj(`New client sign-up: ${p.businessName} (${p.packageName})`),
    html: shell(
      `New sign-up: ${esc(p.businessName)}`,
      `<p><strong>${esc(p.contactName)}</strong> · ${esc(p.email)} · ${esc(p.phone)}</p>
<p>Package: ${esc(p.packageName)}<br>Stage: ${esc(p.stageLabel)}</p>
${button(p.dashboardUrl, "Open the dashboard")}`,
    ),
  };
}

export function clientWelcomeEmail(p: { contactName: string; businessName: string; portalUrl: string; bookingUrl: string; needs: string[]; awaitingProposal: boolean }) {
  const needs = p.needs.length
    ? `<p>A few things we'll need from you (you can track these in your portal):</p><ul>${p.needs.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
    : "";
  const next = p.awaitingProposal
    ? `<p>We'll put together a custom proposal for ${esc(p.businessName)}. Book a call so we can scope it together.</p>`
    : `<p>Next step: book your kickoff call. We'll start building ${esc(p.businessName)}'s AI crew right after.</p>`;
  return {
    subject: subj(`Welcome to Jontri, ${p.businessName}`),
    html: shell(
      `Welcome aboard, ${esc(p.contactName)}.`,
      `${next}
${button(p.bookingUrl, "Book your call")}
<p>Your private portal shows progress on every service, what's live, and what we need from you. Keep this link to yourself.</p>
${button(p.portalUrl, "Open your portal")}
${needs}`,
    ),
  };
}

export function clientReadyForReviewEmail(p: { contactName: string; businessName: string; portalUrl: string }) {
  return {
    subject: subj(`${p.businessName}: your AI crew is ready for review`),
    html: shell(
      `Ready for your review, ${esc(p.contactName)}.`,
      `<p>Everything for ${esc(p.businessName)} is set up. Open your portal to try the chatbot, call your AI receptionist, then click <strong>Approve</strong> or tell us what to change.</p>
${button(p.portalUrl, "Review and approve")}`,
    ),
  };
}

export function ownerFeedbackEmail(p: { businessName: string; action: "approve" | "changes"; note: string; dashboardUrl: string }) {
  const approved = p.action === "approve";
  return {
    subject: subj(approved ? `${p.businessName} approved: now live` : `${p.businessName} requested changes`),
    html: shell(
      approved ? `${esc(p.businessName)} approved` : `${esc(p.businessName)} requested changes`,
      `${p.note ? `<blockquote style="border-left:3px solid #35e0c2;margin:0;padding:8px 14px;background:#f4fbf9">${esc(p.note).replace(/\n/g, "<br>")}</blockquote>` : ""}
${button(p.dashboardUrl, "Open the dashboard")}`,
    ),
  };
}
