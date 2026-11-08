// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { BriefingCard, FeedUnavailable } from "../../components/briefings/Briefings";
import { getBriefings, recordedSeries, upcomingSeries } from "../../../../lib/briefings.ts";
import { pageMetadata } from "../../../../lib/seo.ts";

// Dates and topics come from the briefings platform, so this renders per request.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Upcoming Governance Briefings",
  description:
    "Live briefings for boards and executives on technology, project, and AI governance, each with time for your questions. Choose a date and register.",
  path: "/briefings/live",
});

export default async function LiveBriefingsPage() {
  const feed = await getBriefings();
  const upcoming = feed ? upcomingSeries(feed) : [];
  const recorded = feed ? recordedSeries(feed) : [];

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="podcast" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Media &middot; Briefings</p>
          <h1 className="idx-title">Upcoming Briefings</h1>
          <p className="idx-intro">
            Live briefings for boards and executives on technology, project, and AI governance: what the research
            shows, what to ask, and time for your questions.
          </p>
        </div>
      </section>

      <div className="idx-body">
        <div className="wrap">
          {!feed ? (
            <FeedUnavailable />
          ) : upcoming.length === 0 ? (
            <p className="empty">
              No briefings are scheduled right now. <Link className="link" href="/subscribe">Subscribe</Link> to hear
              when the next dates open.
            </p>
          ) : (
            <section className="br-section" aria-label="Upcoming briefings">
              <div className="cf-cards">
                {upcoming.map((s) => <BriefingCard series={s} key={s.slug} />)}
              </div>
            </section>
          )}

          {recorded.length > 0 && (
            <section className="br-section" aria-labelledby="br-rec-h">
              <h2 id="br-rec-h">Can&rsquo;t make a live date?</h2>
              <p className="br-sub">
                Watch a recorded briefing whenever suits you. <Link className="link" href="/briefings/webinars">See all recorded briefings</Link>.
              </p>
              <div className="cf-cards">
                {recorded.map((s) => <BriefingCard series={s} recorded key={s.slug} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </ResearchShell>
  );
}
