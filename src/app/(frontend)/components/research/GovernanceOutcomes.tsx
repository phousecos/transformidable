// @ts-nocheck
/**
 * GovernanceOutcomes — a case file's coded findings, one table per question.
 *
 * The method asks five things of every coded segment (Technology Governance
 * Codebook §8, §9, §11). This renders one stacked-bar table per question, each
 * broken down by governance domain, from the same set of findings:
 *
 *   Q1  Was it set up?            Q3  How solid is the proof?
 *   Q2  Did it work in practice?  Q4  Did it matter?        Overall  Did it work?
 *
 * Only narrative findings are tallied. Recommendations, entity responses,
 * auditor comments and recommendation follow-ups are stored and remain part of
 * the record, but an entity's account of itself is not a finding about it, and
 * a recommendation is not yet one. The counts here reproduce the four-questions
 * summary sheet exactly, which is why that sheet is never imported.
 *
 * A finding is counted under its PRIMARY domain only. Secondary domains are
 * recorded on the finding but not tallied: counting one finding under every
 * domain it touches would inflate every total and double-count one piece of
 * evidence.
 *
 * Encoding notes, all deliberate:
 *
 * - Bars are scaled by COUNT against the busiest domain in that table, not
 *   stretched to equal width. At two or three findings per domain, a full-width
 *   bar reading "100% fell short" overstates the evidence; here bar length is
 *   how much evidence there is and the segments are its composition.
 * - Verdict scales (Q1, Q2, Overall) are colored good -> serious. Q3 and Q4 are
 *   NOT verdicts — weak evidence is a fact about the record, and "no link to
 *   outcome" is a clean result, not a bad one — so those read as an ordinal
 *   ramp instead. `kind` on each question decides which.
 * - The indeterminate answer in every scale ("Unclear", "Not evidenced", "Not
 *   enough evidence") is hatched as well as grey: it is the absence of a
 *   conclusion rather than one more verdict, and the hatching is what keeps it
 *   separable from the serious step for red-blind readers.
 */
import { DOMAINS } from "../../../../lib/governanceDomains";
import { QUESTIONS, optionFor } from "../../../../lib/governanceCodebook";

const DOMAIN_ORDER = new Map(DOMAINS.map((d, i) => [d.code, i]));
const domainMeta = (code) => DOMAINS.find((d) => d.code === code) || { code, short: code, name: code };

/**
 * Findings that count toward the tables: narrative findings with a domain.
 *
 * A blank segment type counts as a narrative finding, matching the field's own
 * declared default. That default only ever applied to rows created after the
 * field was added, so every row written before it — the seeded placeholders,
 * anything typed in the admin early on — carries a blank. Requiring an explicit
 * value there meant a row with a domain and all five answers coded still
 * silently failed to appear, with nothing on the page to say which field was
 * missing. Nobody chooses "blank" to mean "not a finding".
 *
 * This does not weaken the exclusion the field exists for: the importer always
 * writes an explicit type, so a recommendation, entity response, auditor
 * comment or follow-up loaded from a coding sheet still carries its real type
 * and is still left out of the tally.
 */
function countable(mechanisms) {
  return (Array.isArray(mechanisms) ? mechanisms : []).filter(
    (m) =>
      m &&
      typeof m === "object" &&
      (!m.segmentType || m.segmentType === "narrative-finding") &&
      DOMAIN_ORDER.has(m.primaryDomain),
  );
}

/**
 * Tally one question across domains. Findings not coded for this question are
 * skipped for this table only — a segment can be coded for Q1 and not yet Q4.
 */
export function tallyQuestion(mechanisms, question) {
  const byDomain = new Map();
  let coded = 0;
  for (const m of countable(mechanisms)) {
    const code = m[question.key];
    if (!code || !optionFor(question.key, code)) continue;
    if (!byDomain.has(m.primaryDomain)) byDomain.set(m.primaryDomain, { domain: m.primaryDomain, total: 0, counts: {} });
    const row = byDomain.get(m.primaryDomain);
    row.counts[code] = (row.counts[code] || 0) + 1;
    row.total += 1;
    coded += 1;
  }

  // Rank by how far down the scale a domain's findings sit, weighting each
  // answer by its position: a domain whose findings cluster at the bad end of
  // the scale rises. Ties break toward the better-evidenced domain, then to
  // codebook order so the order is stable across renders.
  const weight = (row) => {
    let sum = 0;
    let n = 0;
    for (const o of question.options) {
      if (o.slot === "none") continue; // an unknown answer is not a severity
      const c = row.counts[o.code] || 0;
      sum += c * o.slot;
      n += c;
    }
    return n ? sum / n : 0;
  };
  const domains = [...byDomain.values()].sort(
    (a, b) => weight(b) - weight(a) || b.total - a.total || DOMAIN_ORDER.get(a.domain) - DOMAIN_ORDER.get(b.domain),
  );
  return { domains, coded, max: domains.reduce((n, d) => Math.max(n, d.total), 0) };
}

/**
 * Overall counts for the section header, with exclusions split by REASON.
 *
 * The two reasons are not interchangeable, and reporting them as one number
 * mislabels whichever is not the cause. A segment left out because it is a
 * recommendation or an entity response is correctly excluded and needs nothing
 * done to it. A finding left out because it carries no governance domain is an
 * incomplete row: there is no table to put it in, and only the author can fix
 * that. Saying "recommendations, entity responses and follow-ups" over the
 * second case hides a coding gap behind a sentence that sounds deliberate.
 *
 * A row that is both — a recommendation with no domain — counts once, under
 * its type, because its type is the reason it would be excluded anyway.
 */
export function tallyFindings(mechanisms) {
  const all = (Array.isArray(mechanisms) ? mechanisms : []).filter(
    (m) => m && typeof m === "object",
  );
  const counted = countable(mechanisms);
  const isNarrative = (m) => !m.segmentType || m.segmentType === "narrative-finding";
  return {
    total: all.length,
    counted: counted.length,
    // Deliberately excluded: not a narrative finding.
    otherType: all.filter((m) => !isNarrative(m)).length,
    // Excluded because it cannot be placed: no domain to file it under.
    noDomain: all.filter((m) => isNarrative(m) && !DOMAIN_ORDER.has(m.primaryDomain)).length,
  };
}

/**
 * Paint an answer from its scale's palette. Answers with no slot are not points
 * on the scale — conflicting evidence, not applicable, unknown — and render
 * hatched grey rather than borrowing a step that would imply a severity they
 * do not carry.
 */
function segClass(option, question) {
  return option.slot === "none" ? "go-seg--none" : `go-seg--${question.palette}${option.slot}`;
}

function QuestionTable({ mechanisms, question }) {
  const { domains, coded, max } = tallyQuestion(mechanisms, question);
  if (!domains.length) return null;
  const used = question.options.filter((o) => domains.some((d) => d.counts[o.code]));

  return (
    <section className="go-q" aria-labelledby={`go-q-${question.key}`}>
      <h3 className="go-title" id={`go-q-${question.key}`}>
        <span className="go-tag">{question.tag}</span> {question.question}
      </h3>
      <p className="go-sub">
        {question.about} · {question.section} · {coded} coded {coded === 1 ? "finding" : "findings"}
      </p>

      <ul className="go-rows">
        {domains.map((row) => {
          const meta = domainMeta(row.domain);
          const parts = question.options
            .filter((o) => row.counts[o.code])
            .map((o) => `${row.counts[o.code]} ${o.label.toLowerCase()}`);
          return (
            <li className="go-row" key={row.domain}>
              {/* aria-label on <li> is ignored by several screen readers; the
                  row's text alternative is real (visually hidden) text instead. */}
              <span className="sr-only">{`${meta.code} ${meta.short}: ${row.total} ${row.total === 1 ? "finding" : "findings"} — ${parts.join(", ")}.`}</span>
              <div className="go-key" aria-hidden="true">
                <span className="go-code">{meta.code}</span>
                <span className="go-name">{meta.short}</span>
              </div>
              <div className="go-track" aria-hidden="true">
                <div className="go-bar" style={{ width: `${(row.total / max) * 100}%` }}>
                  {question.options.map((o, i) => {
                    const n = row.counts[o.code] || 0;
                    if (!n) return null;
                    return (
                      <span
                        className={`go-seg ${segClass(o, question)}`}
                        key={o.code}
                        style={{ flexGrow: n }}
                        title={`${meta.code} ${meta.short} — ${o.code} ${o.label}: ${n} of ${row.total}`}
                      >
                        {/* Label only where it fits with padding; otherwise the
                            number lives in the tooltip, the row total and the table. */}
                        {n / max >= 0.12 && <span className="go-seg-val">{n}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="go-n" aria-hidden="true">{row.total}</div>
            </li>
          );
        })}
      </ul>

      <div className="go-legend" aria-hidden="true">
        {used.map((o) => (
          <span className="go-leg" key={o.code} title={o.meaning}>
            <span className={`go-leg-swatch ${segClass(o, question)}`} />
            {o.label}
          </span>
        ))}
      </div>

      <details className="go-table-wrap">
        <summary className="go-table-toggle">View as table</summary>
        <div className="go-table-scroll">
          <table className="go-table">
            <caption className="go-table-cap">
              {question.tag} — {question.question} · narrative findings by primary domain
            </caption>
            <thead>
              <tr>
                <th scope="col">Domain</th>
                {question.options.map((o) => (
                  <th scope="col" key={o.code} title={o.meaning}>{o.code} {o.label}</th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((row) => {
                const meta = domainMeta(row.domain);
                return (
                  <tr key={row.domain}>
                    <th scope="row">{meta.code} {meta.short}</th>
                    {question.options.map((o) => <td key={o.code}>{row.counts[o.code] || 0}</td>)}
                    <td>{row.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function GovernanceOutcomes({ mechanisms }) {
  const { counted, otherType, noDomain } = tallyFindings(mechanisms);
  if (!counted) return null;
  const tables = QUESTIONS.map((q) => <QuestionTable key={q.key} mechanisms={mechanisms} question={q} />).filter(Boolean);

  return (
    <div className="go">
      <p className="go-intro">
        Every coded segment is put to the same five questions and tallied by governance domain.
        {" "}
        {counted} narrative {counted === 1 ? "finding" : "findings"} are counted here
        {otherType > 0 &&
          `; ${otherType} further ${otherType === 1 ? "segment" : "segments"} — recommendations, entity responses, auditor comments and follow-ups — are recorded but not tallied`}
        {noDomain > 0 &&
          `; ${noDomain} ${noDomain === 1 ? "finding is" : "findings are"} not yet assigned a governance domain, so ${noDomain === 1 ? "it has" : "they have"} no table to appear in`}.
        Each finding counts once, under its primary domain.
      </p>
      {tables}
    </div>
  );
}
