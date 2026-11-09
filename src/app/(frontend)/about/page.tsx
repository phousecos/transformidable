// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { ADVISORY_ENTITY } from "../components/site";
import { pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({ title: "About", description: "Transformidable: possessing the capacity to bring about consequential transformation. Research, Advisory, Academy, Publishing, and Media are each an expression of that definition.", path: "/about" });

// The organizing idea of the page: each division expresses one part of the
// definition, in the order the definition reads.
const EXPRESSIONS = [
  {
    id: "capacity",
    term: "capacity",
    excerpt: "Possessing the capacity to bring about consequential transformation.",
    sense: "1",
    name: "Academy",
    href: "/academy",
    body: "Capacity is built, not assumed. Academy builds it in the people who carry transformation: governance briefings, workshops, and applied programs for leadership teams and governing bodies.",
  },
  {
    id: "courage",
    term: "courage",
    excerpt: "Characterized by the courage…",
    sense: "2",
    name: "Media",
    href: "/media",
    body: "It takes courage to examine in public what went wrong and who decided it. The Governance Files podcast, the Transformidable Briefing, interviews, and events bring those conversations into the open.",
  },
  {
    id: "discipline",
    term: "discipline",
    excerpt: "…the discipline…",
    sense: "2",
    name: "Research",
    href: "/research",
    body: "Discipline means evidence before opinion. Research builds it case by case: Case Files, the governance codebook, evidence-based findings, and the research agenda.",
  },
  {
    id: "capability",
    term: "capability",
    excerpt: "…and capability to turn complex challenges into meaningful change.",
    sense: "2",
    name: "Advisory",
    href: "/advisory",
    body: "Capability is evidence applied to an organization\u2019s own decisions. Advisory provides independent governance advisory for mergers and acquisitions, troubled programs, IT general controls, and AI adoption, grounded in the research.",
  },
  {
    id: "shaping",
    term: "shaping",
    excerpt: "Not simply to embrace change, but to be capable of shaping it.",
    sense: null,
    name: "Publishing",
    href: "/publishing",
    body: "Ideas shape how leaders lead long after a transformation ends. Publishing carries them: The Transformidable Leader, its companion workbook, future books, and substantive publications.",
  },
];

function Term({ id, children }) {
  return <a className="def-term" href={`#expr-${id}`}>{children}</a>;
}

export default function AboutPage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky about-hero">
        <Sky variant="about" />
        <div className="wrap idx-hero-in">
          <p className="kicker">About</p>
          <div className="def-entry" lang="en">
            <h1 className="def-word">transformidable</h1>
            <p className="def-meta">
              <span className="def-phon">/trans-FOR-mi-duh-bul/</span>
              <span className="def-pos">adjective</span>
              <span className="def-ety">coined from <i>transform</i> + <i>formidable</i></span>
            </p>
            <ol className="def-senses">
              <li>
                Possessing the <Term id="capacity">capacity</Term> to bring about consequential transformation.
              </li>
              <li>
                Characterized by the <Term id="courage">courage</Term>, <Term id="discipline">discipline</Term>,
                and <Term id="capability">capability</Term> to turn complex challenges into meaningful change.
              </li>
            </ol>
            <blockquote className="def-coda">
              <p>
                To be transformidable is not simply to embrace change, but to be capable
                of <Term id="shaping">shaping</Term> it.
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="about-expr" id="expressions" aria-labelledby="expr-h">
        <div className="wrap">
          <div className="expr-head">
            <p className="kicker">Five divisions, one definition</p>
            <h2 className="expr-h" id="expr-h">Each part of Transformidable expresses part of the word.</h2>
            <p className="expr-intro">
              Transformidable works through five divisions. Each has its own audience and purpose, and
              each takes its charge from the definition.
            </p>
          </div>
          <ol className="expr-list">
            {EXPRESSIONS.map((e) => (
              <li className="expr-row" id={`expr-${e.id}`} key={e.id}>
                <div className="expr-term">
                  <span className="expr-word">{e.term}</span>
                  <span className="expr-src">
                    {e.sense ? <span className="expr-sense">{e.sense}.</span> : null}
                    {e.excerpt}
                  </span>
                </div>
                <div className="expr-main">
                  <h3 className="expr-name"><Link href={e.href}>{e.name}</Link></h3>
                  <p className="expr-body">{e.body}</p>
                  <Link className="link" href={e.href}>Explore {e.name}</Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <article className="detail">
        <div className="detail-wrap">
          <h2 className="case-h">Why governance</h2>
          <p className="about-thesis">Governance decides whether transformation holds.</p>
          <div className="prose" style={{ marginTop: 0 }}>
            <p>
              Transformidable advances the leadership and governance of organizational transformation
              through research, advisory, education, publishing, and media. We study how governance,
              leadership, and institutional decision-making shape the success, resilience, and public
              trust of organizations navigating complex change.
            </p>
            <p>
              Most transformations do not fail for lack of technology or talent. They fail, or quietly
              revert, because of decisions made upstream: in the rooms where oversight, accountability,
              and authority are set. Those are governance decisions, and they are usually made long
              before the stress event that finally exposes them.
            </p>
            <p>
              Transformidable exists to study those decisions in the open. We trace, case by case, how
              governance and leadership shape whether an organization can carry change without breaking,
              and we turn what we learn into evidence that leaders and institutions can actually use,
              and that the legal system can rely on when a transformation is contested.
            </p>
            <p>
              The research is deliberately independent. It is not opinion, and it is never commissioned
              by advisory clients. It is a standing body of evidence about the decisions that decide
              whether transformation holds.
            </p>
          </div>

          <section className="case-section" id="agenda">
            <h2 className="case-h">The research agenda</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Five questions organize the work, spanning governance, leadership, institutions,
                technology, and evidence. Each is pursued through primary case research, then published
                as case files, articles, and reports.
              </p>
              <p><Link className="link" href="/research/agenda">Read the full agenda</Link></p>
            </div>
          </section>

          <section className="case-section" id="who">
            <h2 className="case-h">Who does the work</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Transformidable is led by <strong>Jerri Bland, Ed.D.</strong> Her work sits at the
                intersection of governance, leadership, and organizational change, with particular
                attention to mission-driven institutions carrying high-stakes, systemwide transformations.
              </p>
              <p>
                She brings the discipline of a researcher and the vantage point of someone who has watched,
                up close, how decisions made in board and committee rooms decide whether change takes hold
                or unwinds. That vantage point, treating governance as the place where transformation
                is really won or lost, is the lens this research is built on.
              </p>
              <p>
                It is also what the work adds to the conversation. Transformation is usually discussed in
                the language of strategy, technology, or change management. Transformidable insists on the
                prior question: were the governance and leadership decisions sound enough to carry it? That
                question is often the difference between a transformation that endures and one that is
                studied, later, as a failure.
              </p>
            </div>
          </section>

          {/* Matches the footer disclosure and /independence. */}
          <section className="case-section" id="independence">
            <h2 className="case-h">Independence and affiliation</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Advisory engagements are contracted through {ADVISORY_ENTITY}, an affiliate of Transformidable.
                Transformidable research is conducted independently: it is never commissioned by advisory clients,
                and we accept no compensation from technology vendors.
              </p>
              <p><Link className="link" href="/independence">Read our independence policy</Link></p>
            </div>
          </section>

          <div className="detail-foot" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="#briefing">
              Subscribe to the Brief
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link className="link" href="/publications/case-files">Read the case files</Link>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
