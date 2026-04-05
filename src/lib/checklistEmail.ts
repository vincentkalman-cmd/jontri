export function buildChecklistEmail(name: string): string {
  const firstName = name || "there";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your 10-Point AI Readiness Audit Checklist</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f1c,#1a2236);padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Jontri Consulting</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">AI-Powered Business Consulting</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0a0f1c;">Hi ${firstName},</h2>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">
                Thank you for your interest in AI automation! Here's your <strong>10-Point AI Readiness Audit Checklist</strong> — a practical framework to evaluate where AI can save you money and drive new revenue.
              </p>
              <p style="margin:0;font-size:16px;line-height:1.6;color:#475569;">
                Work through each point honestly. The more "No" answers you have, the bigger the opportunity for AI to transform your business.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:2px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:1px;"></div>
            </td>
          </tr>

          <!-- Checklist Title -->
          <tr>
            <td style="padding:30px 40px 10px;">
              <h3 style="margin:0;font-size:18px;font-weight:700;color:#0a0f1c;">Your 10-Point AI Readiness Audit</h3>
            </td>
          </tr>

          <!-- Item 1 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">1</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Repetitive Task Inventory</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Have you identified which tasks your team repeats daily or weekly? (Data entry, report generation, email responses, scheduling, invoicing) List the top 5 most time-consuming repetitive tasks and estimate hours spent per week on each.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 2 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">2</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Data Accessibility</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Is your business data organized and digitally accessible? AI needs structured data to work effectively. Assess whether your customer records, financials, and operations data are in digital systems (CRM, spreadsheets, databases) or still in silos.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 3 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">3</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Customer Journey Mapping</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Do you know exactly how leads find you, engage, and convert? Map out every touchpoint from first visit to purchase. Identify where prospects drop off — these are your highest-ROI automation opportunities.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 4 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">4</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Lead Response Time</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">How quickly do you respond to new inquiries? Studies show responding within 5 minutes makes you 21x more likely to qualify a lead. If your average response time is over an hour, AI chatbots and automated follow-ups can close that gap instantly.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 5 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">5</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Marketing & Content Scalability</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Can you produce enough marketing content to stay competitive? If creating social posts, emails, and blog content is a bottleneck, AI content tools can 10x your output while maintaining your brand voice.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 6 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">6</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Cost-per-Acquisition Clarity</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Do you know your exact cost to acquire a customer across each channel? AI analytics can track attribution across every touchpoint and optimize your ad spend automatically — but only if you're measuring it first.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 7 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">7</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Website Performance & Conversion</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Is your website actively converting visitors into leads? Check your conversion rate (industry average is 2-5%). If it's below that, AI-powered personalization, smart chatbots, and dynamic CTAs can significantly improve it.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 8 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">8</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Customer Support Load</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">What percentage of customer questions are repetitive? If more than 40% of support requests are FAQs or status checks, an AI assistant can handle them 24/7 — freeing your team for complex issues that actually need a human.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 9 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">9</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Revenue Leakage Points</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Are you losing revenue to missed follow-ups, forgotten renewals, or slow proposals? Identify your top 3 revenue leakage points. AI-powered workflows can automate follow-up sequences, renewal reminders, and proposal generation.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Item 10 -->
          <tr>
            <td style="padding:12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:28px;">10</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0a0f1c;">Team Capacity & Growth Bottleneck</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">Is your team's capacity the main thing limiting growth? If you can't scale revenue without hiring proportionally, AI automation can break that ceiling. Identify which roles spend the most time on work that doesn't require human judgment.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="height:2px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:1px;"></div>
            </td>
          </tr>

          <!-- Scoring Section -->
          <tr>
            <td style="padding:24px 40px;">
              <h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0a0f1c;">How to Score Yourself</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#475569;"><strong style="color:#10b981;">8-10 "Yes" answers:</strong> You're AI-ready. It's time to implement and start seeing ROI.</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#475569;"><strong style="color:#3b82f6;">5-7 "Yes" answers:</strong> Strong foundation. A few quick wins can get you to full readiness fast.</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;"><strong style="color:#f59e0b;">0-4 "Yes" answers:</strong> Big opportunity ahead. The gaps you've found are exactly where AI delivers the most impact.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:16px 40px 40px;text-align:center;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
                <strong>No matter your score, there's an opportunity.</strong> Book a free strategy session and we'll walk through your results together — with a custom action plan for your business.
              </p>
              <a href="https://calendly.com/jontri/consultation" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">Get Your Free Strategy Session</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">Jontri Consulting | AI-Powered Business Consulting</p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                You received this because you requested our AI Readiness Checklist at jontri.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
