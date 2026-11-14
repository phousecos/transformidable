/**
 * Influence's page and API (KADE docs/influence.md), behind Cloudflare Access (src/auth.ts).
 * Network tab: the influence network. Posts tab: moved from Network.
 */
import { AuthError, signedInEmail, type AuthEnv } from "./auth";
import { buildPosts, buildShortVideo, weekOf, type ContentEnv } from "./content";
import { addToNetwork, InputError, networkView, removeMember, settings, STAGE_LABELS, updateMember, type NetworkEnv } from "./network";
import { PAGE } from "./page";

export interface ApiEnv extends AuthEnv, ContentEnv, NetworkEnv {}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

/** Today in New York, where the owner works. */
export function todayET(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

async function posts(env: ApiEnv) {
  const monday = weekOf(todayET());
  const rows = await env.DB.prepare(
    `SELECT id, item_type, channel, title, COALESCE(final_text, draft) AS text, context_json, status, due_date, approved_by, sent_at
     FROM review_queue WHERE item_type IN ('post_page', 'post_profile', 'short_video')
       AND (due_date BETWEEN ?1 AND date(?1, '+20 days') OR (due_date >= date(?1, '-14 days') AND due_date < ?1 AND status = 'proposed'))
     ORDER BY due_date`,
  ).bind(monday).all<{ context_json: string | null }>();
  return rows.results.map(({ context_json, ...p }) => ({ ...p, context: context_json ? JSON.parse(context_json) : {} }));
}

async function completePost(env: ApiEnv, id: string, who: string, body: { status?: string; text?: string }) {
  if (body.status !== "posted" && body.status !== "skipped") return json({ error: "status must be posted or skipped" }, 422);
  const q = await env.DB.prepare("SELECT draft, status FROM review_queue WHERE id = ?1").bind(id).first<{ draft: string; status: string }>();
  if (!q) return json({ error: "No such post" }, 404);
  if (q.status !== "proposed") return json({ error: `Already ${q.status}` }, 409);
  const now = new Date().toISOString();
  const text = typeof body.text === "string" && body.text.trim() ? body.text.trim() : q.draft;
  const posted = body.status === "posted";
  await env.DB.prepare("UPDATE review_queue SET final_text = ?2, status = ?3, approved_by = ?4, approved_at = ?5, sent_at = ?6, updated_at = ?5 WHERE id = ?1")
    .bind(id, text, posted ? "sent" : "rejected", who, now, posted ? now : null).run();
  return json({ ok: true });
}

/** The morning self-check: what the page loads. */
export async function selfCheck(env: ApiEnv) {
  const n = await networkView(env);
  if (n.signalsError) throw new Error(`Signals: ${n.signalsError}`);
  return { network: n.people.length, posts: (await posts(env)).length };
}

export async function handle(req: Request, env: ApiEnv): Promise<Response> {
  try { return await route(req, env); }
  catch (e) {
    console.log(JSON.stringify({ level: "error", path: new URL(req.url).pathname, error: String(e) }));
    if (new URL(req.url).pathname.startsWith("/api/")) return json({ error: `Something failed on the server: ${String((e as Error).message ?? e).slice(0, 300)}` }, 500);
    return new Response("Something failed on the server. Try again in a minute.", { status: 500 });
  }
}

async function route(req: Request, env: ApiEnv): Promise<Response> {
  const url = new URL(req.url);
  let who: string;
  try { who = await signedInEmail(req, env); }
  catch (e) {
    const err = e instanceof AuthError ? e : new AuthError(401, String(e));
    return url.pathname.startsWith("/api/") ? json({ error: err.message }, err.status) : new Response(err.message, { status: err.status });
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const body = async () => (req.method === "POST" ? ((await req.json().catch(() => ({}))) as Record<string, unknown>) : {});
  const input = (f: () => Promise<unknown>) => f().then((r) => json(r)).catch((e) => (e instanceof InputError ? json({ error: e.message }, 422) : Promise.reject(e)));

  if (req.method === "GET" && url.pathname === "/") return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  if (req.method === "GET" && url.pathname === "/api/me") return json({ me: who, today: todayET() });
  if (req.method === "GET" && url.pathname === "/api/network") return json({ ...(await networkView(env)), settings: await settings(env), stages: STAGE_LABELS });
  if (req.method === "POST" && url.pathname === "/api/network") return input(async () => addToNetwork(env, (await body()) as Record<string, string>, who));
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "network" && parts[2] && !parts[3]) return input(async () => updateMember(env, parts[2], await body(), who));
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "network" && parts[2] && parts[3] === "remove") { await removeMember(env, parts[2]); return json({ ok: true }); }
  if (req.method === "GET" && url.pathname === "/api/posts") return json({ today: todayET(), posts: await posts(env) });
  if (req.method === "POST" && url.pathname === "/api/posts/build") {
    const today = todayET();
    const built = await buildPosts(env, today, "next");
    const video = await buildShortVideo(env, weekOf(today)).catch((e) => ({ error: String(e) }));
    return json({ ...built, video });
  }
  if (req.method === "POST" && parts[0] === "api" && parts[1] === "posts" && parts[2]) return completePost(env, parts[2], who, (await body()) as { status?: string; text?: string });
  return json({ error: "Not found" }, 404);
}
