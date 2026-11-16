import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { EMAIL_RE, MAX_EMAIL_LEN, TOO_FAST_MESSAGE, checkSpam, createRateLimiter, getClientIp } from '../../../../lib/apiRequestGuards.ts'

// The advisory conversation intake (components/advisory/ConversationBooking.tsx).
// Sent when the visitor clicks "Choose a time", before the Cal.com scheduler
// opens, so the full intake reaches the inbox even if they never book. The
// booking itself carries a shortened copy: Cal.com caps its notes at 1,000
// characters.

const MAX_SHORT_LEN = 100
const MAX_PROBLEM_LEN = 2000
const MAX_TAG_LEN = 100
// Same keys as components/advisory/inbound.ts (a client module, so not imported here).
const INBOUND_KEYS = ['cohort', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
const AREAS = ['M&A', 'Troubled program', 'IT controls', 'AI', 'Something else']

const rateLimiter = createRateLimiter(5, 60 * 1000)

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/g
// eslint-disable-next-line no-control-regex
const MESSAGE_CONTROL_CHARS_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g

// A trimmed, single-line string within `max`, or undefined when absent.
// Returns false when present but invalid.
function shortText(value: unknown, max = MAX_SHORT_LEN): string | undefined | false {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.length > max) return false
  const clean = value.trim().replace(CONTROL_CHARS_RE, '')
  return clean.length ? clean : undefined
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest) {
  if (!rateLimiter.check(getClientIp(req))) return bad('Too many requests. Please try again in a minute.', 429)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return bad('Invalid request body.')
  }
  if (typeof body !== 'object' || body === null) return bad('Invalid request body.')
  const f = body as Record<string, unknown>

  // Spam (see checkSpam): bots get a normal-looking reply and nothing is sent.
  const spam = checkSpam((key) => f[key])
  if (spam === 'bot') return NextResponse.json({ ok: true })
  if (spam === 'too-fast') return bad(TOO_FAST_MESSAGE)

  const name = shortText(f.name)
  if (!name) return bad('Name is required.')
  if (typeof f.email !== 'string' || f.email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(f.email.trim())) {
    return bad('A valid email is required.')
  }
  const email = f.email.toLowerCase().trim()

  const organization = shortText(f.organization)
  const role = shortText(f.role)
  if (organization === false || role === false) return bad('One of the fields is too long.')
  const area = typeof f.area === 'string' && AREAS.includes(f.area) ? f.area : undefined

  if (typeof f.problem !== 'string' || !f.problem.trim()) return bad('Add a few words about the governance problem.')
  if (f.problem.length > MAX_PROBLEM_LEN) return bad('The description of the problem is too long.')
  const problem = f.problem.trim().replace(MESSAGE_CONTROL_CHARS_RE, '')

  // Campaign tags (?cohort=, utm_*): kept only when they are short strings.
  const tags: string[] = []
  const inbound = (typeof f.inbound === 'object' && f.inbound) || {}
  for (const key of INBOUND_KEYS) {
    const value = shortText((inbound as Record<string, unknown>)[key], MAX_TAG_LEN)
    if (value) tags.push(`${key}: ${value}`)
  }

  const lines = [
    'Advisory conversation intake',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    organization && `Organization: ${organization}`,
    role && `Role: ${role}`,
    area && `Area: ${area}`,
    '',
    "What's the governance problem?",
    problem,
    tags.length ? `\nCampaign tags\n${tags.join('\n')}` : '',
    '',
    'Sent when they opened the scheduler. If no booking follows, they did not finish booking.',
  ].filter((l) => l !== undefined && l !== false)

  try {
    const payload = await getPayload({ config })
    await payload.sendEmail({
      to: process.env.ADVISORY_NOTIFY_EMAIL || 'hello@betransformidable.com',
      replyTo: email,
      subject: `Advisory intake: ${name}${organization ? ` (${organization})` : ''}`,
      text: lines.join('\n'),
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('[advisory-intake] Email failed:', error instanceof Error ? error.message : 'Unknown error')
    return bad('Something went wrong. Please try again.', 500)
  }
}
