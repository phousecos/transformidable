/**
 * The influence network (KADE docs/influence.md): who is in it, how they score, their tier and where the
 * relationship stands. People are Signals records; the stage is read from Signals' contact history, except the
 * last three stages, which only the owner can set.
 */
import { KadeError, linkLinkedIn, requestResearch, signalsPeople, signalsPerson, type KadeEnv, type SignalsPerson } from "./kade";

export interface NetworkEnv extends KadeEnv { DB: D1Database }

export interface Criterion { key: string; label: string; weight: number }
export interface NetworkSettings {
  communities: { key: string; label: string; target: number; serves: string[] }[];
  types: { key: string; label: string }[];
  criteria: Criterion[];
  tiers: { tier: number; label: string; min: number; target: number }[];
}

export async function settings(env: NetworkEnv): Promise<NetworkSettings> {
  const row = await env.DB.prepare("SELECT value_json FROM settings WHERE key = 'network'").first<{ value_json: string }>();
  if (!row) throw new Error("Influence settings are missing");
  return JSON.parse(row.value_json);
}

/** by: "research" when Claude proposed it from the research, "owner" when she set it (research never overwrites hers). */
export type Scores = Record<string, { score: number | null; evidence?: string | null; by?: "research" | "owner" }>;

/**
 * Weighted score out of 100: each criterion's (score / 5) x weight, over the criteria scored, scaled to the weights
 * scored. Unknown criteria are left out rather than guessed; with fewer than half the weight known there is no score.
 */
export function weightedScore(scores: Scores, criteria: Criterion[]): number | null {
  let got = 0, weight = 0;
  for (const c of criteria) {
    const s = scores[c.key]?.score;
    if (s == null) continue;
    got += (Math.min(5, Math.max(1, s)) / 5) * c.weight;
    weight += c.weight;
  }
  const total = criteria.reduce((n, c) => n + c.weight, 0);
  if (!weight || weight < total / 2) return null;
  return Math.round((got / weight) * 1000) / 10;
}

export function tierFor(score: number | null, s: NetworkSettings): number | null {
  if (score == null) return null;
  const t = [...s.tiers].sort((a, b) => b.min - a.min).find((x) => score >= x.min);
  return t ? t.tier : null;
}

export const STAGES = ["identified", "following", "initial", "recurring", "connected", "dialogue", "collaboration", "active"] as const;
export const STAGE_LABELS: Record<string, string> = {
  identified: "Identified", following: "Following", initial: "Initial engagement", recurring: "Recurring engagement",
  connected: "Connected", dialogue: "Professional dialogue", collaboration: "Collaboration opportunity", active: "Active relationship",
};

/** Where a relationship stands, from what actually happened. Following is assumed once she adds them. */
export function stageOf(p: Pick<SignalsPerson, "kinds" | "comments"> | undefined, override: string | null): string {
  if (override) return override;
  if (!p) return "identified";
  if (p.kinds.includes("connect_accepted")) return "connected";
  if (p.comments >= 3 || p.kinds.includes("reply")) return "recurring";
  if (p.comments >= 1) return "initial";
  return "following";
}

interface Row {
  person_id: string; full_name: string; linkedin_url: string | null; affiliation: string | null; community: string | null; communities_json: string;
  type: string | null; scores_json: string; score: number | null; tier: number | null; tier_set_by: string | null; stage_override: string | null;
  plan_json: string | null; next_action: string | null; notes: string | null; source: string; status: string; added_at: string;
  why: string | null; screening_json: string | null; qualified: number | null; research_key: string | null; scored_at: string | null;
}
export type { Row as NetworkRow };

/**
 * The network with Signals' facts merged in. A person Signals has merged follows the merge. Members are listed;
 * discovery candidates who qualified are the Suggested list, and the others are only counted.
 */
export async function networkView(env: NetworkEnv) {
  const rows = (await env.DB.prepare("SELECT * FROM network WHERE status <> 'removed' ORDER BY tier IS NULL, tier, score DESC, full_name").all<Row>()).results;
  const members = rows.filter((r) => r.status === "active");
  const suggested = rows.filter((r) => r.status === "candidate" && r.qualified === 1);
  let facts: SignalsPerson[] = [];
  let signalsError: string | null = null;
  try { facts = await signalsPeople(env, [...members, ...suggested].map((r) => r.person_id)); }
  catch (e) { signalsError = (e as Error).message; }
  const byId = new Map(facts.map((f) => [f.person_id, f]));
  const shape = (r: Row) => {
    const f = byId.get(r.person_id);
    return {
      ...r, communities: JSON.parse(r.communities_json) as string[], scores: JSON.parse(r.scores_json) as Scores,
      plan: r.plan_json ? JSON.parse(r.plan_json) : null, screening: r.screening_json ? JSON.parse(r.screening_json) as Record<string, boolean | null> : null,
      communities_json: undefined, scores_json: undefined, plan_json: undefined, screening_json: undefined, research_key: undefined,
      stage: stageOf(f, r.stage_override), comments: f?.comments ?? 0, last_touch: f?.last_touch ?? null,
      prospect: f?.prospect ?? false, partner: f?.partner ?? false, signals_role: f ? [f.title, f.organization].filter(Boolean).join(", ") || null : null,
    };
  };
  return {
    signalsError,
    people: members.map(shape),
    suggested: suggested.map(shape).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    candidates: { screening: rows.filter((r) => r.status === "candidate" && r.qualified == null).length, notQualified: rows.filter((r) => r.status === "candidate" && r.qualified === 0).length },
  };
}

export class InputError extends Error {}

/** Tier changes, joins and removals, for the monthly review (KADE docs/influence-measurement.md). */
export function logChange(env: NetworkEnv, personId: string, fullName: string, fromTier: number | null, toTier: number | null, change: "tier" | "joined" | "removed", by: string | null) {
  return env.DB.prepare("INSERT INTO tier_changes (person_id, full_name, from_tier, to_tier, change, by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
    .bind(personId, fullName, fromTier, toTier, change, by).run().catch((e) => console.log(JSON.stringify({ level: "warn", job: "logChange", error: String(e) })));
}

export async function addToNetwork(env: NetworkEnv, input: { linkedinUrl?: string; name?: string; affiliation?: string; community?: string; type?: string; notes?: string }, by: string, source: "manual" | "network_list" = "manual") {
  if (!input.linkedinUrl || !input.name) throw new InputError("Name and LinkedIn profile address are required");
  let p: { personId: string; created: boolean };
  try { p = await signalsPerson(env, input.linkedinUrl, input.name); }
  catch (e) { if (e instanceof KadeError && e.status === 422) throw new InputError(e.message); throw e; }
  const s = await settings(env);
  const community = s.communities.some((c) => c.key === input.community) ? input.community! : null;
  const type = s.types.some((t) => t.key === input.type) ? input.type! : null;
  await env.DB.prepare(
    `INSERT INTO network (person_id, full_name, linkedin_url, affiliation, community, communities_json, type, notes, source, added_by)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
     ON CONFLICT (person_id) DO UPDATE SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE network.status = 'removed'`,
  ).bind(p.personId, input.name.trim(), input.linkedinUrl.trim(), input.affiliation?.trim() || null, community, JSON.stringify(community ? [community] : []), type,
    input.notes?.trim() || null, source, by).run();
  await logChange(env, p.personId, input.name.trim(), null, null, "joined", by);
  // Their public work is researched straight away (Signals queues it; KADE docs/influence-research.md).
  await requestResearch(env, { footprint: [{ personId: p.personId, affiliation: input.affiliation?.trim() || null }] }).catch((e) => console.log(JSON.stringify({ level: "warn", job: "requestResearch", error: String(e) })));
  return { personId: p.personId, createdInSignals: p.created };
}

/** Edits from the page: classification, scores (the tier follows unless she sets it), stage, plan, next action. */
export async function updateMember(env: NetworkEnv, personId: string, b: Record<string, unknown>, by: string) {
  const row = await env.DB.prepare("SELECT * FROM network WHERE person_id = ?1").bind(personId).first<Row>();
  if (!row) throw new InputError("Not in the network");
  const s = await settings(env);
  const set: Record<string, unknown> = {};
  if ("community" in b) set.community = s.communities.some((c) => c.key === b.community) ? b.community : null;
  if ("communities" in b && Array.isArray(b.communities)) set.communities_json = JSON.stringify((b.communities as string[]).filter((k) => s.communities.some((c) => c.key === k)));
  if ("type" in b) set.type = s.types.some((t) => t.key === b.type) ? b.type : null;
  for (const k of ["affiliation", "next_action", "notes"]) if (k in b) set[k] = typeof b[k] === "string" && (b[k] as string).trim() ? (b[k] as string).trim().slice(0, 2000) : null;
  // A plan she edits is hers: research never redrafts it.
  if ("plan" in b) set.plan_json = b.plan && typeof b.plan === "object" ? JSON.stringify({ ...(b.plan as object), auto: false }) : null;
  if ("stage" in b) set.stage_override = ["dialogue", "collaboration", "active"].includes(String(b.stage)) ? b.stage : null;
  let scores: Scores = JSON.parse(row.scores_json);
  if ("scores" in b && b.scores && typeof b.scores === "object") {
    // Only a score she changes becomes hers; the rest keep their evidence and origin.
    for (const [k, v] of Object.entries(b.scores as Scores)) {
      if (!s.criteria.some((c) => c.key === k) || !v || typeof v !== "object") continue;
      const n = v.score == null || (v.score as unknown) === "" ? null : Math.round(Math.min(5, Math.max(1, Number(v.score))));
      if (n === (scores[k]?.score ?? null)) continue;
      scores[k] = { score: n, evidence: scores[k]?.evidence ?? null, by: "owner" };
    }
    set.scores_json = JSON.stringify(scores);
  }
  const score = weightedScore(scores, s.criteria);
  set.score = score;
  if ("tier" in b) {
    // A tier she sets stays; clearing it hands the tier back to the score.
    const t = Number(b.tier);
    set.tier = [1, 2, 3].includes(t) ? t : tierFor(score, s);
    set.tier_set_by = [1, 2, 3].includes(t) ? by : null;
  } else if (!row.tier_set_by) set.tier = tierFor(score, s);
  const keys = Object.keys(set);
  await env.DB.prepare(`UPDATE network SET ${keys.map((k, i) => `${k} = ?${i + 2}`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE person_id = ?1`)
    .bind(personId, ...keys.map((k) => set[k] ?? null)).run();
  if ("tier" in set && (set.tier ?? null) !== row.tier && row.status === "active") await logChange(env, personId, row.full_name, row.tier, (set.tier as number | null) ?? null, "tier", by);
  return { ok: true, score, tier: set.tier ?? row.tier };
}

export async function removeMember(env: NetworkEnv, personId: string, by: string | null = null) {
  const row = await env.DB.prepare("SELECT full_name, tier, status FROM network WHERE person_id = ?1").bind(personId).first<{ full_name: string; tier: number | null; status: string }>();
  await env.DB.prepare("UPDATE network SET status = 'removed', updated_at = CURRENT_TIMESTAMP WHERE person_id = ?1").bind(personId).run();
  if (row?.status === "active") await logChange(env, personId, row.full_name, row.tier, null, "removed", by);
}

/**
 * She follows a suggested candidate: they join the network. Discovery may not have found their LinkedIn profile, so she
 * pastes it here; it is saved on the Signals person, and if Signals already has someone with it, that person is the one.
 */
export async function followCandidate(env: NetworkEnv, personId: string, linkedinUrl: string | undefined, by: string) {
  const row = await env.DB.prepare("SELECT person_id, linkedin_url, status FROM network WHERE person_id = ?1").bind(personId).first<{ person_id: string; linkedin_url: string | null; status: string }>();
  if (!row || row.status !== "candidate") throw new InputError("Not a suggested candidate");
  const url = (linkedinUrl ?? "").trim() || row.linkedin_url;
  if (!url) throw new InputError("Paste their LinkedIn profile address to follow them");
  let id = personId;
  try { id = (await linkLinkedIn(env, personId, url)).personId; }
  catch (e) { if (e instanceof KadeError && e.status === 422) throw new InputError(e.message); throw e; }
  if (id !== personId) {
    const other = await env.DB.prepare("SELECT status FROM network WHERE person_id = ?1").bind(id).first<{ status: string }>();
    if (other) {
      await env.DB.batch([
        env.DB.prepare("UPDATE network SET status = 'active', added_by = ?2, updated_at = CURRENT_TIMESTAMP WHERE person_id = ?1").bind(id, by),
        env.DB.prepare("DELETE FROM network WHERE person_id = ?1").bind(personId),
      ]);
      return { personId: id, merged: true };
    }
    await env.DB.prepare("UPDATE network SET person_id = ?2 WHERE person_id = ?1").bind(personId, id).run();
  }
  await env.DB.prepare("UPDATE network SET status = 'active', linkedin_url = ?2, added_by = ?3, added_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE person_id = ?1")
    .bind(id, url, by).run();
  const joined = await env.DB.prepare("SELECT full_name, tier FROM network WHERE person_id = ?1").bind(id).first<{ full_name: string; tier: number | null }>();
  if (joined) await logChange(env, id, joined.full_name, null, joined.tier, "joined", by);
  return { personId: id, merged: false };
}

/** She passes on a candidate: they are never suggested again. */
export async function passCandidate(env: NetworkEnv, personId: string, by: string) {
  const r = await env.DB.prepare("UPDATE network SET status = 'removed', notes = trim(COALESCE(notes, '') || ?2), updated_at = CURRENT_TIMESTAMP WHERE person_id = ?1 AND status = 'candidate'")
    .bind(personId, `\nPassed by ${by}`).run();
  if (!r.meta.changes) throw new InputError("Not a suggested candidate");
  return { ok: true };
}
