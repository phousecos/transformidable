import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { EMAIL_RE, MAX_EMAIL_LEN, TOO_FAST_MESSAGE, checkSpam, createRateLimiter, getClientIp } from '../../../../lib/apiRequestGuards.ts'

// The Academy's two forms (components/academy/AcademyForm.tsx):
//   dedicated  a dedicated session for a whole governing body
//   interest   waitlist, interest list, or "a topic we don't cover yet"
// Saved to Academy Inquiries, with a best-effort email to the Academy inbox.

const MAX_SHORT_LEN = 150
const MAX_MESSAGE_LEN = 5000
const MAX_COUNT = 500

const rateLimiter = createRateLimiter(5, 60 * 1000)

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/g
// eslint-disable-next-line no-control-regex
const MESSAGE_CONTROL_CHARS_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g

const REASONS: Record<string, string> = {
  waitlist: 'Waitlist for new dates',
  interest: 'Interest list for a course',
  topic: 'A topic the Academy does not cover yet',
}

type Fields = Record<string, unknown>

// A trimmed, single-line string within `max`, or undefined when absent.
// Returns false when present but invalid.
function shortText(value: unknown, max = MAX_SHORT_LEN): string | undefined | false {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.length > max) return false
  const clean = value.trim().replace(CONTROL_CHARS_RE, '')
  return clean.length ? clean : undefined
}

// A whole number from 0 to MAX_COUNT, or undefined when absent. False when invalid.
function count(value: unknown): number | undefined | false {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= MAX_COUNT ? n : false
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
  const f = body as Fields

  // Spam (see checkSpam): bots get a normal-looking reply and nothing is saved.
  const spam = checkSpam((key) => f[key])
  if (spam === 'bot') return NextResponse.json({ message: 'Thank you. We’ll be in touch.' })
  if (spam === 'too-fast') return bad(TOO_FAST_MESSAGE)

  const type = f.type === 'dedicated' || f.type === 'interest' ? f.type : null
  if (!type) return bad('Unknown form.')
  const dedicated = type === 'dedicated'

  const name = shortText(f.name, 100)
  if (!name) return bad(dedicated ? 'Contact name is required.' : 'Name is required.')
  if (typeof f.email !== 'string' || f.email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(f.email.trim())) {
    return bad('A valid email is required.')
  }
  const email = f.email.toLowerCase().trim()

  const fields = {
    jobTitle: shortText(f.jobTitle),
    organization: shortText(f.organization),
    governingBody: shortText(f.governingBody),
    preferredMonths: shortText(f.preferredMonths),
    publicNotice: shortText(f.publicNotice),
    courseSlug: shortText(f.course, 120),
    source: shortText(f.source, 300),
  }
  if (Object.values(fields).some((v) => v === false)) return bad('One of the fields is too long.')
  const members = count(f.members)
  const staff = count(f.staff)
  if (members === false || staff === false) return bad('Enter numbers of people as whole numbers.')
  const reason = !dedicated && typeof f.reason === 'string' && f.reason in REASONS ? f.reason : undefined

  if (dedicated) {
    if (!fields.organization) return bad('Organization is required.')
    if (!fields.governingBody) return bad('Body is required.')
    if (!fields.jobTitle) return bad('Title is required.')
    if (!members) return bad('Members of the body is required.')
    if (!fields.publicNotice) return bad('Tell us who handles public notice for your body.')
  }

  let message: string | undefined
  if (typeof f.message === 'string' && f.message.trim()) {
    if (f.message.length > MAX_MESSAGE_LEN) return bad('Message is too long.')
    message = f.message.trim().replace(MESSAGE_CONTROL_CHARS_RE, '')
  }
  if (reason === 'topic' && !message) return bad('Tell us what your body is being asked to approve.')

  try {
    const payload = await getPayload({ config })

    // Record the course by name, so the inquiry still reads right if the course changes later.
    let course: string | undefined
    if (fields.courseSlug) {
      const found = await payload.find({ collection: 'courses' as any, where: { slug: { equals: fields.courseSlug } }, limit: 1, depth: 0 })
      const c = found.docs[0] as { code?: string; title?: string } | undefined
      if (c) course = [c.code, c.title].filter(Boolean).join(' ')
    }

    const note = [reason && REASONS[reason], message].filter(Boolean).join('\n\n') || undefined
    await payload.create({
      collection: 'academy-inquiries',
      data: {
        type,
        name,
        email,
        jobTitle: fields.jobTitle,
        organization: fields.organization,
        governingBody: fields.governingBody,
        course,
        members: members ?? undefined,
        staff: staff ?? undefined,
        preferredMonths: fields.preferredMonths,
        publicNotice: fields.publicNotice,
        message: note,
        source: fields.source,
        status: 'new',
      } as any,
    })

    // Best effort: the inquiry is already saved in the admin.
    try {
      const lines = [
        dedicated ? 'Dedicated session request' : REASONS[reason || 'waitlist'],
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        fields.jobTitle && `Title: ${fields.jobTitle}`,
        fields.organization && `Organization: ${fields.organization}`,
        fields.governingBody && `Body: ${fields.governingBody}`,
        course && `Course: ${course}`,
        members !== undefined && `Members: ${members}`,
        staff !== undefined && `Staff who might join: ${staff}`,
        fields.preferredMonths && `Preferred months: ${fields.preferredMonths}`,
        fields.publicNotice && `Public notice handled by: ${fields.publicNotice}`,
        fields.source && `Submitted from: ${fields.source}`,
        message && `\n${message}`,
      ].filter(Boolean)
      await payload.sendEmail({
        to: process.env.ACADEMY_NOTIFY_EMAIL || process.env.CONTACT_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'hello@betransformidable.com',
        replyTo: email,
        subject: dedicated
          ? `Academy dedicated session: ${fields.governingBody || fields.organization}`
          : `Academy ${reason === 'topic' ? 'topic request' : 'interest list'}: ${name}${course ? ` (${course})` : ''}`,
        text: lines.join('\n'),
      })
    } catch (emailError: unknown) {
      console.error('[academy-inquiry] Notification email failed:', emailError instanceof Error ? emailError.message : 'Unknown error')
    }

    return NextResponse.json({
      message: dedicated
        ? 'Thank you. We have your request and will be in touch with dates.'
        : reason === 'topic'
          ? 'Thank you. We read every one of these, and it shapes what we build next.'
          : 'Thank you. We’ll tell you as soon as dates open.',
    })
  } catch (error: unknown) {
    console.error('[academy-inquiry] Error:', error instanceof Error ? error.message : 'Unknown error')
    return bad('Something went wrong. Please try again.', 500)
  }
}
