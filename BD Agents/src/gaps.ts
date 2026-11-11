/**
 * Research needed: hot organizations with no leadership contact in KADE. Pulled in full each
 * morning. A gap KADE no longer reports (people found, or no longer hot) becomes 'resolved';
 * an approved or dismissed gap keeps its decision while it is still reported.
 */
import { PAGE_SIZE, gapsPage, type KadeGap } from "./kade";
import type { SyncEnv } from "./sync";

const MAX_PAGES = 10;

function upsert(db: D1Database, g: KadeGap, seenAt: string) {
  return db
    .prepare(
      `INSERT INTO research_gaps (kade_account_id, organization, entity_type, state_province, kade_tier, kade_heat, kade_summary, pursued, status, first_seen_at, last_seen_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'open', ?9, ?9)
       ON CONFLICT(kade_account_id) DO UPDATE SET
         organization = excluded.organization, entity_type = excluded.entity_type, state_province = excluded.state_province,
         kade_tier = excluded.kade_tier, kade_heat = excluded.kade_heat, kade_summary = excluded.kade_summary, pursued = excluded.pursued,
         status = CASE WHEN research_gaps.status = 'resolved' THEN 'open' ELSE research_gaps.status END,
         last_seen_at = excluded.last_seen_at`,
    )
    .bind(g.organization_id, g.organization_name, g.entity_type, g.state_province, g.tier, g.heat, g.summary, g.pursued ? 1 : 0, seenAt);
}

export async function syncGaps(env: SyncEnv) {
  const seenAt = new Date().toISOString();
  let rows = 0;
  let complete = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { organizations } = await gapsPage(env, "hot", page * PAGE_SIZE);
    if (organizations.length) await env.DB.batch(organizations.map((g) => upsert(env.DB, g, seenAt)));
    rows += organizations.length;
    if (organizations.length < PAGE_SIZE) {
      complete = true;
      break;
    }
  }
  let resolved = 0;
  if (complete) {
    const r = await env.DB.prepare("UPDATE research_gaps SET status = 'resolved' WHERE status <> 'resolved' AND last_seen_at < ?1").bind(seenAt).run();
    resolved = r.meta.changes ?? 0;
  }
  return { rows, resolved, capped: !complete };
}
