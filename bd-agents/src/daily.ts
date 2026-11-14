/**
 * Builds the day's LinkedIn action list (owner rules in README: about 5 follow-ups and about
 * 9 connection requests; one touch per person per day; at most 2 people per account per week;
 * invites pending 3 weeks get a withdraw action). Each follow-up and connection gets a drafted
 * message in review_queue. Nothing is sent: a person works the list by hand.
 * Comments (owner, November 12, 2026): about 5 connected prospects and 2 people from the influencer
 * list a day; the card links to their recent activity, a person pastes a post, and Claude drafts the
 * comment (LinkedIn's rules allow no reading of feeds). Reshare: the latest company-page post,
 * once, with a drafted intro. Up to 2 influencers join the 9 connection requests.
 * Partners (KADE docs/partners.md, November 13, 2026): up to 5 invitations a day on top, with a peer note; once
 * accepted, a message asking for a 15-minute call; 6 weeks after the last contact with one she has met, a check-in.
 */
import { draft, type ClaudeEnv, type DraftKind } from "./claude";

import type { SyncEnv } from "./sync";

export interface DailyEnv extends SyncEnv, ClaudeEnv {}

export const FOLLOW_UPS_PER_DAY = 5;
export const CONNECTS_PER_DAY = 9;
export const COMMENTS_PER_DAY = 5;
export const INFLUENCER_COMMENTS_PER_DAY = 2;
export const INFLUENCER_CONNECTS_PER_DAY = 2;
export const PARTNER_CONNECTS_PER_DAY = 5;
export const PARTNER_CHECK_INS_PER_DAY = 3;
/** A person is offered for a comment at most once a week. */
const COMMENT_EVERY_DAYS = 7;
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
  segment: string;
  partner_type: string | null;
}

type ActionType = "connect" | "follow_up" | "withdraw_invite" | "comment";
/** A profile's recent posts and comments page, where a comment is chosen. */
export const activityUrl = (profile: string | null) => profile ? `${profile.replace(/[?#].*$/, "").replace(/\/+$/, "")}/recent-activity/all/` : null;

const COLS = "p.id, p.full_name, p.title, p.organization, p.kade_account_id, p.kade_summary, p.kade_tier, p.kade_heat, p.pursued, p.linkedin_url, p.segment, p.partner_type";
export const PARTNER_LABELS: Record<string, string> = {
  fractional_finance: "fractional CFO or controller", fractional_hr: "fractional CHRO",
  deal_advisor: "M&A, integration or audit advisor", erp_recruiter: "ERP consultancy or executive recruiter",
};
export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

function why(c: Candidate, kind: string, checkIn = false): string {
  if (c.partner_type) {
    const label = PARTNER_LABELS[c.partner_type] ?? "partner";
    if (checkIn) return `Partner (${label}): six weeks since you last talked, a check-in`;
    if (kind === "follow_up") return `Partner (${label}) accepted: ask for a 15-minute call`;
    return `Partner (${label}): serves the same buyers; referrals both ways`;
  }
  if (c.segment === "influencer") return kind === "comment" ? "From your influencer list: comment on a recent post" : "From your influencer list";
  const parts = [c.pursued ? "open pursuit" : null, c.kade_tier ? `${c.kade_tier}${c.kade_heat != null ? ` (heat ${c.kade_heat.toFixed(2)})` : ""}` : null];
  const head = kind === "follow_up" ? "Accepted your invite recently" : kind === "withdraw_invite" ? `Invite pending ${WITHDRAW_AFTER_DAYS}+ days`
    : kind === "comment" ? "A connection at a hot account: comment on a recent post" : "Hot account";
  return [head, ...parts.filter(Boolean)].join(" · ");
}

async function addAction(env: DailyEnv, date: string, rank: number, type: ActionType, c: Candidate, checkIn = false) {
  let queueId: string | null = null;
  // A comment is drafted once a person pastes the post; nothing to draft yet.
  if (type === "connect" || type === "follow_up") {
    const kind: DraftKind = c.partner_type
      ? (type === "connect" ? "partner_note" : checkIn ? "partner_check_in" : "partner_call")
      : type === "connect" ? "connection_note" : "follow_up";
    const d = await draft(env, kind, { firstName: firstName(c.full_name), title: c.title, organization: c.organization, context: c.partner_type ? null : c.kade_summary });
    queueId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO review_queue (id, system, item_type, channel, person_id, title, draft, context_json, created_by_agent, due_date)
       VALUES (?1, 'advisory', ?2, 'linkedin', ?3, ?4, ?5, ?6, ?7, ?8)`,
    ).bind(queueId, type === "connect" ? "connection_note" : "dm", c.id, `${c.full_name}, ${c.organization ?? ""}`, d.text,
      JSON.stringify({ tier: c.kade_tier, heat: c.kade_heat, pursued: !!c.pursued, draft_kind: kind, drafted_by: d.by, draft_error: d.error ?? null }), `engagement-engine:${d.by}`, date).run();
  }
  await env.DB.prepare(
    `INSERT INTO actions (id, action_date, rank, action_type, person_id, queue_id, reason, target_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
  ).bind(crypto.randomUUID(), date, rank, type, c.id, queueId, why(c, type, checkIn), type === "comment" ? activityUrl(c.linkedin_url) : c.linkedin_url).run();
}

/** The latest company-page post published in the last 5 days and not reshared yet, with a drafted intro. */
async function addReshare(env: DailyEnv & { LINKEDIN_PAGE_URL?: string }, date: string, rank: number): Promise<number> {
  const post = await env.DB.prepare(
    `SELECT q.id, q.title, COALESCE(q.final_text, q.draft) AS text FROM review_queue q
     WHERE q.system = 'media' AND q.item_type = 'post_page' AND q.status = 'sent' AND q.sent_at >= date(?1, '-5 days')
       AND NOT EXISTS (SELECT 1 FROM review_queue r WHERE r.item_type = 'reshare' AND json_extract(r.context_json, '$.post_id') = q.id)
     ORDER BY q.sent_at DESC LIMIT 1`,
  ).bind(date).first<{ id: string; title: string | null; text: string }>();
  if (!post) return 0;
  const d = await draft(env, "reshare_intro", { firstName: "Jerri", title: null, organization: null, context: null, post: post.text });
  const queueId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO review_queue (id, system, item_type, channel, title, draft, context_json, created_by_agent, due_date)
     VALUES (?1, 'media', 'reshare', 'profile', ?2, ?3, ?4, ?5, ?6)`,
  ).bind(queueId, post.title, d.text, JSON.stringify({ post_id: post.id, post_title: post.title, post_text: post.text.slice(0, 3000), drafted_by: d.by, draft_error: d.error ?? null }),
    `engagement-engine:${d.by}`, date).run();
  await env.DB.prepare(
    `INSERT INTO actions (id, action_date, rank, action_type, person_id, queue_id, reason, target_url) VALUES (?1, ?2, ?3, 'reshare', NULL, ?4, ?5, ?6)`,
  ).bind(crypto.randomUUID(), date, rank, queueId, "Reshare the company page's latest post to your profile", env.LINKEDIN_PAGE_URL || null).run();
  return 1;
}

/** Builds today's list once; a second call the same day does nothing. */
export async function buildToday(env: DailyEnv & { LINKEDIN_PAGE_URL?: string }, date = todayET()) {
  const existing = await env.DB.prepare("SELECT action_type, COUNT(*) AS n FROM actions WHERE action_date = ?1 GROUP BY action_type").bind(date).all<{ action_type: string; n: number }>();
  const have = Object.fromEntries(existing.results.map((r) => [r.action_type, r.n]));
  if (existing.results.length) return { date, skipped: true, have };

  // Carry-over (owner, November 14, 2026): an item not done stays on the list for 7 days, oldest first, then drops.
  // Each day's new items only top up to the daily numbers, so a missed day never doubles the invitations.
  const expired = await env.DB.prepare(
    "UPDATE actions SET status = 'skipped', outcome = 'Not done within 7 days', done_at = ?2 WHERE status = 'todo' AND action_date < date(?1, '-7 days')",
  ).bind(date, new Date().toISOString()).run();
  const carriedRows = (await env.DB.prepare(
    `SELECT a.action_type, a.person_id, p.partner_type, p.segment FROM actions a LEFT JOIN people p ON p.id = a.person_id
     WHERE a.status = 'todo' AND a.action_date < ?1 AND a.action_date >= date(?1, '-7 days')`,
  ).bind(date).all<{ action_type: string; person_id: string | null; partner_type: string | null; segment: string | null }>()).results;
  const carried = (type: string, who: "prospect" | "influencer" | "partner" | "any") => carriedRows.filter((r) => r.action_type === type
    && (who === "any" || (who === "partner" ? !!r.partner_type : who === "influencer" ? r.segment === "influencer" && !r.partner_type : !r.partner_type && r.segment !== "influencer"))).length;
  const left = (n: number) => Math.max(0, n);
  const limits = {
    followUps: left(FOLLOW_UPS_PER_DAY - carried("follow_up", "prospect") - carried("follow_up", "influencer")),
    comments: left(COMMENTS_PER_DAY - carried("comment", "prospect")),
    influencerComments: left(INFLUENCER_COMMENTS_PER_DAY - carried("comment", "influencer")),
    connects: left(CONNECTS_PER_DAY - carried("connect", "prospect") - carried("connect", "influencer")),
    influencerConnects: left(INFLUENCER_CONNECTS_PER_DAY - carried("connect", "influencer")),
    partnerConnects: left(PARTNER_CONNECTS_PER_DAY - carried("connect", "partner")),
    partnerCheckIns: left(PARTNER_CHECK_INS_PER_DAY - carried("follow_up", "partner")),
    withdraws: left(5 - carried("withdraw_invite", "any")),
  };
  const carriedPeople = new Set(carriedRows.flatMap((r) => (r.person_id ? [r.person_id] : [])));

  const touchedToday = `NOT EXISTS (SELECT 1 FROM touches t WHERE t.person_id = p.id AND date(t.occurred_at) = ?1)`;
  // KADE's contact history (contact_state): no suggestions while in a conversation, paused (not interested) or stopped.
  const CONTACT_OPEN = `(p.contact_state = 'open' OR (p.contact_state = 'paused' AND p.paused_until <= ?1))`;

  const followUps = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.connection_status = 'connected' AND p.do_not_contact = 0 AND ${CONTACT_OPEN} AND p.connected_at >= date(?1, '-14 days') AND ${touchedToday}
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'follow_up')
     ORDER BY p.connected_at LIMIT ?2`,
  ).bind(date, FOLLOW_UPS_PER_DAY + 5).all<Candidate>()).results.filter((c) => !carriedPeople.has(c.id)).slice(0, limits.followUps);

  const notCommentedRecently = `NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'comment' AND a.action_date >= date(?1, '-${COMMENT_EVERY_DAYS} days'))`;
  const lastComment = "(SELECT MAX(a.action_date) FROM actions a WHERE a.person_id = p.id AND a.action_type = 'comment')";
  const busy = new Set([...carriedPeople, ...followUps.map((c) => c.id)]);
  const prospectComments = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.segment <> 'influencer' AND p.in_kade_scope = 1 AND p.connection_status = 'connected' AND p.linkedin_url IS NOT NULL
       AND p.do_not_contact = 0 AND ${CONTACT_OPEN} AND ${touchedToday} AND ${notCommentedRecently}
     ORDER BY p.pursued DESC, ${lastComment} IS NOT NULL, ${lastComment}, p.kade_heat DESC LIMIT 20`,
  ).bind(date).all<Candidate>()).results.filter((c) => !busy.has(c.id)).slice(0, limits.comments);
  const influencerComments = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.segment = 'influencer' AND p.archived_at IS NULL AND p.linkedin_url IS NOT NULL AND p.do_not_contact = 0 AND ${touchedToday} AND ${notCommentedRecently}
     ORDER BY ${lastComment} IS NOT NULL, ${lastComment}, random() LIMIT ?2`,
  ).bind(date, INFLUENCER_COMMENTS_PER_DAY + 5).all<Candidate>()).results.filter((c) => !busy.has(c.id)).slice(0, limits.influencerComments);
  const influencerConnects = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.segment = 'influencer' AND p.archived_at IS NULL AND p.linkedin_url IS NOT NULL AND p.connection_status = 'none' AND p.do_not_contact = 0 AND ${touchedToday}
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'connect' AND (a.status <> 'skipped' OR a.action_date >= date(?1, '-30 days')))
     ORDER BY p.created_at LIMIT ?2`,
  ).bind(date, INFLUENCER_CONNECTS_PER_DAY + INFLUENCER_COMMENTS_PER_DAY).all<Candidate>()).results
    // One touch per person per day: someone up for a comment today is not also invited today.
    .filter((c) => !busy.has(c.id) && !influencerComments.some((x) => x.id === c.id)).slice(0, Math.min(limits.influencerConnects, limits.connects));
  for (const c of [...prospectComments, ...influencerComments, ...influencerConnects]) busy.add(c.id);

  const pool = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.segment <> 'influencer' AND p.in_kade_scope = 1 AND p.linkedin_url IS NOT NULL AND p.connection_status = 'none' AND p.do_not_contact = 0 AND ${CONTACT_OPEN} AND ${touchedToday}
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
    if (busy.has(c.id)) continue;
    if (connects.length + influencerConnects.length >= limits.connects) break;
    const key = c.kade_account_id ?? c.id;
    if ((perAccount.get(key) ?? 0) >= PER_ACCOUNT_PER_WEEK) continue;
    perAccount.set(key, (perAccount.get(key) ?? 0) + 1);
    connects.push(c);
  }

  // Partners (KADE docs/partners.md): invitations on top of the 9, and check-ins with those she has met.
  // A partner in a conversation (a call booked) can still be checked in with; paused or stopped cannot.
  const partnerConnects = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.partner_type IS NOT NULL AND p.linkedin_url IS NOT NULL AND p.connection_status = 'none' AND p.do_not_contact = 0 AND ${CONTACT_OPEN} AND ${touchedToday}
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'connect' AND (a.status <> 'skipped' OR a.action_date >= date(?1, '-30 days')))
     ORDER BY p.created_at LIMIT ?2`,
  ).bind(date, PARTNER_CONNECTS_PER_DAY + 5).all<Candidate>()).results.filter((c) => !busy.has(c.id)).slice(0, limits.partnerConnects);
  for (const c of partnerConnects) busy.add(c.id);
  const partnerCheckIns = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.partner_type IS NOT NULL AND p.partner_check_in_on IS NOT NULL AND p.partner_check_in_on <= ?1 AND p.connection_status = 'connected'
       AND p.do_not_contact = 0 AND p.contact_state IN ('open', 'in_conversation') AND ${touchedToday}
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'follow_up' AND a.action_date >= date(?1, '-30 days'))
     ORDER BY p.partner_check_in_on LIMIT ?2`,
  ).bind(date, PARTNER_CHECK_INS_PER_DAY + 5).all<Candidate>()).results.filter((c) => !busy.has(c.id)).slice(0, limits.partnerCheckIns);
  for (const c of partnerCheckIns) busy.add(c.id);

  const withdraws = (await env.DB.prepare(
    `SELECT ${COLS} FROM people p
     WHERE p.connection_status = 'pending' AND p.invited_at < date(?1, '-${WITHDRAW_AFTER_DAYS} days')
       AND NOT EXISTS (SELECT 1 FROM actions a WHERE a.person_id = p.id AND a.action_type = 'withdraw_invite')
     ORDER BY p.invited_at LIMIT 5`,
  ).bind(date).all<Candidate>()).results.filter((c) => !busy.has(c.id)).slice(0, limits.withdraws);

  let rank = 0;
  for (const c of followUps) await addAction(env, date, ++rank, "follow_up", c);
  for (const c of [...prospectComments, ...influencerComments]) await addAction(env, date, ++rank, "comment", c);
  const reshares = await addReshare(env, date, ++rank);
  for (const c of [...connects, ...influencerConnects]) await addAction(env, date, ++rank, "connect", c);
  for (const c of partnerCheckIns) await addAction(env, date, ++rank, "follow_up", c, true);
  for (const c of partnerConnects) await addAction(env, date, ++rank, "connect", c);
  for (const c of withdraws) await addAction(env, date, ++rank, "withdraw_invite", c);
  return { date, skipped: false, carried: carriedRows.length, expired: expired.meta.changes ?? 0, followUps: followUps.length, comments: prospectComments.length + influencerComments.length, reshares,
    connects: connects.length + influencerConnects.length, withdraws: withdraws.length, partnerConnects: partnerConnects.length, partnerCheckIns: partnerCheckIns.length };
}
