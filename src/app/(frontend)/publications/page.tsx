// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { TYPE_LABELS, TYPE_PLURALS, pubMeta } from "../components/research/format";
import { pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({ title: "Governance Publications", description: "The Governance Files, articles, white papers, and annual reports on technology, project, and AI governance. The research, argued and on the record.", path: "/publications" });

const FILTERS = [
  { value: "", label: "All" },
  { value: "governance-file", label: "Governance Files" },
  { value: "transformidable-brief", label: "The Transformidable Brief" },
  { value: "article", label: "Articles" },
  { value: "white-paper", label: "White Papers" },
  { value: "annual-report", label: "Annual Reports" },
];

export default async function PublicationsIndex({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = TYPE_LABELS[type as string] ? (type as string) : "";

  const payload = await getPayload({ config });
  let docs: any[] = [];
  try {
    const where: any = { status: { equals: "published" } };
    if (activeType) where.type = { equals: activeType };
    const res = await payload.find({
      collection: "publications",
      where,
      sort: "-publishedAt",
      depth: 1,
      limit: 60,
    });
    docs = res.docs || [];
  } catch {
    docs = [];
  }

  const heading = activeType ? TYPE_PLURALS[activeType] : "Publications";

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="publications" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Publications</p>
          <h1 className="idx-title">{heading}</h1>
          <p className="idx-intro">
            What the research becomes: argued, edited, and on the record. The Governance Files run
            long; articles run short; white papers and annual reports carry the depth.
          </p>
          <nav className="idx-filters" aria-label="Filter publications by type">
            {FILTERS.map((f) => {
              const href = f.value ? `/publications?type=${f.value}` : "/publications";
              const isActive = f.value === activeType;
              return (
                <Link className={`idx-filter${isActive ? " is-active" : ""}`} href={href} key={f.label} aria-current={isActive ? "page" : undefined}>
                  {f.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <div className="idx-body">
        <div className="wrap">
          <h2 className="sr-only">{activeType ? `${heading}: all items` : "All publications"}</h2>
          {docs.length === 0 ? (
            <p className="empty">No publications in this series yet. New work is on the way.</p>
          ) : (
            docs.map((p) => {
              const meta = pubMeta(p, true);
              return (
                <article className="pub" key={p.id}>
                  <span className="p-type">{TYPE_LABELS[p.type] || "Publication"}</span>
                  <div>
                    <Link className="p-link" href={`/publications/${p.slug}`}><h3>{p.title}</h3></Link>
                    {p.dek && <p className="p-desc">{p.dek}</p>}
                    {meta.length > 0 && <span className="p-meta">{meta.join(" · ")}</span>}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </ResearchShell>
  );
}
