// @ts-nocheck
import { SITE_URL as siteUrl } from "../lib/seo.ts";

// robots.txt. Next only serves this file from the root of the app directory:
// inside the (frontend) route group it was silently ignored, so the live
// robots.txt carried no rules and no sitemap. Cloudflare's managed robots.txt
// (content signals) is prepended to this one at the edge.

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
