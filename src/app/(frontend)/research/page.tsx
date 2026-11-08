// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { PublicationsList, CaseFilesFeature, HeroLatest } from "../components/research/ResearchSections";
import { Sky } from "../components/research/Sky";
import { pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({ title: "Technology & Transformation Governance Research | Transformidable", absolute: true, description: "Independent research on how boards, executives, and institutions govern technology, ERP, merger, and AI transformations, and why those transformations succeed or fail.", path: "/research" });

const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// Sort helper: featured docs first, then newest by publishedAt.
function featuredFirst(docs: any[]) {
  return [...docs].sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });
}

async function fetchCollection(payload: any, collection: string, limit: number) {
  try {
    const res = await payload.find({
      collection,
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      depth: 1,
      limit,
    });
    return featuredFirst(res.docs || []);
  } catch {
    // Collection may not be migrated yet in a fresh environment.
    return [];
  }
}

export default async function ResearchPage() {
  const payload = await getPayload({ config });
  const [publications, caseFiles] = await Promise.all([
    fetchCollection(payload, "publications", 4),
    fetchCollection(payload, "case-files", 4),
  ]);

  return (
    <ResearchShell>
        {/* HERO */}
        <section className="hero tr-onsky">
          <Sky variant="research" />
          <div className="wrap hero-in">
            <div className="hero-tags fade">
              <span>Governance, leadership &amp; institutional resilience</span>
              <span className="dot" aria-hidden="true"></span>
              <span>Transformidable Research</span>
            </div>

            <h1 className="hero-head fade d1">
              Advancing the science and practice of organizational <span className="em">transformation.</span>
            </h1>

            <div className="hero-grid">
              <div className="fade d2">
                <p className="lead" style={{ maxWidth: "52ch" }}>
                  We research how governance, leadership, and institutional decision-making shape
                  organizational resilience. We publish evidence, develop analytical tools, and
                  provide expert analysis that helps organizations, and the legal system,
                  understand why complex transformations succeed or fail.
                </p>
                <div className="hero-cta" style={{ marginTop: 26 }}>
                  <Link className="btn" href="/research#agenda">Read the research agenda <Arrow /></Link>
                  <Link className="link" href="#briefing">Subscribe to the Brief</Link>
                </div>
              </div>

              {caseFiles[0] || publications[0] ? (
                <HeroLatest caseFile={caseFiles[0]} publication={publications[0]} />
              ) : (
                <aside className="define-card fade d3">
                  <p className="figlabel">The word</p>
                  <div className="pron2">
                    <span className="word2">Transformidable</span>
                    <span className="pos2">adjective</span>
                    <span className="phon2">/trans&bull;form&bull;i&bull;da&bull;ble/</span>
                  </div>
                  <p className="meaning2">
                    <span className="q">&ldquo;</span>Capable of sustained transformation through effective
                    governance, leadership, and institutional resilience.<span className="q">&rdquo;</span>
                  </p>
                </aside>
              )}
            </div>
          </div>
        </section>

        {/* MODES OF WORK */}
        <div className="modes">
          <div className="wrap modes-in">
            <div className="mode">
              <span className="diamond" aria-hidden="true"></span>
              <h3>Publish evidence</h3>
              <p>Case files, white papers, and reports that put governance findings on the record.</p>
            </div>
            <div className="mode">
              <span className="diamond" aria-hidden="true"></span>
              <h3>Inform practice</h3>
              <p>Findings that shape Academy programs, briefings, and the questions leaders ask.</p>
            </div>
            <div className="mode">
              <span className="diamond" aria-hidden="true"></span>
              <h3>Develop tools</h3>
              <p>Analytics and benchmarks that turn the research into instruments you can run.</p>
            </div>
            <div className="mode">
              <span className="diamond" aria-hidden="true"></span>
              <h3>Provide expert analysis</h3>
              <p>Independent analysis for organizations and the legal system when transformations are contested.</p>
            </div>
          </div>
        </div>

        {/* RESEARCH AGENDA */}
        <section className="agenda" id="agenda">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker">The agenda</p>
                <h2 className="h">Five questions the research sets out to answer.</h2>
              </div>
              <Link className="link" href="/research/agenda">All research <Arrow s={13} /></Link>
            </div>
            <div className="inquiries">
              <div className="inquiry">
                <span className="qno">Governance</span>
                <h3>How do governance decisions influence organizational outcomes?</h3>
                <p>Tracing outcomes back to the decisions, and the decision rights, that produced them.</p>
              </div>
              <div className="inquiry">
                <span className="qno">Leadership</span>
                <h3>What leadership behaviors enable successful transformation?</h3>
                <p>The observable behaviors that move change from announced to sustained.</p>
              </div>
              <div className="inquiry">
                <span className="qno">Institutions</span>
                <h3>Why do some organizations become resilient while others fail?</h3>
                <p>What resilient organizations build before the stress event ever arrives.</p>
              </div>
              <div className="inquiry">
                <span className="qno">Technology</span>
                <h3>How is technology actually governed, independent of outcome?</h3>
                <p>Oversight for systems that outpace the structures meant to govern them.</p>
              </div>
              <div className="inquiry">
                <span className="qno">Evidence</span>
                <h3>What does the public record reveal about governance and outcomes?</h3>
                <p>Reading litigation, audits, and public records for the decisions that shaped what happened next.</p>
              </div>
              <Link className="inquiry call" href="/research/agenda">
                <p className="ck">The research agenda, in full. Five threads, one body of evidence.</p>
                <span className="link" style={{ color: "var(--wine)" }}>Explore the agenda <Arrow s={13} /></span>
              </Link>
            </div>
          </div>
        </section>

        {/* CONTENTS INDEX */}
        <section id="publications">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker">Contents</p>
                <h2 className="h">The research, in four parts.</h2>
              </div>
              <p className="figlabel" style={{ alignSelf: "flex-end" }}>Est. 2026</p>
            </div>

            {[
              { no: "01", name: "Agenda & Projects", href: "/research/agenda", desc: "The evidence base. Primary study of governance in the field.", kids: ["Research Agenda", "Datasets", "Research Projects"] },
              { no: "02", name: "Publications", href: "/publications", desc: "What the research becomes. Argued, edited, and on the record.", kids: ["Case Files", "Articles", "White Papers", "Research Notes", "Annual Reports"] },
              { no: "03", name: "Tools", href: "/tools/governance-codebook", desc: "The research, turned outward. Instruments you can run on yourself.", kids: ["Governance Codebook", "Governance Watch", "Benchmarks", "Risk Models"] },
              { no: "04", name: "Events", href: "/research#events", desc: "Where the findings are argued in the room. Roundtables and briefings.", kids: ["Roundtables", "Briefings"] },
            ].map((row) => (
              <Link className="contents-row" href={row.href} key={row.no}>
                <span className="c-no">{row.no}</span>
                <div className="c-main">
                  <span className="c-name">{row.name}<span className="c-arrow"><Arrow s={24} /></span></span>
                  <p className="c-desc">{row.desc}</p>
                </div>
                <div className="c-children">
                  {row.kids.map((k) => <span className="chip" key={k}>{k}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CASE FILES (data) */}
        <section className="casefile rule-band">
          <CaseFilesFeature caseFiles={caseFiles} />
        </section>

        {/* BENCHMARKS / ANALYTICS — not built yet: shown as Coming Soon */}
        <section id="tools" className="rule-band is-coming-soon">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker">Tools &middot; Governance Analytics</p>
                <h2 className="h">Turn the research into a number you can track.</h2>
                <span className="soon-badge">Coming soon</span>
              </div>
            </div>
            <div className="bench-grid">
              <div className="bench-copy">
                <h3>The Governance Resilience Index</h3>
                <p className="body">
                  A standing benchmark built from the case files, scoring how well a sector&rsquo;s
                  governance is set up to carry transformation without breaking. Run it on your own
                  organization, then see where you sit against your peers.
                </p>
                <span className="btn btn--disabled" aria-disabled="true">Coming soon</span>
              </div>
              <div className="stamp-wrap">
                <span className="stamp" aria-hidden="true">Coming Soon</span>
                <div className="chart-card">
                  <div className="cc-head">
                    <div>
                      <div className="cc-title">Resilience Index, all sectors</div>
                      <div className="figlabel" style={{ marginTop: 4 }}>Rolling, indexed to 100 at launch</div>
                    </div>
                    <div className="cc-now">
                      <div className="n">68<span className="up">&nbsp;&uarr;6</span></div>
                      <div className="l">Q3 2026</div>
                    </div>
                  </div>
                  <div className="chart-wrap">
                    <svg viewBox="0 0 520 180" role="img" aria-label="Governance Resilience Index rising from 52 to 68 over eight quarters">
                      <line x1="0" y1="20" x2="520" y2="20" stroke="var(--rule)" strokeWidth="1" />
                      <line x1="0" y1="70" x2="520" y2="70" stroke="var(--rule)" strokeWidth="1" />
                      <line x1="0" y1="120" x2="520" y2="120" stroke="var(--rule)" strokeWidth="1" />
                      <line x1="0" y1="170" x2="520" y2="170" stroke="var(--rule-strong)" strokeWidth="1" />
                      <path d="M0,120 L74,112 L148,116 L222,96 L296,84 L370,70 L444,58 L520,44 L520,170 L0,170 Z" fill="var(--wine)" fillOpacity="0.10" />
                      <path d="M0,120 L74,112 L148,116 L222,96 L296,84 L370,70 L444,58 L520,44" fill="none" stroke="var(--wine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="520" cy="44" r="5" fill="var(--gold)" stroke="var(--paper)" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="bench-table">
                    {[["Credit unions", 74], ["Community banks", 61], ["Public agencies", 48], ["Healthcare systems", 43]].map(([s, v], i, arr) => (
                      <div className="bt-row" key={s} style={i === arr.length - 1 ? { borderBottom: 0 } : undefined}>
                        <span className="s">{s}</span>
                        <span className="bt-bar"><span style={{ width: `${v}%` }} /></span>
                        <span className="bt-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="figlabel" style={{ marginTop: 12 }}>Figure 1 &middot; Illustrative index values, pending first release.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PUBLICATIONS (data) + EVENTS (static) */}
        <section className="rule-band" style={{ background: "var(--paper-2)" }}>
          <div className="wrap">
            <div className="split">
              <PublicationsList publications={publications} />

              <aside className="events-side" id="events">
                <p className="kicker">Upcoming events</p>
                <div className="event">
                  <div className="e-date"><span className="m">Oct 16, 2026</span><span className="tag">Roundtable</span></div>
                  <h4>Governance &amp; the Digital Board</h4>
                  <p>A working session on how boards oversee transformation they cannot personally see.</p>
                  <Link className="link" href="#briefing">Request a seat <Arrow s={13} /></Link>
                </div>
                <div className="event">
                  <div className="e-date"><span className="m">Nov 2026</span><span className="tag">Briefing</span></div>
                  <h4>Reading the Resilience Index</h4>
                  <p>A live walkthrough of the Q3 benchmark and what moved. Online.</p>
                  <Link className="link" href="#briefing">Get notified <Arrow s={13} /></Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
    </ResearchShell>
  );
}
