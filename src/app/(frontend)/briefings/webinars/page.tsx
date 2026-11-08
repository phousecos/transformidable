// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { BriefingCard, FeedUnavailable } from "../../components/briefings/Briefings";
import { getBriefings, recordedSeries } from "../../../../lib/briefings.ts";
import { pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Recorded Governance Briefings",
  description:
    "Recorded briefings for boards and executives on technology, project, and AI governance. Register to watch on demand, whenever suits you.",
  path: "/briefings/webinars",
});

export default async function RecordedBriefingsPage() {
  const feed = await getBriefings();
  const recorded = feed ? recordedSeries(feed) : [];

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="podcast" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Media &middot; Recorded Briefings</p>
          <h1 className="idx-title">Recorded Briefings</h1>
          <p className="idx-intro">
            Briefings on technology, project, and AI governance for boards and executives, on demand. Register once and
            your personal link works for 30 days.
          </p>
        </div>
      </section>

      <div className="idx-body">
        <div className="wrap">
          {!feed ? (
            <FeedUnavailable />
          ) : recorded.length === 0 ? (
            <p className="empty">
              Recorded briefings will appear here. In the meantime, <Link className="link" href="/briefings/live">see the upcoming live dates</Link>.
            </p>
          ) : (
            <div className="cf-cards">
              {recorded.map((s) => <BriefingCard series={s} recorded key={s.slug} />)}
            </div>
          )}
        </div>
      </div>
    </ResearchShell>
  );
}
