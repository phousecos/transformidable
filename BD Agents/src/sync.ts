/**
 * Morning sync: copies people at pursued and watched organizations from KADE into
 * bd-agents `people`, keyed by KADE's person ID. KADE stays the source of truth; this
 * copy is what the BD agents work from. Fields the BD side owns (segment once set,
 * connection status, email, Apollo ID, do-not-contact) are never overwritten.
 */
import { PAGE_SIZE, peoplePage, type KadeEnv, type KadePerson, type PeopleScope } from "./kade";

export interface SyncEnv extends KadeEnv {
  DB: D1Database;
}

/** Stops a runaway sync; 100 pages of 500 is 50,000 rows. */
const MAX_PAGES = 100;

const cursorKey = (scope: PeopleScope) => `people:${scope}`;

async function readCursor(db: D1Database, key: string): Promise<string | undefined> {
  const row = await db.prepare("SELECT value FROM sync_state WHERE key = ?1").bind(key).first<{ value: string }>();
  return row?.value;
}

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
      `INSERT INTO people (id, kade_contact_id, kade_account_id, full_name, title, organization, segment, linkedin_url, synced_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
       ON CONFLICT(kade_contact_id) DO UPDATE SET
         kade_account_id = excluded.kade_account_id,
         full_name = excluded.full_name,
         title = excluded.title,
         organization = excluded.organization,
         linkedin_url = COALESCE(excluded.linkedin_url, people.linkedin_url),
         synced_at = excluded.synced_at,
         updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), p.person_id, p.organization_id, p.full_name, p.title, p.organization_name, segmentFor(p), p.linkedin_url, syncedAt);
}

export interface ScopeResult {
  scope: PeopleScope;
  rows: number;
  pages: number;
  cursor: string | null;
  capped: boolean;
}

/** Pulls every change since the saved cursor for one scope; saves the cursor only after all pages are stored. */
export async function syncScope(env: SyncEnv, scope: PeopleScope): Promise<ScopeResult> {
  const since = await readCursor(env.DB, cursorKey(scope));
  const syncedAt = new Date().toISOString();
  let latest = since;
  let rows = 0;
  let pages = 0;
  for (; pages < MAX_PAGES; pages++) {
    const { people } = await peoplePage(env, scope, since, pages * PAGE_SIZE);
    if (people.length) {
      await env.DB.batch(people.map((p) => upsert(env.DB, p, syncedAt)));
      rows += people.length;
      const last = people[people.length - 1].updated_at;
      if (!latest || last > latest) latest = last;
    }
    if (people.length < PAGE_SIZE) {
      pages++;
      break;
    }
  }
  const capped = pages >= MAX_PAGES;
  if (latest && latest !== since) await writeState(env.DB, cursorKey(scope), latest).run();
  return { scope, rows, pages, cursor: latest ?? null, capped };
}

export async function syncPeople(env: SyncEnv): Promise<ScopeResult[]> {
  const results: ScopeResult[] = [];
  // Pursued first: the people the BD team is working now come through even if the larger watched pull fails.
  for (const scope of ["pursued", "watched"] as const) results.push(await syncScope(env, scope));
  await writeState(env.DB, "people:last_run", JSON.stringify({ at: new Date().toISOString(), results })).run();
  return results;
}
