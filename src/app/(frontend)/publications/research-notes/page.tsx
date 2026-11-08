// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { fullDate } from "../../components/research/format";
import { pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({ title: "Governance Research Notes", description: "Working findings in progress from Transformidable's research on technology, project, and AI governance.", path: "/publications/research-notes" });

export default async function ResearchNotesIndex() {
  const payload = await getPayload({ config });
  let docs: any[] = [];
  try {
    const res = await payload.find({
      collection: "research-notes",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      depth: 1,
      limit: 60,
    });
    docs = res.docs || [];
  } catch {
    docs = [];
  }

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="notes" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Research &middot; Research Notes</p>
          <h1 className="idx-title">Research Notes</h1>
          <p className="idx-intro">
            Working findings in progress. Shorter than a publication, and often the raw material a case
            file or white paper is later built from.
          </p>
        </div>
      </section>

      <div className="idx-body">
        <div className="wrap">
          <h2 className="sr-only">All research notes</h2>
          {docs.length === 0 ? (
            <p className="empty">Research notes will appear here as the work develops.</p>
          ) : (
            docs.map((n) => (
              <article className="pub" key={n.id}>
                <span className="p-type">Note</span>
                <div>
                  <Link className="p-link" href={`/publications/research-notes/${n.slug}`}><h3>{n.title}</h3></Link>
                  {n.dek && <p className="p-desc">{n.dek}</p>}
                  {(n.publishedAt || n.readTime) && (
                    <span className="p-meta">
                      {[n.publishedAt && fullDate(n.publishedAt), n.readTime && `${n.readTime} min`].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </ResearchShell>
  );
}
