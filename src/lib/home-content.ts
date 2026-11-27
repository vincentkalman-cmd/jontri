/**
 * Homepage copy & demo scripts. Edit text here; components read from this file.
 * The hero scenes use fictional example businesses, one industry per scene.
 */

export type SceneIcon = "call" | "chat" | "target" | "loop" | "star" | "search";

export type SceneStep =
  | { kind: "ai" | "cu"; who: string; text: string }
  | { kind: "sys" | "note"; text: string }
  | { kind: "wave" }
  | { kind: "stars" }
  | { kind: "lead"; name: string; meta: string; tag: string; score: number }
  | { kind: "gpt"; query: string; before: string; highlight: string; after: string };

export interface Scene {
  icon: SceneIcon;
  label: string;
  title: string;
  status: string;
  steps: SceneStep[];
}

export const HERO_SCENES: Scene[] = [
  {
    icon: "call",
    label: "Answers calls",
    title: "Incoming call · 9:42 PM",
    status: "live",
    steps: [
      { kind: "wave" },
      { kind: "ai", who: "Ava · AI receptionist", text: "Thanks for calling Summit Heating & Air, this is Ava. How can I help?" },
      { kind: "cu", who: "Caller", text: "My furnace just quit and it's freezing in here." },
      { kind: "ai", who: "Ava · AI receptionist", text: "I'm sorry! I can get a technician out tomorrow at 8 AM. Want me to lock that in?" },
      { kind: "cu", who: "Caller", text: "Yes please." },
      { kind: "sys", text: "✓ Booked · Tue 8:00 AM · confirmation text sent" },
    ],
  },
  {
    icon: "chat",
    label: "Chats on your site",
    title: "Website chat · 11:52 PM",
    status: "live",
    steps: [
      { kind: "cu", who: "Visitor", text: "Do you have any Saturday openings for a facial?" },
      { kind: "ai", who: "Glow Med Spa assistant", text: "We do! Saturdays 9 AM to 3 PM. Is this your first visit with us?" },
      { kind: "cu", who: "Visitor", text: "Yes, first time." },
      { kind: "ai", who: "Glow Med Spa assistant", text: "Welcome! I have Saturday at 10 AM open. What's the best number to confirm?" },
      { kind: "sys", text: "✓ Lead captured · sent to your phone" },
    ],
  },
  {
    icon: "target",
    label: "Finds new customers",
    title: "Prospecting run · 6:00 AM",
    status: "running",
    steps: [
      { kind: "note", text: "Searching: property managers, Denver metro, 10+ units…" },
      { kind: "lead", name: "Peak Property Mgmt", meta: "Denver · 140 units", tag: "researched", score: 94 },
      { kind: "lead", name: "Front Range Rentals", meta: "Aurora · 60 units", tag: "researched", score: 89 },
      { kind: "lead", name: "Mile High Living", meta: "Lakewood · 85 units", tag: "researched", score: 86 },
      { kind: "sys", text: "✓ Qualified prospects found · personal emails drafted" },
    ],
  },
  {
    icon: "loop",
    label: "Follows up",
    title: "Follow-up · SMS",
    status: "auto",
    steps: [
      { kind: "note", text: "Consultation request 2 days ago · no reply" },
      { kind: "ai", who: "Hartley Law", text: "Hi Mark, just following up on your free case review. I can still hold Thursday morning for you." },
      { kind: "cu", who: "Mark", text: "Thursday works. Go ahead." },
      { kind: "ai", who: "Hartley Law", text: "Done! You're booked Thursday at 9 AM. We'll send a reminder the day before." },
      { kind: "sys", text: "✓ Consultation booked · added to calendar" },
    ],
  },
  {
    icon: "star",
    label: "Handles reviews",
    title: "New Google review",
    status: "auto",
    steps: [
      { kind: "stars" },
      { kind: "cu", who: "Dana M. · Google", text: "So gentle and quick. My kids actually look forward to the dentist now." },
      { kind: "ai", who: "Bright Smile Dental · reply", text: "Thank you, Dana! We love seeing your family. See you all at the next cleaning!" },
      { kind: "sys", text: "✓ Reply posted · review requests sent to today's customers" },
    ],
  },
  {
    icon: "search",
    label: "Gets you found",
    title: "AI search · ChatGPT",
    status: "tracked",
    steps: [
      {
        kind: "gpt",
        query: "best roofing company near me in Denver?",
        before: "Here are a few highly rated options: ",
        highlight: "Peak Roofing Co.",
        after: " is well reviewed, offers free inspections, and is praised for fast storm-damage repairs…",
      },
      { kind: "sys", text: "✓ Recommended in ChatGPT, Perplexity & Google AI Overviews" },
    ],
  },
];

export const JOURNEY = [
  { title: "Gets found", text: "Shows up on Google and in ChatGPT answers." },
  { title: "Chats", text: "Website bot answers questions at midnight." },
  { title: "Calls & books", text: "AI receptionist books the job." },
  { title: "Follows up", text: "Reminders and quotes go out on their own." },
  { title: "Leaves a review", text: "Happy customer, 5 stars, warm reply." },
  { title: "Brings more", text: "More reviews, better ranking, more calls." },
];

export const SETUP_STEPS = [
  { title: "Discovery call", text: "We learn how your business runs and where leads slip through." },
  { title: "We build it", text: "Your AI crew, trained on your services, prices, and hours." },
  { title: "You approve it", text: "Call it, test it, tweak it. Nothing goes live until you're happy." },
  { title: "We run & tune it", text: "Monthly monitoring, improvements, and a clear report." },
];

export const FAQS = [
  {
    q: "Will callers know they're talking to AI?",
    a: "The voice sounds natural and handles normal conversation, interruptions included. If a caller asks, it tells them honestly that it's an AI assistant, and it can always transfer to a person.",
  },
  {
    q: "What happens if the AI can't answer something?",
    a: "It takes a detailed message, texts you a summary right away, and for urgent issues it transfers the call straight to your phone.",
  },
  {
    q: "Does it work with my scheduling software or CRM?",
    a: "Usually, yes. We connect to common calendars, CRMs, and business tools. If something has no direct integration, we build a custom workflow for it.",
  },
  {
    q: "How long does setup take?",
    a: "Most systems are built, tested with you, and live within a few weeks of the discovery call.",
  },
  {
    q: "Do I need to learn any new software?",
    a: "No. We set up, monitor, and maintain everything. You get booked jobs, lead alerts, and a simple monthly report.",
  },
];
