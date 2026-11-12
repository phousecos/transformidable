/**
 * Builds the day's LinkedIn action list (owner rules in README: about 5 follow-ups and about
 * 9 connection requests; one touch per person per day; at most 2 people per account per week;
 * invites pending 3 weeks get a withdraw action). Each follow-up and connection gets a drafted
 * message in review_queue. Nothing is sent: a person works the list by hand.
 * Comments and reshares need post data (Sales Navigator alerts), which is not wired yet.
 */
import { draft, type ClaudeEnv, type DraftKind } from "./claude";
import type { SyncEnv } from "./sync";

export interface DailyEnv extends SyncEnv, ClaudeEnv {}

export const FOLLOW_UPS_PER_DAY = 5;
export const CONNECTS_PER_DAY = 9;
const PER_ACCOUNT_PER_WEEK = 2;
const WITHDRAW_AFTER_DAYS = 21;

/** Today's date in New York, YYYY-MM-DD. */
export const todayET = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

/** Buyer roles first; board members last. */
const ROLE_RANK_SQL = `CASE COALESCE(p.role_category, '')
  WHEN 'top_technology' THEN 1 WHEN 'ai_leader' THEN 1 WHEN 'finance' THEN 2 WHEN 'risk_compliance' THEN 2
  WHEN 'top_executive' THEN 3 WHEN 'operations' THEN 3 WHEN 'board' THEN 5 ELSE 4 END`;

interface Candidate {
  id: string;
  full_name: string;
  title: string | null;
  organization: string | null;
  kade_account_id: string | null;
  kade_summary: string | null;
  kade_tier: string | null;
  kade_heat: number | null;
  pursued: number;
  linkedin_url: string | null;
}

const COLS = "p.id, p.full_name, p.title, p.organization, p.kade_account_id, p.kade_summary, p.kade_tier, p.kade_heat, p.pursued, p.linkedin_url";
const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

function why(c: Candidate, kind: string): string {
  const parts = [c.pursued ? "open pursuit" : null, c.kade_tier ? `${c.kade_tier}${c.kade_heat != null ? ` (heat ${c.kade_heat.toFixed(2)})` : ""}` : null];
  const head = kind === "follow_up" ? "Accepted your invite recently" : kind === "withdraw_invite" ? `Invite pending ${WITHDRAW_AFTER_DAYS}+ days` : "Hot account";
  return [head, ...parts.filter(Boolean)].join(" · ");
}

async function addAction(env: DailyEnv, date: string, rank: number, type: "connect" | "follow_up" | "withdraw_invite", c: Candidate) {
  let queueId: string | null = null;
  if (type !== "withdraw_invite") {
    const kind: DraftKind = type === "connect" ? "connection_note" : "follow_up";
    const d = await draft(env, kind, { firstName: firstName(c.full_name), title: c.title, organization: c.organization, context: c.kade_summary });
    queueId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO review_queue (id, system, item_type, channel, person_id, title, draft, context_json, created_by_agent, due_date)
       VALUES (?1, 'advisory', ?2, 'linkedin', ?3, ?4, ?5, ?6, ?7, ?8)`,
    ).bind(queueId, type === "connect" ? "connection_note" : "dm", c.id, `${c.full_name}, ${c.organization ?? ""}`, d.text,
      JSON.stringify({ tier: c.kade_tier, heat: c.kade_heat, pursued: !!c.pursued, drafted_by: d.by }), `engagement-engine:${d.by}`, date).run();
  }
  await env.DB.prepare(
    `INSERT INTO actions (id, action_date, rank, action_type, person_id, queue_id, reason, target_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
  ).bind(crypto.randomUUID(), date, rank, type, c.id, queueId, why(c, type), c.linkedin_url).run();
}

/** Builds today's list once; a second call the same day does nothing. */
export async function buildToday(env: DailyEnv, date = todayET()) {
  const existing = await env.DB.prepare("SELECT action_type, COUNT(*) AS n FROM actions WHERE action_date = ?1 GROUP BY action_type").bind(date).all<{ action_type: string; n: number }>();
  const have = Object.fromEntries(existing.results.map((r) => [r.action_type, r.n]));
  if (existing.results.length) return { date, skipped: true, have };

  const touchedToday = `NOT EXISTS (SELECT 1 FROM touches t WHERE t.person_id = p.id AND date(t.occurred_at) = ?1)`;
  // KADE's contact history (contact_state): no suggestions while in a conversation, paused (not interested) or stopped.
  const CONTACT_OPEN = `(p.contact_state = 'open' OR (p.contact_state = 'paused' AND p.paused_until <= ?1))`;

  const followUps = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.connection_status = 'connected' AND p.do_not_contact = 0 AND ${CONTACT_OPEN} AND p.connected_at >= date(?1, '-14 days') AND ${touchedToday}
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'follow_up')
     ORDER BY p.connected_at LIMIT ?2`,
  ).bind(date, FOLLOW_UPS_PER_DAY).all<Candidate>()).results;

  const pool = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.in_kade_scope = 1 AND p.linkedin_url IS NOT NULL AND p.connection_status = 'none' AND p.do_not_contact = 0 AND ${CONTACT_OPEN} AND ${touchedToday}
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'connect'
                       AND (a.status <> 'skipped' OR a.action_date >= date(?1, '-30 days')))
       AND (SELECT COUNT(*) FROM actions a JOIN people q ON q.id = a.person_id
            WHERE q.kade_account_id = p.kade_account_id AND a.action_type = 'connect' AND a.action_date >= date(?1, '-6 days')) < ?2
     ORDER BY p.pursued DESC, ${ROLE_RANK_SQL}, p.kade_heat DESC, p.full_name
     LIMIT 60`,
  ).bind(date, PER_ACCOUNT_PER_WEEK).all<Candidate>()).results;
  const perAccount = new Map<string, number>();
  const connects: Candidate[] = [];
  for (const c of pool) {
    const key = c.kade_account_id ?? c.id;
    if ((perAccount.get(key) ?? 0) >= PER_ACCOUNT_PER_WEEK) continue;
    perAccount.set(key, (perAccount.get(key) ?? 0) + 1);
    connects.push(c);
    if (connects.length >= CONNECTS_PER_DAY) break;
  }

  const withdraws = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.connection_status = 'pending' AND p.invited_at < date(?1, '-${WITHDRAW_AFTER_DAYS} days')
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'withdraw_invite')
     ORDER BY p.invited_at LIMIT 5`,
  ).bind(date).all<Candidate>()).results;

  let rank = 0;
  for (const c of followUps) await addAction(env, date, ++rank, "follow_up", c);
  for (const c of connects) await addAction(env, date, ++rank, "connect", c);
  for (const c of withdraws) await addAction(env, date, ++rank, "withdraw_invite", c);
  return { date, skipped: false, followUps: followUps.length, connects: connects.length, withdraws: withdraws.length };
}
