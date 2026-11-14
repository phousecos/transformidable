/**
 * Influence Worker (KADE docs/influence.md).
 * - Monday cron: the week's posts and the Transformidable Thinking short-video script (moved from Network),
 *   then a self-check of what the page loads. Steps are logged; a failure in one does not stop the rest.
 * - HTTP: the page and its API, behind Cloudflare Access.
 */
import { handle, selfCheck, todayET, type ApiEnv } from "./api";
import { buildPosts, buildShortVideo, weekOf } from "./content";

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
  async scheduled(_c: ScheduledController, env: ApiEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      const today = todayET();
      await step("week-posts", () => buildPosts(env, today, "week"));
      await step("week-short-video", () => buildShortVideo(env, weekOf(today)));
      await step("page-check", () => selfCheck(env));
    })());
  },
};
