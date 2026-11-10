import { NextResponse } from 'next/server'
import { BUYING_MODEL_TEXT, courseHref, fullName, getCourses } from '../../../../lib/academy.ts'

export const dynamic = 'force-dynamic'

// The Academy entries of the site menu (components/research/ResearchNav.tsx),
// from Courses: listed courses in their Order. The menu starts from a built-in
// copy and swaps this in once loaded, so a new course shows up in the menu
// without a deploy.
export async function GET() {
  const courses = (await getCourses()).filter((c) => c.listed)
  const items = courses.map((c) => ({
    name: fullName(c),
    desc: [c.format, BUYING_MODEL_TEXT[c.buyingModel]].filter(Boolean).join(' · '),
    href: c.hasPage ? courseHref(c.slug) : '/academy#courses',
  }))
  return NextResponse.json(
    { courses: items },
    { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' } },
  )
}
