// The Academy on the main site: course copy from Payload (Courses, Academy
// Page), joined to dates, seats and prices from the class platform.
//
// The class platform is the `academy` Worker (repo phousecos/webinar,
// live.betransformidable.com). It owns sessions, seats, prices, registration
// and payment; this site only reads its public feed, the same feed format as
// the briefings (lib/briefings.ts), with each date's price and seats added.
// A course is matched to its series by Courses → "Webinar series slug".
//
// On Cloudflare the feed is read through the ACADEMY service binding
// (wrangler.jlynne.jsonc); elsewhere from ACADEMY_FEED_URL, defaulting to the
// public address. The feed is cached for five minutes there, and these pages
// render on every request, so a change in either system shows up on its own.

import { cache } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'
import { SITE_CAMPAIGN, type BriefingSeries, type BriefingSession } from './briefings.ts'

export type AcademySession = BriefingSession & {
  priceCents: number
  regularPriceCents: number
  capacity: number | null
  seatsLeft: number | null
  full: boolean
}

export type AcademySeries = Omit<BriefingSeries, 'sessions'> & {
  liveClass: boolean
  currency: string
  priceCents: number
  sessions: AcademySession[]
}

type Feed = { generatedAt: string; source: string; series: AcademySeries[] }

const ACADEMY_ORIGIN = 'https://live.betransformidable.com'
const FEED_PATH = '/api/public/briefings.json'
const FEED_URL = process.env.ACADEMY_FEED_URL || `${ACADEMY_ORIGIN}${FEED_PATH}`
const TIMEOUT_MS = 5000

/** Times on the Academy pages are shown in Eastern; confirmations show local time. */
export const ACADEMY_TIMEZONE = 'America/New_York'

async function fetchFeed(): Promise<Feed | null> {
  let binding: { fetch: typeof fetch } | undefined
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    binding = ((await getCloudflareContext({ async: true })) as { env: Record<string, any> }).env.ACADEMY
  } catch {}

  try {
    const res = binding
      ? await binding.fetch(`${ACADEMY_ORIGIN}${FEED_PATH}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      : await fetch(FEED_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return null
    const data = (await res.json()) as Feed
    return Array.isArray(data?.series) ? data : null
  } catch {
    return null
  }
}

/** One fetch per request. null when the class platform can't be reached. */
export const getAcademyFeed = cache(fetchFeed)

export const getAcademyPage = cache(async (): Promise<Record<string, any>> => {
  try {
    const payload = await getPayload({ config })
    return (await payload.findGlobal({ slug: 'academy-page' as any, depth: 1 })) as Record<string, any>
  } catch {
    return {}
  }
})

export const getCourses = cache(async (): Promise<Record<string, any>[]> => {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({ collection: 'courses' as any, limit: 200, depth: 1, sort: 'sortOrder' })
    return res.docs as Record<string, any>[]
  } catch {
    return []
  }
})

export type CatalogCourse = Record<string, any> & {
  href: string | null
  series: AcademySeries | null
  sessions: AcademySession[]
  next: AcademySession | null
}

export const courseHref = (slug: string) => `/academy/courses/${slug}`
export const DEDICATED_HREF = '/academy/dedicated-sessions'
export const INTEREST_HREF = '/academy/interest'

/** Courses joined to their dates: dated courses first, soonest first, then by Order. */
export function buildCatalog(courses: Record<string, any>[], feed: Feed | null): CatalogCourse[] {
  const bySlug = new Map((feed?.series || []).map((s) => [s.slug, s]))
  const out: CatalogCourse[] = courses.map((c) => {
    const series: AcademySeries | null = (c.webinarSeries && bySlug.get(String(c.webinarSeries).trim())) || null
    const sessions: AcademySession[] = c.availability === 'scheduled' && series ? series.sessions : []
    return {
      ...c,
      href: c.hasPage ? courseHref(c.slug) : null,
      series,
      sessions,
      next: sessions.find((s) => !s.full) || sessions[0] || null,
    }
  })
  return out.sort((a, b) => {
    const an = a.next?.startsAt
    const bn = b.next?.startsAt
    if (an && bn && an !== bn) return an.localeCompare(bn)
    if (an && !bn) return -1
    if (bn && !an) return 1
    return (a.sortOrder ?? 100) - (b.sortOrder ?? 100)
  })
}

/** Listed courses with their dates, for the Academy page and the menu. */
export async function getCatalog(): Promise<{ catalog: CatalogCourse[]; feedOk: boolean }> {
  const [courses, feed] = await Promise.all([getCourses(), getAcademyFeed()])
  return { catalog: buildCatalog(courses.filter((c) => c.listed), feed), feedOk: feed !== null }
}

/** The registration link for a date, on the class platform, tagged as coming from the website. */
export function registerHref(series: AcademySeries, session?: AcademySession | null) {
  const u = new URL(series.registerUrl)
  u.searchParams.set('c', SITE_CAMPAIGN)
  if (session) u.searchParams.set('session', String(session.id))
  return u.toString()
}

/** "$199", or "$1,250.50" when there are cents. */
export function money(cents: number, currency = 'usd') {
  const whole = cents % 100 === 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100)
}

/** True when a date is priced below its course's regular price (a founding cohort). */
export const isReduced = (s: AcademySession) => s.regularPriceCents > 0 && s.priceCents < s.regularPriceCents

/** "Tue, Jan 13" and "12:00–1:30 pm ET", in Eastern. */
export function sessionTimes(s: AcademySession) {
  const tz = ACADEMY_TIMEZONE
  const start = new Date(s.startsAt)
  const end = new Date(s.endsAt)
  const date = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(start)
  const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(d)
    const get = (t: string) => p.find((x) => x.type === t)?.value || ''
    return { time: `${get('hour')}:${get('minute')}`, period: get('dayPeriod').toLowerCase() }
  }
  const a = parts(start)
  const b = parts(end)
  const time = a.period === b.period ? `${a.time}–${b.time} ${b.period}` : `${a.time} ${a.period}–${b.time} ${b.period}`
  return { date, time: `${time} ET`, timeBare: time, iso: s.startsAt }
}

/** "9 of 20 seats left", "Full", or null when the date has no seat limit. */
export function seatsText(s: AcademySession) {
  if (s.full) return 'Full'
  if (s.seatsLeft == null || !s.capacity) return null
  return `${s.seatsLeft} of ${s.capacity} seats left`
}

/** The buying model's wording on a card, e.g. "per seat". */
export const BUYING_MODEL_TEXT: Record<string, string> = {
  'per-seat': 'per seat',
  'private-organization': 'private for your organization',
  'private-program': 'private program',
}

export const LEVEL_TEXT: Record<string, string> = { foundations: 'Foundations', workshop: 'Workshop', applied: 'Applied' }

/** The small label on a card: the course code, else the level. */
export const cardLabel = (c: Record<string, any>) => c.code || LEVEL_TEXT[c.level] || ''

/** The course's name as people say it: "TA-101 Know What You're Governing". */
export const fullName = (c: Record<string, any>) => [c.code, c.title].filter(Boolean).join(' ')
