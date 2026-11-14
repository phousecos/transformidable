/**
 * The review page's API. Every route needs a signed-in person (auth.ts); whoever marks an
 * action done or decides a research request is recorded as its approver.
 */
import { AuthError, signedInEmail, type AuthEnv } from "./auth";
import { buildPosts, buildShortVideo, weekOf, type ContentEnv } from "./content";
import { draft, type DraftKind } from "./claude";
import { buildToday, firstName, todayET, type DailyEnv } from "./daily";
import { addPartner as kadeAddPartner, events as kadeEvents, KadeError, kadeOrgUrl, results as kadeResults, weekPlan, type KadeWeekPlan, type PartnerAdd } from "./kade";
import { syncPartners } from "./sync";
import { flushTouches, KIND_BY_ACTION, OUTCOMES, touchStatement } from "./contact";
import { PAGE } from "./page";
import { alreadyConnected, importConnections } from "./connections";

export interface ApiEnv extends DailyEnv, ContentEnv, AuthEnv {}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function today(env: ApiEnv, date: string) {
  const actions = await env.DB.prepare(
    `SELECT a.id, a.action_date, a.rank, a.action_type, a.status, a.reason, a.target_url, a.done_at,
       p.id AS person_id, p.full_name, p.title, p.organization, p.kade_account_id, p.kade_tier, p.kade_heat, p.pursued, p.connection_status, p.contact_state, p.paused_until,
       p.segment, p.partner_type, q.id AS queue_id, COALESCE(q.final_text, q.draft) AS text, q.draft, json_extract(q.context_json, '$.drafted_by') AS drafted_by,
       json_extract(q.context_json, '$.post_title') AS post_title, json_extract(q.context_json, '$.post_text') AS post_text
     FROM actions a LEFT JOIN people p ON p.id = a.person_id LEFT JOIN review_queue q ON q.id = a.queue_id
     WHERE a.action_date = ?1 ORDER BY a.rank`,
  ).bind(date).all();
  const pending = await env.DB.prepare(
    `SELECT id AS person_id, full_name, title, organization, linkedin_url, invited_at FROM people
     WHERE connection_status = 'pending' ORDER BY invited_at DESC LIMIT 100`,
  ).all();
  // People to record a reply or meeting for: in a conversation, or connected in the last 60 days.
  const contacts = await env.DB.prepare(
    `SELECT id AS person_id, full_name, title, organization, linkedin_url, connection_status, connected_at, contact_state, paused_until, kade_account_id FROM people
     WHERE contact_state = 'in_conversation' OR (connection_status = 'connected' AND connected_at >= date('now', '-60 days') AND contact_state = 'open')
     ORDER BY contact_state = 'in_conversation' DESC, connected_at DESC LIMIT 100`,
  ).all<{ kade_account_id: string | null }>();
  const unsent = await env.DB.prepare("SELECT COUNT(*) AS n FROM touches WHERE kade_sent_at IS NULL AND kade_kind IS NOT NULL").first<{ n: number }>();
  const openGaps = await env.DB.prepare("SELECT COUNT(*) AS n FROM research_gaps WHERE status = 'open'").first<{ n: number }>();
  const monday = weekOf(date);
  const posts = await env.DB.prepare(
    `SELECT id, item_type, channel, title, COALESCE(final_text, draft) AS text, context_json, status, due_date, approved_by, sent_at
     FROM review_queue WHERE system = 'media' AND item_type IN ('post_page', 'post_profile', 'short_video') AND due_date BETWEEN ?1 AND date(?1, '+20 days')
     ORDER BY due_date`,
  ).bind(monday).all<{ context_json: string | null }>();
  return {
    date,
    actions: actions.results.map((a) => ({ ...a, kade_url: a.kade_account_id ? kadeOrgUrl(env, String(a.kade_account_id)) : null })),
    pending: pending.results,
    contacts: contacts.results.map((p) => ({ ...p, kade_url: p.kade_account_id ? kadeOrgUrl(env, p.kade_account_id) : null })),
    unsentToKade: unsent?.n ?? 0,
    openGaps: openGaps?.n ?? 0,
    week: monday,
    posts: posts.results.map(({ context_json, ...p }) => ({ ...p, context: context_json ? JSON.parse(context_json) : {} })),
  };
}

async function completeAction(env: ApiEnv, id: string, who: string, body: { status?: string; text?: string }) {
  if (body.status !== "done" && body.status !== "skipped") return json({ error: "status must be done or skipped" }, 422);
  const a = await env.DB.prepare("SELECT id, action_type, person_id, queue_id, status FROM actions WHERE id = ?1").bind(id)
    .first<{ id: string; action_type: string; person_id: string | null; queue_id: string | null; status: string }>();
  if (!a) return json({ error: "No such action" }, 404);
  if (a.status !== "todo") return json({ error: `Already ${a.status}` }, 409);
  const now = new Date().toISOString();
  const done = body.status === "done";
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare("UPDATE actions SET status = ?2, done_at = ?3, outcome = ?4 WHERE id = ?1").bind(id, body.status, now, `${body.status} by ${who}`),
  ];
  if (a.queue_id) {
    const q = await env.DB.prepare("SELECT draft FROM review_queue WHERE id = ?1").bind(a.queue_id).first<{ draft: string }>();
    const text = typeof body.text === "string" && body.text.trim() ? body.text.trim() : q?.draft ?? null;
    stmts.push(env.DB.prepare(
      `UPDATE review_queue SET final_text = ?2, status = ?3, approved_by = ?4, approved_at = ?5, sent_at = ?6, updated_at = ?5 WHERE id = ?1`,
    ).bind(a.queue_id, text, done ? "sent" : "rejected", who, now, done ? now : null));
  }
  const touchId = crypto.randomUUID();
  if (done) {
    // Recorded here first, then on the person in KADE (contact.ts).
    // A reshare is of your own post: no person, so nothing for a contact history.
    if (a.person_id) stmts.push(touchStatement(env.DB, { id: touchId, personId: a.person_id, kind: KIND_BY_ACTION[a.action_type] ?? a.action_type, queueId: a.queue_id, at: now, by: who }));
    if (a.action_type === "connect") stmts.push(env.DB.prepare("UPDATE people SET connection_status = 'pending', invited_at = ?2, updated_at = ?2 WHERE id = ?1").bind(a.person_id, now));
    if (a.action_type === "withdraw_invite") stmts.push(env.DB.prepare("UPDATE people SET connection_status = 'withdrawn', updated_at = ?2 WHERE id = ?1").bind(a.person_id, now));
  }
  await env.DB.batch(stmts);
  const kade = done && a.person_id ? await flushTouches(env, [touchId]).catch((e) => ({ sent: 0, failed: 1, waiting: 1, error: String(e) })) : null;
  return json({ ok: true, kade });
}

/** The draft kind for each action on the list. */
const KIND_FOR: Record<string, DraftKind> = { connect: "connection_note", follow_up: "follow_up", comment: "comment", reshare: "reshare_intro" };

/** Re-asks Claude for any draft on the list (a note, a follow-up, a comment, a reshare intro). */
async function redraft(env: ApiEnv, actionId: string) {
  const a = await env.DB.prepare(
    `SELECT a.action_type, a.status, q.id AS queue_id, q.context_json, p.full_name, p.title, p.organization, p.kade_summary, p.segment
     FROM actions a LEFT JOIN people p ON p.id = a.person_id JOIN review_queue q ON q.id = a.queue_id WHERE a.id = ?1`,
  ).bind(actionId).first<{ action_type: string; status: string; queue_id: string; context_json: string | null; full_name: string | null; title: string | null; organization: string | null; kade_summary: string | null; segment: string | null }>();
  if (!a) return json({ error: "No such action with a draft" }, 404);
  if (a.status !== "todo") return json({ error: `Already ${a.status}` }, 409);
  const prior = a.context_json ? JSON.parse(a.context_json) as Record<string, unknown> : {};
  // A partner's note, call ask or check-in is redrafted as what it was (KADE docs/partners.md).
  const kind = (typeof prior.draft_kind === "string" ? prior.draft_kind as DraftKind : null) ?? KIND_FOR[a.action_type];
  if (!kind) return json({ error: "Nothing to draft for this action" }, 422);
  const d = await draft(env, kind, { firstName: a.full_name ? firstName(a.full_name) : "Jerri", title: a.title, organization: a.organization,
    context: a.segment === "influencer" ? null : a.kade_summary, post: typeof prior.post_text === "string" ? prior.post_text : null });
  if (d.by === "template") return json({ error: `Claude did not draft it: ${d.error ?? "unknown"}` }, 502);
  const ctx = { ...prior, drafted_by: d.by, draft_error: null };
  await env.DB.prepare("UPDATE review_queue SET draft = ?2, final_text = NULL, context_json = ?3, created_by_agent = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?1")
    .bind(a.queue_id, d.text, JSON.stringify(ctx), `engagement-engine:${d.by}`).run();
  return json({ ok: true, text: d.text });
}

/** A comment: the person pasted the post; Claude drafts the comment, kept on the action for review. */
async function draftComment(env: ApiEnv, actionId: string, body: { postText?: string }) {
  const post = typeof body.postText === "string" ? body.postText.trim() : "";
  if (post.length < 20) return json({ error: "Paste the post's text first" }, 422);
  const a = await env.DB.prepare(
    `SELECT a.id, a.status, a.queue_id, a.action_date, p.id AS person_id, p.full_name, p.title, p.organization, p.kade_summary, p.segment
     FROM actions a JOIN people p ON p.id = a.person_id WHERE a.id = ?1 AND a.action_type = 'comment'`,
  ).bind(actionId).first<{ id: string; status: string; queue_id: string | null; action_date: string; person_id: string; full_name: string; title: string | null; organization: string | null; kade_summary: string | null; segment: string }>();
  if (!a) return json({ error: "No such comment" }, 404);
  if (a.status !== "todo") return json({ error: `Already ${a.status}` }, 409);
  const d = await draft(env, "comment", { firstName: firstName(a.full_name), title: a.title, organization: a.organization,
    context: a.segment === "influencer" ? null : a.kade_summary, post });
  const ctx = JSON.stringify({ post_text: post.slice(0, 6000), drafted_by: d.by, draft_error: d.error ?? null });
  if (a.queue_id) {
    await env.DB.prepare("UPDATE review_queue SET draft = ?2, final_text = NULL, context_json = ?3, created_by_agent = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?1")
      .bind(a.queue_id, d.text, ctx, `engagement-engine:${d.by}`).run();
  } else {
    const queueId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO review_queue (id, system, item_type, channel, person_id, title, draft, context_json, created_by_agent, due_date)
         VALUES (?1, ?2, 'comment', 'linkedin', ?3, ?4, ?5, ?6, ?7, ?8)`,
      ).bind(queueId, a.segment === "influencer" ? "media" : "advisory", a.person_id, `${a.full_name}, ${a.organization ?? ""}`, d.text, ctx, `engagement-engine:${d.by}`, a.action_date),
      env.DB.prepare("UPDATE actions SET queue_id = ?2 WHERE id = ?1").bind(a.id, queueId),
    ]);
  }
  return json({ ok: true, text: d.text, drafted_by: d.by, error: d.error ?? null });
}

/** Partners (KADE docs/partners.md): as the morning sync brought them, with where each stands. */
async function partnerList(env: ApiEnv) {
  const rows = await env.DB.prepare(
    `SELECT id, full_name, title, organization, linkedin_url, connection_status, partner_type, partner_stage, partner_check_in_on
     FROM people WHERE partner_type IS NOT NULL ORDER BY CASE partner_stage WHEN 'referring' THEN 0 WHEN 'met' THEN 1 WHEN 'talking' THEN 2 WHEN 'connected' THEN 3 WHEN 'invited' THEN 4 ELSE 5 END, full_name`,
  ).all();
  return json({ partners: rows.results });
}
/** Adds a partner in KADE (one record per person), then brings KADE's list here at once. */
async function addPartnerHere(env: ApiEnv, body: Partial<PartnerAdd>) {
  if (typeof body.linkedinUrl !== "string" || typeof body.name !== "string" || typeof body.type !== "string") return json({ error: "Name, LinkedIn profile address and kind are required" }, 422);
  try {
    const r = await kadeAddPartner(env, { linkedinUrl: body.linkedinUrl, name: body.name, title: body.title ?? null, firm: body.firm ?? null, type: body.type, note: body.note ?? null });
    await syncPartners(env);
    return json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof KadeError && e.status === 422) return json({ error: e.message }, 422);
    return json({ error: `Could not add the partner in KADE: ${(e as Error).message}` }, 502);
  }
}

/** The influencer list (owner, November 12, 2026): people added by LinkedIn URL who join the comment rotation. */
async function influencers(env: ApiEnv) {
  const rows = await env.DB.prepare(
    `SELECT id, full_name, title, organization, linkedin_url, connection_status, note,
       (SELECT MAX(a.action_date) FROM actions a WHERE a.person_id = people.id AND a.action_type = 'comment' AND a.status = 'done') AS last_comment
     FROM people WHERE segment = 'influencer' AND archived_at IS NULL ORDER BY full_name`,
  ).all();
  return json({ influencers: rows.results });
}
const LINKEDIN_PROFILE = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/;
async function addInfluencer(env: ApiEnv, who: string, body: Record<string, string>) {
  const name = (body.name ?? "").trim();
  const url = (body.linkedinUrl ?? "").trim().replace(/[?#].*$/, "").replace(/^http:/, "https:");
  if (!name) return json({ error: "Enter a name" }, 422);
  if (!LINKEDIN_PROFILE.test(url)) return json({ error: "Enter a LinkedIn profile address, like https://www.linkedin.com/in/name" }, 422);
  const existing = await env.DB.prepare("SELECT id, archived_at FROM people WHERE linkedin_url = ?1 OR linkedin_url = ?2").bind(url, url.replace(/\/$/, "")).first<{ id: string; archived_at: string | null }>();
  if (existing && !existing.archived_at) return json({ error: "Already on your list or in KADE's people" }, 409);
  const now = new Date().toISOString();
  if (existing) {
    await env.DB.prepare("UPDATE people SET archived_at = NULL, segment = 'influencer', full_name = ?2, updated_at = ?3 WHERE id = ?1").bind(existing.id, name, now).run();
    return json({ ok: true, id: existing.id });
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO people (id, full_name, title, organization, segment, linkedin_url, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 'influencer', ?5, ?6, ?7, ?7)`,
  ).bind(id, name, (body.title ?? "").trim() || null, (body.organization ?? "").trim() || null, url, `added by ${who}`, now).run();
  return json({ ok: true, id });
}
async function removeInfluencer(env: ApiEnv, id: string) {
  const r = await env.DB.prepare("UPDATE people SET archived_at = ?2, updated_at = ?2 WHERE id = ?1 AND segment = 'influencer' AND archived_at IS NULL").bind(id, new Date().toISOString()).run();
  return (r.meta.changes ?? 0) ? json({ ok: true }) : json({ error: "Not on your list" }, 404);
}

async function completePost(env: ApiEnv, id: string, who: string, body: { status?: string; text?: string }) {
  if (body.status !== "posted" && body.status !== "skipped") return json({ error: "status must be posted or skipped" }, 422);
  const q = await env.DB.prepare("SELECT draft, status FROM review_queue WHERE id = ?1 AND system = 'media'").bind(id).first<{ draft: string; status: string }>();
  if (!q) return json({ error: "No such post" }, 404);
  if (q.status !== "proposed") return json({ error: `Already ${q.status}` }, 409);
  const now = new Date().toISOString();
  const text = typeof body.text === "string" && body.text.trim() ? body.text.trim() : q.draft;
  const posted = body.status === "posted";
  await env.DB.prepare("UPDATE review_queue SET final_text = ?2, status = ?3, approved_by = ?4, approved_at = ?5, sent_at = ?6, updated_at = ?5 WHERE id = ?1")
    .bind(id, text, posted ? "sent" : "rejected", who, now, posted ? now : null).run();
  return json({ ok: true });
}

async function markConnected(env: ApiEnv, personId: string, who: string) {
  const now = new Date().toISOString();
  const r = await env.DB.prepare("UPDATE people SET connection_status = 'connected', connected_at = ?2, updated_at = ?2 WHERE id = ?1 AND connection_status = 'pending'")
    .bind(personId, now).run();
  if (!(r.meta.changes ?? 0)) return json({ error: "Not a pending invite" }, 409);
  const touchId = crypto.randomUUID();
  await touchStatement(env.DB, { id: touchId, personId, kind: "connect_accepted", at: now, by: who }).run();
  return json({ ok: true, kade: await flushTouches(env, [touchId]).catch((e) => ({ error: String(e) })) });
}

/**
 * A reply, a meeting, not interested, asked to stop, or a closed conversation. Recorded on the person
 * in KADE, which decides what it means everywhere; here, the person's open suggestions are skipped.
 */
async function recordOutcome(env: ApiEnv, personId: string, who: string, body: { kind?: string; note?: string }) {
  const outcome = body.kind ? OUTCOMES[body.kind] : undefined;
  if (!outcome || !body.kind) return json({ error: `kind must be one of ${Object.keys(OUTCOMES).join(", ")}` }, 422);
  const person = await env.DB.prepare("SELECT id FROM people WHERE id = ?1").bind(personId).first();
  if (!person) return json({ error: "No such person" }, 404);
  const now = new Date().toISOString();
  const touchId = crypto.randomUUID();
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  await env.DB.batch([
    touchStatement(env.DB, { id: touchId, personId, kind: body.kind, at: now, by: who, note }),
    ...(outcome.state === null ? [] : [env.DB.prepare(`UPDATE people SET contact_state = ?2, paused_until = CASE WHEN ?2 = 'paused' THEN date('now', '+365 days') ELSE NULL END,
       do_not_contact = CASE WHEN ?2 = 'stopped' THEN 1 ELSE do_not_contact END, updated_at = ?3 WHERE id = ?1`).bind(personId, outcome.state, now)]),
    // Today's open suggestions for them no longer apply (a closed conversation or a referral leaves them as they are).
    ...(body.kind === "conversation_closed" || outcome.state === null ? [] : [env.DB.prepare("UPDATE actions SET status = 'skipped', done_at = ?2, outcome = ?3 WHERE person_id = ?1 AND status = 'todo'")
      .bind(personId, now, `${outcome.label} (recorded by ${who})`)]),
  ]);
  return json({ ok: true, kade: await flushTouches(env, [touchId]).catch((e) => ({ error: String(e) })) });
}

/** LinkedIn's own numbers, typed in weekly (LinkedIn shares no analytics with outside tools). */
const LINKEDIN_STATS = ["followers_profile", "followers_page", "impressions_profile", "impressions_page", "profile_views"];
const WEEKS = 8;

/** Results: outreach from KADE (counted there), posts from the review queue, LinkedIn numbers from `results`. */
/** This week: KADE's weekly plan, plus what only this list holds (this week's posts, the LinkedIn numbers entered). */
async function weekView(env: ApiEnv) {
  const [kade, posts, linkedin, kev] = await Promise.all([
    weekPlan(env).then((r) => r.plan).catch((e) => ({ error: String(e).slice(0, 300) })),
    env.DB.prepare(
      `SELECT id, title, channel, item_type, status, due_date FROM review_queue
       WHERE system = 'media' AND item_type IN ('post_page', 'post_profile', 'short_video') AND due_date >= date('now', '-6 days', 'weekday 1') AND due_date < date('now', '-6 days', 'weekday 1', '+7 days')
       ORDER BY due_date`,
    ).all<{ id: string; title: string | null; channel: string | null; item_type: string; status: string; due_date: string | null }>(),
    env.DB.prepare("SELECT MAX(metric_date) AS week FROM results WHERE source = 'linkedin' AND system = 'media'").first<{ week: string | null }>(),
    kadeEvents(env).catch((e) => ({ error: String(e).slice(0, 300) })),
  ]);
  const plan = kade && !("error" in kade) ? {
    ...(kade as KadeWeekPlan),
    decide: { pursuits: (kade as KadeWeekPlan).decide.pursuits.map((p) => ({ ...p, kade_url: kadeOrgUrl(env, p.organizationId) })) },
    conversations: (kade as KadeWeekPlan).conversations.map((c) => ({ ...c, kade_url: new URL(`/#person/${encodeURIComponent(c.personId)}`, env.KADE_API_URL).toString() })),
  } : kade;
  return { plan, posts: posts.results, linkedinLastEntered: linkedin?.week ?? null, events: kev, kadeEventsUrl: new URL("/#events", env.KADE_API_URL).toString() };
}

async function resultsView(env: ApiEnv) {
  const [kade, posts, linkedin] = await Promise.all([
    kadeResults(env, WEEKS).catch((e) => ({ error: String(e).slice(0, 300) })),
    env.DB.prepare(
      `SELECT date(sent_at, '-6 days', 'weekday 1') AS week, channel, COUNT(*) AS n FROM review_queue
       WHERE system = 'media' AND item_type IN ('post_page', 'post_profile') AND status = 'sent' AND sent_at >= date('now', '-63 days')
       GROUP BY week, channel`,
    ).all<{ week: string; channel: string; n: number }>(),
    env.DB.prepare(
      `SELECT metric_date AS week, metric, value FROM results WHERE source = 'linkedin' AND system = 'media' AND metric_date >= date('now', '-63 days')`,
    ).all<{ week: string; metric: string; value: number }>(),
  ]);
  return { kade, posts: posts.results, linkedin: linkedin.results, stats: LINKEDIN_STATS };
}

async function saveLinkedinStats(env: ApiEnv, who: string, body: Record<string, unknown>) {
  const week = String(body.week ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || new Date(`${week}T00:00:00Z`).getUTCDay() !== 1) return json({ error: "week must be a Monday (YYYY-MM-DD)" }, 422);
  const stmts: D1PreparedStatement[] = [];
  for (const m of LINKEDIN_STATS) {
    const raw = body[m];
    if (raw === undefined || raw === null || raw === "") continue;
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0) return json({ error: `${m} must be a number` }, 422);
    stmts.push(env.DB.prepare("DELETE FROM results WHERE source = 'linkedin' AND system = 'media' AND metric = ?1 AND metric_date = ?2").bind(m, week));
    stmts.push(env.DB.prepare("INSERT INTO results (id, metric_date, system, source, metric, value, notes) VALUES (?1, ?2, 'media', 'linkedin', ?3, ?4, ?5)")
      .bind(crypto.randomUUID(), week, m, v, `entered by ${who}`));
  }
  if (!stmts.length) return json({ error: "Enter at least one number" }, 422);
  await env.DB.batch(stmts);
  return json({ ok: true });
}

export async function handle(req: Request, env: ApiEnv): Promise<Response> {
  const url = new URL(req.url);
  let who: string;
  try {
    who = await signedInEmail(req, env);
  } catch (e) {
    const err = e instanceof AuthError ? e : new AuthError(401, String(e));
    return url.pathname.startsWith("/api/") ? json({ error: err.message }, err.status) : new Response(err.message, { status: err.status });
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const body = async () => (req.method === "POST" ? ((await req.json().catch(() => ({}))) as Record<string, string>) : {});

  if (req.method === "GET" && url.pathname === "/") return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  if (req.method === "GET" && url.pathname === "/api/today") {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date") ?? "") ? url.searchParams.get("date")! : todayET();
    return json({ ...(await today(env, date)), me: who });
  }
  if (req.method === "POST" && url.pathname === "/api/today/build") return json(await buildToday(env));
  if (req.method === "POST" && url.pathname === "/api/posts/build") {
    try {
      const posts = await buildPosts(env, todayET(), "next");
      // The week's Transformidable Thinking short video too, when it is not drafted yet.
      const video = await buildShortVideo(env, weekOf(todayET())).catch((e) => ({ skipped: true, reason: String(e).slice(0, 200) }));
      return json({ ...posts, video });
    } catch (e) { return json({ error: String(e) }, 502); }
  }
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "posts" && parts[2]) return completePost(env, parts[2], who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "actions" && parts[2] && parts[3] === "redraft") return redraft(env, parts[2]);
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "actions" && parts[2] && parts[3] === "comment-draft") return draftComment(env, parts[2], await body());
  if (req.method === "GET" && url.pathname === "/api/partners") return partnerList(env);
  if (req.method === "POST" && url.pathname === "/api/partners") return addPartnerHere(env, await body());
  if (req.method === "GET" && url.pathname === "/api/influencers") return influencers(env);
  if (req.method === "POST" && url.pathname === "/api/influencers") return addInfluencer(env, who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "influencers" && parts[2] && parts[3] === "remove") return removeInfluencer(env, parts[2]);
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "actions" && parts[2]) return completeAction(env, parts[2], who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "people" && parts[2] && parts[3] === "connected") return markConnected(env, parts[2], who);
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "people" && parts[2] && parts[3] === "outcome") return recordOutcome(env, parts[2], who, await body());
  if (req.method === "POST" && url.pathname === "/api/kade/flush") return json(await flushTouches(env, undefined, Math.min(200, Number(url.searchParams.get("limit")) || 200)));
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "people" && parts[2] && parts[3] === "already-connected") {
    const r = await alreadyConnected(env, parts[2], who);
    return "error" in r ? json({ error: r.error }, r.status) : json(r);
  }
  if (req.method === "POST" && url.pathname === "/api/connections/import") {
    const b = await body() as { csv?: unknown };
    if (typeof b.csv !== "string" || !b.csv.trim()) return json({ error: "csv: the text of Connections.csv" }, 422);
    try { return json(await importConnections(env, b.csv, who)); }
    catch (e) { return json({ error: (e as Error).message }, 422); }
  }
  if (req.method === "GET" && url.pathname === "/api/results") return json(await resultsView(env));
  if (req.method === "GET" && url.pathname === "/api/week") return json(await weekView(env));
  if (req.method === "POST" && url.pathname === "/api/results/linkedin") return saveLinkedinStats(env, who, await body());
  return json({ error: "Not found" }, 404);
}
