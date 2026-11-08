// Briefings (webinars) shown on the main site.
//
// The briefings platform (the `briefings` Worker, repo phousecos/webinar,
// briefings.betransformidable.com) owns everything about a briefing: series,
// dates, registration, email, the briefing room, and its admin. The main site
// only shows the public side, read from that Worker's feed, so each topic has
// an indexable page on betransformidable.com. Register and Watch buttons go to
// the briefings site.
//
// On Cloudflare the feed is read through the BRIEFINGS service binding
// (wrangler.jlynne.jsonc): a Worker can't reliably fetch another Worker on the
// same zone by URL. Elsewhere (next dev, builds) it's fetched from
// BRIEFINGS_FEED_URL, defaulting to the public address.

import { cache } from 'react'

export type BriefingSession = {
  id: number
  startsAt: string
  endsAt: string
  durationMinutes: number
  title: string | null
  coverUrl: string | null
  host: string | null
}

export type BriefingSeries = {
  slug: string
  name: string
  tagline: string
  description: string
  formatLabel: string
  program: string
  timezone: string
  durationMinutes: number
  topics: { slug: string; name: string }[]
  coverUrl: string | null
  host: { name: string; bio: string; photoUrl: string | null } | null
  registerUrl: string
  onDemand: boolean
  watchUrl: string | null
  updatedAt: string
  sessions: BriefingSession[]
}

export type BriefingsFeed = { generatedAt: string; source: string; series: BriefingSeries[] }

const FEED_PATH = '/api/public/briefings.json'
const FEED_URL = process.env.BRIEFINGS_FEED_URL || `https://briefings.betransformidable.com${FEED_PATH}`
const TIMEOUT_MS = 5000

// Campaign tag on links from the main site, so registrations that came from
// these pages show as "website" in the briefings admin and CSV exports.
export const SITE_CAMPAIGN = 'website'

async function fetchFeed(): Promise<BriefingsFeed | null> {
  let binding: { fetch: typeof fetch } | undefined
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    binding = ((await getCloudflareContext({ async: true })) as { env: Record<string, any> }).env.BRIEFINGS
  } catch {}

  try {
    const res = binding
      ? await binding.fetch(`https://briefings.betransformidable.com${FEED_PATH}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      : await fetch(FEED_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return null
    const data = (await res.json()) as BriefingsFeed
    return Array.isArray(data?.series) ? data : null
  } catch {
    return null
  }
}

// One fetch per request, shared by generateMetadata and the page.
// null means the briefings platform couldn't be reached.
export const getBriefings = cache(fetchFeed)

export const upcomingSeries = (feed: BriefingsFeed) =>
  feed.series
    .filter((s) => s.sessions.length > 0)
    .sort((a, b) => a.sessions[0].startsAt.localeCompare(b.sessions[0].startsAt))

export const recordedSeries = (feed: BriefingsFeed) => feed.series.filter((s) => s.onDemand && s.watchUrl)

/** A briefings-site link tagged with the website campaign. */
export function tagged(url: string, extra: Record<string, string> = {}) {
  const u = new URL(url)
  u.searchParams.set('c', SITE_CAMPAIGN)
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v)
  return u.toString()
}

/** "Wednesday, December 9, 2026" and "12:00 PM EST" in the series' time zone. */
export function sessionWhen(startsAt: string, timeZone: string) {
  const d = new Date(startsAt)
  return {
    date: new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d),
    time: new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d),
    short: new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(d),
  }
}

export const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
