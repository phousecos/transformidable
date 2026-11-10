import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { r2Storage } from '@payloadcms/storage-r2'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import pg from 'pg'
import { isWorkers } from './lib/runtime.ts'

import { Users } from './collections/Users.ts'
import { Media } from './collections/Media.ts'
import { Articles } from './collections/Articles.ts'
import { Publications } from './collections/Publications.ts'
import { CaseFiles } from './collections/CaseFiles.ts'
import { ResearchNotes } from './collections/ResearchNotes.ts'
import { Issues } from './collections/Issues.ts'
import { Verticals } from './collections/Verticals.ts'
import { Topics } from './collections/Topics.ts'
import { Books } from './collections/Books.ts'
import { Subscribers } from './collections/Subscribers.ts'
import { CaseFollows } from './collections/CaseFollows.ts'
import { CaseSubmissions } from './collections/CaseSubmissions.ts'
import { ContactMessages } from './collections/ContactMessages.ts'
import { AcademyInquiries } from './collections/AcademyInquiries.ts'
import { Courses } from './collections/Courses.ts'
import { PodcastEpisodes } from './collections/PodcastEpisodes.ts'
import { Documents } from './collections/Documents.ts'
import { AdvisoryBookings } from './collections/AdvisoryBookings.ts'
import { ToolRequests } from './collections/ToolRequests.ts'
import { Assets } from './collections/library/Assets.ts'
import { AssetFiles } from './collections/library/AssetFiles.ts'
import { ApiClients } from './collections/library/ApiClients.ts'
import { MessageTemplates } from './collections/library/MessageTemplates.ts'
import { MessageSnippets } from './collections/library/MessageSnippets.ts'
import { Senders } from './collections/library/Senders.ts'
import { SiteSettings } from './globals/SiteSettings.ts'
import { TransformidableFeature } from './globals/TransformidableFeature.ts'
import { PodcastSettings } from './globals/PodcastSettings.ts'
import { MessagingSettings } from './globals/MessagingSettings.ts'
import { AcademyPage } from './globals/AcademyPage.ts'

// Legacy collections — kept so Payload can still read/write their DB tables.
// Articles still references authors and brand-pillars via legacy fields.
import { Authors } from './collections/Authors.ts'
import { BrandPillars } from './collections/BrandPillars.ts'
import { Sponsors } from './collections/Sponsors.ts'
import { NewsletterIssues } from './collections/NewsletterIssues.ts'

// Puts collections or globals under one sidebar heading in the admin.
function inGroup<T extends { admin?: Record<string, unknown> }>(group: string, items: T[]): T[] {
  return items.map((item) => ({ ...item, admin: { ...item.admin, group } }))
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Bindings from wrangler.jsonc (R2 bucket, Hyperdrive). The import is dynamic
// so Node never loads the adapter.
const cloudflareEnv = isWorkers
  ? (await import('@opennextjs/cloudflare').then(({ getCloudflareContext }) =>
      getCloudflareContext({ async: true }),
    )).env
  : undefined

// On Workers, prefer the Hyperdrive binding when one is configured.
const hyperdrive = cloudflareEnv?.HYPERDRIVE

// Force sslmode=no-verify on remote databases so pg accepts the database's
// certificate. Setting ssl in the pool config doesn't work because pg's
// Object.assign overwrites it with the sslmode parsed from the connection
// string. Local databases are left alone, since they usually don't speak TLS,
// and so is Hyperdrive, which handles TLS to the database itself.
const rawConnectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
const isLocalDatabase = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(rawConnectionString)
const connectionString = hyperdrive
  ? hyperdrive.connectionString
  : rawConnectionString && !isLocalDatabase
    ? rawConnectionString.includes('sslmode=')
      ? rawConnectionString.replace(/sslmode=[^&]*/, 'sslmode=no-verify')
      : rawConnectionString + (rawConnectionString.includes('?') ? '&' : '?') + 'sslmode=no-verify'
    : rawConnectionString

// On Workers every connection is closed straight after use (see the pool
// options below). Closing a Cloudflare socket fails its pending read with
// "This socket has been closed", which pg-pool re-emits as a pool 'error'
// event; with no listener, every query would log an unhandled rejection.
// The connection has already been released and discarded by then, so the
// error is safe to drop.
type PostgresAdapterArgs = Parameters<typeof postgresAdapter>[0]
class WorkersPool extends pg.Pool {
  constructor(...args: ConstructorParameters<typeof pg.Pool>) {
    super(...args)
    this.on('error', () => {})
  }
}

// Payload's default logger (pino) expects Node; on Workers, log plain JSON
// lines to the console, which Workers Logs indexes.
const workersLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }
const workersLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: workersLog('trace', console.debug),
  debug: workersLog('debug', console.debug),
  info: workersLog('info', console.log),
  warn: workersLog('warn', console.warn),
  error: workersLog('error', console.error),
  fatal: workersLog('fatal', console.error),
  silent: () => {},
} as any // Payload doesn't export its logger type

// The admin's own address (https://cms.transformidablethinking.com). serverURL
// feeds the CSRF allowlist below (Payload appends it during config
// sanitization), so pointing it at the wrong host silently locks the admin out
// of its own API.
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || ''

// Origins allowed to carry the admin session cookie on API requests.
//
// Payload matches the browser's Origin header against this list with an exact
// string comparison (auth/extractJWT.js). On a miss it does not reject the
// request — it silently drops the session cookie, so the call is processed as
// unauthenticated and returns 401. Nothing identifies CSRF as the reason.
//
// In the admin that failure is invisible and badly misleading: adding an array
// row 401s on the doc-preferences call it makes first, so the new row shimmers
// forever with no error; and logout cannot authenticate, so the cookie is
// never cleared and you land back on the dashboard still logged in. Meanwhile
// every page still renders fine, because server-side rendering reads the
// cookie directly and never goes through this check.
//
// So: every host the admin is actually served from must be listed here, and
// the cost of omitting one is hours of misdirected debugging.
//
// This list must track the domains attached to the Worker, NOT the domain we
// currently consider canonical.
// The legacy transformidable.media domains are still attached and still
// serving production, so the admin is reachable at them; when the rename to
// transformidablethinking.com edited the single hardcoded entry here, it
// silently locked out anyone still using a .media URL. Retiring a domain on
// the host is what should remove it from this list.
//
// Any extra host the admin is opened at (the workers.dev URL, a preview URL)
// must be added through PAYLOAD_CSRF_ORIGINS.
const csrfOrigins = Array.from(
  new Set(
    [
      serverURL,
      // Every production domain attached to this project. These are all
      // this app served from its own hosts, so allowing them is what the CSRF
      // list is for — it is unrelated to keeping third-party origins out.
      'https://cms.transformidablethinking.com',
      'https://transformidablethinking.com',
      'https://www.transformidablethinking.com',
      'https://cms.transformidable.media',
      'https://transformidable.media',
      'https://www.transformidable.media',
      // The jlynne-cms Worker in the J. Lynne Cloudflare account: the admin
      // (transformidable.net), the public site (betransformidable.com), and
      // the old library address it still answers on.
      'https://transformidable.net',
      'https://www.transformidable.net',
      'https://jlynne.io',
      'https://betransformidable.com',
      'https://www.betransformidable.com',
      // Escape hatch: comma-separated extra origins. Lets a domain change be
      // fixed with an env var instead of a code change and a redeploy.
      ...(process.env.PAYLOAD_CSRF_ORIGINS?.split(',').map((origin) => origin.trim()) ?? []),
    ].filter(Boolean) as string[],
  ),
)

export default buildConfig({
  serverURL,

  // CORS: origins permitted to read responses from the Payload REST/GraphQL
  // API. These are the public brand sites that may call the read-only API.
  cors: [
    'https://betransformidable.com',
    'https://www.betransformidable.com',
    'https://transformidablethinking.com',
    'https://www.transformidablethinking.com',
    'https://jerribland.com',
    'https://lumynr.com',
    'https://agentpmo.com',
    'https://vettersgroup.com',
    // KADE Analytics, in case it reads Assets from the browser rather than
    // its server. Reads still need its api-clients key.
    'https://kadeanlytics.com',
    'https://www.kadeanlytics.com',
  ],

  // CSRF: only requests from these origins can carry the admin session cookie
  // and mutate data. Without this, any site a logged-in admin visits could
  // POST to the CMS API on their behalf.
  csrf: csrfOrigins,

  admin: {
    // The import map is generated at build time under Node, where the R2
    // plugin isn't active (no bucket binding), so it would leave out R2's
    // browser-upload handler and the admin on Workers would fail to find it.
    dependencies: {
      '@payloadcms/storage-r2/client#R2ClientUploadHandler': {
        type: 'function',
        path: '@payloadcms/storage-r2/client#R2ClientUploadHandler',
      },
    },
    user: Users.slug,
    meta: {
      titleSuffix: '— Transformidable CMS',
    },
  },

  localization: {
    locales: ['en'],
    defaultLocale: 'en',
  },

  editor: lexicalEditor(),

  // Case-follow digest emails (see api/cron/case-digest) need an adapter to
  // actually send through. Sends via Proton SMTP. Falls back to Payload's
  // default no-op/console adapter when the SMTP env vars aren't set, so
  // local dev without them doesn't break.
  // Note: if SMTP_HOST points at a local Proton Mail Bridge instance, it
  // must be reachable from wherever this app runs (e.g. a persistent
  // server or a Bridge instance exposed to Vercel) — Bridge running on a
  // developer's laptop won't be reachable from serverless functions.
  email:
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      ? nodemailerAdapter({
          defaultFromAddress: process.env.EMAIL_FROM || 'hello@betransformidable.com',
          defaultFromName: 'Transformidable',
          // Payload otherwise waits on an SMTP handshake every time it starts,
          // which on Workers is every cold request. Bad credentials still
          // surface when a message is actually sent.
          skipVerify: isWorkers,
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
        })
      : undefined,

  // Sidebar headings follow the divisions. Groups are set here, not in each
  // collection, so the whole layout reads in one place; order is the order
  // the headings appear.
  collections: [
    ...inGroup('Research', [CaseFiles, ResearchNotes, Publications, CaseSubmissions, CaseFollows, Topics, Verticals]),
    ...inGroup('Advisory', [Assets, AssetFiles, MessageTemplates, MessageSnippets, Senders, AdvisoryBookings, ToolRequests, ApiClients]),
    ...inGroup('Academy', [Courses, AcademyInquiries]),
    ...inGroup('Publishing & Media', [Books, PodcastEpisodes, Articles, Issues]),
    ...inGroup('Audience', [Subscribers, ContactMessages]),
    ...inGroup('Site', [Media, Documents, Users]),
    // Legacy collections — hidden from nav, kept for data access
    { ...Authors, admin: { ...Authors.admin, hidden: true } },
    { ...BrandPillars, admin: { ...BrandPillars.admin, hidden: true } },
    { ...Sponsors, admin: { ...Sponsors.admin, hidden: true } },
    { ...NewsletterIssues, admin: { ...NewsletterIssues.admin, hidden: true } },
  ],

  globals: [
    ...inGroup('Site', [SiteSettings, TransformidableFeature, PodcastSettings]),
    ...inGroup('Advisory', [MessagingSettings]),
    ...inGroup('Academy', [AcademyPage]),
  ],

  logger: isWorkers ? workersLogger : undefined,

  db: postgresAdapter({
    // Cast: the adapter pins its own copy of @types/pg, which differs from ours.
    ...(isWorkers ? { pg: { ...pg, Pool: WorkersPool } as unknown as PostgresAdapterArgs['pg'] } : {}),
    pool: {
      connectionString,
      // Workers tear down a socket when the request that opened it ends, but
      // this pool outlives requests. So on Workers no connection may pass
      // between requests: maxUses closes each one after a single use, and the
      // effectively unlimited max means a caller never queues for a
      // connection, since a queued caller is handed one opened by whichever
      // request released last — and loses it when that request finishes
      // ("This socket has been closed"). Hyperdrive makes reconnecting cheap.
      ...(isWorkers ? { maxUses: 1, max: 10_000 } : {}),
    },
    push: false,
  }),

  secret: (() => {
    const secret = process.env.PAYLOAD_SECRET
    if (secret) return secret
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYLOAD_SECRET is required in production')
    }
    return 'dev-only-insecure-secret'
  })(),

  // No sharp: it is a native module and cannot run on Workers. Uploads keep
  // their original file; see the Media collection.

  typescript: {
    // Off: outside production, Payload otherwise starts `generate:types` in the
    // background whenever it boots (dev, the build's migrate step, scripts)
    // and quietly replaces the placeholder payload-types.ts. The code doesn't
    // type-check against the generated types yet, so a generated file that
    // gets committed — or lands mid-build — fails `next build`. Run
    // `npm run generate:types` by hand when the types are wanted.
    autoGenerate: false,
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  plugins: [
    // Media and document storage. Files are keyed by filename in every store
    // and served through Payload at /api/<collection>/file/<filename>;
    // documents sit under their own documents/ prefix in the bucket.
    //
    // alwaysInsertFields is set on every branch because the storage plugin
    // adds columns to the media table (_object_key, prefix). The schema is
    // pushed by src/migrate.ts under Node, where the R2 binding doesn't exist;
    // without identical fields there, that push would drop columns the Worker
    // then queries.
    cloudflareEnv?.MEDIA_BUCKET
      ? // Cloudflare: R2 through the binding. clientUploads sends files from
        // the browser in chunks, so a large upload (podcast audio) never has
        // to fit in one request or in the Worker's memory.
        r2Storage({
          alwaysInsertFields: true,
          bucket: cloudflareEnv.MEDIA_BUCKET,
          clientUploads: true,
          collections: {
            media: true,
            documents: { prefix: 'documents' },
            'asset-files': { prefix: 'asset-files' },
          },
        })
      : // Under Node (build-time migrations, local dev): fields only, and
        // files stay on local disk.
        cloudStoragePlugin({
          alwaysInsertFields: true,
          collections: {
            media: { adapter: null },
            documents: { adapter: null, prefix: 'documents' },
            'asset-files': { adapter: null, prefix: 'asset-files' },
          },
          enabled: false,
        }),
  ],
})
