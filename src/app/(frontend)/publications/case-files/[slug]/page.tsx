// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import { getStreamHost } from "../../../components/research/streamHost";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ResearchShell } from "../../../components/research/ResearchShell";
import { caseNo, fullDate } from "../../../components/research/format";
import { CaseDossier } from "../../../components/research/CaseDossier";
import { FollowCaseForm } from "../../../components/research/FollowCaseForm";
import { SubmitToCaseForm } from "../../../components/research/SubmitToCaseForm";
import { articleJsonLd, jsonLdHtml, pageMetadata } from "../../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

const CASE_STATUS: Record<string, string> = {
  "ongoing": "Ongoing",
  "under-review": "Under review",
  "in-litigation": "In litigation",
  "resolved": "Resolved",
};

// cache(): generateMetadata and the page share one query per request.
const getCaseFile = cache(async (slug: string) => {
  const payload = await getPayload({ config });
  try {
    const res = await payload.find({
      collection: "case-files",
      where: { slug: { equals: slug }, status: { equals: "published" } },
      // The dossier only reads fields of directly related docs.
      depth: 1,
      limit: 1,
    });
    return res.docs?.[0] || null;
  } catch {
    return null;
  }
});

function mediaUrl(m: any): string | null {
  return m && typeof m === "object" && typeof m.url === "string" ? m.url : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cf = await getCaseFile(slug);
  if (!cf) return { title: "Case file not found" };
  return pageMetadata({ title: `${cf.title}`, description: cf.dek, path: `/publications/case-files/${slug}`, type: "article" });
}

export default async function CaseFileDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cf, streamHost] = await Promise.all([getCaseFile(slug), getStreamHost()]);
  if (!cf) notFound();

  const cover = mediaUrl(cf.featuredImage);
  const meta = [
    cf.sector && { l: "Sector", v: cf.sector },
    cf.jurisdiction && { l: "Jurisdiction", v: cf.jurisdiction },
    cf.caseStatus && CASE_STATUS[cf.caseStatus] && { l: "Status", v: CASE_STATUS[cf.caseStatus] },
    cf.method && { l: "Method", v: cf.method },
    cf.readTime && { l: "Reading", v: `${cf.readTime} min` },
    cf.publishedAt && { l: "Published", v: fullDate(cf.publishedAt) },
  ].filter(Boolean);

  return (
    <ResearchShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(articleJsonLd({ title: cf.title, description: cf.dek, path: `/publications/case-files/${slug}`, publishedAt: cf.publishedAt, updatedAt: cf.updatedAt }))}
      />
      <article className="detail">
        <div className="detail-wrap">
          <Link className="backlink" href="/publications/case-files">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            All case files
          </Link>

          <p className="kicker">Case File {caseNo(cf.caseNumber)} &middot; From the field</p>
          <h1 className="detail-title">{cf.title}</h1>
          {cf.dek && <p className="detail-dek">{cf.dek}</p>}

          {meta.length > 0 && (
            <div className="detail-meta">
              {meta.map((m: any) => <span className="dm" key={m.l}>{m.l}: <b>{m.v}</b></span>)}
            </div>
          )}

          {cf.podcastEpisode && typeof cf.podcastEpisode === "object" && (
            <div className="detail-cta">
              <a className="btn" href="#podcast">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                Listen to the episode
              </a>
            </div>
          )}

          {cover && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="detail-cover" src={cover} alt="" />
          )}
        </div>

        <CaseDossier caseFile={cf} streamHost={streamHost} />

        <div className="detail-wrap">
          <div className="case-engage">
            <div className="case-engage-card">
              <h2 className="case-h">Stay informed</h2>
              <p className="case-engage-p">Get a daily email when new information is added to this case.</p>
              <FollowCaseForm caseSlug={cf.slug} />
            </div>
            <div className="case-engage-card">
              <h2 className="case-h">Contribute to this case</h2>
              <p className="case-engage-p">Have a document or a correction? Send it to our research team for review.</p>
              <SubmitToCaseForm caseSlug={cf.slug} />
            </div>
          </div>

          <div className="detail-foot">
            <Link className="link" href="/publications/case-files">More case files
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
