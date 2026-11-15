/**
 * LinkedIn's analytics exports, uploaded weekly (KADE docs/influence-measurement.md). A later upload replaces the days
 * it covers, so nothing is counted twice.
 * - Her profile (AggregateAnalytics_<name>_<start>_<end>.xlsx): DISCOVERY, ENGAGEMENT, TOP POSTS, FOLLOWERS and
 *   DEMOGRAPHICS sheets.
 * - The company page's Content export (<page>_content_<n>.xls, the old binary format): Metrics (by day) and All posts.
 */
import type { NetworkEnv } from "./network";
import { InputError } from "./network";
import { isXls, readXls } from "./xls";
import { readXlsx, type Sheets } from "./xlsx";

export interface ProfileExport {
  periodStart: string; periodEnd: string; impressions: number | null; membersReached: number | null;
  daily: { day: string; impressions: number | null; engagements: number | null; newFollowers: number | null }[];
  followers: { day: string; total: number } | null;
  posts: { url: string; publishedDate: string | null; impressions: number | null; engagements: number | null }[];
  demographics: { category: string; value: string; pct: number | null }[];
}

/** 10/19/2026 → 2026-10-19. */
export function usDate(s: string | undefined): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s ?? "").trim());
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : null;
}
const num = (s: string | undefined) => { const n = Number(String(s ?? "").replace(/[,\s]/g, "")); return s != null && String(s).trim() !== "" && Number.isFinite(n) ? n : null; };
const sheet = (s: Sheets, name: string) => s[Object.keys(s).find((k) => k.trim().toUpperCase() === name) ?? ""] ?? null;
/** The first row whose first cell names a header, and the rows under it. */
function table(rows: string[][], first: string) {
  const at = rows.findIndex((r) => (r[0] ?? "").trim().toLowerCase() === first.toLowerCase());
  return at < 0 ? [] : rows.slice(at + 1).filter((r) => r.some((c) => c && c.trim()));
}

export function parseProfile(s: Sheets): ProfileExport {
  const disc = sheet(s, "DISCOVERY"), eng = sheet(s, "ENGAGEMENT"), fol = sheet(s, "FOLLOWERS"), top = sheet(s, "TOP POSTS"), demo = sheet(s, "DEMOGRAPHICS");
  if (!disc || !eng) throw new InputError("This is not LinkedIn's profile analytics export: it has no DISCOVERY and ENGAGEMENT sheets");
  const period = disc.find((r) => /overall performance/i.test(r[0] ?? ""))?.[1] ?? "";
  const [a, b] = period.split("-").map((x) => usDate(x));
  if (!a || !b) throw new InputError("Could not read the export's date range on the DISCOVERY sheet");
  const val = (label: string) => num(disc.find((r) => (r[0] ?? "").trim().toLowerCase() === label)?.[1]);
  const byDay = new Map<string, ProfileExport["daily"][number]>();
  for (const r of table(eng, "Date")) {
    const day = usDate(r[0]); if (!day) continue;
    byDay.set(day, { day, impressions: num(r[1]), engagements: num(r[2]), newFollowers: null });
  }
  let followers: ProfileExport["followers"] = null;
  if (fol) {
    const head = fol.find((r) => /^total followers on/i.test(r[0] ?? ""));
    const day = usDate(/on\s+(\S+)/i.exec(head?.[0] ?? "")?.[1]);
    const total = num(head?.[1]);
    if (day && total != null) followers = { day, total };
    for (const r of table(fol, "Date")) {
      const d = usDate(r[0]); if (!d) continue;
      const row = byDay.get(d) ?? { day: d, impressions: null, engagements: null, newFollowers: null };
      row.newFollowers = num(r[1]);
      byDay.set(d, row);
    }
  }
  // TOP POSTS has two side-by-side lists: by engagements (A to C) and by impressions (E to G).
  const posts = new Map<string, ProfileExport["posts"][number]>();
  if (top) {
    const at = top.findIndex((r) => (r[0] ?? "").trim().toLowerCase() === "post url" || (r[4] ?? "").trim().toLowerCase() === "post url");
    for (const r of at < 0 ? [] : top.slice(at + 1)) {
      for (const [u, d, v, key] of [[r[0], r[1], r[2], "engagements"], [r[4], r[5], r[6], "impressions"]] as const) {
        const url = (u ?? "").trim();
        if (!/^https:\/\/www\.linkedin\.com\//i.test(url)) continue;
        const p = posts.get(url) ?? { url, publishedDate: usDate(d), impressions: null, engagements: null };
        p[key] = num(v);
        posts.set(url, p);
      }
    }
  }
  const demographics = (demo ? table(demo, "Top Demographics") : []).filter((r) => r[0] && r[1]).map((r) => ({
    category: r[0].trim(), value: r[1].trim(), pct: /^\s*</.test(r[2] ?? "") ? null : num((r[2] ?? "").replace("%", "")),
  }));
  return { periodStart: a, periodEnd: b, impressions: val("impressions"), membersReached: val("members reached"), daily: [...byDay.values()].sort((x, y) => x.day.localeCompare(y.day)), followers, posts: [...posts.values()], demographics };
}

export interface PageContentExport {
  periodStart: string; periodEnd: string;
  daily: { day: string; impressions: number | null; engagements: number | null }[];
  posts: { url: string; publishedDate: string | null; impressions: number | null; engagements: number | null }[];
}

/** The company page's Content export: daily totals (organic and sponsored) and each post. Engagements are clicks, reactions, comments and reposts. */
export function parsePageContent(s: Sheets): PageContentExport {
  const metrics = sheet(s, "METRICS"), all = sheet(s, "ALL POSTS");
  if (!metrics) throw new InputError("This is not the company page's Content export: it has no Metrics sheet");
  const head = metrics.find((r) => (r[0] ?? "").trim().toLowerCase() === "date") ?? [];
  const col = (name: string) => head.findIndex((h) => (h ?? "").trim().toLowerCase() === name);
  const imp = col("impressions (total)") >= 0 ? col("impressions (total)") : col("impressions (organic)");
  const eng = ["clicks (total)", "reactions (total)", "comments (total)", "reposts (total)"].map(col).filter((i) => i >= 0);
  const daily = table(metrics, "Date").flatMap((r) => {
    const day = usDate(r[0]); if (!day) return [];
    const parts = eng.map((i) => num(r[i]));
    return [{ day, impressions: imp >= 0 ? num(r[imp]) : null, engagements: parts.some((x) => x != null) ? parts.reduce<number>((n, x) => n + (x ?? 0), 0) : null }];
  }).sort((a, b) => a.day.localeCompare(b.day));
  if (!daily.length) throw new InputError("The Metrics sheet has no days in it");
  const ph = all?.find((r) => (r[0] ?? "").trim().toLowerCase() === "post title") ?? [];
  const pc = (name: string) => ph.findIndex((h) => (h ?? "").trim().toLowerCase() === name);
  const posts = (all ? table(all, "Post title") : []).flatMap((r) => {
    const url = (r[pc("post link")] ?? "").trim();
    if (!/^https:\/\/www\.linkedin\.com\//i.test(url)) return [];
    const parts = ["clicks", "likes", "comments", "reposts"].map((k) => num(r[pc(k)]));
    return [{ url, publishedDate: usDate(r[pc("created date")]), impressions: num(r[pc("impressions")]), engagements: parts.some((x) => x != null) ? parts.reduce<number>((n, x) => n + (x ?? 0), 0) : null }];
  });
  return { periodStart: daily[0].day, periodEnd: daily[daily.length - 1].day, daily, posts };
}

/** Either kind of file, read by its format and then by its sheets. */
export async function readExport(buf: ArrayBuffer): Promise<{ kind: "profile"; x: ProfileExport } | { kind: "page"; x: PageContentExport }> {
  let sheets: Sheets;
  try { sheets = isXls(buf) ? readXls(buf) : await readXlsx(buf); }
  catch (e) { throw new InputError(`Could not read the file: ${(e as Error).message}`); }
  const names = Object.keys(sheets).map((k) => k.trim().toUpperCase());
  if (names.includes("DISCOVERY")) return { kind: "profile", x: parseProfile(sheets) };
  if (names.includes("METRICS") && names.includes("ALL POSTS")) return { kind: "page", x: parsePageContent(sheets) };
  throw new InputError(`Not an export Influence reads yet (sheets: ${Object.keys(sheets).join(", ") || "none"}). Upload your profile's analytics export or the company page's Content export.`);
}

async function savePage(env: NetworkEnv, fileName: string, x: PageContentExport, by: string) {
  const ours = (await env.DB.prepare("SELECT id, due_date FROM review_queue WHERE status = 'sent' AND item_type = 'post_page'").all<{ id: string; due_date: string }>()).results;
  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO li_uploads (id, account, file_name, period_start, period_end, impressions, summary_json, uploaded_by) VALUES (?1, 'page', ?2, ?3, ?4, ?5, ?6, ?7)`)
      .bind(id, fileName.slice(0, 200), x.periodStart, x.periodEnd, x.daily.reduce((n, d) => n + (d.impressions ?? 0), 0), JSON.stringify({ days: x.daily.length, posts: x.posts.length }), by),
    ...x.daily.map((d) => env.DB.prepare(
      `INSERT INTO li_daily (account, day, impressions, engagements) VALUES ('page', ?1, ?2, ?3)
       ON CONFLICT (account, day) DO UPDATE SET impressions = COALESCE(excluded.impressions, impressions), engagements = COALESCE(excluded.engagements, engagements)`).bind(d.day, d.impressions, d.engagements)),
    ...x.posts.map((p) => env.DB.prepare(
      `INSERT INTO li_posts (url, account, published_date, impressions, engagements, post_id) VALUES (?1, 'page', ?2, ?3, ?4, ?5)
       ON CONFLICT (url) DO UPDATE SET impressions = COALESCE(excluded.impressions, impressions), engagements = COALESCE(excluded.engagements, engagements),
         post_id = COALESCE(post_id, excluded.post_id), seen_at = CURRENT_TIMESTAMP`)
      .bind(p.url, p.publishedDate, p.impressions, p.engagements, ours.find((o) => o.due_date === p.publishedDate)?.id ?? null)),
  ]);
  return { id, account: "page", periodStart: x.periodStart, periodEnd: x.periodEnd, days: x.daily.length, posts: x.posts.length, followers: null };
}

/** Stores an upload: the days it covers replace what was there; the top posts keep their latest numbers; the audience is the latest snapshot. */
export async function saveUpload(env: NetworkEnv, fileName: string, buf: ArrayBuffer, extra: { profileViews?: number | null; searchAppearances?: number | null }, by: string) {
  if (buf.byteLength > 5_000_000) throw new InputError("That file is larger than LinkedIn's export; choose the .xlsx file LinkedIn gave you");
  const read = await readExport(buf);
  if (read.kind === "page") return savePage(env, fileName, read.x, by);
  const x = read.x;
  // Posts on the Posts tab published the same day as a top post are the same post (one profile post a day at most).
  const ours = (await env.DB.prepare("SELECT id, due_date FROM review_queue WHERE status = 'sent' AND item_type = 'post_profile'").all<{ id: string; due_date: string }>()).results;
  const id = crypto.randomUUID();
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(`INSERT INTO li_uploads (id, account, file_name, period_start, period_end, impressions, members_reached, profile_views, search_appearances, summary_json, uploaded_by)
       VALUES (?1, 'profile', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`)
      .bind(id, fileName.slice(0, 200), x.periodStart, x.periodEnd, x.impressions, x.membersReached, extra.profileViews ?? null, extra.searchAppearances ?? null,
        JSON.stringify({ days: x.daily.length, posts: x.posts.length, demographics: x.demographics.length, followers: x.followers?.total ?? null }), by),
    ...x.daily.map((d) => env.DB.prepare(
      `INSERT INTO li_daily (account, day, impressions, engagements, new_followers) VALUES ('profile', ?1, ?2, ?3, ?4)
       ON CONFLICT (account, day) DO UPDATE SET impressions = COALESCE(excluded.impressions, impressions), engagements = COALESCE(excluded.engagements, engagements),
         new_followers = COALESCE(excluded.new_followers, new_followers)`).bind(d.day, d.impressions, d.engagements, d.newFollowers)),
    ...(x.followers ? [env.DB.prepare("INSERT INTO li_followers (account, day, total) VALUES ('profile', ?1, ?2) ON CONFLICT (account, day) DO UPDATE SET total = excluded.total").bind(x.followers.day, x.followers.total)] : []),
    ...x.posts.map((p) => env.DB.prepare(
      `INSERT INTO li_posts (url, account, published_date, impressions, engagements, post_id) VALUES (?1, 'profile', ?2, ?3, ?4, ?5)
       ON CONFLICT (url) DO UPDATE SET impressions = COALESCE(excluded.impressions, impressions), engagements = COALESCE(excluded.engagements, engagements),
         post_id = COALESCE(post_id, excluded.post_id), seen_at = CURRENT_TIMESTAMP`)
      .bind(p.url, p.publishedDate, p.impressions, p.engagements, ours.find((o) => o.due_date === p.publishedDate)?.id ?? null)),
    ...(x.demographics.length ? [env.DB.prepare("DELETE FROM li_demographics WHERE account = 'profile'"),
      ...x.demographics.map((d) => env.DB.prepare("INSERT OR REPLACE INTO li_demographics (account, category, value, pct, as_of) VALUES ('profile', ?1, ?2, ?3, ?4)").bind(d.category, d.value, d.pct, x.periodEnd))] : []),
  ];
  await env.DB.batch(stmts);
  return { id, account: "profile", periodStart: x.periodStart, periodEnd: x.periodEnd, days: x.daily.length, posts: x.posts.length, followers: x.followers?.total ?? null };
}
