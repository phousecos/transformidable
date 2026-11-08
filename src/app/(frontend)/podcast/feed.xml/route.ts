// @ts-nocheck
// Podcast RSS feed, the URL submitted to Apple Podcasts, Spotify and other
// apps. Show details come from the Podcast Settings global; each published
// episode with audio becomes an <item>.
// Tag reference: https://podcasters.apple.com/support/823-podcast-requirements
import config from "@payload-config";
import { getPayload } from "payload";
import { renderLexical } from "../../components/research/lexical";
import { PODCAST_DEFAULTS, durationSeconds } from "../../../../lib/podcast";

export const dynamic = "force-dynamic";

import { SITE_URL as siteUrl } from "../../../../lib/seo.ts";

function xml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// HTML inside CDATA; "]]>" would end the section early.
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function absolute(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

function media(m: any) {
  return m && typeof m === "object" ? m : null;
}

function category(value: string | null | undefined): string {
  if (!value) return "";
  const [main, sub] = value.split("|");
  return sub
    ? `<itunes:category text="${xml(main)}"><itunes:category text="${xml(sub)}"/></itunes:category>`
    : `<itunes:category text="${xml(main)}"/>`;
}

// The episode's audio for the <enclosure>: the uploaded file, else the
// external URL. Apple wants the byte length; an uploaded file has it, an
// external URL usually doesn't, and 0 is the accepted placeholder.
function enclosure(ep: any) {
  const file = media(ep.audioFile);
  if (file?.url) {
    return { url: absolute(file.url), length: file.filesize || 0, type: file.mimeType || "audio/mpeg" };
  }
  if (ep.audioUrl) return { url: ep.audioUrl, length: 0, type: "audio/mpeg" };
  return null;
}

export async function GET() {
  const payload = await getPayload({ config });

  let settings: any = {};
  try {
    settings = await payload.findGlobal({ slug: "podcast-settings", depth: 1 });
  } catch {
    // Global not migrated yet: fall back to the defaults below.
  }
  const show = {
    ...PODCAST_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== null && v !== undefined && v !== "")),
  };
  const cover = absolute(media(settings?.coverArt)?.url);

  let episodes: any[] = [];
  try {
    const res = await payload.find({
      collection: "podcast-episodes",
      where: {
        status: { equals: "published" },
        or: [{ publishDate: { exists: false } }, { publishDate: { less_than_equal: new Date().toISOString() } }],
      },
      sort: "-publishDate",
      depth: 1,
      limit: 500,
    });
    episodes = res.docs || [];
  } catch {
    episodes = [];
  }

  const items = episodes
    .map((ep) => {
      const audio = enclosure(ep);
      if (!audio) return "";
      const link = `${siteUrl}/podcast/${ep.slug}`;
      const art = absolute(media(ep.featuredImage)?.url);
      const seconds = durationSeconds(ep.duration);
      const notesHtml = renderLexical(ep.showNotes);
      return [
        "<item>",
        `<title>${xml(ep.title)}</title>`,
        `<itunes:title>${xml(ep.title)}</itunes:title>`,
        `<link>${xml(link)}</link>`,
        // Must never change once published, or apps show the episode twice.
        `<guid isPermaLink="false">transformidable-podcast-${xml(ep.id)}</guid>`,
        `<pubDate>${new Date(ep.publishDate || ep.createdAt).toUTCString()}</pubDate>`,
        ep.description && `<description>${xml(ep.description)}</description>`,
        notesHtml && `<content:encoded>${cdata(notesHtml)}</content:encoded>`,
        `<enclosure url="${xml(audio.url)}" length="${xml(audio.length)}" type="${xml(audio.type)}"/>`,
        seconds !== null && `<itunes:duration>${seconds}</itunes:duration>`,
        ep.episodeNumber != null && `<itunes:episode>${xml(ep.episodeNumber)}</itunes:episode>`,
        ep.season != null && `<itunes:season>${xml(ep.season)}</itunes:season>`,
        "<itunes:episodeType>full</itunes:episodeType>",
        art && `<itunes:image href="${xml(art)}"/>`,
        `<itunes:explicit>${show.explicit ? "true" : "false"}</itunes:explicit>`,
        "</item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n");

  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">`,
    "<channel>",
    `<atom:link href="${xml(`${siteUrl}/podcast/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    `<title>${xml(show.title)}</title>`,
    `<link>${xml(`${siteUrl}/podcast`)}</link>`,
    `<description>${xml(show.description)}</description>`,
    `<language>${xml(show.language)}</language>`,
    `<copyright>© ${new Date().getFullYear()} ${xml(show.author)}</copyright>`,
    `<itunes:author>${xml(show.author)}</itunes:author>`,
    `<itunes:owner><itunes:name>${xml(show.author)}</itunes:name><itunes:email>${xml(show.ownerEmail)}</itunes:email></itunes:owner>`,
    cover && `<itunes:image href="${xml(cover)}"/>`,
    cover && `<image><url>${xml(cover)}</url><title>${xml(show.title)}</title><link>${xml(`${siteUrl}/podcast`)}</link></image>`,
    category(show.primaryCategory),
    show.secondaryCategory !== show.primaryCategory && category(show.secondaryCategory),
    `<itunes:explicit>${show.explicit ? "true" : "false"}</itunes:explicit>`,
    "<itunes:type>episodic</itunes:type>",
    items,
    "</channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Podcast apps poll; a few minutes of caching spares the database.
      "Cache-Control": "public, max-age=300",
    },
  });
}
