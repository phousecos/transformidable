import pg from 'pg'

const rawCS = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
const connectionString = rawCS.includes('sslmode=')
  ? rawCS.replace(/sslmode=[^&]*/, 'sslmode=no-verify')
  : rawCS + (rawCS.includes('?') ? '&' : '?') + 'sslmode=no-verify'

// ── Migration lock ─────────────────────────────────────────────────────
// This script does destructive, multi-step, non-transactional schema
// surgery (drop enum types → convert columns to TEXT → push recreates
// enums → convert back). If two deploys run it at the same time against
// the same database — a stray Preview build and a Production build, or
// two Production deploys in quick succession — one process's DROP/ALTER
// can land in the middle of the other's steps and crash both. A single
// session-level advisory lock, held for the whole script, makes a second
// concurrent run wait instead of interleaving.
//
// This uses pg_try_advisory_lock (non-blocking) in a bounded retry loop
// rather than the blocking pg_advisory_lock. A blocking lock is only as
// safe as every holder's guarantee to release it — if a previous run gets
// force-killed (a Vercel build timeout, an OOM) before its cleanup code
// runs, the lock leaks and every future deploy hangs on it forever (or
// until the platform's own statement_timeout kills the wait, which is
// what happened here). Giving up after a bounded wait and proceeding
// without the lock trades a small window of race risk for a build that
// can never be permanently bricked by a stuck lock.
const LOCK_KEY = 'transformidable-cms-migrate'
const lockClient = new pg.Client({ connectionString })
await lockClient.connect()

let haveLock = false
console.log('[migrate] Acquiring migration lock...')
for (let attempt = 1; attempt <= 6; attempt++) {
  const { rows } = await lockClient.query('SELECT pg_try_advisory_lock(0, hashtext($1)) AS locked', [LOCK_KEY])
  if (rows[0].locked) {
    haveLock = true
    console.log('[migrate] Lock acquired.')
    break
  }
  console.log(`[migrate] Lock held by another process (attempt ${attempt}/6) — retrying in 5s...`)
  await new Promise((resolve) => setTimeout(resolve, 5000))
}
if (!haveLock) {
  console.warn('[migrate] Could not acquire migration lock after 30s — a previous run may have leaked it. Proceeding without it rather than hanging the build.')
}

let payload: any = null
let fatalError: unknown = null

try {
  // ── Phase 1: Raw PG connection to diagnose & fix enum mismatches ───────
  // When pushSchema() recreates enum types and casts TEXT columns back,
  // any row with a value not in the new enum causes error 22P02 (enum_in).
  // We must convert ALL enum columns to TEXT, clean stale data, then drop types.
  const client = new pg.Client({ connectionString })
  await client.connect()

  // Known value renames (old DB value → new code value)
  const valueRenames: Record<string, string> = {
    'jerribland.com': 'jerribland',
    'agentpmo.com': 'agentpmo',
    'prept.com': 'prept',
    'lumynr.com': 'lumynr',
    'vettersgroup.com': 'vettersgroup',
    'sent': 'published',
  }

  // All tables+columns that hold enum data, with their valid values.
  // Includes main tables, junction tables (hasMany selects), and version tables.
  const enumColumns: { table: string; column: string; validValues: string[] }[] = [
    // Articles
    { table: 'articles_syndicate_to', column: 'value', validValues: ['jerribland', 'agentpmo', 'prept', 'lumynr', 'vettersgroup', 'cio-advisra'] },
    { table: 'articles', column: 'status', validValues: ['draft', 'review', 'scheduled', 'published'] },
    // Articles versions
    { table: '_articles_v_version_syndicate_to', column: 'value', validValues: ['jerribland', 'agentpmo', 'prept', 'lumynr', 'vettersgroup', 'cio-advisra'] },
    { table: '_articles_v', column: 'version_status', validValues: ['draft', 'review', 'scheduled', 'published'] },
    // Podcast Episodes
    { table: 'podcast_episodes_syndicate_to', column: 'value', validValues: ['jerribland', 'agentpmo', 'prept', 'lumynr', 'vettersgroup'] },
    { table: 'podcast_episodes', column: 'status', validValues: ['draft', 'review', 'scheduled', 'published'] },
    // Podcast Episodes versions
    { table: '_podcast_episodes_v_version_syndicate_to', column: 'value', validValues: ['jerribland', 'agentpmo', 'prept', 'lumynr', 'vettersgroup'] },
    { table: '_podcast_episodes_v', column: 'version_status', validValues: ['draft', 'review', 'scheduled', 'published'] },
    // Documents
    { table: 'documents_brand', column: 'value', validValues: ['jlynne', 'transformidable', 'jerribland'] },
    { table: 'documents_service_areas', column: 'value', validValues: ['ai', 'erp-core', 'general-technology', 'mergers-acquisitions', 'fractional-cio', 'leadership-transitions', 'transformations'] },
    { table: 'documents', column: 'sector', validValues: ['general', 'highered-nonprofit', 'credit-unions'] },
    { table: 'documents', column: 'document_type', validValues: ['overview', 'checklist', 'guide', 'brief', 'framework', 'template', 'worksheet', 'report'] },
    { table: 'documents', column: 'status', validValues: ['draft', 'published'] },
    // Academy Inquiries
    { table: 'academy_inquiries', column: 'type', validValues: ['dedicated', 'interest', 'organization', 'individual'] },
    { table: 'academy_inquiries', column: 'sector', validValues: ['local-government', 'higher-education', 'financial-services', 'nonprofit', 'healthcare', 'corporate', 'other'] },
    { table: 'academy_inquiries', column: 'program', validValues: ['foundation-certificate', 'course-1', 'course-2', 'course-3', 'executive-briefing', 'not-sure'] },
    { table: 'academy_inquiries', column: 'participants', validValues: ['1-9', '10-24', '25-49', '50-plus', 'not-sure'] },
    { table: 'academy_inquiries', column: 'delivery', validValues: ['in-person', 'virtual', 'hybrid', 'no-preference'] },
    { table: 'academy_inquiries', column: 'timeframe', validValues: ['0-3-months', '3-6-months', '6-12-months', 'exploring'] },
    { table: 'academy_inquiries', column: 'status', validValues: ['new', 'contacted', 'qualified', 'closed'] },
    // Courses
    { table: 'courses', column: 'level', validValues: ['foundations', 'workshop', 'applied'] },
    { table: 'courses', column: 'buying_model', validValues: ['per-seat', 'private-organization', 'private-program'] },
    { table: 'courses', column: 'availability', validValues: ['scheduled', 'private', 'coming'] },
    { table: 'courses_offerings', column: 'value', validValues: ['open', 'private'] },
    // Subscribers
    { table: 'subscribers_lists', column: 'value', validValues: ['brief', 'book'] },
    // Newsletter Issues
    { table: 'newsletter_issues', column: 'status', validValues: ['draft', 'scheduled', 'published'] },
    // Users
    { table: 'users', column: 'role', validValues: ['admin', 'editor', 'brandContributor', 'sponsorManager'] },
    // Authors
    { table: 'authors', column: 'type', validValues: ['staff', 'guestContributor', 'podcastGuest'] },
    { table: 'authors_social_links', column: 'platform', validValues: ['linkedin', 'twitter', 'website', 'instagram', 'other'] },
    // Sponsors
    { table: 'sponsors_ad_creative', column: 'format', validValues: ['image', 'audio', 'html'] },
    { table: 'sponsors', column: 'placement_type', validValues: ['podcastMidRoll', 'articleSidebar', 'newsletter'] },
  ]

  try {
    // Dump all enum types and values for diagnostics
    const { rows: enumRows } = await client.query(`
      SELECT t.typname AS enum_name, e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder
    `)
    console.log('[migrate] Current DB enums:')
    for (const row of enumRows) {
      console.log(`  ${row.enum_name}: ${row.enum_value}`)
    }

    // Step 1: Convert ALL enum columns to TEXT (so DROP TYPE doesn't fail)
    // Query every column that uses a user-defined enum type
    const { rows: allEnumCols } = await client.query(`
      SELECT c.table_schema, c.table_name, c.column_name, c.udt_name
      FROM information_schema.columns c
      WHERE c.data_type = 'USER-DEFINED'
        AND c.table_schema = 'public'
        AND c.udt_name IN (SELECT typname FROM pg_type WHERE oid IN (SELECT enumtypid FROM pg_enum))
    `)
    console.log(`[migrate] Found ${allEnumCols.length} enum columns to convert to TEXT`)

    for (const col of allEnumCols) {
      try {
        await client.query(
          `ALTER TABLE "${col.table_name}" ALTER COLUMN "${col.column_name}" TYPE TEXT USING "${col.column_name}"::TEXT`
        )
        console.log(`  Converted ${col.table_name}.${col.column_name} (was ${col.udt_name}) to TEXT`)
      } catch (e: any) {
        console.log(`  Warning converting ${col.table_name}.${col.column_name}: ${e.message}`)
      }
    }

    // Step 2: Drop ALL Payload enum types
    const payloadEnumTypes = [...new Set(enumRows
      .map((r: any) => r.enum_name as string)
      .filter((n: string) => n.startsWith('enum_'))
    )]
    for (const enumName of payloadEnumTypes) {
      await client.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE`)
      console.log(`  Dropped enum ${enumName}`)
    }

    // Step 3: Clean data in ALL known tables — rename stale values, null invalids
    for (const { table, column, validValues } of enumColumns) {
      // Check if table exists
      const { rows: tableExists } = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      )
      if (!tableExists.length) {
        console.log(`  Table ${table} does not exist — skipping`)
        continue
      }

      // Check if column exists
      const { rows: colExists } = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
      )
      if (!colExists.length) {
        console.log(`  Column ${table}.${column} does not exist — skipping`)
        continue
      }

      // Apply known renames
      for (const [oldVal, newVal] of Object.entries(valueRenames)) {
        const res = await client.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`,
          [newVal, oldVal]
        )
        if (res.rowCount && res.rowCount > 0) {
          console.log(`  Updated ${table}.${column}: '${oldVal}' → '${newVal}' (${res.rowCount} rows)`)
        }
      }

      // Null out any remaining values that aren't in the valid set
      const res = await client.query(
        `UPDATE "${table}" SET "${column}" = NULL WHERE "${column}" IS NOT NULL AND "${column}" != ALL($1)`,
        [validValues]
      )
      if (res.rowCount && res.rowCount > 0) {
        console.log(`  Nulled ${res.rowCount} invalid values in ${table}.${column}`)
      }
    }

    // Step 4: Truncate version history tables to avoid SET NOT NULL failures
    // during schema push. These tables only store historical snapshots — the
    // actual articles/episodes in the main tables are unaffected.
    // This is far more robust than trying to backfill every possible NULL column.
    //
    // Opt-in (MIGRATE_TRUNCATE_VERSIONS=true): it deletes version history, and
    // more than one deployment now builds against this database, so it must
    // not happen on every build. Set it only for a build whose push fails on
    // a NOT NULL change to one of these tables.
    const versionTables = process.env.MIGRATE_TRUNCATE_VERSIONS === 'true' ? ['_articles_v', '_podcast_episodes_v'] : []
    for (const vt of versionTables) {
      try {
        // Also truncate associated junction tables first (FK constraints)
        const junctionTable = `${vt}_version_syndicate_to`
        await client.query(`TRUNCATE TABLE "${junctionTable}" CASCADE`).catch(() => {})
        const res = await client.query(`TRUNCATE TABLE "${vt}" CASCADE`)
        console.log(`  Truncated ${vt} (version history cleared)`)
      } catch (e: any) {
        if (!e.message.includes('does not exist')) {
          console.log(`  Could not truncate ${vt}: ${e.message}`)
        }
      }
    }

    // Step 5: Drop tables/columns that were renamed or removed in code. Without
    // this, drizzle-kit push sees an add+drop pair and stops to ask "Is X
    // created or renamed from Y?" — an interactive prompt that hangs a
    // non-interactive CI build. Pre-dropping the old objects makes the change a
    // set of unambiguous CREATEs/ADDs, which push applies without prompting.
    // All statements are IF EXISTS, so they are no-ops on a fresh database.
    const staleTables = ['case_files_exhibit', 'case_files_research_notes']
    for (const t of staleTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${t}" CASCADE`)
        console.log(`  Dropped stale table ${t} (renamed/removed in code)`)
      } catch (e: any) {
        console.log(`  Could not drop ${t}: ${e.message}`)
      }
    }
    const staleColumns: { table: string; column: string }[] = [
      { table: 'case_files', column: 'body' },
      { table: 'case_files', column: 'exhibit_label' },
      // Interim coding fields, replaced by the per-question codes (design,
      // operational, evidence, relationship, effectiveness). Dropping them here
      // keeps the schema push from seeing an add+drop pair and stopping to ask
      // whether a column was renamed — an interactive prompt that hangs the build.
      { table: 'case_files_governance_mechanisms', column: 'domain' },
      { table: 'case_files_governance_mechanisms', column: 'outcome' },
      // Media lost its image sizes and focal point when sharp was dropped for
      // Cloudflare Workers, in the same change that added the storage
      // plugin's prefix column — an add+drop pair on one table.
      { table: 'media', column: 'focal_x' },
      { table: 'media', column: 'focal_y' },
      ...['thumbnail', 'card', 'hero'].flatMap((size) =>
        ['url', 'width', 'height', 'mime_type', 'filesize', 'filename'].map((field) => ({
          table: 'media',
          column: `sizes_${size}_${field}`,
        })),
      ),
      // Courses: every course now has a page, in the same change that added
      // the private-session fields (an add+drop pair on one table).
      { table: 'courses', column: 'has_page' },
    ]
    for (const { table, column } of staleColumns) {
      try {
        await client.query(`ALTER TABLE IF EXISTS "${table}" DROP COLUMN IF EXISTS "${column}"`)
        console.log(`  Dropped stale column ${table}.${column} (renamed/removed in code)`)
      } catch (e: any) {
        console.log(`  Could not drop ${table}.${column}: ${e.message}`)
      }
    }

    console.log('[migrate] Phase 1 complete — enums dropped and data cleaned.')
  } catch (e: any) {
    console.error('[migrate] Phase 1 error:', e.message)
    console.error(e)
  } finally {
    await client.end()
  }

  // ── Phase 2: Normal Payload init + schema push ─────────────────────────
  const { getPayload } = await import('payload')
  const { default: config } = await import('./payload.config.ts')

  payload = await getPayload({ config })
  const adapter = payload.db as any

  console.log('[migrate] Pushing schema to database...')
  const { pushSchema } = adapter.requireDrizzleKit()
  const { apply, hasDataLoss, warnings, statementsToExecute: statements = [] } = await pushSchema(
    adapter.schema,
    adapter.drizzle,
    adapter.schemaName ? [adapter.schemaName] : undefined,
    adapter.tablesFilter,
    adapter.extensions?.postgis ? ['postgis'] : undefined,
  )

  console.log('[migrate] Statements to apply:', JSON.stringify(statements, null, 2))

  if (warnings.length) {
    console.log('[migrate] Push warnings:', warnings.join('\n'))
    if (hasDataLoss) {
      console.log('[migrate] DATA LOSS WARNING — proceeding (legacy columns preserved via hidden fields)')
    }
  }

  // Refuse a push that would drop a table or column. More than one deployment
  // builds against this database (the Transformidable and J. Lynne accounts),
  // and one built from code that lacks a newer collection would otherwise
  // delete that collection's data here. Planned removals are pre-dropped in
  // Phase 1 (staleTables/staleColumns), so a normal push has nothing to drop.
  // To accept a drop deliberately, rerun with ALLOW_SCHEMA_DROPS=true.
  const drops = (statements as string[]).filter((sql) => /\bDROP\s+(TABLE|COLUMN)\b/i.test(sql))
  if (drops.length && process.env.ALLOW_SCHEMA_DROPS !== 'true') {
    throw new Error(
      `Schema push would drop data and was stopped:\n${drops.join('\n')}\n` +
        'If this build is from older code than the database, deploy the newer code instead. ' +
        'If the drop is intended, rerun with ALLOW_SCHEMA_DROPS=true.',
    )
  }

  await apply()
  console.log('[migrate] Schema push complete.')

  await payload.db.migrate()

  // ── Phase 2.5: Seed the Topic vocabulary (idempotent) ──────────────────
  try {
    const { seedTopics } = await import('./seed/topics.ts')
    await seedTopics(payload)
    console.log('[migrate] Topic seed complete.')
  } catch (e: any) {
    // Never let seeding break the deploy.
    console.error('[migrate] Topic seed error:', e.message)
  }

  // ── Phase 2.7: Load committed governance coding sheets ─────────────────
  // Every CSV in src/seed/coding is applied to the case file whose slug matches
  // its filename (coding/ucpath.csv -> the "ucpath" case). This is how coding
  // reaches production: the sheet is edited in the repo and the deploy applies
  // it, so no one needs a local checkout or the production database URL.
  //
  // Applying is idempotent — it reconciles the case's findings to the sheet, so
  // re-running on every deploy is a no-op once they already match.
  //
  // A bad sheet must not take the site down with it, so a failure here is
  // logged and the deploy continues, matching the seeds above. It is not silent
  // though: the problems are printed in full, and the case page shows its
  // Governance Outcomes section as Pending rather than pretending to be
  // complete, so a sheet that failed to load is visible rather than assumed.
  try {
    const { readdirSync, readFileSync, existsSync } = await import('fs')
    const nodePath = await import('path')
    const { fileURLToPath } = await import('url')
    // Resolve from this file, not the working directory: the build invokes
    // this script from the project root today, but that is not a guarantee.
    const here = nodePath.dirname(fileURLToPath(import.meta.url))
    const codingDir = nodePath.resolve(here, 'seed/coding')
    if (existsSync(codingDir)) {
      const { parseCodingSheet, applyCoding } = await import('./lib/importCoding.ts')
      const sheets = readdirSync(codingDir).filter((f: string) => f.toLowerCase().endsWith('.csv'))
      if (!sheets.length) console.log('[migrate] No coding sheets to load.')
      for (const sheet of sheets) {
        const caseSlug = sheet.replace(/\.csv$/i, '')
        const parsed = parseCodingSheet(readFileSync(nodePath.join(codingDir, sheet), 'utf8'))
        if (parsed.problems.length) {
          console.error(`[migrate] Coding sheet ${sheet} has ${parsed.problems.length} problem(s) — not applied:`)
          for (const problem of parsed.problems) console.error(`    • ${problem}`)
          continue
        }
        const result = await applyCoding(payload, caseSlug, parsed)
        if (result.error) {
          console.error(`[migrate] Coding sheet ${sheet}: ${result.error} — not applied.`)
          continue
        }
        console.log(
          `[migrate] Coding ${caseSlug}: ${result.total} segments (${result.counted} narrative findings) · ` +
            `+${result.added.length} ~${result.changed.length} -${result.removed.length}`,
        )
      }
    }
  } catch (e: any) {
    console.error('[migrate] Coding sheet load error:', e.message)
  }

  // ── Phase 2.55: Academy courses and page copy (first run only) ─────────
  try {
    const { seedAcademy } = await import('./seed/academy.ts')
    await seedAcademy(payload)
    console.log('[migrate] Academy seed complete.')
  } catch (e: any) {
    console.error('[migrate] Academy seed error:', e.message)
  }

  // ── Phase 2.6: Retire Unlimited Powerhouse (authors + brand pillars) ───
  try {
    const { retireUnlimitedPowerhouse } = await import('./seed/retire-unlimited-powerhouse.ts')
    await retireUnlimitedPowerhouse(payload)
    console.log('[migrate] Unlimited Powerhouse retirement complete.')
  } catch (e: any) {
    console.error('[migrate] Unlimited Powerhouse retirement error:', e.message)
  }

  // ── Phase 3: Enable Row Level Security on all public tables ────────────
  // Supabase exposes the public schema through PostgREST. Without RLS, the
  // anon/authenticated API roles can read every row. Payload connects as the
  // schema owner / a BYPASSRLS role, so enabling RLS without any policies
  // locks out the API while leaving Payload unaffected. Don't FORCE RLS —
  // that would apply it to the owner too and break Payload.
  const rlsClient = new pg.Client({ connectionString })
  await rlsClient.connect()
  try {
    const { rows: publicTables } = await rlsClient.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `)
    for (const { tablename } of publicTables) {
      await rlsClient.query(`ALTER TABLE "public"."${tablename}" ENABLE ROW LEVEL SECURITY`)
    }
    console.log(`[migrate] RLS enabled on ${publicTables.length} public tables.`)
  } catch (e: any) {
    console.error('[migrate] RLS enablement error:', e.message)
    throw e
  } finally {
    await rlsClient.end()
  }
} catch (e: unknown) {
  fatalError = e
} finally {
  // Only release if we actually hold it — unlocking a lock this session
  // never acquired is a harmless no-op, but logging would be misleading.
  if (haveLock) {
    await lockClient
      .query('SELECT pg_advisory_unlock(0, hashtext($1))', [LOCK_KEY])
      .catch((e: any) => console.error('[migrate] Failed to release migration lock:', e.message))
    console.log('[migrate] Lock released.')
  }
  await lockClient.end().catch(() => {})
}

if (payload) {
  await payload.destroy().catch(() => {})
}

if (fatalError) {
  console.error('[migrate] Fatal error:', fatalError)
  process.exit(1)
}

process.exit(0)
