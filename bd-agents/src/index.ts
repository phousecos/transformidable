/**
 * bd-agents Worker.
 * - Weekday cron (wrangler.jsonc): sync hot people from KADE, sync research-needed
 *   organizations, then build and draft today's LinkedIn list; on Mondays, draft the week's posts.
 * - HTTP: the review page and its API, behind Cloudflare Access (src/auth.ts).
 * Trigger the cron locally with `npx wrangler dev --remote --test-scheduled`.
 */
import { handle, type ApiEnv } from "./api";
import { buildWeekPosts } from "./content";
import { buildToday, todayET } from "./daily";
import { syncGaps } from "./gaps";
import { syncPeople } from "./sync";

export interface Env extends ApiEnv {}

async function step<T>(name: string, run: () => Promise<T>): Promise<T | undefined> {
  const started = Date.now();
  try {
    const results = await run();
    console.log(JSON.stringify({ level: "info", job: name, ms: Date.now() - started, results }));
    return results;
  } catch (e) {
    console.log(JSON.stringify({ level: "error", job: name, ms: Date.now() - started, error: String(e) }));
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
        await step("daily-list", () => buildToday(env));
        // Mondays (New York): draft the week's posts. Safe to repeat; it skips a week that has posts.
        const today = todayET();
        if (new Date(`${today}T12:00:00Z`).getUTCDay() === 1) await step("week-posts", () => buildWeekPosts(env, today));
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
