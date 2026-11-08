// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import { getStreamHost } from "../../components/research/streamHost";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ResearchShell } from "../../components/research/ResearchShell";
import { YouTubeEmbed } from "../../components/research/YouTubeEmbed";
import { StreamPlayer } from "../../components/research/StreamPlayer";
import { SeekLink } from "../../components/research/SeekLink";
import { fullDate } from "../../components/research/format";
import { renderLexical } from "../../components/research/lexical";
import { chapterList, clock, durationSeconds, streamVideo, youtubeId } from "../../../../lib/podcast";
import { SITE_URL, jsonLdHtml, pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

// cache(): generateMetadata and the page share one query per request.
const getEpisode = cache(async (slug: string) => {
  const payload = await getPayload({ config });
  try {
    const res = await payload.find({
      collection: "podcast-episodes",
      where: { slug: { equals: slug }, status: { equals: "published" } },
      depth: 1,
      limit: 1,
    });
    return res.docs?.[0] || null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = await getEpisode(slug);
  if (!ep) return { title: "Episode not found" };
  const meta = pageMetadata({ title: ep.title, description: ep.description, path: `/podcast/${slug}`, type: "article" });
  return { ...meta, alternates: { ...meta.alternates, types: { "application/rss+xml": "/podcast/feed.xml" } } };
}

export default async function PodcastEpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;
  const [ep, streamHost] = await Promise.all([getEpisode(slug), getStreamHost()]);
  if (!ep) notFound();

  // The website plays the Stream copy when there is one; YouTube otherwise.
  const stream = streamVideo(ep.streamVideo, streamHost);
  const videoId = stream ? null : youtubeId(ep.youtubeUrl);
  const chapters = chapterList(ep.chapters);
  const startAt = durationSeconds(t) ?? 0;
  const audioFile = ep.audioFile && typeof ep.audioFile === "object" ? ep.audioFile : null;
  const audioSrc = audioFile?.url || ep.audioUrl || null;
  const guest = ep.guest && typeof ep.guest === "object" ? ep.guest : null;
  const notesHtml = renderLexical(ep.showNotes);
  const transcriptHtml = renderLexical(ep.transcript);
  const label = [
    ep.season != null ? `Season ${ep.season}` : null,
    ep.episodeNumber != null ? `Episode ${ep.episodeNumber}` : null,
  ].filter(Boolean).join(" · ");
  const meta = [ep.publishDate && fullDate(ep.publishDate), ep.duration].filter(Boolean);

  const episodeJsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: ep.title,
    ...(ep.description && { description: ep.description }),
    url: `${SITE_URL}/podcast/${slug}`,
    ...(ep.publishDate && { datePublished: ep.publishDate }),
    ...(ep.episodeNumber != null && { episodeNumber: ep.episodeNumber }),
    ...(audioSrc && { associatedMedia: { "@type": "MediaObject", contentUrl: audioSrc } }),
    partOfSeries: { "@type": "PodcastSeries", name: "The Governance Files", url: `${SITE_URL}/podcast` },
  };

  return (
    <ResearchShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(episodeJsonLd)} />
      <article className="detail">
        <div className="detail-wrap">
          <Link className="backlink" href="/podcast">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            All episodes
          </Link>

          <p className="kicker">The Governance Files{label ? ` · ${label}` : ""}</p>
          <h1 className="detail-title">{ep.title}</h1>
          {guest && (
            <p className="detail-dek">with {guest.name}{guest.role ? `, ${guest.role}` : ""}</p>
          )}
          {meta.length > 0 && (
            <div className="detail-meta">
              {meta.map((m: string) => <span className="dm" key={m}>{m}</span>)}
            </div>
          )}

          {stream && (
            <StreamPlayer
              src={stream.hls}
              poster={stream.poster}
              title={ep.title}
              chapters={chapters}
              duration={durationSeconds(ep.duration) ?? 0}
              startAt={startAt}
            />
          )}
          {videoId && <YouTubeEmbed id={videoId} title={ep.title} start={startAt} />}
          {chapters.length > 0 && (
            <ol className="sp-chapters" aria-label="Chapters">
              {chapters.map((c) => (
                <li key={c.start}>
                  <SeekLink href={`/podcast/${ep.slug}?t=${c.start}`} seconds={c.start}>
                    <span className="sp-chapters-time">{clock(c.start)}</span>
                    <span className="sp-chapters-t">{c.title}</span>
                  </SeekLink>
                </li>
              ))}
            </ol>
          )}
          {audioSrc && (
            // Audio-only listeners; preload="none" so the page doesn't start
            // downloading a large file nobody asked for.
            <audio className="episode-audio" controls preload="none" src={audioSrc}>
              <a href={audioSrc}>Download the episode audio</a>
            </audio>
          )}

          {ep.description && <p className="lead episode-section">{ep.description}</p>}

          {notesHtml && (
            <section className="episode-section">
              <h2>Show notes</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: notesHtml }} />
            </section>
          )}

          {transcriptHtml && (
            <section className="episode-section">
              <h2>Transcript</h2>
              <div className="prose transcript" dangerouslySetInnerHTML={{ __html: transcriptHtml }} />
            </section>
          )}

          <div className="detail-foot">
            <Link className="link" href="/podcast">More episodes
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
