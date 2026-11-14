/**
 * Research for the network (KADE docs/influence-research.md). Influence asks; Signals researches.
 *
 * - Daily: who is due for footprint research (Tier 1 weekly, Tier 2 every two weeks, Tier 3 and reassess monthly,
 *   anyone never researched straight away; a candidate once), plus the week's discovery (Signals runs one a week).
 * - Hourly: new discovery candidates join as candidates; anyone whose research changed is screened and scored by
 *   Claude; a Tier 1 member gets a relationship plan drafted (until she edits it).
 */
import { draftPlan, scorePerson } from "./judge";
import { discoveries, requestResearch, signalsResearch, type Appearance, type PersonResearch } from "./kade";
import { settings, tierFor, weightedScore, type NetworkEnv, type NetworkRow, type Scores } from "./network";
import type { ClaudeEnv } from "./claude";

export interface ResearchEnv extends NetworkEnv, ClaudeEnv {}

export interface ResearchSettings {
  discoveryWeekly: number;
  footprintDays: Record<string, number>;
  focus: string;
  subjects: Record<string, string>;
  screening: { key: string; label: string }[];
  qualifyConditions: number;
  qualifyScore: number;
}

export async function researchSettings(env: NetworkEnv): Promise<ResearchSettings> {
  const row = await env.DB.prepare("SELECT value_json FROM settings WHERE key = 'research'").first<{ value_json: string }>();
  if (!row) throw new Error("Influence research settings are missing");
  return JSON.parse(row.value_json);
}

const DAY = 86_400_000;

/** Whether a member or candidate is due for footprint research now. */
export function footprintDue(row: Pick<NetworkRow, "status" | "tier">, r: PersonResearch | undefined, s: ResearchSettings, now = Date.now()): boolean {
  if (r?.waiting) return false;
  if (!r?.researched_at) return true;
  if (row.status === "candidate") return false;
  const days = s.footprintDays[row.tier ? String(row.tier) : "reassess"] ?? 30;
  return now - Date.parse(r.researched_at) >= days * DAY;
}

/** Each day: footprints that are due, and the week's discovery. */
export async function requestDue(env: NetworkEnv) {
  const [s, net] = await Promise.all([researchSettings(env), settings(env)]);
  const rows = (await env.DB.prepare("SELECT person_id, affiliation, tier, status FROM network WHERE status IN ('active', 'candidate')").all<Pick<NetworkRow, "person_id" | "affiliation" | "tier" | "status">>()).results;
  const research = new Map((await signalsResearch(env, rows.map((r) => r.person_id))).map((r) => [r.person_id, r]));
  const due = rows.filter((r) => footprintDue(r, research.get(r.person_id), s)).map((r) => ({ personId: r.person_id, affiliation: r.affiliation }));
  const everyone = (await env.DB.prepare("SELECT full_name FROM network").all<{ full_name: string }>()).results.map((r) => r.full_name);
  const discovery = s.discoveryWeekly > 0 ? {
    communities: net.communities.map((c) => ({ key: c.key, label: c.label, subjects: s.subjects[c.key] })),
    types: net.types, focus: s.focus, count: Math.min(20, s.discoveryWeekly * 2), exclude: everyone,
  } : null;
  const r = await requestResearch(env, { footprint: due, discovery });
  return { due: due.length, queued: r.queued, skipped: r.skipped.length, discovery: r.discovery };
}

async function getState(env: NetworkEnv): Promise<{ discoveriesSince: string }> {
  const row = await env.DB.prepare("SELECT value_json FROM settings WHERE key = 'research_state'").first<{ value_json: string }>();
  return row ? JSON.parse(row.value_json) : { discoveriesSince: "1970-01-01T00:00:00Z" };
}

/** New discovery candidates join as candidates, waiting for research and screening. Anyone already in the network (even passed) is skipped. */
export async function takeDiscoveries(env: NetworkEnv) {
  const st = await getState(env);
  const { scans } = await discoveries(env, st.discoveriesSince);
  if (!scans.length) return { scans: 0, added: 0 };
  const net = await settings(env);
  let added = 0;
  for (const scan of scans) for (const c of scan.candidates) {
    if (!c.personId || !c.name) continue;
    const community = net.communities.some((x) => x.key === c.community) ? c.community : null;
    const type = net.types.some((x) => x.key === c.type) ? c.type : null;
    const r = await env.DB.prepare(
      `INSERT INTO network (person_id, full_name, linkedin_url, affiliation, community, communities_json, type, why, source, status, added_by)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'research', 'candidate', 'research') ON CONFLICT (person_id) DO NOTHING`,
    ).bind(c.personId, c.name, c.linkedinUrl, c.affiliation, community, JSON.stringify(community ? [community] : []), type, c.why).run();
    added += r.meta.changes ?? 0;
  }
  const since = scans[scans.length - 1].finishedAt;
  await env.DB.prepare("UPDATE settings SET value_json = ?1, updated_at = CURRENT_TIMESTAMP WHERE key = 'research_state'").bind(JSON.stringify({ ...st, discoveriesSince: since })).run();
  return { scans: scans.length, added };
}

/** What a scoring read, so a change in the research (and only a change) rescores. */
export async function researchKey(appearances: Appearance[]): Promise<string> {
  const text = appearances.map((a) => `${a.url}|${a.confirmed ? 1 : 0}`).sort().join("\n");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Research scores merged with hers: a score she set is never replaced. */
export function mergeScores(current: Scores, proposed: Scores): Scores {
  const out: Scores = { ...proposed };
  for (const [k, v] of Object.entries(current)) if (v?.by === "owner") out[k] = v;
  return out;
}

/** Screened and scored, up to `limit` people a run (Claude calls), once their research is in and checked. */
export async function scoreChanged(env: ResearchEnv, limit = 6) {
  const [s, net] = await Promise.all([researchSettings(env), settings(env)]);
  const rows = (await env.DB.prepare("SELECT * FROM network WHERE status IN ('active', 'candidate') ORDER BY status = 'active' DESC, tier IS NULL, tier").all<NetworkRow>()).results;
  if (!rows.length) return { scored: 0, plans: 0 };
  const research = new Map((await signalsResearch(env, rows.map((r) => r.person_id))).map((r) => [r.person_id, r]));
  let scored = 0, plans = 0;
  const errors: string[] = [];
  for (const row of rows) {
    if (scored >= limit) break;
    const r = research.get(row.person_id);
    if (!r?.researched_at || r.waiting || r.checking > 0) continue;
    const key = await researchKey(r.appearances);
    const plan = row.plan_json ? JSON.parse(row.plan_json) as Record<string, unknown> : null;
    const wantsPlan = (tier: number | null) => row.status === "active" && tier === 1 && (!plan || plan.auto !== false);
    if (key === row.research_key && !(wantsPlan(row.tier) && !plan)) continue;
    try {
      const subject = { name: row.full_name, affiliation: row.affiliation, why: row.why, community: row.community, type: row.type, appearances: r.appearances };
      const a = await scorePerson(env, { focus: s.focus, criteria: net.criteria, screening: s.screening, communities: net.communities, types: net.types }, subject);
      scored++;
      const scores = mergeScores(JSON.parse(row.scores_json) as Scores, a.scores);
      const score = weightedScore(scores, net.criteria);
      const tier = row.tier_set_by ? row.tier : tierFor(score, net);
      const met = Object.values(a.screening).filter((v) => v === true).length;
      const qualified = met >= s.qualifyConditions && score != null && score >= s.qualifyScore ? 1 : 0;
      const community = row.community ?? a.community;
      let planJson = row.plan_json;
      if (wantsPlan(tier)) {
        const p = await draftPlan(env, s.focus, { ...subject, scores });
        planJson = JSON.stringify({ ...p, auto: true, drafted_at: new Date().toISOString() });
        plans++;
      }
      await env.DB.prepare(
        `UPDATE network SET scores_json = ?2, score = ?3, tier = ?4, screening_json = ?5, qualified = ?6, community = ?7,
           communities_json = CASE WHEN community IS NULL AND ?7 IS NOT NULL THEN json_array(?7) ELSE communities_json END,
           type = COALESCE(type, ?8), plan_json = ?9, research_key = ?10, scored_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE person_id = ?1`,
      ).bind(row.person_id, JSON.stringify(scores), score, tier, JSON.stringify(a.screening), qualified, community, a.type, planJson, key).run();
    } catch (e) { errors.push(`${row.full_name}: ${String((e as Error).message ?? e).slice(0, 200)}`); }
  }
  if (errors.length) console.log(JSON.stringify({ level: "warn", job: "scoreChanged", errors }));
  return { scored, plans, errors: errors.length };
}

/** One person's research, for the page. */
export async function researchFor(env: NetworkEnv, personId: string) {
  const [r] = await signalsResearch(env, [personId]);
  return r ?? { person_id: personId, researched_at: null, waiting: false, checking: 0, appearances: [] };
}

/** "Research now": a footprint scan as soon as Signals' queue allows (not within six days of the last one). */
export async function researchNow(env: NetworkEnv, personId: string) {
  const row = await env.DB.prepare("SELECT affiliation FROM network WHERE person_id = ?1").bind(personId).first<{ affiliation: string | null }>();
  const r = await requestResearch(env, { footprint: [{ personId, affiliation: row?.affiliation ?? null }] });
  return r.queued ? { queued: true } : { queued: false, reason: r.skipped[0]?.reason ?? "not queued" };
}
