/**
 * The review page's API. Every route needs a signed-in person (auth.ts); whoever marks an
 * action done or decides a research request is recorded as its approver.
 */
import { AuthError, signedInEmail, type AuthEnv } from "./auth";
import { buildPosts, weekOf, type ContentEnv } from "./content";
import { draft } from "./claude";
import { buildToday, firstName, todayET, type DailyEnv } from "./daily";
import { kadeOrgUrl } from "./kade";
import { flushTouches, KIND_BY_ACTION, OUTCOMES, touchStatement } from "./contact";
import { PAGE } from "./page";

export interface ApiEnv extends DailyEnv, ContentEnv, AuthEnv {}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function today(env: ApiEnv, date: string) {
  const actions = await env.DB.prepare(
    `SELECT a.id, a.action_date, a.rank, a.action_type, a.status, a.reason, a.target_url, a.done_at,
       p.id AS person_id, p.full_name, p.title, p.organization, p.kade_account_id, p.kade_tier, p.kade_heat, p.pursued, p.connection_status, p.contact_state, p.paused_until,
       q.id AS queue_id, COALESCE(q.final_text, q.draft) AS text, q.draft, json_extract(q.context_json, '$.drafted_by') AS drafted_by
     FROM actions a JOIN people p ON p.id = a.person_id LEFT JOIN review_queue q ON q.id = a.queue_id
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
  const gaps = await env.DB.prepare(
    `SELECT kade_account_id, organization, entity_type, state_province, kade_tier, kade_heat, kade_summary, pursued, status
     FROM research_gaps WHERE status = 'open' ORDER BY pursued DESC, kade_heat DESC LIMIT 50`,
  ).all<{ kade_account_id: string }>();
  const openGaps = await env.DB.prepare("SELECT COUNT(*) AS n FROM research_gaps WHERE status = 'open'").first<{ n: number }>();
  const monday = weekOf(date);
  const posts = await env.DB.prepare(
    `SELECT id, item_type, channel, title, COALESCE(final_text, draft) AS text, context_json, status, due_date, approved_by, sent_at
     FROM review_queue WHERE system = 'media' AND item_type IN ('post_page', 'post_profile') AND due_date BETWEEN ?1 AND date(?1, '+20 days')
     ORDER BY due_date`,
  ).bind(monday).all<{ context_json: string | null }>();
  return {
    date,
    actions: actions.results.map((a) => ({ ...a, kade_url: a.kade_account_id ? kadeOrgUrl(env, String(a.kade_account_id)) : null })),
    pending: pending.results,
    contacts: contacts.results.map((p) => ({ ...p, kade_url: p.kade_account_id ? kadeOrgUrl(env, p.kade_account_id) : null })),
    unsentToKade: unsent?.n ?? 0,
    gaps: gaps.results.map((g) => ({ ...g, kade_url: kadeOrgUrl(env, g.kade_account_id) })),
    openGaps: openGaps?.n ?? 0,
    week: monday,
    posts: posts.results.map(({ context_json, ...p }) => ({ ...p, context: context_json ? JSON.parse(context_json) : {} })),
  };
}

async function completeAction(env: ApiEnv, id: string, who: string, body: { status?: string; text?: string }) {
  if (body.status !== "done" && body.status !== "skipped") return json({ error: "status must be done or skipped" }, 422);
  const a = await env.DB.prepare("SELECT id, action_type, person_id, queue_id, status FROM actions WHERE id = ?1").bind(id)
    .first<{ id: string; action_type: string; person_id: string; queue_id: string | null; status: string }>();
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
    stmts.push(touchStatement(env.DB, { id: touchId, personId: a.person_id, kind: KIND_BY_ACTION[a.action_type] ?? a.action_type, queueId: a.queue_id, at: now, by: who }));
    if (a.action_type === "connect") stmts.push(env.DB.prepare("UPDATE people SET connection_status = 'pending', invited_at = ?2, updated_at = ?2 WHERE id = ?1").bind(a.person_id, now));
    if (a.action_type === "withdraw_invite") stmts.push(env.DB.prepare("UPDATE people SET connection_status = 'withdrawn', updated_at = ?2 WHERE id = ?1").bind(a.person_id, now));
  }
  await env.DB.batch(stmts);
  const kade = done ? await flushTouches(env, [touchId]).catch((e) => ({ sent: 0, failed: 1, waiting: 1, error: String(e) })) : null;
  return json({ ok: true, kade });
}

/** Re-asks Claude for a LinkedIn note or follow-up that fell back to the template. */
async function redraft(env: ApiEnv, actionId: string) {
  const a = await env.DB.prepare(
    `SELECT a.action_type, a.status, q.id AS queue_id, q.context_json, p.full_name, p.title, p.organization, p.kade_summary
     FROM actions a JOIN people p ON p.id = a.person_id JOIN review_queue q ON q.id = a.queue_id WHERE a.id = ?1`,
  ).bind(actionId).first<{ action_type: string; status: string; queue_id: string; context_json: string | null; full_name: string; title: string | null; organization: string | null; kade_summary: string | null }>();
  if (!a) return json({ error: "No such action with a draft" }, 404);
  if (a.status !== "todo") return json({ error: `Already ${a.status}` }, 409);
  const d = await draft(env, a.action_type === "connect" ? "connection_note" : "follow_up", { firstName: firstName(a.full_name), title: a.title, organization: a.organization, context: a.kade_summary });
  if (d.by === "template") return json({ error: `Claude did not draft it: ${d.error ?? "unknown"}` }, 502);
  const ctx = { ...(a.context_json ? JSON.parse(a.context_json) : {}), drafted_by: d.by, draft_error: null };
  await env.DB.prepare("UPDATE review_queue SET draft = ?2, context_json = ?3, created_by_agent = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?1")
    .bind(a.queue_id, d.text, JSON.stringify(ctx), `engagement-engine:${d.by}`).run();
  return json({ ok: true, text: d.text });
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
    env.DB.prepare(`UPDATE people SET contact_state = ?2, paused_until = CASE WHEN ?2 = 'paused' THEN date('now', '+365 days') ELSE NULL END,
       do_not_contact = CASE WHEN ?2 = 'stopped' THEN 1 ELSE do_not_contact END, updated_at = ?3 WHERE id = ?1`).bind(personId, outcome.state, now),
    // Today's open suggestions for them no longer apply (a closed conversation leaves them as they are).
    ...(body.kind === "conversation_closed" ? [] : [env.DB.prepare("UPDATE actions SET status = 'skipped', done_at = ?2, outcome = ?3 WHERE person_id = ?1 AND status = 'todo'")
      .bind(personId, now, `${outcome.label} (recorded by ${who})`)]),
  ]);
  return json({ ok: true, kade: await flushTouches(env, [touchId]).catch((e) => ({ error: String(e) })) });
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
    try { return json(await buildPosts(env, todayET(), "next")); } catch (e) { return json({ error: String(e) }, 502); }
  }
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "posts" && parts[2]) return completePost(env, parts[2], who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "actions" && parts[2] && parts[3] === "redraft") return redraft(env, parts[2]);
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "actions" && parts[2]) return completeAction(env, parts[2], who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "people" && parts[2] && parts[3] === "connected") return markConnected(env, parts[2], who);
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "people" && parts[2] && parts[3] === "outcome") return recordOutcome(env, parts[2], who, await body());
  if (req.method === "POST" && url.pathname === "/api/kade/flush") return json(await flushTouches(env));
  return json({ error: "Not found" }, 404);
}
