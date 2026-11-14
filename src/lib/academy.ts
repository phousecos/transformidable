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

/** A later part of a class in parts: registering for the date registers for every part. */
export type AcademyPart = { id: number; startsAt: string; endsAt: string; durationMinutes: number }

/** How a date is taught. Older feeds send no format: treat them as one online session. */
export type AcademyFormat = 'online_one' | 'online_two' | 'in_person'

export type AcademySession = BriefingSession & {
  format?: AcademyFormat
  /** "Online · two sessions", "In person · Raleigh, NC". */
  formatText?: string
  location?: string | null
  parts?: AcademyPart[]
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
  href: string
  series: AcademySeries | null
  sessions: AcademySession[]
  next: AcademySession | null
}

export const courseHref = (slug: string) => `/academy/courses/${slug}`
export const DEDICATED_HREF = '/academy/dedicated-sessions'
export const INTEREST_HREF = '/academy/interest'

const offers = (c: Record<string, any>, what: 'open' | 'private') => Array.isArray(c.offerings) && c.offerings.includes(what)
/** Offered now (not "Coming") in open cohorts, per seat. */
export const offersOpen = (c: Record<string, any>) => c.availability !== 'coming' && offers(c, 'open')
/** Offered now as a private session for one organization. */
export const offersPrivate = (c: Record<string, any>) => c.availability !== 'coming' && offers(c, 'private')
/** Open cohorts, whether offered now or coming. */
export const isPerSeat = (c: Record<string, any>) => offers(c, 'open')

/** "per seat or private for your organization", "per seat", "private for your organization". */
export function offeringsText(c: Record<string, any>) {
  const parts = [offers(c, 'open') && 'per seat', offers(c, 'private') && 'private for your organization'].filter(Boolean)
  return parts.join(' or ')
}

/** Courses joined to their dates: dated courses first, soonest first, then by Order. */
export function buildCatalog(courses: Record<string, any>[], feed: Feed | null): CatalogCourse[] {
  const bySlug = new Map((feed?.series || []).map((s) => [s.slug, s]))
  const out: CatalogCourse[] = courses.map((c) => {
    const series: AcademySeries | null = (c.webinarSeries && bySlug.get(String(c.webinarSeries).trim())) || null
    const sessions: AcademySession[] = offersOpen(c) && series ? series.sessions : []
    return {
      ...c,
      href: courseHref(c.slug),
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

const dayOf = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: ACADEMY_TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))

/** "12:00–1:30 pm" or "9:00 am–1:00 pm", in Eastern. */
function timeRange(startsAt: string, endsAt: string) {
  const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: ACADEMY_TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(d)
    const get = (t: string) => p.find((x) => x.type === t)?.value || ''
    return { time: `${get('hour')}:${get('minute')}`, period: get('dayPeriod').toLowerCase() }
  }
  const a = parts(new Date(startsAt))
  const b = parts(new Date(endsAt))
  return a.period === b.period ? `${a.time}–${b.time} ${b.period}` : `${a.time} ${a.period}–${b.time} ${b.period}`
}

/**
 * "Tue, Jan 13" and "12:00–1:30 pm ET", in Eastern. A class in parts lists
 * every day ("Tue, Feb 9 & Tue, Feb 16") and its time once with "each" when
 * the parts share it.
 */
export function sessionTimes(s: AcademySession) {
  const all = [{ startsAt: s.startsAt, endsAt: s.endsAt }, ...(s.parts || [])]
  const date = all.map((p) => dayOf(p.startsAt)).join(' & ')
  const times = all.map((p) => timeRange(p.startsAt, p.endsAt))
  const same = times.every((t) => t === times[0])
  const time = same ? `${times[0]}${all.length > 1 ? ' each' : ''}` : times.join(', ')
  return { date, time: same ? `${times[0]} ET${all.length > 1 ? ' each' : ''}` : `${time} ET`, timeBare: time, iso: s.startsAt }
}

/** The label for a date's format, e.g. "Online · two sessions". */
export function formatText(s: AcademySession) {
  if (s.formatText) return s.formatText
  if (s.format === 'in_person') return ['In person', s.location].filter(Boolean).join(' · ')
  return s.format === 'online_two' || (s.parts?.length ?? 0) > 0 ? 'Online · two sessions' : 'Online · one session'
}

/** True when a course's dates aren't all single online sessions, so pages show each date's format. */
export const showsFormats = (sessions: AcademySession[]) =>
  sessions.some((s) => (s.format && s.format !== 'online_one') || (s.parts?.length ?? 0) > 0)

/** "9 of 20 seats left", "Full", or null when the date has no seat limit. */
export function seatsText(s: AcademySession) {
  if (s.full) return 'Full'
  if (s.seatsLeft == null || !s.capacity) return null
  return `${s.seatsLeft} of ${s.capacity} seats left`
}

/**
 * The open-cohort price for the "Two ways to attend" card, from the class
 * platform: "$249 per seat · $199 founding" when some dates are priced lower,
 * else "$249 per seat". The course's own price line when there are no dates.
 */
export function openPriceLine(c: CatalogCourse): string | null {
  if (!c.series || !c.sessions.length) return c.priceLabel || null
  const cur = c.series.currency
  const regular = c.series.priceCents || Math.max(...c.sessions.map((s) => s.priceCents))
  const reduced = c.sessions.filter(isReduced).map((s) => s.priceCents)
  const low = reduced.length ? Math.min(...reduced) : null
  return [`${money(regular, cur)} per seat`, low != null && `${money(low, cur)} founding`].filter(Boolean).join(' · ')
}

export const LEVEL_TEXT: Record<string, string> = { foundations: 'Foundations', workshop: 'Workshop', applied: 'Applied' }

/** The small label on a card: the course code, else the level. */
export const cardLabel = (c: Record<string, any>) => c.code || LEVEL_TEXT[c.level] || ''

/** The course's name as people say it: "TA-101 Know What You're Governing". */
export const fullName = (c: Record<string, any>) => [c.code, c.title].filter(Boolean).join(' ')
