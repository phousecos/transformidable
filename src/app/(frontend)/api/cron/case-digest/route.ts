import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'https://betransformidable.com'
).replace(/\/$/, '')

const DAY_MS = 24 * 60 * 60 * 1000

type FollowRecord = {
  id: string | number
  email: string
  unsubscribeToken: string
  caseFile: string | number
}

// Fired daily by the Cron Trigger in wrangler.jsonc, via worker.ts. For every Case File updated
// in the last 24h, finds active followers and sends each one a single
// digest email listing every case of theirs that changed — not one email
// per case. Authenticated via CRON_SECRET, which worker.ts sends on the
// Authorization header.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[case-digest] CRON_SECRET is not configured — refusing to run.')
    return NextResponse.json({ error: 'Not configured.' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const since = new Date(Date.now() - DAY_MS).toISOString()

  const updatedCases = await payload.find({
    collection: 'case-files',
    where: {
      status: { equals: 'published' },
      updatedAt: { greater_than_equal: since },
    },
    limit: 200,
    depth: 0,
  })

  if (updatedCases.docs.length === 0) {
    return NextResponse.json({ casesUpdated: 0, subscribersNotified: 0 })
  }

  const caseIds = updatedCases.docs.map((c) => c.id)

  const follows = await payload.find({
    collection: 'case-follows',
    where: {
      caseFile: { in: caseIds },
      status: { equals: 'active' },
    },
    limit: 5000,
    depth: 0,
  })

  if (follows.docs.length === 0) {
    return NextResponse.json({ casesUpdated: updatedCases.docs.length, subscribersNotified: 0 })
  }

  const caseById = new Map(updatedCases.docs.map((c) => [String(c.id), c]))

  // email -> [{ follow, case }]
  const byEmail = new Map<string, { follow: FollowRecord; caseFile: (typeof updatedCases.docs)[number] }[]>()
  for (const raw of follows.docs) {
    const follow = raw as unknown as FollowRecord
    const caseFile = caseById.get(String(follow.caseFile))
    if (!caseFile) continue
    const list = byEmail.get(follow.email) || []
    list.push({ follow, caseFile })
    byEmail.set(follow.email, list)
  }

  let sent = 0
  const notifiedFollowIds: (string | number)[] = []

  for (const [email, items] of byEmail) {
    const itemsHtml = items
      .map(({ follow, caseFile }) => {
        const url = `${SITE_URL}/publications/case-files/${caseFile.slug}`
        const unsubUrl = `${SITE_URL}/api/case-follow/unsubscribe?token=${follow.unsubscribeToken}`
        return (
          `<li style="margin-bottom:14px;">` +
          `<a href="${url}" style="color:#750427;font-weight:600;text-decoration:underline;">${escapeHtml(String(caseFile.title))}</a>` +
          ` was updated.` +
          `<br><a href="${unsubUrl}" style="color:#7c6c70;font-size:12px;">Unsubscribe from this case</a>` +
          `</li>`
        )
      })
      .join('')

    const itemsText = items
      .map(({ follow, caseFile }) => {
        const url = `${SITE_URL}/publications/case-files/${caseFile.slug}`
        const unsubUrl = `${SITE_URL}/api/case-follow/unsubscribe?token=${follow.unsubscribeToken}`
        return `- ${caseFile.title}: ${url}\n  Unsubscribe from this case: ${unsubUrl}`
      })
      .join('\n')

    const subject =
      items.length === 1
        ? `Update on "${items[0].caseFile.title}"`
        : `Updates on ${items.length} cases you're following`

    try {
      await payload.sendEmail({
        to: email,
        subject,
        html:
          `<p>The following case files you're following were updated in the last 24 hours:</p>` +
          `<ul style="padding-left:18px;">${itemsHtml}</ul>`,
        text: `The following case files you're following were updated in the last 24 hours:\n\n${itemsText}`,
      })
      sent++
      notifiedFollowIds.push(...items.map((i) => i.follow.id))
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[case-digest] Failed to send to ${email}:`, msg)
    }
  }

  const now = new Date().toISOString()
  await Promise.all(
    notifiedFollowIds.map((id) =>
      payload.update({ collection: 'case-follows', id, data: { lastNotifiedAt: now } }).catch((error) => {
        console.error(`[case-digest] Failed to update lastNotifiedAt for follow ${id}:`, error)
      }),
    ),
  )

  return NextResponse.json({ casesUpdated: updatedCases.docs.length, subscribersNotified: sent })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
