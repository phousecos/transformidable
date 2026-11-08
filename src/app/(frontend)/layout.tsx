import React from "react";
import Script from "next/script";
import "./globals.css";
import { OG_IMAGE, SITE_URL, jsonLdHtml, organizationJsonLd } from "../../lib/seo.ts";

// Canonical public site URL (NEXT_PUBLIC_SITE_URL, falling back to the
// production domain) so absolute URLs (OpenGraph, sitemap, canonicals) are right.
const siteUrl = SITE_URL;

// Cloudflare Web Analytics site token (public; it appears in the page). Read
// at build time for the statically rendered pages, so set it as a build
// variable as well as a runtime one.
const cfAnalyticsToken = process.env.CF_WEB_ANALYTICS_TOKEN;

const SITE_TITLE = "Transformidable | Technology, Project & AI Governance for Boards and Executives";
const SITE_DESCRIPTION =
  "Technology, project, and AI governance advisory, research, and governance training for boards and executives in higher education, nonprofits, associations, and mid-market organizations.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    // Child pages set a bare title (e.g. "Case Files") and this appends the brand.
    template: "%s | Transformidable",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Transformidable",
  keywords: [
    "technology governance",
    "project governance",
    "AI governance",
    "governance training",
    "AI governance training for boards",
    "board technology oversight",
    "ERP transformation governance",
    "IT general controls",
    "material weakness remediation",
    "fractional CIO",
    "executive technology office",
    "higher education technology governance",
    "nonprofit technology governance",
    "transformation governance",
  ],
  authors: [{ name: "Transformidable" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Transformidable",
    // No url here: a page that doesn't set its own would otherwise claim the
    // home page's address. Pages set theirs with pageMetadata() (lib/seo.ts).
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32-new.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192-new.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon-new.png",
  },
};

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="impact-verification" strategy="afterInteractive">
          {`(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7237205-9a8c-4554-8285-fab54129af9a1.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(organizationJsonLd())} />
        {children}
        {cfAnalyticsToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cfAnalyticsToken })}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
