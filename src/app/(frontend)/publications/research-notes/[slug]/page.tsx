// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchShell } from "../../../components/research/ResearchShell";
import { fullDate } from "../../../components/research/format";
import { renderLexical } from "../../../components/research/lexical";
import { articleJsonLd, jsonLdHtml, pageMetadata } from "../../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

async function getNote(slug: string) {
  const payload = await getPayload({ config });
  try {
    const res = await payload.find({
      collection: "research-notes",
      where: { slug: { equals: slug }, status: { equals: "published" } },
      depth: 1,
      limit: 1,
    });
    return res.docs?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await getNote(slug);
  if (!n) return { title: "Research note not found" };
  return pageMetadata({ title: `${n.title}`, description: n.dek, path: `/publications/research-notes/${slug}`, type: "article" });
}

export default async function ResearchNoteDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await getNote(slug);
  if (!n) notFound();

  const bodyHtml = renderLexical(n.body);
  const meta = [
    n.publishedAt && fullDate(n.publishedAt),
    n.readTime && `${n.readTime} min`,
  ].filter(Boolean);

  return (
    <ResearchShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(articleJsonLd({ title: n.title, description: n.dek, path: `/publications/research-notes/${slug}`, publishedAt: n.publishedAt, updatedAt: n.updatedAt }))}
      />
      <article className="detail">
        <div className="detail-wrap">
          <Link className="backlink" href="/publications/research-notes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            All research notes
          </Link>

          <p className="kicker">Research Note</p>
          <h1 className="detail-title">{n.title}</h1>
          {n.dek && <p className="detail-dek">{n.dek}</p>}
          {meta.length > 0 && (
            <div className="detail-meta">
              {meta.map((m: string) => <span className="dm" key={m}>{m}</span>)}
            </div>
          )}

          {bodyHtml ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : (
            <p className="detail-note">This note is being written up.</p>
          )}

          <div className="detail-foot">
            <Link className="link" href="/publications/research-notes">More research notes
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
