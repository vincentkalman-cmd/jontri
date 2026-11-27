import nodemailer from "nodemailer";

/** Send an email through the Jontri Zoho account. Returns false (and logs) instead of throwing. */
export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  const user = process.env.ZOHO_EMAIL;
  const pass = process.env.ZOHO_PASSWORD;
  if (!user || !pass) {
    console.error("sendMail: missing ZOHO_EMAIL or ZOHO_PASSWORD");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({ host: "smtp.zoho.com", port: 587, secure: false, auth: { user, pass } });
    await transporter.sendMail({ from: `"Jontri AI Assistant" <${user}>`, ...opts });
    return true;
  } catch (e) {
    console.error("sendMail failed:", e instanceof Error ? e.message : e);
    return false;
  }
}
