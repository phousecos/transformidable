// @ts-nocheck
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { Arrow } from "../../components/briefings/Briefings";
import { getBriefings, paragraphs, sessionWhen, tagged } from "../../../../lib/briefings.ts";
import { SITE_URL, jsonLdHtml, pageMetadata } from "../../../../lib/seo.ts";

// One briefing topic (a series on the briefings platform): what it covers,
// its upcoming dates, and the recording. Registering and watching happen on
// the briefings site; links carry the "website" campaign tag.
export const dynamic = "force-dynamic";

async function load(slug: string) {
  const feed = await getBriefings();
  // Platform unreachable: fail the request (search engines retry a 500)
  // rather than answer 404 and get the page dropped.
  if (!feed) throw new Error("Briefings feed unavailable");
  return feed.series.find((s) => s.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = await load(slug);
  if (!s) return { title: "Briefing not found" };
  return pageMetadata({
    title: `${s.name} | Governance Briefing`,
    description: s.tagline || paragraphs(s.description)[0]?.slice(0, 200) || s.formatLabel,
    path: `/briefings/${s.slug}`,
  });
}

// schema.org Event for each upcoming date, so the dates can show in Google's
// event listings. Online, free, registration on the briefings site.
function eventsJsonLd(s) {
  const pageUrl = `${SITE_URL}/briefings/${s.slug}`;
  return s.sessions.map((se) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: se.title || s.name,
    description: s.tagline || paragraphs(s.description)[0] || s.formatLabel,
    startDate: se.startsAt,
    endDate: se.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: pageUrl },
    image: [se.coverUrl || s.coverUrl || `${SITE_URL}/og.png`],
    url: pageUrl,
    organizer: { "@type": "Organization", name: "Transformidable", url: SITE_URL },
    ...((se.host || s.host?.name) && { performer: { "@type": "Person", name: se.host || s.host.name } }),
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: tagged(s.registerUrl, { session: String(se.id) }),
    },
  }));
}

export default async function BriefingPage({ params }) {
  const { slug } = await params;
  const s = await load(slug);
  if (!s) notFound();

  const hasDates = s.sessions.length > 0;
  const cover = s.sessions[0]?.coverUrl || s.coverUrl;
  const body = paragraphs(s.description);

  return (
    <ResearchShell>
      {hasDates && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(eventsJsonLd(s))} />}
      <section className="idx-hero tr-onsky">
        <Sky variant="podcast" />
        <div className="wrap idx-hero-in">
          <p className="kicker">
            <Link href="/briefings/live">Briefings</Link> &middot; {s.formatLabel}
          </p>
          <h1 className="idx-title">{s.name}</h1>
          {s.tagline && <p className="idx-intro">{s.tagline}</p>}
          <div className="hero-cta" style={{ marginTop: 28 }}>
            {hasDates && <a className="btn" href={tagged(s.registerUrl)}>Register <Arrow /></a>}
            {s.onDemand && s.watchUrl && (
              <a className={hasDates ? "link" : "btn"} href={tagged(s.watchUrl)}>
                Register to watch the recording <Arrow s={hasDates ? 13 : 14} />
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="idx-body">
        <div className="wrap br-detail">
          <div className="br-copy">
            {cover && (
              <figure className="br-cover">
                <img src={cover} alt="" width={1600} height={900} />
              </figure>
            )}
            {body.map((p, i) => <p key={i}>{p}</p>)}
            {s.host && (
              <>
                <h2>Your host</h2>
                <p><strong>{s.host.name}</strong>{s.host.bio ? `. ${s.host.bio}` : ""}</p>
              </>
            )}
            {s.topics.length > 0 && (
              <>
                <h2>Topics</h2>
                <ul className="br-tags">{s.topics.map((t) => <li key={t.slug}>{t.name}</li>)}</ul>
              </>
            )}
          </div>

          <aside>
            <section className="br-panel" aria-labelledby="br-dates-h">
              <h2 id="br-dates-h">{hasDates ? "Upcoming dates" : "Live dates"}</h2>
              {hasDates ? (
                <>
                  <ul className="br-dates">
                    {s.sessions.map((se) => {
                      const w = sessionWhen(se.startsAt, s.timezone);
                      return (
                        <li key={se.id}>
                          <span className="d">
                            {w.date}
                            <span className="t">{w.time} &middot; {se.durationMinutes} minutes</span>
                          </span>
                          <a className="link" href={tagged(s.registerUrl, { session: String(se.id) })}>
                            Register<span className="sr-only"> for {w.date}, {w.time}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  <p>Registration takes a minute. You&rsquo;ll get a calendar invitation and a reminder before it starts.</p>
                </>
              ) : (
                <p>
                  No live dates are scheduled right now. <Link className="link" href="/subscribe">Subscribe</Link> to hear
                  when the next one opens.
                </p>
              )}
            </section>

            {s.onDemand && s.watchUrl && (
              <section className="br-panel" aria-labelledby="br-od-h">
                <h2 id="br-od-h">Watch the recording</h2>
                <p>
                  Watch the recorded briefing whenever suits you. Register to get your personal link, which works for
                  30 days. The live Q&amp;A is part of the live dates only.
                </p>
                <a className="btn" href={tagged(s.watchUrl)}>Register to watch <Arrow /></a>
              </section>
            )}
          </aside>
        </div>
      </div>
    </ResearchShell>
  );
}
