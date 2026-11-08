// Shared SEO helpers for the public site: the canonical site address, the
// per-page metadata builder, and the site-wide structured data.

// Canonical public site URL. Production sets NEXT_PUBLIC_SITE_URL; the fallback
// is the same address, so a build without the variable still emits correct
// canonicals, OpenGraph URLs, and sitemap entries.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://betransformidable.com').replace(/\/$/, '')

export const SITE_NAME = 'Transformidable'
export const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Transformidable' }

// The service areas and audiences, used in the site-wide description,
// keywords, and structured data. Keep these in step with the Advisory and
// Academy pages.
export const EXPERTISE = [
  'Technology governance',
  'Project governance',
  'AI governance',
  'Governance training',
  'ERP transformation governance',
  'IT general controls and material weakness remediation',
  'Mergers, acquisitions, and separation',
  'Technology leadership transition',
  'Fractional CIO',
  'Technology vendor portfolio and renewals',
]

export const AUDIENCES = [
  'Boards of directors and trustees',
  'Executive leadership teams',
  'Higher education',
  'Nonprofit organizations',
  'Associations',
  'Mid-market organizations',
]

type PageMetaInput = {
  // The page's own title. The layout's template appends "| Transformidable"
  // unless `absolute` is set.
  title: string
  absolute?: boolean
  // Optional for CMS documents without a dek; omitted rather than left empty.
  description?: string | null
  // Path from the site root, e.g. "/advisory". Used for the canonical and og:url.
  path: string
  // OpenGraph type: "website" for most pages, "article" for publications.
  type?: 'website' | 'article'
  // Keep the page out of search results (placeholders, utility pages).
  noindex?: boolean
}

// Per-page metadata: title, description, canonical, and OpenGraph/Twitter
// cards that match the page. Without this, a page that sets no openGraph of
// its own inherits the home page's og:url and title from the layout.
export function pageMetadata({ title, absolute = false, description, path, type = 'website', noindex = false }: PageMetaInput) {
  const fullTitle = absolute ? title : `${title} | ${SITE_NAME}`
  description = description || undefined
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

// Site-wide structured data: who Transformidable is, what it is expert in,
// and whom it serves.
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-new.png`,
    image: `${SITE_URL}${OG_IMAGE.url}`,
    email: 'hello@betransformidable.com',
    description:
      'Technology, project, and AI governance advisory, research, and governance training for boards and executives in higher education, nonprofits, associations, and mid-market organizations.',
    knowsAbout: EXPERTISE,
    audience: AUDIENCES.map((audienceType) => ({ '@type': 'Audience', audienceType })),
    areaServed: 'US',
  }
}

// A professional service offered by Transformidable, for the Advisory pages.
export function serviceJsonLd({ name, description, path, serviceType }: { name: string; description: string; path: string; serviceType: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}${path}`,
    serviceType,
    provider: { '@id': `${SITE_URL}/#organization` },
    audience: AUDIENCES.map((audienceType) => ({ '@type': 'Audience', audienceType })),
  }
}

// An article-type page (case file, research note, publication).
export function articleJsonLd({ title, description, path, publishedAt, updatedAt }: { title: string; description?: string | null; path: string; publishedAt?: string | null; updatedAt?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description && { description }),
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: `${SITE_URL}${path}`,
    image: `${SITE_URL}${OG_IMAGE.url}`,
    ...(publishedAt && { datePublished: publishedAt }),
    ...((updatedAt || publishedAt) && { dateModified: updatedAt || publishedAt }),
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-new.png` } },
  }
}

// Renders JSON-LD safely inside a <script> tag.
export function jsonLdHtml(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}

// FAQ structured data, so questions can show in Google's results. Answers are
// plain text, matching what the page shows.
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
