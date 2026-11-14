/**
 * Morning sync: copies people at KADE's open pursuits and active hot prospects into
 * bd-agents `people`, keyed by KADE's person ID (owner decision: hot only). Every run
 * pulls all of it: anyone not returned has cooled off in KADE and is marked out of scope
 * (in_kade_scope = 0), never deleted, so their touch history stays. KADE stays the source
 * of truth; fields the BD side owns (segment once set, connection status, email, Apollo ID,
 * do-not-contact) are never overwritten.
 */
import { PAGE_SIZE, partners, peoplePage, type KadeEnv, type KadePerson } from "./kade";

export interface SyncEnv extends KadeEnv {
  DB: D1Database;
}

/** Stops a runaway pull; 20 pages of 500 is 10,000 rows, far above the hot list. */
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
         kade_tier, kade_heat, pursued, in_kade_scope, synced_at, updated_at, kade_summary, role_category, contact_state, paused_until)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1, ?12, ?12, ?13, ?14, ?15, ?16)
       ON CONFLICT(kade_contact_id) DO UPDATE SET
         kade_account_id = excluded.kade_account_id,
         full_name = excluded.full_name,
         title = excluded.title,
         organization = excluded.organization,
         linkedin_url = COALESCE(excluded.linkedin_url, people.linkedin_url),
         kade_tier = excluded.kade_tier,
         kade_heat = excluded.kade_heat,
         pursued = excluded.pursued,
         kade_summary = excluded.kade_summary,
         role_category = excluded.role_category,
         -- KADE's contact history decides; an outcome recorded here but not yet sent keeps the local state.
         contact_state = CASE WHEN EXISTS (SELECT 1 FROM touches t WHERE t.person_id = people.id AND t.kade_sent_at IS NULL) THEN people.contact_state ELSE excluded.contact_state END,
         paused_until = CASE WHEN EXISTS (SELECT 1 FROM touches t WHERE t.person_id = people.id AND t.kade_sent_at IS NULL) THEN people.paused_until ELSE excluded.paused_until END,
         do_not_contact = CASE WHEN excluded.contact_state = 'stopped' THEN 1 ELSE people.do_not_contact END,
         in_kade_scope = 1,
         synced_at = excluded.synced_at,
         updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), p.person_id, p.organization_id, p.full_name, p.title, p.organization_name, segmentFor(p),
      p.linkedin_url, p.tier, p.heat, p.pursued ? 1 : 0, syncedAt, p.summary ?? null, p.role_category, p.contact_state ?? "open", p.paused_until ?? null);
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
    const { people } = await peoplePage(env, "hot", undefined, pages * PAGE_SIZE);
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

/**
 * Partners (KADE docs/partners.md): everyone KADE lists, each morning and after one is added here. Kept as
 * segment 'warm' and out of KADE's hot scope, with the kind, stage and next check-in as KADE reads them from
 * contact history. Someone KADE no longer lists stops being a partner here; their history stays.
 */
export async function syncPartners(env: SyncEnv) {
  const { partners: list } = await partners(env);
  const now = new Date().toISOString();
  const stmts = list.map((p) => env.DB.prepare(
    `INSERT INTO people (id, kade_contact_id, full_name, title, organization, segment, linkedin_url, in_kade_scope, synced_at, updated_at,
       partner_type, partner_stage, partner_check_in_on)
     VALUES (?1, ?2, ?3, ?4, ?5, 'warm', ?6, 0, ?7, ?7, ?8, ?9, ?10)
     ON CONFLICT(kade_contact_id) DO UPDATE SET
       full_name = excluded.full_name, title = COALESCE(excluded.title, people.title), organization = COALESCE(excluded.organization, people.organization),
       linkedin_url = COALESCE(people.linkedin_url, excluded.linkedin_url), partner_type = excluded.partner_type,
       partner_stage = excluded.partner_stage, partner_check_in_on = excluded.partner_check_in_on, synced_at = excluded.synced_at, updated_at = excluded.updated_at`,
  ).bind(crypto.randomUUID(), p.person_id, p.full_name, p.title, p.firm, p.linkedin_url, now, p.partner_type, p.stage, p.check_in_on));
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
  const gone = await env.DB.prepare(
    `UPDATE people SET partner_type = NULL, partner_stage = NULL, partner_check_in_on = NULL, updated_at = ?2
     WHERE partner_type IS NOT NULL AND kade_contact_id NOT IN (SELECT value FROM json_each(?1))`,
  ).bind(JSON.stringify(list.map((p) => p.person_id)), now).run();
  const result = { partners: list.length, removed: gone.meta.changes ?? 0 };
  await writeState(env.DB, "partners:last_run", JSON.stringify({ at: now, ...result })).run();
  return result;
}
