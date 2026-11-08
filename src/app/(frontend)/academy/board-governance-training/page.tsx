// @ts-nocheck
import Link from "next/link";
import { AcademyFaq, AcademyHero, AcademyShell, Arrow, JsonLd } from "../../components/academy/AcademySections";
import { FACULTY, OTHER_AUDIENCES, PRIMARY_AUDIENCES, PROGRAMS, programHref } from "../content";
import { faqJsonLd, pageMetadata } from "../../../../lib/seo.ts";

// Search page: "board governance training" (the phrase from the original
// keyword list with real volume), "ai governance for boards", "board oversight
// of ai", "ai governance in higher education" (Keyword Planner, Nov 2026).
export const metadata = pageMetadata({
  title: "Board Governance Training: AI & Technology | Transformidable",
  absolute: true,
  description:
    "Governance training for boards, councils, and trustees on overseeing AI and technology decisions. Private sessions, from a 90-minute briefing to an applied program.",
  path: "/academy/board-governance-training",
});

const FAQ = [
  {
    q: "Do board members need a technical background?",
    a: "No. The programs are designed for the people who oversee and answer for AI and technology decisions, not technical specialists.",
  },
  {
    q: "Can training be delivered privately to our board?",
    a: "Yes. All programs are available as private sessions for your board, council, or leadership team, virtually or in person.",
  },
  {
    q: "How long does board governance training take?",
    a: "From a 90-minute briefing to about seven hours of applied work, depending on the program. Many boards start with the 90-minute briefing.",
  },
  {
    q: "Is this training specific to higher education or local government?",
    a: "The programs are designed for public institutions, universities, and nonprofit and other governing boards, and examples are adapted to your sector.",
  },
  {
    q: "What do participants take away?",
    a: "Practical tools for their own organization: an oversight checklist, a scorecard and 90-day action plan, or an action brief, depending on the program.",
  },
];

const BOARD_QUESTIONS = [
  "What AI is the organization using today, including AI built into existing software?",
  "Who in management is accountable for it?",
  "What information or people could be harmed, and what has been done about it?",
  "What would we expect to be told, and when?",
  "Which AI decisions should come to the board at all?",
];

export default function BoardGovernanceTrainingPage() {
  return (
    <AcademyShell>
      <JsonLd data={faqJsonLd(FAQ)} />
      <AcademyHero
        kicker="Transformidable Academy · Board Governance Training"
        title="Board governance training for the decisions technology now puts in front of you."
        intro="Boards, councils, and trustees are increasingly asked to approve, fund, and oversee decisions about artificial intelligence and technology, often without a shared understanding of the technology or of what good oversight looks like. Transformidable Academy's governance training is built for exactly that part of the board's job."
        seed={131}
      >
        <div className="ac-hero-cta">
          <Link className="btn" href="/academy/organizations#register">Discuss a private session <Arrow s={14} /></Link>
        </div>
      </AcademyHero>

      <section className="ac-band" aria-labelledby="bgt-who-h">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">Who it&rsquo;s for</p>
            <h2 className="ac-h2" id="bgt-who-h">Governing bodies and the leaders who answer to them</h2>
            <p className="body" style={{ marginTop: 14 }}>
              Participants don&rsquo;t need technical expertise. The focus is on governance, accountability, and informed
              decision-making.
            </p>
            <p className="ac-note">
              This is governance training for technology and AI oversight. For general fiduciary and nonprofit board
              training, your state nonprofit association or board-development organizations are a good starting point.
            </p>
          </div>
          <div>
            <ul className="ac-audiences">
              {PRIMARY_AUDIENCES.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p className="ac-note">{OTHER_AUDIENCES}</p>
          </div>
        </div>
      </section>

      <section className="ac-band ac-band--parchment" aria-labelledby="bgt-programs-h">
        <div className="wrap">
          <p className="kicker">From awareness to action</p>
          <h2 className="ac-h2" id="bgt-programs-h">Three programs. No prerequisites.</h2>
          <div className="ac-courses">
            {PROGRAMS.map((p) => (
              <Link className="ac-course" href={programHref(p.slug)} key={p.slug}>
                <span className="ac-no">{p.stage.name} &middot; {p.stage.format}</span>
                <span className="ac-course-title">{p.title}</span>
                <span className="ac-course-desc">{p.stage.line}</span>
                <span className="ac-course-meta">Take away: {p.tools.join(" and ")}</span>
                <span className="ac-course-go">View program <Arrow /></span>
              </Link>
            ))}
          </div>
          <p className="ac-note">
            Coming next: governance training for boards on overseeing technology and major projects is in development.
          </p>
        </div>
      </section>

      <section className="ac-band" aria-labelledby="bgt-questions-h">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">Where training starts</p>
            <h2 className="ac-h2" id="bgt-questions-h">Questions your board should be able to answer about AI</h2>
            <p className="body" style={{ marginTop: 14 }}>If your board can&rsquo;t answer these yet, that&rsquo;s where training starts.</p>
          </div>
          <ul className="ac-outcomes">
            {BOARD_QUESTIONS.map((q) => <li key={q}>{q}</li>)}
          </ul>
        </div>
      </section>

      <section className="ac-band ac-band--parchment" aria-labelledby="bgt-faculty-h">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">Your faculty</p>
            <h2 className="ac-h2" id="bgt-faculty-h">Led by experience on both sides of the table</h2>
          </div>
          <div>
            <p className="body">{FACULTY.name}, {FACULTY.creds}</p>
            <p className="body">{FACULTY.bio}</p>
            <p className="body">
              Related: an <Link className="ac-inline" href="/advisory/ai-policy">AI acceptable use policy</Link> is often
              the first thing a board asks management for.
            </p>
          </div>
        </div>
      </section>

      <AcademyFaq items={FAQ} heading="Questions about board governance training" />

      <section className="ac-band" aria-labelledby="bgt-cta-h">
        <div className="wrap ac-two">
          <div>
            <h2 className="ac-h2" id="bgt-cta-h">Bring governance training to your board.</h2>
            <p className="body" style={{ marginTop: 14 }}>
              Tell us about your board, the decisions in front of it, and your preferred timing. An inquiry carries no
              commitment.
            </p>
          </div>
          <div className="ac-hero-cta">
            <Link className="btn" href="/academy/organizations#register">Discuss a private session <Arrow s={14} /></Link>
          </div>
        </div>
      </section>
    </AcademyShell>
  );
}
