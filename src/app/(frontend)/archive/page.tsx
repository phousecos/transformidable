// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({ title: "Archive", description: "Browse past issues of Transformidable.", path: "/archive" });

export default async function ArchivePage() {
  const payload = await getPayload({ config });

  const issuesResult = await payload.find({
    collection: "issues",
    where: { status: { equals: "published" } },
    sort: "-issueNumber",
    limit: 100,
  });

  const issues = issuesResult.docs;

  return (
    <>
      <SiteNav />
      <main id="main-content" className="bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <h1 className="font-serif text-4xl font-bold italic text-obsidian md:text-5xl">
            Archive
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-obsidian/60 font-light">
            Past issues of Transformidable.
          </p>

          <div className="mt-12 space-y-16">
            {await Promise.all(issues.map(async (issue) => {
              const articlesResult = await payload.find({
                collection: "articles",
                where: {
                  issue: { equals: issue.id },
                  status: { equals: "published" },
                },
                sort: "displayOrder",
                depth: 2,
              });
              const articles = articlesResult.docs;
              const flagship = articles.find((a) => a.isFlagship);
              const remaining = articles.filter((a) => !a.isFlagship);

              const issueDate = new Date(issue.publicationDate);
              const dateStr = isNaN(issueDate.getTime())
                ? ""
                : issueDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

              return (
                <section key={issue.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-oxblood md:text-xs">
                        {[
                          issue.issueNumber != null ? `Issue ${String(issue.issueNumber).padStart(2, "0")}` : null,
                          issue.volume != null ? `Volume ${issue.volume}` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-bold italic leading-snug text-obsidian md:text-3xl">
                        <Link href={`/issues/${issue.issueNumber}`} className="transition-colors hover:text-oxblood">
                          {issue.themeTagline || issue.title}
                        </Link>
                      </h2>
                      {issue.themeSubheading && (
                        <p className="mt-1 text-sm text-obsidian/50">{issue.themeSubheading}</p>
                      )}
                    </div>
                    {dateStr && (
                      <p className="text-xs font-medium uppercase tracking-[0.15em] text-obsidian/40">{dateStr}</p>
                    )}
                  </div>
                  <div className="mt-4 h-[2px] bg-oxblood" />

                  <div className="mt-6 space-y-4">
                    {flagship && (
                      <div className="flex items-baseline gap-4">
                        <span className="w-6 shrink-0 text-right text-xs font-bold text-gold">
                          {String(flagship.displayOrder ?? 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-gold" aria-label="Flagship">★</span>
                        <div>
                          <p className="font-serif text-base font-semibold leading-snug text-obsidian md:text-lg">
                            {flagship.title}
                          </p>
                          {flagship.dek && (
                            <p className="mt-1 text-xs text-obsidian/50 md:text-sm">{flagship.dek}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {remaining.map((article) => {
                      const vertical = article.vertical && typeof article.vertical === "object" ? article.vertical : null;
                      return (
                        <div key={article.id} className="flex items-baseline gap-4">
                          <span className="w-6 shrink-0 text-right text-xs font-bold text-obsidian/30">
                            {String(article.displayOrder ?? 0).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="font-serif text-sm font-medium leading-snug text-obsidian/80 md:text-base">
                              {article.title}
                            </p>
                            {vertical && (
                              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-obsidian/40 md:text-[10px]">
                                {vertical.name}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/issues/${issue.issueNumber}`}
                    className="mt-6 inline-block rounded-sm border border-oxblood/40 px-6 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-oxblood transition-colors hover:bg-oxblood/5 md:text-xs"
                  >
                    Read This Issue →
                  </Link>
                </section>
              );
            }))}
          </div>

          {!issues.length && (
            <p className="mt-12 font-serif text-lg text-obsidian/60 italic">
              No published issues yet.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
