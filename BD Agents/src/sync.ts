/**
 * Morning sync: copies people at KADE's open pursuits and active hot/warm prospects into
 * bd-agents `people`, keyed by KADE's person ID. The hot/warm list is small, so every run
 * pulls all of it: anyone not returned has cooled off in KADE and is marked out of scope
 * (in_kade_scope = 0), never deleted, so their touch history stays. KADE stays the source
 * of truth; fields the BD side owns (segment once set, connection status, email, Apollo ID,
 * do-not-contact) are never overwritten.
 */
import { PAGE_SIZE, peoplePage, type KadeEnv, type KadePerson } from "./kade";

export interface SyncEnv extends KadeEnv {
  DB: D1Database;
}

/** Stops a runaway pull; 20 pages of 500 is 10,000 rows, far above a hot/warm list. */
const MAX_PAGES = 20;

function writeState(db: D1Database, key: string, value: string) {
  return db
    .prepare("INSERT INTO sync_state (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .bind(key, value);
}

/** Public officials get the Academy framing; everyone else starts as a cohort target. */
const segmentFor = (p: KadePerson) => (p.entity_type === "government" ? "official" : "cohort_target");

function upsert(db: D1Database, p: KadePerson, syncedAt: string) {
  return db
    .prepare(
      `INSERT INTO people (id, kade_contact_id, kade_account_id, full_name, title, organization, segment, linkedin_url,
         kade_tier, kade_heat, pursued, in_kade_scope, synced_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1, ?12, ?12)
       ON CONFLICT(kade_contact_id) DO UPDATE SET
         kade_account_id = excluded.kade_account_id,
         full_name = excluded.full_name,
         title = excluded.title,
         organization = excluded.organization,
         linkedin_url = COALESCE(excluded.linkedin_url, people.linkedin_url),
         kade_tier = excluded.kade_tier,
         kade_heat = excluded.kade_heat,
         pursued = excluded.pursued,
         in_kade_scope = 1,
         synced_at = excluded.synced_at,
         updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), p.person_id, p.organization_id, p.full_name, p.title, p.organization_name, segmentFor(p),
      p.linkedin_url, p.tier, p.heat, p.pursued ? 1 : 0, syncedAt);
}

export interface SyncResult {
  rows: number;
  pages: number;
  cooled: number;
  capped: boolean;
}

export async function syncPeople(env: SyncEnv): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  let rows = 0;
  let pages = 0;
  let complete = false;
  for (; pages < MAX_PAGES; ) {
    const { people } = await peoplePage(env, "hot_warm", undefined, pages * PAGE_SIZE);
    pages++;
    if (people.length) {
      await env.DB.batch(people.map((p) => upsert(env.DB, p, syncedAt)));
      rows += people.length;
    }
    if (people.length < PAGE_SIZE) {
      complete = true;
      break;
    }
  }
  // Only a complete pull can say who cooled off; a capped one leaves everyone as they were.
  let cooled = 0;
  if (complete) {
    const r = await env.DB
      .prepare("UPDATE people SET in_kade_scope = 0, kade_tier = NULL, pursued = 0, updated_at = ?1 WHERE kade_contact_id IS NOT NULL AND in_kade_scope = 1 AND (synced_at IS NULL OR synced_at < ?1)")
      .bind(syncedAt)
      .run();
    cooled = r.meta.changes ?? 0;
  }
  const result = { rows, pages, cooled, capped: !complete };
  await writeState(env.DB, "people:last_run", JSON.stringify({ at: syncedAt, ...result })).run();
  return result;
}
