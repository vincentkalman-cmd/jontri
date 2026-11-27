import { ChatWidget } from "@/components/ChatWidget";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TalkToAI } from "@/components/home/TalkToAI";
import { HeroConsole } from "@/components/home/HeroConsole";
import { MissedCallCalculator } from "@/components/home/MissedCallCalculator";
import { DemoLab } from "@/components/home/DemoLab";
import { ContactMini, ChecklistMini } from "@/components/home/MiniForms";
import { RevealObserver } from "@/components/home/RevealObserver";
import { Icon, Wave } from "@/components/home/Icons";
import { BOOKING_URL, SERVICES } from "@/lib/constants";
import { TIERS } from "@/lib/tiers";
import { FAQS, INDUSTRIES, JOURNEY, SETUP_STEPS } from "@/lib/home-content";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://jontri.com/#organization",
      name: "Jontri",
      alternateName: "Jontri Consulting",
      url: "https://jontri.com",
      logo: "https://jontri.com/icon.svg",
      email: "hello@jontri.com",
      founder: { "@type": "Person", name: "Vince" },
    },
    {
      "@type": "WebSite",
      "@id": "https://jontri.com/#website",
      url: "https://jontri.com",
      name: "Jontri",
      publisher: { "@id": "https://jontri.com/#organization" },
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://jontri.com/#service",
      name: "Jontri",
      url: "https://jontri.com",
      description:
        "Done-for-you AI automation for local service businesses: AI voice receptionists, lead prospecting, website chatbots, review management, SEO and AI search visibility, and follow-up automation.",
      provider: { "@id": "https://jontri.com/#organization" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "AI Automation Services",
        itemListElement: SERVICES.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.title, description: s.description },
        })),
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://jontri.com/#faq",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className="jh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <noscript>
        <style>{`.jh .reveal{opacity:1;transform:none}`}</style>
      </noscript>
      <svg className="grain" width="100%" height="100%" aria-hidden>
        <filter id="jh-noise">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves={3} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#jh-noise)" />
      </svg>

      <SiteNav />

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="bg" aria-hidden />
          <div className="gridlines" aria-hidden />
          <div className="wrap hero-grid">
            <div>
              <span className="kicker">Done-for-you AI for local businesses</span>
              <h1 className="display">
                One AI crew.
                <br />
                Six jobs.
                <br />
                <em>Zero days off.</em>
              </h1>
              <p className="sub">
                We build and run the AI that answers your phone, follows up with every lead, finds new customers, and
                gets you recommended by Google and ChatGPT, so you can stay on the job.
              </p>
              <div className="ctas">
                <TalkToAI label="Talk to our AI receptionist" />
                <a className="btn btn-ghost" href="#demo">
                  Try it on your website →
                </a>
              </div>
              <div className="trust">
                <span>Answers 24/7</span>
                <span>Built &amp; managed for you</span>
                <span>Works with your tools</span>
              </div>
            </div>
            <HeroConsole />
          </div>
        </section>

        <div className="ind" aria-label="Industries we serve">
          <div className="ticker">
            {[...INDUSTRIES, ...INDUSTRIES].map((x, i) => (
              <span key={i} aria-hidden={i >= INDUSTRIES.length}>
                {x.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <MissedCallCalculator />

        <DemoLab />

        {/* SERVICES */}
        <section id="services">
          <div className="wrap">
            <div className="reveal">
              <span className="kicker">What we build &amp; run</span>
              <h2 className="display h">
                Six jobs your AI crew
                <br />
                handles every day.
              </h2>
              <p className="lede">
                Each one works on its own. Together they form one system that turns strangers into booked, happy,
                reviewing customers.
              </p>
            </div>
            <div className="bento">
              <div className="tile t-a reveal">
                <div className="ico"><Icon name="call" /></div>
                <h3>AI Voice Receptionist</h3>
                <p>Answers every call in a natural voice, qualifies the caller, books the job in your calendar, and transfers emergencies to your phone.</p>
                <div className="vig">
                  <Wave bars={8} height={20} />
                  <div className="mono" style={{ color: "var(--ok)", fontSize: 12, marginTop: 6 }}>✓ Booked · Tue 8:00 AM · confirmation text sent</div>
                </div>
              </div>
              <div className="tile t-b reveal">
                <div className="ico"><Icon name="target" /></div>
                <h3>AI Lead Prospecting</h3>
                <p>Every morning, a fresh list of local businesses that need what you sell, researched, scored, and sent a personal email.</p>
                <div className="vig" style={{ display: "grid", gap: 6 }}>
                  <div className="lead"><span>Peak Property Mgmt<small>Denver · 140 units</small></span><span className="tagx">email sent</span><span className="score">94</span></div>
                  <div className="lead"><span>Alpine Dental Group<small>Lakewood · 3 offices</small></span><span className="tagx">drafted</span><span className="score">88</span></div>
                </div>
              </div>
              <div className="tile t-c reveal">
                <div className="ico"><Icon name="chat" /></div>
                <h3>Website Chatbot</h3>
                <p>Trained on your business. Answers questions and captures leads at 11 PM.</p>
              </div>
              <div className="tile t-d reveal">
                <div className="ico"><Icon name="star" /></div>
                <h3>Review Engine</h3>
                <p>Asks every happy customer for a review and drafts warm, on-brand replies.</p>
              </div>
              <div className="tile t-e reveal">
                <div className="ico"><Icon name="search" /></div>
                <h3>SEO + AI Search</h3>
                <p>Rank on Google, and get named when people ask ChatGPT who to hire.</p>
              </div>
              <div className="tile t-f reveal">
                <div className="ff" style={{ display: "grid", gap: "var(--s6)", alignItems: "center" }}>
                  <div>
                    <div className="ico"><Icon name="flow" /></div>
                    <h3 style={{ marginTop: "var(--s4)" }}>Follow-up &amp; Custom Workflows</h3>
                    <p style={{ marginTop: 8 }}>Quotes that chase themselves, appointment reminders, reports in your inbox, and custom automations connecting the tools you already use.</p>
                  </div>
                  <div className="flow" aria-label="Example follow-up workflow">
                    <span className="node s">New lead</span><span className="arrow">→</span>
                    <span className="node">Text in 30s</span><span className="arrow">→</span>
                    <span className="node">Quote sent</span><span className="arrow">→</span>
                    <span className="node">Day-2 nudge</span><span className="arrow">→</span>
                    <span className="node s">✓ Job won</span><span className="arrow">→</span>
                    <span className="node">Review ask</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="alt">
          <div className="wrap">
            <div className="reveal">
              <span className="kicker">One connected system</span>
              <h2 className="display h">
                From stranger to
                <br />
                5-star customer.
              </h2>
              <p className="lede">Not six separate tools. One crew that hands each customer to the next step automatically.</p>
            </div>
            <ol className="journey" id="journey">
              <div className="line" aria-hidden><i /></div>
              {JOURNEY.map((j, i) => (
                <li className="step" key={j.title}>
                  <div className="dot">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="h4">{j.title}</h3>
                  <p>{j.text}</p>
                </li>
              ))}
            </ol>
            <div className="steps4">
              {SETUP_STEPS.map((s, i) => (
                <div className="s4 reveal" key={s.title}>
                  <div className="n">STEP {i + 1}</div>
                  <h3 className="h4">{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PACKAGES */}
        <section id="packages">
          <div className="wrap">
            <div className="reveal" style={{ textAlign: "center" }}>
              <span className="kicker">Packages</span>
              <h2 className="display h">Start small. Add crew as you grow.</h2>
              <p className="lede" style={{ margin: "0 auto" }}>
                Simple monthly packages, fully managed. Book a call and we&apos;ll recommend the right fit and give you
                exact pricing.
              </p>
            </div>
            <div className="pk">
              {TIERS.map((t) => {
                const parent = TIERS.find((x) => x.id === t.includesTier);
                return (
                  <div className={`pkg reveal${t.highlighted ? " hot" : ""}`} key={t.id}>
                    {t.highlighted && <span className="badge">MOST POPULAR</span>}
                    <h3>{t.name}</h3>
                    <p className="for">{t.subtitle}.</p>
                    <ul>
                      {parent && <li className="inh">Everything in {parent.name}</li>}
                      {t.services.map((s) => (
                        <li key={s.key}>{s.label}</li>
                      ))}
                    </ul>
                    <a className={`btn ${t.highlighted ? "btn-sig" : "btn-ghost"}`} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                      Book a call
                    </a>
                  </div>
                );
              })}
            </div>
            <p className="alac">
              Only need one thing? <a href="#contact">Every service is available on its own →</a>
            </p>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="alt" aria-labelledby="founder-h">
          <div className="wrap">
            <span className="kicker reveal" id="founder-h">Who&apos;s behind Jontri</span>
            <div className="founder reveal" style={{ marginTop: "var(--s6)" }}>
              <div className="mark" aria-hidden>&ldquo;</div>
              <figure style={{ margin: 0 }}>
                <blockquote>
                  I started Jontri because the best local businesses I know lose jobs for the dumbest reason: nobody
                  picked up the phone. I build every system myself, test it on real calls before it goes live, and keep
                  tuning it after. You&apos;ll always talk to the person who built your AI, not a support queue.
                </blockquote>
                <figcaption className="sig">
                  <b>Vince</b>
                  <span>· Founder, Jontri</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="wrap">
            <div className="reveal" style={{ textAlign: "center" }}>
              <span className="kicker">FAQ</span>
              <h2 className="display h">Straight answers.</h2>
            </div>
            <div className="faq">
              {FAQS.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final">
          <div className="bg" aria-hidden />
          <div className="wrap" style={{ position: "relative" }}>
            <span className="kicker">Ready when you are</span>
            <h2 className="display">
              Hear it answer a call.
              <br />
              Then let&apos;s talk.
            </h2>
            <p className="lede" style={{ margin: "0 auto" }}>
              30 seconds with our AI receptionist will tell you more than this whole page.
            </p>
            <div className="ctas">
              <TalkToAI />
              <a className="btn btn-ghost" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Book a free strategy call
              </a>
            </div>
            <div className="mini">
              <ContactMini />
              <ChecklistMini />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <RevealObserver />
      <ChatWidget />
    </div>
  );
}
