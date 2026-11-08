// @ts-nocheck
import Link from "next/link";
import { fullDate, caseNo } from "./format";
import { renderLexical } from "./lexical";
import { GovernanceOutcomes, tallyFindings } from "./GovernanceOutcomes";
import { QUESTIONS, optionFor } from "../../../../lib/governanceCodebook";
import { DOMAINS } from "../../../../lib/governanceDomains";
import { chapterList, clock, durationSeconds, streamVideo } from "../../../../lib/podcast";
import { StreamPlayer } from "./StreamPlayer";
import { SeekLink } from "./SeekLink";

const ASSESSMENT: Record<string, string> = { strength: "Strength", weakness: "Weakness", observation: "Observation" };
const SEGMENT_TYPE_LABEL: Record<string, string> = {
  "narrative-finding": "Narrative finding", recommendation: "Recommendation",
  "entity-response": "Entity response", "auditor-comment": "Auditor comment", "rec-follow-up": "Rec. follow-up",
};
const DOC_TYPES: Record<string, string> = {
  filing: "Filing", contract: "Contract", memo: "Memo", report: "Report",
  presentation: "Presentation", correspondence: "Correspondence", other: "Document",
};

function mediaUrl(m: any): string | null {
  return m && typeof m === "object" && typeof m.url === "string" ? m.url : null;
}
const has = (a: any) => Array.isArray(a) && a.length > 0;

// `label` names what the link points to, so "Open" / "Read" / "Visit" make
// sense out of context (WCAG 2.4.4). New-tab behavior is announced too.
const ExtLink = ({ href, label, children }: any) => (
  <a className="link" href={href} rel="noopener" target="_blank">{children}
    <span className="sr-only">{label ? `: ${label}` : ""} (opens in new tab)</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
  </a>
);

// Screen readers run adjacent inline text together ("OverviewPending"); this
// visually hidden separator keeps a title and its pills apart.
const Sep = () => <span className="sr-only">, </span>;

// moments: the episode chapters tied to case sections, keyed by section id.
function Section({ id, label, pending, children, moments }: any) {
  return (
    <section className="case-section" id={id}>
      <h2 className="case-h">{label}{pending && <><Sep /><span className="case-pill case-pill--pending">Pending</span></>}</h2>
      {children}
      {moments?.[id]?.map((m: any) => (
        <SeekLink key={m.start} className="case-moment" href={m.href} seconds={m.start}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          Discussed in the episode at {clock(m.start)}
        </SeekLink>
      ))}
    </section>
  );
}

export function CaseDossier({ caseFile: cf, streamHost }: { caseFile: any; streamHost?: string | null }) {
  const overviewHtml = renderLexical(cf.overview);
  const timeline = has(cf.timeline) ? cf.timeline : [];
  const orgs = has(cf.organizations) ? cf.organizations : [];
  const outcomes = tallyFindings(cf.governanceMechanisms);
  const documents = has(cf.documents) ? cf.documents : [];
  const audits = has(cf.auditReports) ? cf.auditReports : [];
  const news = has(cf.newsCoverage) ? cf.newsCoverage : [];
  const notes = (Array.isArray(cf.researchNotes) ? cf.researchNotes : []).filter((n: any) => n && typeof n === "object");
  const mechanisms = has(cf.governanceMechanisms) ? cf.governanceMechanisms : [];
  const lessons = has(cf.lessonsLearned) ? cf.lessonsLearned : [];
  const related = (Array.isArray(cf.relatedCases) ? cf.relatedCases : []).filter((r: any) => r && typeof r === "object");
  const pod = cf.podcastEpisode && typeof cf.podcastEpisode === "object" ? cf.podcastEpisode : null;
  const aiSummary = typeof cf.aiSummary === "string" ? cf.aiSummary.trim() : "";
  const podStream = pod ? streamVideo(pod.streamVideo, streamHost) : null;
  const podChapters = pod ? chapterList(pod.chapters) : [];
  const moments: Record<string, { start: number; href: string }[]> = {};
  for (const c of podChapters) {
    if (!c.section) continue;
    (moments[c.section] ||= []).push({ start: c.start, href: `/podcast/${pod.slug}?t=${c.start}` });
  }

  // Core dossier sections (mirroring the CMS admin tabs) always appear, showing
  // a "Pending" status when the case doesn't have that content yet. Genuinely
  // optional extras only show up once there's something to show.
  const toc: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "organizations", label: "Organizations" },
  ];
  toc.push({ id: "governance-outcomes", label: "Governance Outcomes" });
  toc.push({ id: "documents", label: "Documents" });
  toc.push({ id: "audit-reports", label: "Audit Reports" });
  toc.push({ id: "news-coverage", label: "News Coverage" });
  if (notes.length) toc.push({ id: "research-notes", label: "Research Notes" });
  toc.push({ id: "governance-mechanisms", label: "Governance Mechanisms" });
  if (pod) toc.push({ id: "podcast", label: "Podcast Episode" });
  if (aiSummary) toc.push({ id: "ai-summary", label: "AI Summary" });
  toc.push({ id: "lessons-learned", label: "Lessons Learned" });
  if (related.length) toc.push({ id: "related", label: "Related Cases" });

  return (
    <div className="case-layout">
      <nav className="case-toc" aria-label="Case sections">
        <p className="case-toc-h">On this case</p>
        {toc.map((t) => <a key={t.id} href={`#${t.id}`}>{t.label}</a>)}
      </nav>

      <div className="case-content">
        <Section moments={moments} id="overview" label="Overview" pending={!overviewHtml}>
          {overviewHtml ? (
            <div className="prose" style={{ marginTop: 0 }} dangerouslySetInnerHTML={{ __html: overviewHtml }} />
          ) : (
            <p className="case-pending-note">Overview not yet available.</p>
          )}
        </Section>

        <Section moments={moments} id="timeline" label="Timeline" pending={timeline.length === 0}>
          {timeline.length > 0 ? (
            <>
              {cf.timelineLabel && <p className="case-cap">{cf.timelineLabel}</p>}
              <div className="exhibit" style={{ marginTop: cf.timelineLabel ? 14 : 0 }}>
                <div className="exhibit-body">
                  <div className="timeline">
                    {timeline.map((row: any, i: number) => (
                      <div className="tl-row" key={i}>
                        <span className="tl-time">{row.time}</span>
                        <span className="tl-mark" aria-hidden="true"><span className={`tl-dot${row.keyMoment ? " key" : ""}`} /><span className="tl-line" /></span>
                        <div className="tl-body">
                          <div className="t">{row.keyMoment && <span className="sr-only">Key moment: </span>}{row.title}</div>
                          {row.description && <div className="d">{row.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="case-pending-note">Timeline not yet available.</p>
          )}
        </Section>

        <Section moments={moments} id="organizations" label="Organizations" pending={orgs.length === 0}>
          {orgs.length > 0 ? (
            <div className="case-rows">
              {orgs.map((o: any, i: number) => (
                <div className="case-row" key={i}>
                  <div className="case-row-main">
                    <div className="case-row-title">{o.name}{o.role && <><Sep /><span className="case-pill">{o.role}</span></>}</div>
                    {o.description && <p className="case-row-desc">{o.description}</p>}
                  </div>
                  {o.url && <ExtLink href={o.url} label={o.name}>Visit</ExtLink>}
                </div>
              ))}
            </div>
          ) : (
            <p className="case-pending-note">Organizations not yet documented.</p>
          )}
        </Section>

        {/* Always present, like every other section, and marked Pending when the
            coding has not been loaded. Hiding it outright made the slot look as
            though it did not exist, so an uncoded case read as a missing feature
            rather than as missing data. */}
        <Section moments={moments} id="governance-outcomes" label="Governance Outcomes" pending={outcomes.counted === 0}>
          {outcomes.counted > 0 ? (
            <GovernanceOutcomes mechanisms={cf.governanceMechanisms} />
          ) : (
            <p className="case-pending-note">
              {outcomes.total > 0
                ? `${outcomes.total} governance ${outcomes.total === 1 ? "mechanism is" : "mechanisms are"} recorded, but none are coded to a codebook domain and the five questions yet, so there is nothing to tally.`
                : "Coded findings not yet loaded for this case."}
            </p>
          )}
        </Section>

        <Section moments={moments} id="documents" label="Documents" pending={documents.length === 0}>
          {documents.length > 0 ? (
            <div className="case-rows">
              {documents.map((d: any, i: number) => {
                const href = d.url || mediaUrl(d.file);
                return (
                  <div className="case-row" key={i}>
                    <div className="case-row-main">
                      <div className="case-row-title">{d.title}
                        {d.docType && <Sep />}
                        {d.docType && <span className="case-pill">{DOC_TYPES[d.docType] || "Document"}</span>}
                      </div>
                      {d.description && <p className="case-row-desc">{d.description}</p>}
                      {d.date && <span className="case-row-meta">{fullDate(d.date)}</span>}
                    </div>
                    {href && <ExtLink href={href} label={d.title}>Open</ExtLink>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="case-pending-note">No documents added yet.</p>
          )}
        </Section>

        <Section moments={moments} id="audit-reports" label="Audit Reports" pending={audits.length === 0}>
          {audits.length > 0 ? (
            <div className="case-rows">
              {audits.map((a: any, i: number) => {
                const href = a.url || mediaUrl(a.file);
                return (
                  <div className="case-row" key={i}>
                    <div className="case-row-main">
                      <div className="case-row-title">{a.title}</div>
                      {(a.auditor || a.date) && (
                        <span className="case-row-meta">{[a.auditor, a.date && fullDate(a.date)].filter(Boolean).join(" · ")}</span>
                      )}
                      {a.summary && <p className="case-row-desc">{a.summary}</p>}
                    </div>
                    {href && <ExtLink href={href} label={a.title}>Read</ExtLink>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="case-pending-note">No audit reports added yet.</p>
          )}
        </Section>

        <Section moments={moments} id="news-coverage" label="News Coverage" pending={news.length === 0}>
          {news.length > 0 ? (
            <div className="case-rows">
              {news.map((n: any, i: number) => (
                <div className="case-row" key={i}>
                  <div className="case-row-main">
                    <div className="case-row-title">{n.headline}</div>
                    {(n.outlet || n.date) && (
                      <span className="case-row-meta">{[n.outlet, n.date && fullDate(n.date)].filter(Boolean).join(" · ")}</span>
                    )}
                    {n.excerpt && <p className="case-row-desc">{n.excerpt}</p>}
                  </div>
                  {n.url && <ExtLink href={n.url} label={n.headline}>Read</ExtLink>}
                </div>
              ))}
            </div>
          ) : (
            <p className="case-pending-note">No news coverage added yet.</p>
          )}
        </Section>

        {notes.length > 0 && (
          <Section moments={moments} id="research-notes" label="Research Notes">
            <div className="case-rows">
              {notes.map((nt: any) => (
                <Link className="case-row" href={`/publications/research-notes/${nt.slug}`} key={nt.id}>
                  <div className="case-row-main">
                    <div className="case-row-title">{nt.title}</div>
                    {nt.dek && <p className="case-row-desc">{nt.dek}</p>}
                    {nt.publishedAt && <span className="case-row-meta">{fullDate(nt.publishedAt)}</span>}
                  </div>
                  <span className="link" aria-hidden="true">Read
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section moments={moments} id="governance-mechanisms" label="Governance Mechanisms" pending={mechanisms.length === 0}>
          {mechanisms.length > 0 ? (
            <div className="case-rows">
              {mechanisms.map((m: any, i: number) => {
                const dom = DOMAINS.find((d: any) => d.code === m.primaryDomain);
                const type = SEGMENT_TYPE_LABEL[m.segmentType];
                return (
                  <div className="case-row" key={i}>
                    <div className="case-row-main">
                      <div className="case-row-title">{m.name}
                        {dom && <><Sep /><span className="case-pill">{dom.code} {dom.short}</span></>}
                        {/* Everything except a narrative finding is labelled, so a
                            recommendation or an entity's own response is never
                            read as a finding about the entity. */}
                        {type && m.segmentType !== "narrative-finding" && <><Sep /><span className="case-pill case-pill--pending">{type}</span></>}
                        {m.assessment && <><Sep /><span className={`case-pill case-pill--${m.assessment}`}>{ASSESSMENT[m.assessment]}</span></>}
                      </div>
                      {m.description && <p className="case-row-desc">{m.description}</p>}
                      <div className="case-codes">
                        {QUESTIONS.map((q: any) => {
                          const opt = m[q.key] ? optionFor(q.key, m[q.key]) : null;
                          if (!opt) return null;
                          return (
                            <span className="case-code" key={q.key} title={`${q.tag} — ${q.question} · ${opt.meaning}`}>
                              <b>{q.tag}</b> {opt.code} {opt.label}
                            </span>
                          );
                        })}
                      </div>
                      {m.segment && <span className="case-row-meta">Segment {m.segment}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="case-pending-note">Governance mechanisms not yet documented.</p>
          )}
        </Section>

        {pod && (
          <Section moments={moments} id="podcast" label="Podcast Episode">
            {podStream ? (
              <>
                <StreamPlayer
                  src={podStream.hls}
                  poster={podStream.poster}
                  title={pod.title}
                  chapters={podChapters}
                  duration={durationSeconds(pod.duration) ?? 0}
                  collapsible
                />
                <p style={{ marginTop: 14 }}>
                  <Link className="link" href={`/podcast/${pod.slug}`}>Episode page, chapters and show notes
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </Link>
                </p>
              </>
            ) : (
              <Link className="case-podcast" href={`/podcast/${pod.slug}`}>
                <span className="case-podcast-play">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span>
                  <span className="case-podcast-t">{pod.title}</span>
                  {pod.episodeNumber != null && <span className="case-row-meta">Episode {pod.episodeNumber}</span>}
                </span>
              </Link>
            )}
          </Section>
        )}

        {aiSummary && (
          <Section moments={moments} id="ai-summary" label="AI Summary">
            <div className="case-ai">
              <span className="case-ai-badge">AI-generated</span>
              {aiSummary.split(/\n{2,}/).map((para: string, i: number) => <p key={i}>{para}</p>)}
            </div>
          </Section>
        )}

        <Section moments={moments} id="lessons-learned" label="Lessons Learned" pending={lessons.length === 0}>
          {lessons.length > 0 ? (
            <ol className="case-lessons">
              {lessons.map((l: any, i: number) => (
                <li key={i}>
                  <span className="case-lesson-t">{l.lesson}</span>
                  {l.detail && <p className="case-row-desc">{l.detail}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="case-pending-note">Lessons learned not yet documented.</p>
          )}
        </Section>

        {related.length > 0 && (
          <Section moments={moments} id="related" label="Related Cases">
            <div className="case-related">
              {related.map((r: any) => (
                <Link className="case-related-card" href={`/publications/case-files/${r.slug}`} key={r.id}>
                  <span className="cn">Case File {caseNo(r.caseNumber)}</span>
                  <span className="case-related-t">{r.title}</span>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
