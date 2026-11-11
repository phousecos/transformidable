/**
 * bd-agents Worker. No HTTP routes yet: it only runs on the weekday cron in
 * wrangler.jsonc. Trigger a run by hand from the dashboard (Workers > bd-agents >
 * Triggers) or locally with `npx wrangler dev --test-scheduled`.
 */
import { syncPeople, type SyncEnv } from "./sync";

export interface Env extends SyncEnv {}

export default {
  async fetch(): Promise<Response> {
    return new Response("Not found", { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const started = Date.now();
        try {
          const results = await syncPeople(env);
          console.log(JSON.stringify({ level: "info", job: "kade-people-sync", ms: Date.now() - started, results }));
        } catch (e) {
          console.log(JSON.stringify({ level: "error", job: "kade-people-sync", ms: Date.now() - started, error: String(e) }));
          throw e;
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
