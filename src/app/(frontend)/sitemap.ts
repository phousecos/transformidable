// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import { TOOLS_PATH, listedToolsWhere } from "../../lib/advisoryTools.ts";
import { SITE_URL as siteUrl } from "../../lib/seo.ts";
import { getBriefings } from "../../lib/briefings.ts";
import { courseHref, getCourses } from "../../lib/academy.ts";

export const dynamic = "force-dynamic";

// Static, always-present routes. The "Coming soon" placeholders (research
// projects and datasets, and the tools other than the Codebook) are
// left out, and marked noindex, until they have content: thin placeholder pages
// count against the site in search. Add each back here when it launches.
const STATIC_PATHS = [
  "",
  "/research",
  "/advisory",
  "/advisory/conversation",
  "/advisory/executive-technology-office",
  "/advisory/ai-policy",
  "/advisory/fractional-cio",
  "/advisory/independent-verification-and-validation",
  "/publishing",
  "/media",
  "/publications",
  "/publications/case-files",
  "/publications/research-notes",
  "/podcast",
  "/briefings/live",
  "/briefings/webinars",
  "/about",
  "/contact",
  "/academy",
  "/academy/dedicated-sessions",
  "/research/agenda",
  "/research/governance-method",
  "/tools/governance-codebook",
];

async function publishedDocs(payload: any, collection: string) {
  try {
    const res = await payload.find({
      collection,
      where: { status: { equals: "published" } },
      limit: 1000,
      depth: 0,
    });
    return (res.docs || []).filter((d: any) => d?.slug);
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const entries = STATIC_PATHS.map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  // Briefing topics, from the briefings platform (lib/briefings.ts).
  const briefings = await getBriefings();
  for (const s of briefings?.series || []) {
    entries.push({
      url: `${siteUrl}/briefings/${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Academy course pages (Courses: listed, with a page).
  for (const c of await getCourses()) {
    if (!c.listed || !c.hasPage) continue;
    entries.push({ url: `${siteUrl}${courseHref(c.slug)}`, lastModified: c.updatedAt ? new Date(c.updatedAt) : now, changeFrequency: "weekly", priority: 0.8 });
  }

  try {
    const payload = await getPayload({ config });
    const [caseFiles, notes, pubs, episodes] = await Promise.all([
      publishedDocs(payload, "case-files"),
      publishedDocs(payload, "research-notes"),
      publishedDocs(payload, "publications"),
      publishedDocs(payload, "podcast-episodes"),
    ]);
    const add = (docs: any[], prefix: string) => {
      for (const d of docs) {
        entries.push({
          url: `${siteUrl}${prefix}/${d.slug}`,
          lastModified: d.updatedAt || d.publishedAt ? new Date(d.updatedAt || d.publishedAt) : now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    };
    add(caseFiles, "/publications/case-files");
    add(notes, "/publications/research-notes");
    add(pubs, "/publications");
    add(episodes, "/podcast");
    // Advisory tools listed on /advisory (Final, tagged "Website download").
    try {
      const tools = await payload.find({ collection: "assets", where: listedToolsWhere, limit: 500, depth: 0, overrideAccess: true });
      add((tools.docs || []).filter((d: any) => d?.slug), TOOLS_PATH);
    } catch {}
  } catch {
    // Fall back to the static routes if the CMS isn't reachable at build time.
  }

  return entries;
}
