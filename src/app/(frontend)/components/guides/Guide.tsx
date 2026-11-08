// @ts-nocheck
import Link from "next/link";
import "../home/home.css";
import "./guide.css";
import { ResearchShell } from "../research/ResearchShell";
import { Sky } from "../research/Sky";
import { faqJsonLd, jsonLdHtml } from "../../../../lib/seo.ts";

export const Arrow = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const BOOK_HREF = "/advisory/conversation";

// A problem-led guide page on the Advisory side: dark hero, long-form body,
// questions (with FAQ structured data), and a closing call to action. Written
// for the searches people actually make (see docs in the PR), and for the
// boards and executives who arrive from them.
export function GuidePage({ kicker, title, intro, cta = { href: BOOK_HREF, label: "Book a conversation" }, faq = [], closing, children }) {
  return (
    <ResearchShell>
      {faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(faqJsonLd(faq))} />}
      <section className="idx-hero tr-onsky">
        <Sky variant="advisory" />
        <div className="wrap idx-hero-in">
          <p className="kicker">{kicker}</p>
          <h1 className="idx-title">{title}</h1>
          {(Array.isArray(intro) ? intro : [intro]).map((p, i) => <p className="idx-intro" key={i}>{p}</p>)}
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <Link className="btn" href={cta.href}>{cta.label} <Arrow /></Link>
          </div>
        </div>
      </section>

      <div className="idx-body">
        <div className="wrap gd">{children}</div>
      </div>

      {faq.length > 0 && (
        <section className="rule-band" aria-labelledby="gd-faq-h">
          <div className="wrap gd">
            <h2 id="gd-faq-h">Questions</h2>
            <div className="gd-faq">
              {faq.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rule-band av-cta" aria-labelledby="gd-cta-h">
        <div className="wrap av-cta-in">
          <div>
            <h2 className="av-cta-t" id="gd-cta-h">{closing.title}</h2>
            <p className="eto-cta-body">{closing.body}</p>
          </div>
          <div className="av-cta-btns">
            <Link className="btn" href={cta.href}>{cta.label} <Arrow /></Link>
          </div>
        </div>
      </section>
    </ResearchShell>
  );
}
