/**
 * Influence Worker (KADE docs/influence.md).
 * - Monday cron: the week's posts and the Transformidable Thinking short-video script (moved from Network),
 *   then a self-check of what the page loads. Steps are logged; a failure in one does not stop the rest.
 * - Hourly cron (KADE docs/influence-research.md): new discovery candidates, and screening and scoring for anyone whose
 *   research changed; at 11:15 UTC each day, the footprint research that is due and the week's discovery; the Friday
 *   LinkedIn upload reminder and the first Monday's review email (KADE docs/influence-measurement.md).
 * - HTTP: the page and its API, behind Cloudflare Access.
 */
import { handle, selfCheck, todayET, type ApiEnv } from "./api";
import { buildPosts, buildShortVideo, weekOf } from "./content";
import { requestDue, scoreChanged, takeDiscoveries } from "./research";
import { monthlyEmail, remindUpload } from "./measure";

/** Matches the hourly entry in wrangler.jsonc. */
const HOURLY = "15 * * * *";

async function step<T>(name: string, run: () => Promise<T>) {
  const started = Date.now();
  try {
    const results = await run();
    console.log(JSON.stringify({ level: "info", job: name, ms: Date.now() - started, results }));
  } catch (e) {
    console.log(JSON.stringify({ level: "error", job: name, ms: Date.now() - started, error: String(e) }));
  }
}

export default {
  fetch(req: Request, env: ApiEnv): Promise<Response> {
    return handle(req, env);
  },
  async scheduled(c: ScheduledController, env: ApiEnv, ctx: ExecutionContext): Promise<void> {
    if (c.cron === HOURLY) {
      ctx.waitUntil((async () => {
        if (new Date(c.scheduledTime).getUTCHours() === 11) await step("research-request", () => requestDue(env));
        await step("research-discoveries", () => takeDiscoveries(env));
        await step("research-score", () => scoreChanged(env));
        // Measurement (KADE docs/influence-measurement.md): Friday's upload reminder, the first Monday's review email.
        await step("upload-reminder", () => remindUpload(env));
        await step("monthly-review", () => monthlyEmail(env));
      })());
      return;
    }
    ctx.waitUntil((async () => {
      const today = todayET();
      await step("week-posts", () => buildPosts(env, today, "week"));
      await step("week-short-video", () => buildShortVideo(env, weekOf(today)));
      await step("page-check", () => selfCheck(env));
    })());
  },
};
