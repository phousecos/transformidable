// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { ADVISORY_ENTITY } from "../components/site";
import { pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({ title: "About", description: "Transformidable advances the governance of technology and organizational transformation through research, advisory, governance training, publishing, and media for boards and executives.", path: "/about" });

export default function AboutPage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="about" />
        <div className="wrap idx-hero-in">
          <p className="kicker">About</p>
          <h1 className="idx-title">Governance decides whether transformation holds.</h1>
          <p className="idx-intro">
            Transformidable advances the leadership and governance of organizational transformation
            through research, advisory, education, publishing, and media. We study how governance, leadership,
            and institutional decision-making shape the success, resilience, and public trust of
            organizations navigating complex change.
          </p>
        </div>
      </section>

      <article className="detail">
        <div className="detail-wrap">
          <div className="prose" style={{ marginTop: 0 }}>
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

          <section className="case-section" id="divisions">
            <h2 className="case-h">Five divisions, one intellectual identity</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Transformidable works through five divisions. Each has its own audience and purpose. Research
                builds the evidence, and Advisory applies it to an organization&rsquo;s own decisions. What they
                share is a commitment to stronger leadership and governance.
              </p>
              <ul>
                <li><Link href="/research">Research</Link>: Case Files, the governance codebook, evidence-based findings, and the research agenda.</li>
                <li><Link href="/advisory">Advisory</Link>: independent governance advisory for mergers and acquisitions, troubled programs, IT general controls, and AI adoption, grounded in the research.</li>
                <li><Link href="/academy">Academy</Link>: executive education, with governance briefings, workshops, and applied programs for leadership teams and governing bodies.</li>
                <li><Link href="/publishing">Publishing</Link>: The Transformidable Leader, its companion workbook, future books, and substantive publications.</li>
                <li><Link href="/media">Media</Link>: The Governance Files podcast, the Transformidable Briefing, interviews, and events.</li>
              </ul>
            </div>
          </section>

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
