import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildChecklistEmail } from "@/lib/checklistEmail";

const KIT_FORM_ID = "9153586";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD,
    },
  });
}

async function sendNotificationEmail(data: {
  name?: string;
  email: string;
  company?: string;
  message?: string;
}) {
  const to = process.env.ZOHO_EMAIL;
  if (!to || !process.env.ZOHO_PASSWORD) {
    console.error("Missing ZOHO_EMAIL or ZOHO_PASSWORD env vars");
    return;
  }

  const safeName = escapeHtml(data.name || "Unknown");
  const safeEmail = escapeHtml(data.email);
  const safeCompany = data.company ? escapeHtml(data.company) : "";
  const safeMessage = data.message ? escapeHtml(data.message) : "";

  const subject = data.message
    ? `New Contact Form Submission from ${safeName}`
    : `New Lead Capture: ${safeName} (${safeEmail})`;

  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeName}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      ${safeCompany ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeCompany}</td></tr>` : ""}
      ${safeMessage ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeMessage}</td></tr>` : ""}
    </table>
    <br/>
    <p style="color:#666;font-size:12px;">Sent from jontri.com contact form</p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Jontri Website" <${to}>`,
    to,
    replyTo: data.email,
    subject,
    html,
  });
}

async function sendChecklistEmail(data: { name?: string; email: string }) {
  const from = process.env.ZOHO_EMAIL;
  if (!from || !process.env.ZOHO_PASSWORD) {
    console.error("Missing ZOHO_EMAIL or ZOHO_PASSWORD env vars");
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Jontri Consulting" <${from}>`,
    to: data.email,
    subject: "Your 10-Point AI Readiness Audit Checklist",
    html: buildChecklistEmail(data.name || ""),
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const body = new URLSearchParams();
    body.append("email_address", data.email);
    if (data.name) body.append("first_name", data.name);
    if (data.company) body.append("fields[company]", data.company);
    if (data.message) body.append("fields[message]", data.message);

    const res = await fetch(
      `https://app.convertkit.com/forms/${KIT_FORM_ID}/subscriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Kit API error:", res.status, text);
      return NextResponse.json(
        { error: "Subscription failed" },
        { status: res.status }
      );
    }

    // Send both the checklist to the subscriber and the notification to us
    await Promise.allSettled([
      sendChecklistEmail(data),
      sendNotificationEmail(data),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
