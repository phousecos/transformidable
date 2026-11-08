// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { pageMetadata } from "../../../../lib/seo.ts";

export const metadata = pageMetadata({ title: "The Transformidable Governance Method", description: "A framework for making governance visible, accountable, and actionable: six governance disciplines applied through a five-stage improvement lifecycle.", path: "/research/governance-method" });

const DISCIPLINES = [
  {
    term: "SEE",
    name: "Establish Visibility",
    lead: "Governance begins with the ability to see what is happening.",
    body: "Decision-makers need timely, reliable visibility into organizational conditions, emerging risks, dependencies, progress, and changes that may affect intended outcomes.",
    question: "Are we seeing what we need to see?",
  },
  {
    term: "DECIDE",
    name: "Clarify Decision Authority",
    lead: "Effective governance requires clear authority for consequential decisions.",
    body: "Organizations must establish who can make decisions, what information those decisions require, and how decisions are communicated and documented.",
    question: "Are the right people making the right decisions at the right time?",
  },
  {
    term: "OWN",
    name: "Establish Accountability",
    lead: "Governance becomes ineffective when responsibility is fragmented or ambiguous.",
    body: "Every consequential commitment, risk, decision, and corrective action should have an identifiable owner accountable for its resolution or outcome.",
    question: "Is accountability clearly assigned and understood?",
  },
  {
    term: "ESCALATE",
    name: "Ensure Issues Reach the Appropriate Authority",
    lead: "Not every issue can or should be resolved at the operational level.",
    body: "Effective governance establishes thresholds, channels, and expectations for elevating matters that exceed delegated authority, threaten outcomes, or remain unresolved.",
    question: "Are significant concerns reaching the people empowered to address them?",
  },
  {
    term: "EVIDENCE",
    name: "Validate What Is Known",
    lead: "Governance decisions should be supported by credible, traceable information.",
    body: "Reports, assurances, and claims of progress must be examined against the evidence supporting them, particularly when organizational commitments or risks are significant.",
    question: "What evidence supports what we are being told?",
  },
  {
    term: "RESPOND",
    name: "Turn Oversight into Action",
    lead: "Visibility without action does not constitute effective governance.",
    body: "Governing bodies and executive leaders must be prepared to intervene, adjust decisions, address emerging conditions, and verify that corrective actions are producing the intended results.",
    question: "Are we acting appropriately on what we know?",
  },
];

const LIFECYCLE = [
  { stage: "Assess", body: "Examine existing governance arrangements, decision processes, information flows, and accountability." },
  { stage: "Align", body: "Establish shared expectations, responsibilities, authorities, and governance objectives." },
  { stage: "Govern", body: "Apply the six disciplines within ongoing oversight and decision-making." },
  { stage: "Measure", body: "Evaluate whether governance processes are functioning and producing the intended results." },
  { stage: "Improve", body: "Adjust governance arrangements as organizational needs, risks, and conditions evolve." },
];

const APPLICATIONS = [
  "Enterprise technology implementations and ERP transformations",
  "Artificial intelligence adoption and oversight",
  "Mergers, acquisitions, and systems integration",
  "Technology modernization and organizational change",
  "Executive and governing-body oversight of complex initiatives",
];

export default function GovernanceMethodPage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="research" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Research · Method</p>
          <h1 className="idx-title">The Transformidable Governance Method</h1>
          <p className="idx-intro">
            A framework for making governance visible, accountable, and actionable.
          </p>
        </div>
      </section>

      <article className="detail">
        <div className="detail-wrap">
          <div className="prose" style={{ marginTop: 0 }}>
            <p>
              Organizational transformation introduces uncertainty, competing priorities,
              consequential decisions, and risks that evolve over time. Whether an organization is
              implementing enterprise technology, adopting artificial intelligence, or navigating
              significant institutional change, effective governance requires more than policies,
              committees, and periodic status reports.
            </p>
            <p>
              It requires a disciplined approach to ensuring that decision-makers have the
              information, authority, accountability, and evidence needed to act.
            </p>
            <p>
              The Transformidable Governance Method (TGM) provides a practical framework for
              examining, designing, and strengthening governance throughout organizational
              transformation.
            </p>
          </div>

          <section className="case-section" id="disciplines">
            <h2 className="case-h">The Six Governance Disciplines</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                TGM is organized around six interconnected disciplines that operate continuously
                rather than as sequential project phases.
              </p>
              {DISCIPLINES.map((d) => (
                <div key={d.term}>
                  <h3>{d.term}: {d.name}</h3>
                  <p>{d.lead}</p>
                  <p>{d.body}</p>
                  <blockquote>Core question: {d.question}</blockquote>
                </div>
              ))}
            </div>
          </section>

          <section className="case-section" id="continuous">
            <h2 className="case-h">Governance as a Continuous Discipline</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>The six disciplines are mutually reinforcing.</p>
              <p>
                An organization may have accurate information but unclear decision authority. It may
                assign accountability without establishing escalation mechanisms. It may receive
                evidence of deteriorating conditions but fail to respond.
              </p>
              <p>
                TGM examines these relationships rather than treating governance activities as
                isolated functions.
              </p>
              <p>
                Together, the six disciplines create a continuous connection between visibility,
                authority, accountability, escalation, evidence, and action.
              </p>
            </div>
          </section>

          <section className="case-section" id="lifecycle">
            <h2 className="case-h">The TGM Improvement Lifecycle</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>The governance disciplines are applied through a five-stage improvement lifecycle:</p>
              <ol>
                {LIFECYCLE.map((s) => (
                  <li key={s.stage}><strong>{s.stage}</strong>: {s.body}</li>
                ))}
              </ol>
              <p>
                The lifecycle provides a structured approach to strengthening governance while the
                six disciplines describe the capabilities that effective governance must sustain.
              </p>
            </div>
          </section>

          <section className="case-section" id="applications">
            <h2 className="case-h">Applications</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                The Transformidable Governance Method can be applied across a range of organizational
                settings, including:
              </p>
              <ul>
                {APPLICATIONS.map((a) => <li key={a}>{a}</li>)}
              </ul>
              <p>
                Although the circumstances differ, the fundamental governance questions remain
                relevant across sectors.
              </p>
            </div>
          </section>

          <section className="case-section" id="research-education-practice">
            <h2 className="case-h">Research, Education, and Practice</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>TGM provides a common framework connecting three areas of Transformidable&rsquo;s work.</p>
              <p>
                <Link className="link" href="/research">Transformidable Research</Link> develops,
                documents, examines, and refines the method through case analysis and applied research.
              </p>
              <p>
                <Link className="link" href="/academy">Transformidable Academy</Link> translates
                governance principles into educational programs, workshops, and practical learning
                experiences for executives and governing bodies.
              </p>
              <p>
                J. Lynne &amp; Co., an affiliated advisory practice, applies governance principles to
                organizational assessments, transformation oversight, and advisory engagements.
              </p>
              <p>Insights from research and practice can inform the continued development of the method.</p>
            </div>
          </section>

          <section className="case-section" id="continuing-development">
            <h2 className="case-h">Continuing Development</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                The Transformidable Governance Method is an evolving framework. As additional cases
                are examined and practical applications are evaluated, its definitions, instruments,
                and supporting guidance may be refined.
              </p>
              <p>
                Future publications will document substantive changes to the method and its
                supporting materials.
              </p>
            </div>
          </section>

          <div className="detail-foot" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/publications/case-files">
              Read the case files
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link className="link" href="/research/agenda">The research agenda</Link>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
