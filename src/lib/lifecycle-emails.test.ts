import { test } from "node:test";
import assert from "node:assert/strict";
import { ownerNewSignupEmail, clientWelcomeEmail, clientReadyForReviewEmail, ownerFeedbackEmail } from "./lifecycle-emails.ts";

test("welcome email links the portal and booking page and lists needs", () => {
  const e = clientWelcomeEmail({ contactName: "Dana", businessName: "Haul Hero", portalUrl: "https://jontri.com/p/tok", bookingUrl: "https://cal.example/x", needs: ["Add the chatbot code"], awaitingProposal: false });
  assert.match(e.subject, /Haul Hero/);
  assert.match(e.html, /href="https:\/\/jontri\.com\/p\/tok"/);
  assert.match(e.html, /href="https:\/\/cal\.example\/x"/);
  assert.match(e.html, /Add the chatbot code/);
});

test("proposal welcome says a proposal is coming", () => {
  const e = clientWelcomeEmail({ contactName: "Dana", businessName: "B", portalUrl: "https://jontri.com/p/t", bookingUrl: "https://c", needs: [], awaitingProposal: true });
  assert.match(e.html, /proposal/i);
});

test("user-supplied text is escaped everywhere", () => {
  const evil = `<script>alert(1)</script>`;
  const a = ownerNewSignupEmail({ businessName: evil, contactName: evil, email: "a@b.co", phone: evil, packageName: "Tier 1", stageLabel: "Kickoff", dashboardUrl: "https://jontri.com/dashboard" });
  const b = ownerFeedbackEmail({ businessName: "B", action: "changes", note: evil, dashboardUrl: "https://jontri.com/dashboard" });
  const c = clientReadyForReviewEmail({ contactName: evil, businessName: "B", portalUrl: "https://jontri.com/p/t" });
  for (const e of [a, b, c]) assert.equal(e.html.includes("<script>"), false);
  assert.match(b.html, /&lt;script&gt;/);
  assert.match(b.subject, /changes/i);
  assert.match(ownerFeedbackEmail({ businessName: "B", action: "approve", note: "", dashboardUrl: "x" }).subject, /approved/i);
});

test("subjects strip newlines (no header injection)", () => {
  const e = ownerNewSignupEmail({ businessName: "Acme\r\nBcc: x@y.z", contactName: "A", email: "a@b.co", phone: "1", packageName: "T", stageLabel: "K", dashboardUrl: "d" });
  assert.equal(/[\r\n]/.test(e.subject), false);
});
