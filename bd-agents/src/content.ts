/**
 * Content agent: drafts LinkedIn posts (owner choice: the Transformidable page on Mon/Wed/Fri,
 * Jerri's profile on Tue/Thu). Monday's cron fills that week's empty days; the page button
 * fills the next five weekdays starting tomorrow (owner, Nov 11). Days that already have a
 * post are never redrafted. Sources:
 * themes across KADE's recent business events (counts only, never an organization's name),
 * recent podcast episodes, and upcoming Academy/briefing sessions. Drafts land in review_queue
 * (system 'media') and are posted by hand from the review page. Voice: The Transformidable Leader.
 */
import type { ClaudeEnv } from "./claude";
import { EXAMPLE_POSTS, VOICE } from "./voice";
import { recentSignals, type KadeSignal } from "./kade";
import type { SyncEnv } from "./sync";

export interface ContentEnv extends SyncEnv, ClaudeEnv {
  /** Public site, for links (https://betransformidable.com). */
  SITE_URL?: string;
  /** Service binding to the briefings Worker (same account): upcoming sessions. */
  BRIEFINGS?: Fetcher;
}

/** Monday, Wednesday, Friday: company page. Tuesday, Thursday: Jerri's profile. */
const CHANNEL_BY_WEEKDAY: Record<number, "page" | "profile"> = { 1: "page", 2: "profile", 3: "page", 4: "profile", 5: "page" };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

export interface Slot { date: string; channel: "page" | "profile" }

/** Weekdays from `start` (inclusive): `count` of them, or through that week's Friday when `count` is "week". */
export function slots(start: string, count: number | "week"): Slot[] {
  const out: Slot[] = [];
  let d = start;
  for (let i = 0; i < 21; i++, d = addDays(d, 1)) {
    const w = weekday(d);
    if (count === "week" && w === 6 && out.length) break;
    if (w >= 1 && w <= 5) out.push({ date: d, channel: CHANNEL_BY_WEEKDAY[w] });
    if (typeof count === "number" && out.length >= count) break;
  }
  return out;
}

export const POST_LIMIT = 3000;

const iso = (d: Date) => d.toISOString().slice(0, 10);
/** Monday of the week containing `date` (YYYY-MM-DD, New York). */
export function weekOf(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

function top(counts: Map<string, number>, n: number) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`);
}

/** Counts only: no organization names, titles or links leave this function. */
export function themes(items: KadeSignal[]) {
  const by = { trigger: new Map<string, number>(), area: new Map<string, number>(), service: new Map<string, number>(), sector: new Map<string, number>(), effect: new Map<string, number>() };
  const bump = (m: Map<string, number>, k: string | null | undefined) => { if (k) m.set(k, (m.get(k) ?? 0) + 1); };
  for (const s of items) {
    bump(by.trigger, s.trigger ?? s.event_type);
    for (const a of s.areas ?? []) bump(by.area, a);
    for (const v of s.services ?? []) bump(by.service, v);
    bump(by.sector, s.entity_type);
    bump(by.effect, s.verdict_effect_kind);
  }
  return {
    events: items.length,
    triggers: top(by.trigger, 8),
    areas: top(by.area, 6),
    services: top(by.service, 6),
    sectors: top(by.sector, 5),
    effects: top(by.effect, 5),
  };
}

interface Episode { title: string; slug: string; description?: string; publishDate?: string; episodeNumber?: number }
interface Course { title: string; slug: string; format?: string }
interface Session { series: string; tagline: string; startsAt: string; registerUrl: string }

async function json<T>(url: string, init?: RequestInit, via?: Fetcher): Promise<T | null> {
  try {
    const res = await (via ? via.fetch(url, init) : fetch(url, init));
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function gather(env: ContentEnv, monday: string) {
  const site = (env.SITE_URL || "https://betransformidable.com").replace(/\/$/, "");
  const since = addDays(monday, -14);
  const [signals, eps, courses, feed] = await Promise.all([
    recentSignals(env, since).catch(() => null),
    json<{ docs: Episode[] }>(`${site}/api/podcast-episodes?where[status][equals]=published&sort=-publishDate&limit=3&depth=0`),
    json<{ docs: Course[] }>(`${site}/api/courses?limit=20&depth=0`),
    json<{ series: { slug: string; name: string; tagline: string; registerUrl: string; sessions: { startsAt: string }[] }[] }>(
      "https://briefings.betransformidable.com/api/public/briefings.json", undefined, env.BRIEFINGS),
  ]);
  const horizon = addDays(monday, 35);
  const sessions: Session[] = (feed?.series ?? [])
    .flatMap((s) => s.sessions.filter((x) => x.startsAt.slice(0, 10) >= monday && x.startsAt.slice(0, 10) <= horizon)
      .map((x) => ({ series: s.name, tagline: s.tagline, startsAt: x.startsAt, registerUrl: s.registerUrl })))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 6);
  return {
    themes: signals ? themes(signals.items) : null,
    episodes: (eps?.docs ?? []).map((e) => ({ title: e.title, number: e.episodeNumber ?? null, date: e.publishDate?.slice(0, 10) ?? null, summary: (e.description ?? "").slice(0, 600), url: `${site}/podcast/${e.slug}` })),
    courses: (courses?.docs ?? []).map((c) => ({ title: c.title, format: c.format ?? null, url: `${site}/academy/courses/${c.slug}` })),
    sessions,
  };
}

const SYSTEM = `You are the content writer for Transformidable and for Dr. Jerri Bland, its founder. Jerri is a governance advisor (ERP and core systems, IT controls, AI governance, M&A technology integration) with 25 years of enterprise IT leadership, including Deputy CIO at Columbia University, and the author of The Transformidable Leader: The Leader the Moment Needs.

${VOICE}

Rules:
- Company-page posts speak as Transformidable ("we", or no pronoun). Profile posts speak as Jerri ("I").
- Theme data is aggregate counts from internal research. Use it only to choose what leaders are dealing with now. Never name or hint at any organization, never cite the counts, never mention research, signals, data or tools.
- Never invent facts, statistics, quotes, clients or stories. Use composite hypotheticals, labeled as such, or Jerri's own experience as stated above.
- No selling, pricing or calls to book. A post about an episode, course or session may end with its link; at most one link per post.
- No emojis, no em dashes, two or three hashtags at most (#TransformidableThinking where it fits), no stock openers.
- 500 to 1,100 characters per post, short paragraphs, ending with one question.

Match the shape and length of these posts Jerri wrote:

${EXAMPLE_POSTS}`;

function userPrompt(input: Awaited<ReturnType<typeof gather>>, plan: Slot[], scheduled: string[]) {
  const lines = plan.map((p) => `${DAY_NAMES[weekday(p.date)]} ${p.date}: ${p.channel === "page" ? "Transformidable company page" : "Jerri's personal profile"}`).join("\n");
  const avoid = scheduled.length ? `\nAlready scheduled (do not repeat these topics):\n${scheduled.map((t) => `- ${t}`).join("\n")}\n` : "";
  return `Draft ${plan.length} LinkedIn post${plan.length === 1 ? "" : "s"}, one per slot.

Schedule:
${lines}
${avoid}
Material:
${JSON.stringify(input, null, 2)}

Mix the sources: mostly the themes, plus a podcast episode if there is one and an upcoming session or course if there is one. Do not repeat a topic.

Return the posts in schedule order. Use an empty string for link when there is none.`;
}

/** Structured output (output_config.format): the reply text is JSON matching this schema. */
const POSTS_SCHEMA = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          channel: { type: "string", enum: ["page", "profile"] },
          theme: { type: "string" },
          source: { type: "string", enum: ["themes", "podcast", "event", "course"] },
          link: { type: "string", description: "Episode, course or registration URL, or empty" },
          text: { type: "string" },
        },
        required: ["day", "channel", "theme", "source", "link", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["posts"],
  additionalProperties: false,
};

/**
 * Drafts posts for the empty slots in `plan` (days that already have a post are left alone).
 * mode "week": Monday's cron, today through Friday. mode "next": the page button, the next five
 * weekdays starting tomorrow.
 */
export async function buildPosts(env: ContentEnv, today: string, mode: "week" | "next") {
  const all = mode === "week" ? slots(today, "week") : slots(addDays(today, 1), 5);
  if (!all.length) return { skipped: true, reason: "no weekdays to fill" };
  const from = all[0].date;
  const to = all[all.length - 1].date;
  const have = await env.DB.prepare(
    "SELECT due_date, title FROM review_queue WHERE system = 'media' AND item_type IN ('post_page', 'post_profile') AND due_date BETWEEN ?1 AND date(?2, '+14 days')",
  ).bind(addDays(from, -7), to).all<{ due_date: string; title: string }>();
  const taken = new Set(have.results.map((r) => r.due_date));
  const plan = all.filter((s) => !taken.has(s.date));
  if (!plan.length) return { skipped: true, reason: `every weekday from ${from} to ${to} already has a post` };
  if (!env.ANTHROPIC_API_KEY) return { skipped: true, reason: "ANTHROPIC_API_KEY is not set" };
  const monday = weekOf(from);

  const input = await gather(env, monday);
  const model = env.AI_MODEL || "claude-sonnet-5-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: POSTS_SCHEMA } },
      messages: [{ role: "user", content: userPrompt(input, plan, have.results.map((r) => r.title)) }],
    }),
  });
  if (!res.ok) throw new Error(`Claude: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const body = await res.json<{ stop_reason?: string; content: { type: string; text?: string }[] }>();
  const text = body.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
  let parsed: { posts?: Draft[] } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Claude's reply was not valid JSON (stop: ${body.stop_reason ?? "unknown"}): ${text.slice(0, 200)}`);
  }
  const drafts = (parsed.posts ?? []).filter((d) => d && typeof d.text === "string" && d.text.trim()).slice(0, plan.length);
  if (!drafts.length) throw new Error(`Claude returned no posts (stop: ${body.stop_reason ?? "unknown"})`);

  const stmts = drafts.map((d, i) => {
    const slot = plan[i]; // the schedule decides date and channel, whatever the model said
    return env.DB.prepare(
      `INSERT INTO review_queue (id, system, item_type, channel, title, draft, context_json, created_by_agent, due_date)
       VALUES (?1, 'media', ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    ).bind(crypto.randomUUID(), slot.channel === "page" ? "post_page" : "post_profile", slot.channel, (d.theme || "Post").slice(0, 120), String(d.text ?? "").trim(),
      JSON.stringify({ source: d.source, link: d.link || null }), `content-agent:${model}`, slot.date);
  });
  if (stmts.length) await env.DB.batch(stmts);
  return { skipped: false, from, to, posts: stmts.length, sources: { themes: !!input.themes, episodes: input.episodes.length, sessions: input.sessions.length, courses: input.courses.length } };
}
