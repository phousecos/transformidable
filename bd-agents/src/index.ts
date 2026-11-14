/**
 * bd-agents Worker.
 * - Weekday cron (wrangler.jsonc): sync hot people from KADE, sync research-needed
 *   organizations, then build and draft today's LinkedIn list; on Mondays, draft the week's posts.
 * - HTTP: the review page and its API, behind Cloudflare Access (src/auth.ts).
 * Trigger the cron locally with `npx wrangler dev --remote --test-scheduled`.
 */
import { handle, selfCheck, type ApiEnv } from "./api";
import { reportJobs, type JobReport } from "./kade";
import { buildPosts, buildShortVideo, weekOf } from "./content";
import { buildToday, todayET } from "./daily";
import { syncGaps } from "./gaps";
import { syncPartners, syncPeople } from "./sync";
import { flushTouches } from "./contact";

export interface Env extends ApiEnv {}

/** Each morning's steps and how they went, reported to KADE's system check at the end. */
const jobs: JobReport[] = [];

async function step<T>(name: string, run: () => Promise<T>): Promise<T | undefined> {
  const started = Date.now();
  try {
    const results = await run();
    console.log(JSON.stringify({ level: "info", job: name, ms: Date.now() - started, results }));
    jobs.push({ job: name, ok: true, at: new Date(started).toISOString(), ms: Date.now() - started, detail: JSON.stringify(results ?? null).slice(0, 500) });
    return results;
  } catch (e) {
    console.log(JSON.stringify({ level: "error", job: name, ms: Date.now() - started, error: String(e) }));
    jobs.push({ job: name, ok: false, at: new Date(started).toISOString(), ms: Date.now() - started, detail: String(e).slice(0, 500) });
    return undefined;
  }
}

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return handle(req, env);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        // Each step runs even if an earlier one failed: yesterday's people still make a usable list.
        await step("kade-people-sync", () => syncPeople(env));
        await step("kade-gaps-sync", () => syncGaps(env));
        await step("kade-partners-sync", () => syncPartners(env));
        // Touches KADE did not take yet (offline earlier) are retried first, so today's states are current.
        await step("kade-contact-flush", () => flushTouches(env));
        await step("daily-list", () => buildToday(env));
        // Mondays (New York): draft posts for this week's empty days (days drafted earlier are kept).
        const today = todayET();
        if (new Date(`${today}T12:00:00Z`).getUTCDay() === 1) {
          await step("week-posts", () => buildPosts(env, today, "week"));
          await step("week-short-video", () => buildShortVideo(env, weekOf(today)));
        }
        // Last: load what the page loads, then tell KADE how the morning went (docs/system-check.md).
        await step("page-check", () => selfCheck(env));
        try { await reportJobs(env, jobs.splice(0)); }
        catch (e) { console.log(JSON.stringify({ level: "error", job: "report-jobs", error: String(e) })); }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
