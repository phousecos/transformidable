// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchShell } from "../../components/research/ResearchShell";
import { TYPE_LABELS, pubMeta, videoEmbedUrl } from "../../components/research/format";
import { renderLexical } from "../../components/research/lexical";
import { articleJsonLd, jsonLdHtml, pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

async function getPublication(slug: string) {
  const payload = await getPayload({ config });
  try {
    const res = await payload.find({
      collection: "publications",
      where: { slug: { equals: slug }, status: { equals: "published" } },
      depth: 1,
      limit: 1,
    });
    return res.docs?.[0] || null;
  } catch {
    return null;
  }
}

function mediaUrl(m: any): string | null {
  return m && typeof m === "object" && typeof m.url === "string" ? m.url : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublication(slug);
  if (!p) return { title: "Publication not found" };
  return pageMetadata({ title: `${p.title}`, description: p.dek, path: `/publications/${slug}`, type: "article" });
}

export default async function PublicationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublication(slug);
  if (!p) notFound();

  const cover = mediaUrl(p.coverImage);
  const bodyHtml = renderLexical(p.body);
  const meta = pubMeta(p, true);
  const typeLabel = TYPE_LABELS[p.type] || "Publication";
  const video = videoEmbedUrl(p.videoUrl);
  const isDownload = p.assetUrl && p.assetUrl.startsWith("http");
  const downloadLabel = p.type === "white-paper" || p.type === "annual-report" ? "Download the PDF" : "Read the full version";

  return (
    <ResearchShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(articleJsonLd({ title: p.title, description: p.dek, path: `/publications/${slug}`, publishedAt: p.publishedAt, updatedAt: p.updatedAt }))}
      />
      <article className="detail">
        <div className="detail-wrap">
          <Link className="backlink" href="/publications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            All publications
          </Link>

          <p className="kicker">{typeLabel}</p>
          <h1 className="detail-title">{p.title}</h1>
          {p.dek && <p className="detail-dek">{p.dek}</p>}

          {meta.length > 0 && (
            <div className="detail-meta">
              {meta.map((m: string) => <span className="dm" key={m}>{m}</span>)}
            </div>
          )}

          {isDownload && (
            <div className="detail-cta">
              <a className="btn" href={p.assetUrl} rel="noopener" target="_blank">
                {downloadLabel}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
              </a>
            </div>
          )}

          {video ? (
            <div className="detail-video">
              <iframe
                src={video}
                title={p.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="detail-cover" src={cover} alt="" />
          ) : null}

          {bodyHtml ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : isDownload ? (
            <p className="detail-note">The full text is available as a download above.</p>
          ) : (
            <p className="detail-note">The full text of this {typeLabel.toLowerCase()} is being prepared for publication.</p>
          )}

          <div className="detail-foot">
            <Link className="link" href="/publications">More publications
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
