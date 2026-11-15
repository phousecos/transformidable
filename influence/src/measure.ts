/**
 * Measurement (KADE docs/influence-measurement.md; owner, November 14, 2026): the baseline, the weekly trends, the
 * 90-day pilot against her plan's targets, the monthly review, the Friday upload reminder and the monthly email.
 * LinkedIn's numbers come from her weekly upload; engagement from Signals' contact history; ideas and posts from here.
 */
import { engagementLog, notifyOwner, type Engagement } from "./kade";
import { networkView, type NetworkEnv } from "./network";

export interface MeasureSettings {
  startDate: string; baselineWeeks: number; reminderHourNY: number;
  pilot: Record<"researched" | "tier1" | "tier2" | "comments" | "connections" | "recurring" | "ideas" | "collaborations", [number, number]>;
}

export async function measureSettings(env: NetworkEnv): Promise<MeasureSettings> {
  const row = await env.DB.prepare("SELECT value_json FROM settings WHERE key = 'measure'").first<{ value_json: string }>();
  if (!row) throw new Error("Influence measure settings are missing");
  return JSON.parse(row.value_json);
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const at = (d: string) => Date.parse(`${d}T12:00:00Z`);
/** The Monday of a date's week. */
export const mondayOf = (d: string) => { const t = at(d); const w = new Date(t).getUTCDay(); return iso(t - ((w + 6) % 7) * DAY); };
const addDays = (d: string, n: number) => iso(at(d) + n * DAY);

/** New York's date and hour now. */
export function nyNow(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short" })
    .formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday as string };
}

const APPROACH_LABELS: Record<string, string> = { research_extension: "research extension", governance_lens: "governance lens", constructive_challenge: "constructive challenge", executive_translation: "executive translation" };

export const RECURRING_OR_MORE = ["recurring", "connected", "dialogue", "collaboration", "active"];

interface Week { week: string; impressions: number | null; engagements: number | null; newFollowers: number | null; days: number; comments: number; people: number; responses: number; connections: number; ideas: number; posts: number }

async function allIds(env: NetworkEnv) {
  return (await env.DB.prepare("SELECT person_id, full_name, community, tier, status FROM network").all<{ person_id: string; full_name: string; community: string | null; tier: number | null; status: string }>()).results;
}

/** Weeks (Monday to Sunday) from `from` through the week of `to`, each with every measure. */
export async function weeks(env: NetworkEnv, from: string, to: string, log: Engagement[]): Promise<Week[]> {
  const [daily, ideas, posts] = await Promise.all([
    env.DB.prepare("SELECT day, impressions, engagements, new_followers FROM li_daily WHERE account = 'profile' AND day >= ?1 AND day <= ?2").bind(from, addDays(to, 6))
      .all<{ day: string; impressions: number | null; engagements: number | null; new_followers: number | null }>(),
    env.DB.prepare("SELECT substr(created_at, 1, 10) AS day FROM ideas WHERE status <> 'dropped' AND created_at >= ?1").bind(from).all<{ day: string }>(),
    env.DB.prepare("SELECT substr(sent_at, 1, 10) AS day FROM review_queue WHERE status = 'sent' AND item_type IN ('post_page', 'post_profile', 'short_video') AND sent_at >= ?1").bind(from).all<{ day: string }>(),
  ]);
  const out: Week[] = [];
  for (let w = mondayOf(from); w <= mondayOf(to); w = addDays(w, 7)) {
    const end = addDays(w, 6), inWeek = (d: string) => d >= w && d <= end;
    const ds = daily.results.filter((d) => inWeek(d.day));
    const sum = (k: "impressions" | "engagements" | "new_followers") => (ds.some((d) => d[k] != null) ? ds.reduce((n, d) => n + (d[k] ?? 0), 0) : null);
    const lw = log.filter((x) => inWeek(x.occurred_at.slice(0, 10)));
    const comments = lw.filter((x) => x.kind === "comment");
    out.push({
      week: w, impressions: sum("impressions"), engagements: sum("engagements"), newFollowers: sum("new_followers"), days: ds.length,
      comments: comments.length, people: new Set(comments.map((c) => c.person_id)).size, responses: lw.filter((x) => x.kind === "reply").length,
      connections: lw.filter((x) => x.kind === "connect_accepted").length,
      ideas: ideas.results.filter((x) => inWeek(x.day)).length, posts: posts.results.filter((x) => inWeek(x.day)).length,
    });
  }
  return out;
}

/** The baseline: the full weeks before the start date if LinkedIn's export covers them, else the first weeks after it. */
export function baseline(all: Week[], s: MeasureSettings) {
  const start = mondayOf(s.startDate);
  const covered = (w: Week) => w.days >= 5;
  const before = all.filter((w) => w.week < start && covered(w)).slice(-s.baselineWeeks);
  const after = all.filter((w) => w.week >= start && covered(w) && addDays(w.week, 6) < nyNow().date).slice(0, s.baselineWeeks);
  const use = before.length >= s.baselineWeeks ? before : after.length >= s.baselineWeeks ? after : [];
  if (!use.length) return null;
  const avg = (k: keyof Week) => Math.round((use.reduce((n, w) => n + Number(w[k] ?? 0), 0) / use.length) * 10) / 10;
  return { weeks: use.map((w) => w.week), from: before === use ? "before the start" : "the first weeks", impressions: avg("impressions"), engagements: avg("engagements"), newFollowers: avg("newFollowers"), comments: avg("comments") };
}

/** The Review tab: latest numbers, baseline, weekly trends, the 90-day pilot and the month's review. */
export async function reviewView(env: NetworkEnv, month?: string) {
  const s = await measureSettings(env);
  const today = nyNow().date;
  const people = await allIds(env);
  const from = addDays(mondayOf(today), -7 * 11);
  const pilotStart = s.startDate;
  const sinceAll = [from, pilotStart, `${(month ?? previousMonth(today))}-01`].sort()[0];
  const log = people.length ? await engagementLog(env, people.map((p) => p.person_id), sinceAll) : [];
  const ws = await weeks(env, from, today, log);
  const [lastUpload, followers, view, researched, ideasSince] = await Promise.all([
    env.DB.prepare("SELECT period_start, period_end, uploaded_at, profile_views, search_appearances, file_name FROM li_uploads ORDER BY uploaded_at DESC LIMIT 1").first<Record<string, unknown>>(),
    env.DB.prepare("SELECT day, total FROM li_followers WHERE account = 'profile' ORDER BY day DESC LIMIT 2").all<{ day: string; total: number }>(),
    networkView(env),
    env.DB.prepare("SELECT COUNT(*) AS n FROM network WHERE scored_at IS NOT NULL").first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM ideas WHERE status <> 'dropped' AND created_at >= ?1").bind(pilotStart).first<{ n: number }>(),
  ]);
  const since = log.filter((x) => x.occurred_at.slice(0, 10) >= pilotStart);
  const day = Math.max(0, Math.floor((at(today) - at(pilotStart)) / DAY) + 1);
  const pilot = {
    start: pilotStart, day: Math.min(day, 90), ended: day > 90,
    measures: ([
      ["People researched", researched?.n ?? 0, s.pilot.researched],
      ["Tier 1 (core)", view.people.filter((p) => p.tier === 1).length, s.pilot.tier1],
      ["Tier 2 (strategic)", view.people.filter((p) => p.tier === 2).length, s.pilot.tier2],
      ["Comments", since.filter((x) => x.kind === "comment").length, s.pilot.comments],
      ["Relevant connections", since.filter((x) => x.kind === "connect_accepted").length, s.pilot.connections],
      ["In recurring engagement or beyond", view.people.filter((p) => RECURRING_OR_MORE.includes(p.stage)).length, s.pilot.recurring],
      ["Ideas", ideasSince?.n ?? 0, s.pilot.ideas],
      ["Collaboration openings", view.people.filter((p) => p.stage === "collaboration" || p.stage === "active").length, s.pilot.collaborations],
    ] as [string, number, [number, number]][]).map(([label, value, target]) => ({ label, value, target })),
  };
  const m = month && /^\d{4}-\d{2}$/.test(month) ? month : previousMonth(today);
  return {
    today, lastUpload, followers: followers.results[0] ?? null, baseline: baseline(ws, s), weeks: ws.slice(-8).reverse(), pilot,
    review: await monthReview(env, m, log, people, view), reminderHourNY: s.reminderHourNY,
  };
}

export function previousMonth(today: string) {
  const [y, mo] = today.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}
const nextMonth = (m: string) => { const [y, mo] = m.split("-").map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`; };

type People = Awaited<ReturnType<typeof allIds>>;
type View = Awaited<ReturnType<typeof networkView>>;

export async function monthReview(env: NetworkEnv, month: string, log: Engagement[], people: People, view: View) {
  const a = `${month}-01`, b = `${nextMonth(month)}-01`;
  const inMonth = log.filter((x) => x.occurred_at.slice(0, 10) >= a && x.occurred_at.slice(0, 10) < b);
  const byPerson = new Map(people.map((p) => [p.person_id, p]));
  const comments = inMonth.filter((x) => x.kind === "comment");
  const replies = inMonth.filter((x) => x.kind === "reply");
  const responded = (c: Engagement) => log.some((x) => x.kind === "reply" && x.person_id === c.person_id && x.occurred_at >= c.occurred_at && Date.parse(x.occurred_at) - Date.parse(c.occurred_at) <= 14 * DAY);
  const tally = new Map<string, { name: string; comments: number; replies: number }>();
  for (const x of [...comments, ...replies]) {
    const t = tally.get(x.person_id) ?? { name: byPerson.get(x.person_id)?.full_name ?? "", comments: 0, replies: 0 };
    if (x.kind === "comment") t.comments++; else t.replies++;
    tally.set(x.person_id, t);
  }
  const group = <K extends string>(key: (c: Engagement) => K | null) => {
    const g = new Map<K, { comments: number; responded: number }>();
    for (const c of comments) { const k = key(c); if (!k) continue; const v = g.get(k) ?? { comments: 0, responded: 0 }; v.comments++; if (responded(c)) v.responded++; g.set(k, v); }
    return [...g.entries()].map(([k, v]) => ({ key: k, ...v })).sort((x, y) => y.responded - x.responded || y.comments - x.comments);
  };
  const [ideasUsed, changes, linkedin, audience, notes] = await Promise.all([
    env.DB.prepare(`SELECT i.title, q.title AS post_title, q.due_date FROM ideas i JOIN review_queue q ON q.id = i.used_in WHERE q.due_date >= ?1 AND q.due_date < ?2 ORDER BY q.due_date`).bind(a, b)
      .all<{ title: string; post_title: string; due_date: string }>(),
    env.DB.prepare("SELECT full_name, from_tier, to_tier, change, by, at FROM tier_changes WHERE at >= ?1 AND at < ?2 ORDER BY at").bind(a, b)
      .all<{ full_name: string; from_tier: number | null; to_tier: number | null; change: string; by: string | null; at: string }>(),
    env.DB.prepare("SELECT SUM(impressions) AS impressions, SUM(engagements) AS engagements, SUM(new_followers) AS new_followers, COUNT(*) AS days FROM li_daily WHERE account = 'profile' AND day >= ?1 AND day < ?2").bind(a, b)
      .first<{ impressions: number | null; engagements: number | null; new_followers: number | null; days: number }>(),
    env.DB.prepare("SELECT category, value, pct FROM li_demographics WHERE account = 'profile' AND category IN ('Seniority', 'Industry', 'Job title') ORDER BY category, pct DESC").all<{ category: string; value: string; pct: number | null }>(),
    env.DB.prepare("SELECT notes FROM reviews WHERE month = ?1").bind(month).first<{ notes: string | null }>(),
  ]);
  return {
    month,
    linkedin,
    discussions: [...tally.values()].sort((x, y) => y.replies - x.replies || y.comments - x.comments).slice(0, 8),
    byCommunity: group((c) => byPerson.get(c.person_id)?.community ?? "unassigned"),
    byApproach: group((c) => (typeof c.detail?.approach === "string" ? c.detail.approach : null)),
    recurring: view.people.filter((p) => RECURRING_OR_MORE.includes(p.stage)).map((p) => ({ name: p.full_name, stage: p.stage, tier: p.tier })),
    topics: comments.map((c) => (typeof c.detail?.topic === "string" ? c.detail.topic : "")).filter(Boolean),
    ideasUsed: ideasUsed.results, tierChanges: changes.results, audience: audience.results,
    notes: notes?.notes ?? "",
  };
}

export async function saveReviewNotes(env: NetworkEnv, month: string, notes: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("month must be YYYY-MM");
  await env.DB.prepare("INSERT INTO reviews (month, notes) VALUES (?1, ?2) ON CONFLICT (month) DO UPDATE SET notes = excluded.notes, updated_at = CURRENT_TIMESTAMP")
    .bind(month, notes.slice(0, 5000)).run();
  return { ok: true };
}

/** Friday at the reminder hour: if nothing has been uploaded since Monday, an email to her. Once a week. */
export async function remindUpload(env: NetworkEnv & { SITE_URL?: string }, now = new Date()) {
  const s = await measureSettings(env);
  const ny = nyNow(now);
  if (ny.weekday !== "Fri" || ny.hour !== s.reminderHourNY) return { skipped: "not the reminder hour" };
  const monday = mondayOf(ny.date);
  const state = JSON.parse((await env.DB.prepare("SELECT value_json FROM settings WHERE key = 'measure_state'").first<{ value_json: string }>())?.value_json ?? "{}");
  if (state.remindedWeek === monday) return { skipped: "already reminded" };
  const up = await env.DB.prepare("SELECT 1 FROM li_uploads WHERE uploaded_at >= ?1").bind(monday).first();
  if (!up) {
    await notifyOwner(env, "Influence: upload this week's LinkedIn analytics", [
      "It's Friday: time to upload this week's LinkedIn analytics export.",
      "",
      "1. On LinkedIn, open your profile's Analytics, set the range to the past 28 days, and click Export.",
      "2. In Influence, open Review and upload the .xlsx file.",
      "",
      "https://influence.kadeanalytics.com/#review",
    ].join("\n"));
  }
  await env.DB.prepare("UPDATE settings SET value_json = json_set(value_json, '$.remindedWeek', ?1) WHERE key = 'measure_state'").bind(monday).run();
  return { reminded: !up };
}

/** The first Monday of the month, at 7 New York: last month's review in brief, with a link. Once a month. */
export async function monthlyEmail(env: NetworkEnv, now = new Date()) {
  const ny = nyNow(now);
  if (ny.weekday !== "Mon" || Number(ny.date.slice(8)) > 7 || ny.hour !== 7) return { skipped: "not the first Monday at 7" };
  const month = previousMonth(ny.date);
  const done = await env.DB.prepare("SELECT emailed_at FROM reviews WHERE month = ?1").bind(month).first<{ emailed_at: string | null }>();
  if (done?.emailed_at) return { skipped: "already sent" };
  const v = await reviewView(env, month);
  const r = v.review;
  const n = (x: number | null | undefined) => (x == null ? "not uploaded" : String(x));
  // No audience demographics here: they name employers and stay on the private Review tab.
  const body = [
    `Your Influence review for ${month}.`,
    "",
    `LinkedIn: ${n(r.linkedin?.impressions)} impressions, ${n(r.linkedin?.engagements)} engagements, ${n(r.linkedin?.new_followers)} new followers (${r.linkedin?.days ?? 0} days uploaded).`,
    `Comments: ${r.topics.length}. Author responses: ${r.discussions.reduce((s, d) => s + d.replies, 0)}.`,
    r.discussions.length ? `Most discussion: ${r.discussions.slice(0, 3).map((d) => `${d.name} (${d.replies} responses, ${d.comments} comments)`).join("; ")}.` : null,
    r.byApproach.length ? `Comment approaches (responses of comments): ${r.byApproach.map((a) => `${APPROACH_LABELS[a.key] ?? a.key} ${a.responded} of ${a.comments}`).join("; ")}.` : null,
    `In recurring engagement or beyond: ${r.recurring.length}.`,
    `Ideas that became posts: ${r.ideasUsed.length}. Tier changes: ${r.tierChanges.length}.`,
    "",
    `90-day pilot, day ${v.pilot.day}: ${v.pilot.measures.map((m) => `${m.label} ${m.value} (target ${m.target[0] === m.target[1] ? m.target[0] : `${m.target[0]} to ${m.target[1]}`})`).join("; ")}.`,
    "",
    "The full review, and the place to note what to change: https://influence.kadeanalytics.com/#review",
  ].filter((x) => x !== null).join("\n");
  await notifyOwner(env, `Influence: your ${month} review`, body);
  await env.DB.prepare("INSERT INTO reviews (month, emailed_at) VALUES (?1, CURRENT_TIMESTAMP) ON CONFLICT (month) DO UPDATE SET emailed_at = CURRENT_TIMESTAMP").bind(month).run();
  return { sent: month };
}
