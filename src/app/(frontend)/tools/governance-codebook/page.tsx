// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { MechanismExplorer } from "../../components/research/MechanismExplorer";
import { pageMetadata } from "../../../../lib/seo.ts";

export const metadata = pageMetadata({ title: "Technology Governance Codebook", description: "The analytical framework behind Transformidable's research: how technology governance is defined, evidenced, and assessed, independent of outcome.", path: "/tools/governance-codebook" });

const SEQUENCE = ["Evidence", "Governance", "Design & Operation", "Effectiveness", "Consequences", "Relationship"];

export default function GovernanceCodebookPage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="tools" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Tools · Governance Codebook</p>
          <h1 className="idx-title">The Technology Governance Codebook</h1>
          <p className="idx-intro">
            The analytical framework behind every Governance Files case: how Transformidable defines,
            evidences, and assesses technology governance, independent of whether an initiative
            ultimately succeeded or failed.
          </p>
        </div>
      </section>

      <article className="detail">
        <div className="ref-layout">
          <nav className="ref-nav" aria-label="On this page">
            <p className="ref-nav-h">On this page</p>
            <a href="#overview">Overview</a>
            <a href="#governance-matter">The Governance Matter</a>
            <a href="#outcome-neutrality">Outcome neutrality</a>
            <a href="#domains">The ten domains</a>
            <a href="#how-the-analysis-works">How the analysis works</a>
            <a href="#evidence-standards">Evidence &amp; standards</a>
            <a href="#version-status">Version &amp; status</a>
            <a href="#codebook-and-cases">Codebook &amp; cases</a>
          </nav>

          <div className="ref-content">
          <div className="detail-meta">
            <span className="dm"><b>Version</b> 0.1</span>
            <span className="dm"><b>Status</b> Prototype</span>
            <span className="dm"><b>Initial pilot</b> UCPath</span>
            <span className="dm"><b>Maintainer</b> Jerri Bland, Ed.D., PMP</span>
          </div>

          <div className="prose" id="overview" style={{ marginTop: 34, scrollMarginTop: 90 }}>
            <p>
              The Technology Governance Codebook supports systematic, outcome-neutral analysis of
              technology governance. It is the research instrument behind every Governance Files case:
              the same definitions and questions are applied whether the matter at hand ended well,
              ended badly, or is still unfolding.
            </p>
            <blockquote>
              How do governance decisions and mechanisms shape the adoption, use, transformation,
              operation, and consequences of technology within organizations?
            </blockquote>
            <p>
              The codebook is designed to examine governance across favorable, adverse, mixed,
              recovered, ongoing, and indeterminate outcomes. It does not assume that:
            </p>
            <ul>
              <li>an adverse outcome establishes governance failure;</li>
              <li>a favorable outcome establishes effective governance;</li>
              <li>a governance deficiency necessarily produces realized harm;</li>
              <li>effective governance eliminates the possibility of adverse consequences; or</li>
              <li>technology governance occurs only within formal projects or implementations.</li>
            </ul>
            <p>
              Coding first establishes how governance operated. Governance effectiveness, consequences,
              and the relationship between them are assessed separately, and only afterward.
            </p>
          </div>

          <section className="case-section" id="governance-matter">
            <h2 className="case-h">What we study: the Governance Matter</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                The unit of research is a <strong>Governance Matter</strong>: a defined instance in
                which organizational authority, oversight, accountability, policy, control, or
                decision-making is exercised, or reasonably may be expected to be exercised, over a
                consequential technology activity, decision, system, relationship, or use.
              </p>
              <p>
                Governance Matters include, among others: technology projects and transformations; ERP
                and student information system implementations; AI deployments and use cases;
                enterprise technology policies; technology acquisitions and investment decisions;
                vendor and third-party relationships; data practices and cybersecurity decisions; and
                technology incidents and how institutions respond to them. A single matter may draw on
                many source documents and many separately coded pieces of evidence.
              </p>
            </div>
          </section>

          <section className="case-section" id="outcome-neutrality">
            <h2 className="case-h">Outcome neutrality</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Outcome neutrality is foundational to the methodology. Transformidable does not begin
                with whether an initiative succeeded or failed and work backward to decide whether
                governance was good or bad. Governance is coded independently of the known outcome: a
                successful initiative may still contain governance deficiencies, and an unsuccessful one
                may contain governance mechanisms that operated effectively.
              </p>
              <p>
                Governance effectiveness, consequences, and any relationship between them are
                characterized separately, and each only after governance itself has been described.
              </p>
            </div>
          </section>

          <section className="case-section" id="domains">
            <h2 className="case-h">The ten governance domains</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Every coded piece of evidence is assigned one primary governance domain, and may be
                assigned secondary domains when independently supported. Select a domain to see its
                definition, the question it asks, and what it covers.
              </p>
            </div>
            <div style={{ marginTop: 20 }}>
              <MechanismExplorer />
            </div>
          </section>

          <section className="case-section" id="how-the-analysis-works">
            <h2 className="case-h">How the analysis works</h2>
            <div className="seq-flow" role="list" aria-label="Analytical sequence">
              {SEQUENCE.map((step, i) => (
                <div className="seq-item" key={step}>
                  <div className={`seq-step${i === SEQUENCE.length - 1 ? " is-last" : ""}`} role="listitem">
                    <span className="seq-n">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                  {i < SEQUENCE.length - 1 && (
                    <svg className="seq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  )}
                </div>
              ))}
            </div>
            <div className="prose" style={{ marginTop: 20 }}>
              <p>
                Each governance mechanism found in the evidence is described first, then examined for
                how it was designed and how it actually operated in practice, and separately for the
                strength and quality of the evidence supporting that description. Effectiveness and
                consequences are assessed afterward, and only then, cautiously, any relationship between
                them. Several distinctions hold throughout:
              </p>
              <ul>
                <li>Governance mechanisms are not consequences.</li>
                <li>Effectiveness is not inferred from the outcome.</li>
                <li>Governance and consequences are characterized independently before any relationship between them is assessed.</li>
                <li>Causal language is used only to the extent the evidence actually supports it.</li>
              </ul>
            </div>
          </section>

          <section className="case-section" id="evidence-standards">
            <h2 className="case-h">Evidence &amp; research standards</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Findings are built from audits and oversight reports, litigation and court records, laws
                and regulations, policies and governance frameworks, contracts and procurement records,
                institutional records, labor agreements, academic research, journalism, interviews,
                hearings and testimony, and vendor or interested-party material.
              </p>
              <p>
                Not every source carries the same evidentiary weight. Transformidable tracks the role a
                source plays (discovery, evidence, corroboration, or context), how independent or
                interested its origin is, and whether it was produced at the time of the matter or
                afterward. A source that is valuable for locating information is not automatically
                sufficient to support an analytical conclusion on its own.
              </p>
              <p>
                Absence of evidence is not treated as evidence of absence. If available sources are
                silent on a governance mechanism, it is classified as not evidenced, not as absent;
                classifying a mechanism as absent requires evidence that affirmatively supports that
                conclusion.
              </p>
            </div>
          </section>

          <section className="case-section" id="version-status">
            <h2 className="case-h">Version &amp; validation status</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Technology Governance Codebook v0.1 is a prototype, and UCPath is its initial operational
                pilot. UCPath alone cannot validate an outcome-neutral technology-governance codebook, so
                v0.1 should not be read as validated, an industry standard, predictive, statistically
                established, a maturity model, or a best-practice framework. It is a developmental
                instrument, and the research program intentionally allows evidence to test and refine it.
              </p>
              <p>
                Before any promotion to v1.0, the codebook will be tested against a deliberately varied
                set of matters, favorable, adverse, and mixed outcomes; project and non-project
                governance; and matters with genuinely indeterminate evidence, to surface overlapping
                domains, missing mechanisms, and ambiguous definitions before the taxonomy is treated as
                settled.
              </p>
              <p>
                <strong>Current version: 0.1 (Prototype), released August 2026.</strong> Initial release
                of the Technology Governance Codebook, expanding the research methodology from ERP and
                student-information-system failure mechanisms to outcome-neutral analysis of technology
                governance across both project and non-project governance matters. Definitions change
                only through a version bump; no version is silently altered, and prior versions remain
                archived as the codebook evolves.
              </p>
            </div>
          </section>

          <section className="case-section" id="codebook-and-cases">
            <h2 className="case-h">How this connects to the Governance Files</h2>
            <div className="prose" style={{ marginTop: 0 }}>
              <p>
                Every published Governance Files case identifies which version of the Technology
                Governance Codebook governed its analysis. If a case is later recoded under a newer
                version, the original methodological provenance is preserved alongside the current one,
                so a reader can always determine which analytical framework produced a given published
                finding.
              </p>
            </div>
          </section>

          <div className="detail-foot" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/publications/case-files">
              Read the case files
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link className="link" href="/about">About the research</Link>
          </div>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
