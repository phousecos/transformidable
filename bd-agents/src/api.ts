/**
 * The review page's API. Every route needs a signed-in person (auth.ts); whoever marks an
 * action done or decides a research request is recorded as its approver.
 */
import { AuthError, signedInEmail, type AuthEnv } from "./auth";
import { buildWeekPosts, weekOf, type ContentEnv } from "./content";
import { buildToday, todayET, type DailyEnv } from "./daily";
import { kadeOrgUrl } from "./kade";
import { PAGE } from "./page";

export interface ApiEnv extends DailyEnv, ContentEnv, AuthEnv {}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function today(env: ApiEnv, date: string) {
  const actions = await env.DB.prepare(
    `SELECT a.id, a.action_date, a.rank, a.action_type, a.status, a.reason, a.target_url, a.done_at,
       p.id AS person_id, p.full_name, p.title, p.organization, p.kade_account_id, p.kade_tier, p.kade_heat, p.pursued, p.connection_status,
       q.id AS queue_id, COALESCE(q.final_text, q.draft) AS text, q.draft
     FROM actions a JOIN people p ON p.id = a.person_id LEFT JOIN review_queue q ON q.id = a.queue_id
     WHERE a.action_date = ?1 ORDER BY a.rank`,
  ).bind(date).all();
  const pending = await env.DB.prepare(
    `SELECT id AS person_id, full_name, title, organization, linkedin_url, invited_at FROM people
     WHERE connection_status = 'pending' ORDER BY invited_at DESC LIMIT 100`,
  ).all();
  const gaps = await env.DB.prepare(
    `SELECT kade_account_id, organization, entity_type, state_province, kade_tier, kade_heat, kade_summary, pursued, status
     FROM research_gaps WHERE status = 'open' ORDER BY pursued DESC, kade_heat DESC LIMIT 50`,
  ).all<{ kade_account_id: string }>();
  const openGaps = await env.DB.prepare("SELECT COUNT(*) AS n FROM research_gaps WHERE status = 'open'").first<{ n: number }>();
  const monday = weekOf(date);
  const posts = await env.DB.prepare(
    `SELECT id, item_type, channel, title, COALESCE(final_text, draft) AS text, context_json, status, due_date, approved_by, sent_at
     FROM review_queue WHERE system = 'media' AND item_type IN ('post_page', 'post_profile') AND due_date BETWEEN ?1 AND date(?1, '+6 days')
     ORDER BY due_date`,
  ).bind(monday).all<{ context_json: string | null }>();
  return {
    date,
    actions: actions.results.map((a) => ({ ...a, kade_url: a.kade_account_id ? kadeOrgUrl(env, String(a.kade_account_id)) : null })),
    pending: pending.results,
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
  if (done) {
    const touch = { connect: "connection_request", follow_up: "dm", withdraw_invite: "invite_withdrawn" }[a.action_type] ?? a.action_type;
    if (a.action_type !== "withdraw_invite") {
      stmts.push(env.DB.prepare("INSERT INTO touches (id, person_id, channel, touch_type, queue_id, occurred_at, by_user) VALUES (?1, ?2, 'linkedin', ?3, ?4, ?5, ?6)")
        .bind(crypto.randomUUID(), a.person_id, touch, a.queue_id, now, who));
    }
    if (a.action_type === "connect") stmts.push(env.DB.prepare("UPDATE people SET connection_status = 'pending', invited_at = ?2, updated_at = ?2 WHERE id = ?1").bind(a.person_id, now));
    if (a.action_type === "withdraw_invite") stmts.push(env.DB.prepare("UPDATE people SET connection_status = 'withdrawn', updated_at = ?2 WHERE id = ?1").bind(a.person_id, now));
  }
  await env.DB.batch(stmts);
  return json({ ok: true });
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

async function markConnected(env: ApiEnv, personId: string) {
  const now = new Date().toISOString();
  const r = await env.DB.prepare("UPDATE people SET connection_status = 'connected', connected_at = ?2, updated_at = ?2 WHERE id = ?1 AND connection_status = 'pending'")
    .bind(personId, now).run();
  return (r.meta.changes ?? 0) ? json({ ok: true }) : json({ error: "Not a pending invite" }, 409);
}

async function decideGap(env: ApiEnv, id: string, who: string, body: { status?: string }) {
  if (body.status !== "approved" && body.status !== "dismissed") return json({ error: "status must be approved or dismissed" }, 422);
  const r = await env.DB.prepare("UPDATE research_gaps SET status = ?2, decided_by = ?3, decided_at = ?4 WHERE kade_account_id = ?1 AND status = 'open'")
    .bind(id, body.status, who, new Date().toISOString()).run();
  return (r.meta.changes ?? 0) ? json({ ok: true }) : json({ error: "Not an open request" }, 409);
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
    try { return json(await buildWeekPosts(env, todayET())); } catch (e) { return json({ error: String(e) }, 502); }
  }
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "posts" && parts[2]) return completePost(env, parts[2], who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "actions" && parts[2]) return completeAction(env, parts[2], who, await body());
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "people" && parts[2] && parts[3] === "connected") return markConnected(env, parts[2]);
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "gaps" && parts[2]) return decideGap(env, decodeURIComponent(parts[2]), who, await body());
  return json({ error: "Not found" }, 404);
}
