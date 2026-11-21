const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Jontri Consulting";
pres.title = "Jontri Consulting - AI Automation Packages";

// Colors
const NAVY = "0A0F1C";
const DARK = "111827";
const CARD = "1A2236";
const ACCENT = "3B82F6";
const PURPLE = "8B5CF6";
const GREEN = "10B981";
const WHITE = "F1F5F9";
const MUTED = "94A3B8";
const DIM = "64748B";
const BORDER = "1E293B";
const AMBER = "F59E0B";

const mkShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.25 });

// ============================================================
// SLIDE 1: Title
// ============================================================
const s1 = pres.addSlide();
s1.background = { color: NAVY };

// Subtle gradient accent bar at top
s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

// Logo area
s1.addText([
  { text: "Jontri ", options: { color: ACCENT, fontSize: 28, fontFace: "Georgia" } },
  { text: "Consulting", options: { color: WHITE, fontSize: 28, fontFace: "Georgia", bold: true } },
], { x: 0.7, y: 0.5, w: 5, h: 0.6, margin: 0 });

// Main title
s1.addText("AI Automation\nThat Grows Your\nBottom Line", {
  x: 0.7, y: 1.5, w: 8.5, h: 2.5,
  fontSize: 48, fontFace: "Georgia", color: WHITE, bold: true,
  lineSpacingMultiple: 1.1, margin: 0,
});

// Subtitle
s1.addText("Managed AI services that increase revenue and decrease expenses\u2014delivering measurable results, not just technology.", {
  x: 0.7, y: 4.0, w: 7, h: 0.8,
  fontSize: 16, fontFace: "Calibri", color: MUTED, lineSpacingMultiple: 1.4,
});

// Stats at bottom
const stats = ["150+ Businesses", "98% Retention", "3x Revenue Avg."];
stats.forEach((stat, i) => {
  const xPos = 0.7 + i * 2.8;
  s1.addShape(pres.shapes.OVAL, { x: xPos, y: 5.05, w: 0.12, h: 0.12, fill: { color: GREEN } });
  s1.addText(stat, { x: xPos + 0.22, y: 4.95, w: 2.2, h: 0.3, fontSize: 12, fontFace: "Calibri", color: DIM, margin: 0 });
});

// ============================================================
// SLIDE 2: The Problem
// ============================================================
const s2 = pres.addSlide();
s2.background = { color: NAVY };
s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s2.addText("The Problem", {
  x: 0.7, y: 0.4, w: 8, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});

s2.addText("Your business is leaving money on the table every day.", {
  x: 0.7, y: 1.1, w: 8, h: 0.5,
  fontSize: 16, fontFace: "Calibri", color: MUTED,
});

const problems = [
  { stat: "62%", label: "of calls go unanswered", desc: "Every missed call is a missed customer. Your competitors answer theirs." },
  { stat: "5hrs", label: "wasted on manual follow-ups", desc: "Your team spends hours chasing leads that could be automated." },
  { stat: "0", label: "leads generated overnight", desc: "While you sleep, your pipeline sits empty. AI never sleeps." },
  { stat: "73%", label: "of reviews go unanswered", desc: "Unmanaged reputation costs you customers before they even call." },
];

problems.forEach((p, i) => {
  const yPos = 1.8 + i * 0.9;
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: yPos, w: 8.6, h: 0.75,
    fill: { color: CARD },
    shadow: mkShadow(),
  });
  s2.addText(p.stat, {
    x: 0.9, y: yPos + 0.08, w: 1.2, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: ACCENT, bold: true, align: "center", valign: "middle", margin: 0,
  });
  s2.addText(p.label, {
    x: 2.2, y: yPos + 0.08, w: 2.5, h: 0.6,
    fontSize: 14, fontFace: "Calibri", color: WHITE, bold: true, valign: "middle", margin: 0,
  });
  s2.addText(p.desc, {
    x: 4.8, y: yPos + 0.08, w: 4.3, h: 0.6,
    fontSize: 12, fontFace: "Calibri", color: MUTED, valign: "middle", margin: 0,
  });
});

// ============================================================
// SLIDE 3: The Solution
// ============================================================
const s3 = pres.addSlide();
s3.background = { color: NAVY };
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s3.addText("Our Solution", {
  x: 0.7, y: 0.4, w: 8, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});

s3.addText("We don\u2019t sell AI tools. We run your AI.", {
  x: 0.7, y: 1.1, w: 8, h: 0.5,
  fontSize: 18, fontFace: "Calibri", color: ACCENT, italic: true,
});

const solutions = [
  { title: "Managed, Not DIY", desc: "We handle everything \u2014 setup, training, optimization. You just see the results." },
  { title: "Trained on YOUR Business", desc: "Every AI agent is trained on your services, FAQs, and brand voice." },
  { title: "Measurable ROI", desc: "Monthly reports showing calls answered, leads generated, and revenue impact." },
  { title: "24/7 Operations", desc: "Your AI agents work around the clock \u2014 answering calls, capturing leads, responding to reviews." },
];

solutions.forEach((s, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const xPos = 0.7 + col * 4.5;
  const yPos = 1.9 + row * 1.7;

  s3.addShape(pres.shapes.RECTANGLE, {
    x: xPos, y: yPos, w: 4.1, h: 1.4,
    fill: { color: CARD },
    shadow: mkShadow(),
  });
  s3.addShape(pres.shapes.RECTANGLE, {
    x: xPos, y: yPos, w: 0.07, h: 1.4,
    fill: { color: ACCENT },
  });
  s3.addText(s.title, {
    x: xPos + 0.3, y: yPos + 0.15, w: 3.6, h: 0.4,
    fontSize: 16, fontFace: "Calibri", color: WHITE, bold: true, margin: 0,
  });
  s3.addText(s.desc, {
    x: xPos + 0.3, y: yPos + 0.6, w: 3.6, h: 0.6,
    fontSize: 12, fontFace: "Calibri", color: MUTED, margin: 0,
  });
});

// ============================================================
// SLIDE 4: Tier 1 - AI Lead Engine
// ============================================================
const s4 = pres.addSlide();
s4.background = { color: NAVY };
s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s4.addText("Tier 1", {
  x: 0.7, y: 0.3, w: 3, h: 0.4,
  fontSize: 14, fontFace: "Calibri", color: ACCENT, bold: true, margin: 0,
});
s4.addText("AI Lead Engine", {
  x: 0.7, y: 0.65, w: 6, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});
s4.addText("Fill your pipeline on autopilot", {
  x: 0.7, y: 1.3, w: 6, h: 0.4,
  fontSize: 16, fontFace: "Calibri", color: MUTED, italic: true, margin: 0,
});

// Price
s4.addText([
  { text: "$1,500", options: { fontSize: 44, bold: true, color: WHITE, fontFace: "Georgia" } },
  { text: " /mo", options: { fontSize: 18, color: MUTED, fontFace: "Calibri" } },
], { x: 7, y: 0.5, w: 2.5, h: 0.8, align: "right", margin: 0 });

const tier1Services = [
  { icon: "\uD83D\uDCDE", name: "AI Voice Agent", desc: "Answers every call 24/7. Books appointments, answers FAQs, transfers when needed." },
  { icon: "\uD83C\uDFAF", name: "AI Lead Prospecting", desc: "Finds and qualifies prospects daily. Sends personalized outreach automatically." },
  { icon: "\uD83D\uDCAC", name: "AI Chatbot", desc: "Lives on your website. Captures leads, answers questions, books meetings after hours." },
];

tier1Services.forEach((svc, i) => {
  const yPos = 2.0 + i * 1.1;
  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: yPos, w: 8.6, h: 0.9,
    fill: { color: CARD },
    shadow: mkShadow(),
  });
  s4.addText(svc.icon, {
    x: 0.9, y: yPos + 0.1, w: 0.7, h: 0.7,
    fontSize: 28, align: "center", valign: "middle", margin: 0,
  });
  s4.addText(svc.name, {
    x: 1.7, y: yPos + 0.1, w: 2.5, h: 0.7,
    fontSize: 16, fontFace: "Calibri", color: WHITE, bold: true, valign: "middle", margin: 0,
  });
  s4.addText(svc.desc, {
    x: 4.3, y: yPos + 0.1, w: 4.8, h: 0.7,
    fontSize: 12, fontFace: "Calibri", color: MUTED, valign: "middle", margin: 0,
  });
});

s4.addText("Ideal for: Businesses that need more leads and can\u2019t afford to miss calls.", {
  x: 0.7, y: 5.1, w: 8.6, h: 0.35,
  fontSize: 12, fontFace: "Calibri", color: GREEN, italic: true, margin: 0,
});

// ============================================================
// SLIDE 5: Tier 2 - AI Operations Suite
// ============================================================
const s5 = pres.addSlide();
s5.background = { color: NAVY };
s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: PURPLE } });

s5.addText([
  { text: "Tier 2  ", options: { fontSize: 14, color: PURPLE, bold: true, fontFace: "Calibri" } },
  { text: "MOST POPULAR", options: { fontSize: 10, color: NAVY, bold: true, fontFace: "Calibri" } },
], { x: 0.7, y: 0.3, w: 4, h: 0.4, margin: 0 });

// Most popular badge background
s5.addShape(pres.shapes.RECTANGLE, {
  x: 1.6, y: 0.32, w: 1.4, h: 0.28,
  fill: { color: PURPLE },
});
s5.addText("MOST POPULAR", {
  x: 1.6, y: 0.32, w: 1.4, h: 0.28,
  fontSize: 8, fontFace: "Calibri", color: WHITE, bold: true, align: "center", valign: "middle", margin: 0,
});

s5.addText("AI Operations Suite", {
  x: 0.7, y: 0.65, w: 6, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});
s5.addText("Run your business with AI co-pilots", {
  x: 0.7, y: 1.3, w: 6, h: 0.4,
  fontSize: 16, fontFace: "Calibri", color: MUTED, italic: true, margin: 0,
});

s5.addText([
  { text: "$3,000", options: { fontSize: 44, bold: true, color: WHITE, fontFace: "Georgia" } },
  { text: " /mo", options: { fontSize: 18, color: MUTED, fontFace: "Calibri" } },
], { x: 7, y: 0.5, w: 2.5, h: 0.8, align: "right", margin: 0 });

s5.addText("Everything in Tier 1, plus:", {
  x: 0.7, y: 1.75, w: 8, h: 0.35,
  fontSize: 13, fontFace: "Calibri", color: ACCENT, bold: true, margin: 0,
});

const tier2Services = [
  { icon: "\u2B50", name: "Review Management", desc: "Auto-responds to Google/Yelp reviews. Sends review requests to happy customers." },
  { icon: "\uD83D\uDD0D", name: "SEO Optimization", desc: "Ongoing keyword tracking, technical fixes, content recommendations." },
  { icon: "\uD83D\uDCE7", name: "Automated Follow-Ups", desc: "Intelligent email sequences that nurture leads without manual effort." },
  { icon: "\uD83D\uDCCA", name: "Monthly Reporting", desc: "Dashboard showing calls, leads, reviews, and ROI." },
];

tier2Services.forEach((svc, i) => {
  const yPos = 2.2 + i * 0.8;
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: yPos, w: 8.6, h: 0.65,
    fill: { color: CARD },
    shadow: mkShadow(),
  });
  s5.addText(svc.icon, {
    x: 0.9, y: yPos + 0.05, w: 0.6, h: 0.55,
    fontSize: 22, align: "center", valign: "middle", margin: 0,
  });
  s5.addText(svc.name, {
    x: 1.6, y: yPos + 0.05, w: 2.5, h: 0.55,
    fontSize: 14, fontFace: "Calibri", color: WHITE, bold: true, valign: "middle", margin: 0,
  });
  s5.addText(svc.desc, {
    x: 4.2, y: yPos + 0.05, w: 5, h: 0.55,
    fontSize: 11, fontFace: "Calibri", color: MUTED, valign: "middle", margin: 0,
  });
});

s5.addText("Ideal for: Businesses ready to systematize their operations with AI.", {
  x: 0.7, y: 5.1, w: 8.6, h: 0.35,
  fontSize: 12, fontFace: "Calibri", color: GREEN, italic: true, margin: 0,
});

// ============================================================
// SLIDE 6: Tier 3 - Full AI Transformation
// ============================================================
const s6 = pres.addSlide();
s6.background = { color: NAVY };
s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: AMBER } });

s6.addText("Tier 3", {
  x: 0.7, y: 0.3, w: 3, h: 0.4,
  fontSize: 14, fontFace: "Calibri", color: AMBER, bold: true, margin: 0,
});
s6.addText("Full AI Transformation", {
  x: 0.7, y: 0.65, w: 6, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});
s6.addText("Your dedicated AI department", {
  x: 0.7, y: 1.3, w: 6, h: 0.4,
  fontSize: 16, fontFace: "Calibri", color: MUTED, italic: true, margin: 0,
});

s6.addText([
  { text: "$5,000+", options: { fontSize: 44, bold: true, color: WHITE, fontFace: "Georgia" } },
  { text: " /mo", options: { fontSize: 18, color: MUTED, fontFace: "Calibri" } },
], { x: 6.5, y: 0.5, w: 3, h: 0.8, align: "right", margin: 0 });

s6.addText("Custom pricing", {
  x: 7, y: 1.2, w: 2.5, h: 0.3,
  fontSize: 11, fontFace: "Calibri", color: DIM, align: "right", margin: 0,
});

s6.addText("Everything in Tier 1 & 2, plus:", {
  x: 0.7, y: 1.75, w: 8, h: 0.35,
  fontSize: 13, fontFace: "Calibri", color: AMBER, bold: true, margin: 0,
});

const tier3Services = [
  { icon: "\uD83E\uDD16", name: "AI Platform SEO", desc: "Optimize for ChatGPT, Perplexity, Google AI Overviews \u2014 be found by AI search." },
  { icon: "\u2699\uFE0F", name: "Custom Workflows", desc: "Tailored automations for your specific processes (scheduling, dispatch, invoicing)." },
  { icon: "\uD83D\uDCB0", name: "AI Estimating & Quoting", desc: "AI-assisted proposals and quotes for faster, more accurate bidding." },
  { icon: "\uD83E\uDD1D", name: "Strategy Calls", desc: "Monthly strategy sessions to optimize and expand your AI operations." },
];

tier3Services.forEach((svc, i) => {
  const yPos = 2.2 + i * 0.8;
  s6.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: yPos, w: 8.6, h: 0.65,
    fill: { color: CARD },
    shadow: mkShadow(),
  });
  s6.addText(svc.icon, {
    x: 0.9, y: yPos + 0.05, w: 0.6, h: 0.55,
    fontSize: 22, align: "center", valign: "middle", margin: 0,
  });
  s6.addText(svc.name, {
    x: 1.6, y: yPos + 0.05, w: 2.5, h: 0.55,
    fontSize: 14, fontFace: "Calibri", color: WHITE, bold: true, valign: "middle", margin: 0,
  });
  s6.addText(svc.desc, {
    x: 4.2, y: yPos + 0.05, w: 5, h: 0.55,
    fontSize: 11, fontFace: "Calibri", color: MUTED, valign: "middle", margin: 0,
  });
});

s6.addText("Ideal for: Businesses that want a full AI transformation with dedicated support.", {
  x: 0.7, y: 5.1, w: 8.6, h: 0.35,
  fontSize: 12, fontFace: "Calibri", color: GREEN, italic: true, margin: 0,
});

// ============================================================
// SLIDE 7: Side-by-Side Comparison
// ============================================================
const s7 = pres.addSlide();
s7.background = { color: NAVY };
s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s7.addText("Compare Packages", {
  x: 0.7, y: 0.3, w: 8, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});

// Column headers
const colX = [0.7, 3.8, 6.3, 8.0];
const colW = [2.9, 2.3, 1.5, 1.7];
const headerY = 1.2;

s7.addText("", { x: colX[0], y: headerY, w: colW[0], h: 0.5 });
["AI Lead Engine\n$1,500/mo", "Operations Suite\n$3,000/mo", "Full Transformation\n$5,000+/mo"].forEach((t, i) => {
  const colors = [ACCENT, PURPLE, AMBER];
  s7.addShape(pres.shapes.RECTANGLE, {
    x: colX[i + 1], y: headerY, w: colW[i + 1], h: 0.55,
    fill: { color: colors[i] },
  });
  s7.addText(t, {
    x: colX[i + 1], y: headerY, w: colW[i + 1], h: 0.55,
    fontSize: 10, fontFace: "Calibri", color: WHITE, bold: true, align: "center", valign: "middle", margin: 0,
  });
});

const features = [
  ["AI Voice Agent (24/7)", true, true, true],
  ["AI Lead Prospecting", true, true, true],
  ["AI Chatbot", true, true, true],
  ["Review Management", false, true, true],
  ["SEO Optimization", false, true, true],
  ["Automated Follow-Ups", false, true, true],
  ["Monthly Reporting", false, true, true],
  ["AI Platform SEO", false, false, true],
  ["Custom Workflows", false, false, true],
  ["AI Estimating & Quoting", false, false, true],
  ["Dedicated Strategy Calls", false, false, true],
];

features.forEach((row, i) => {
  const yPos = 1.9 + i * 0.32;
  const bg = i % 2 === 0 ? CARD : DARK;
  s7.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: yPos, w: 9, h: 0.32, fill: { color: bg } });
  s7.addText(row[0], {
    x: 0.9, y: yPos, w: 2.7, h: 0.32,
    fontSize: 10, fontFace: "Calibri", color: WHITE, valign: "middle", margin: 0,
  });
  [1, 2, 3].forEach((ci) => {
    s7.addText(row[ci] ? "\u2713" : "\u2014", {
      x: colX[ci], y: yPos, w: colW[ci], h: 0.32,
      fontSize: row[ci] ? 14 : 10, fontFace: "Calibri",
      color: row[ci] ? GREEN : DIM,
      align: "center", valign: "middle", margin: 0,
    });
  });
});

// ============================================================
// SLIDE 8: Why Jontri vs Traditional Agency
// ============================================================
const s8 = pres.addSlide();
s8.background = { color: NAVY };
s8.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s8.addText("Why Jontri?", {
  x: 0.7, y: 0.3, w: 8, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});

// Two columns
const compData = [
  ["Builds a chatbot and leaves", "Manages your entire AI operation"],
  ["One-time project fee", "Predictable monthly investment"],
  ["You manage the technology", "We manage everything"],
  ["Generic solutions", "Trained on YOUR business"],
  ["No ongoing support", "Monthly optimization + reporting"],
];

// Headers
s8.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.2, w: 4.1, h: 0.5, fill: { color: "7F1D1D" } });
s8.addText("Traditional AI Agency", {
  x: 0.7, y: 1.2, w: 4.1, h: 0.5,
  fontSize: 14, fontFace: "Calibri", color: "FCA5A5", bold: true, align: "center", valign: "middle", margin: 0,
});
s8.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.1, h: 0.5, fill: { color: "064E3B" } });
s8.addText("Jontri Consulting", {
  x: 5.2, y: 1.2, w: 4.1, h: 0.5,
  fontSize: 14, fontFace: "Calibri", color: GREEN, bold: true, align: "center", valign: "middle", margin: 0,
});

compData.forEach((row, i) => {
  const yPos = 1.85 + i * 0.7;
  s8.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: yPos, w: 4.1, h: 0.55, fill: { color: CARD } });
  s8.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: yPos, w: 4.1, h: 0.55, fill: { color: CARD } });
  s8.addText("\u2717  " + row[0], {
    x: 0.9, y: yPos, w: 3.8, h: 0.55,
    fontSize: 12, fontFace: "Calibri", color: "FCA5A5", valign: "middle", margin: 0,
  });
  s8.addText("\u2713  " + row[1], {
    x: 5.4, y: yPos, w: 3.8, h: 0.55,
    fontSize: 12, fontFace: "Calibri", color: GREEN, valign: "middle", margin: 0,
  });
});

// ============================================================
// SLIDE 9: How It Works
// ============================================================
const s9 = pres.addSlide();
s9.background = { color: NAVY };
s9.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s9.addText("How It Works", {
  x: 0.7, y: 0.3, w: 8, h: 0.7,
  fontSize: 36, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
});
s9.addText("From discovery to delivery in 7 days.", {
  x: 0.7, y: 1.0, w: 8, h: 0.4,
  fontSize: 16, fontFace: "Calibri", color: MUTED, margin: 0,
});

const steps = [
  { num: "1", title: "Discovery", desc: "We analyze your operations, identify bottlenecks, and map where AI will have the biggest impact.", time: "Day 1" },
  { num: "2", title: "Setup", desc: "We configure your AI services, train them on your business data, and integrate with your tools.", time: "Days 2\u20135" },
  { num: "3", title: "Launch", desc: "Your AI goes live. We monitor everything, make adjustments, and ensure smooth operation.", time: "Days 6\u20137" },
  { num: "4", title: "Optimize", desc: "Ongoing management, optimization, and monthly reporting. We run it, you see results.", time: "Ongoing" },
];

steps.forEach((step, i) => {
  const xPos = 0.7 + i * 2.3;
  // Number circle
  s9.addShape(pres.shapes.OVAL, {
    x: xPos + 0.7, y: 1.7, w: 0.6, h: 0.6,
    fill: { color: ACCENT },
  });
  s9.addText(step.num, {
    x: xPos + 0.7, y: 1.7, w: 0.6, h: 0.6,
    fontSize: 20, fontFace: "Georgia", color: WHITE, bold: true, align: "center", valign: "middle", margin: 0,
  });
  // Card
  s9.addShape(pres.shapes.RECTANGLE, {
    x: xPos, y: 2.5, w: 2.1, h: 2.5,
    fill: { color: CARD },
    shadow: mkShadow(),
  });
  s9.addText(step.title, {
    x: xPos + 0.15, y: 2.65, w: 1.8, h: 0.4,
    fontSize: 16, fontFace: "Calibri", color: WHITE, bold: true, margin: 0,
  });
  s9.addText(step.time, {
    x: xPos + 0.15, y: 3.05, w: 1.8, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: ACCENT, margin: 0,
  });
  s9.addText(step.desc, {
    x: xPos + 0.15, y: 3.4, w: 1.8, h: 1.4,
    fontSize: 11, fontFace: "Calibri", color: MUTED, margin: 0,
  });
});

// ============================================================
// SLIDE 10: Next Steps / CTA
// ============================================================
const s10 = pres.addSlide();
s10.background = { color: NAVY };
s10.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: ACCENT } });

s10.addText("Ready to Automate\nYour Business?", {
  x: 0.7, y: 0.8, w: 8.5, h: 1.8,
  fontSize: 44, fontFace: "Georgia", color: WHITE, bold: true, margin: 0,
  lineSpacingMultiple: 1.15,
});

s10.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 2.8, w: 8.6, h: 2.2,
  fill: { color: CARD },
  shadow: mkShadow(),
});

const nextSteps = [
  { num: "1", text: "Book a free strategy session", sub: "calendly.com/jontri/consultation" },
  { num: "2", text: "Choose your package", sub: "We\u2019ll help you decide what makes sense" },
  { num: "3", text: "We handle everything else", sub: "Setup, training, deployment, and ongoing management" },
];

nextSteps.forEach((step, i) => {
  const yPos = 3.0 + i * 0.65;
  s10.addShape(pres.shapes.OVAL, {
    x: 1.0, y: yPos + 0.05, w: 0.4, h: 0.4,
    fill: { color: ACCENT },
  });
  s10.addText(step.num, {
    x: 1.0, y: yPos + 0.05, w: 0.4, h: 0.4,
    fontSize: 14, fontFace: "Georgia", color: WHITE, bold: true, align: "center", valign: "middle", margin: 0,
  });
  s10.addText(step.text, {
    x: 1.6, y: yPos, w: 5, h: 0.3,
    fontSize: 16, fontFace: "Calibri", color: WHITE, bold: true, margin: 0,
  });
  s10.addText(step.sub, {
    x: 1.6, y: yPos + 0.28, w: 5, h: 0.25,
    fontSize: 11, fontFace: "Calibri", color: MUTED, margin: 0,
  });
});

// Contact info
s10.addText([
  { text: "Vincent Kalman", options: { bold: true, color: WHITE, fontSize: 14 } },
  { text: "  |  Founder, Jontri Consulting", options: { color: MUTED, fontSize: 12 } },
], { x: 0.7, y: 5.15, w: 8.6, h: 0.3, fontFace: "Calibri", margin: 0 });

s10.addText("vincent@jontri.com  |  jontri.com  |  calendly.com/jontri/consultation", {
  x: 0.7, y: 5.4, w: 8.6, h: 0.25,
  fontSize: 11, fontFace: "Calibri", color: ACCENT, margin: 0,
});

// Save
const outputPath = process.argv[2] || "c:/Users/vince/OneDrive/Desktop/VK Personal/AI Automation/Jontri/templates/Jontri-Pitch-Deck.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("Pitch deck saved to: " + outputPath);
});
