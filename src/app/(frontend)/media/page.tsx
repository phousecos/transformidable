// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { fullDate } from "../components/research/format";
import "../components/home/home.css";
import { pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Transformidable Media: The Governance Files podcast, the Transformidable Briefing, interviews, and events on leadership and governance.";

export const metadata = pageMetadata({ title: "Media", description: DESCRIPTION, path: "/media" });

const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

const SERIES = [
  {
    tag: "Podcast",
    name: "The Governance Files",
    desc: "Governance decisions, examined on the record: conversations on governance, leadership, and institutional transformation.",
    href: "/podcast",
    cta: "Listen to The Governance Files",
  },
  {
    tag: "Briefing",
    name: "Transformidable Briefing",
    desc: "Mixed-media briefings, in video and writing, on what the research means for leaders now.",
    href: "/publications?type=transformidable-brief",
    cta: "Read the Briefing",
  },
  {
    tag: "Live",
    name: "Live Sessions",
    desc: "Upcoming and live briefings where findings are presented and discussed.",
    href: "/briefings/live",
    cta: "Attend a briefing",
  },
  {
    tag: "Archive",
    name: "Webinar Archive",
    desc: "Past webinars and recordings, available to watch on demand.",
    href: "/briefings/webinars",
    cta: "Browse the archive",
  },
];

export default async function MediaPage() {
  const payload = await getPayload({ config });
  let episodes: any[] = [];
  try {
    const res = await payload.find({
      collection: "podcast-episodes",
      where: { status: { equals: "published" } },
      sort: "-publishDate",
      depth: 0,
      limit: 3,
    });
    episodes = res.docs || [];
  } catch {
    // Collection may not be migrated yet in a fresh environment.
  }

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="media" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Transformidable Media</p>
          <h1 className="idx-title">Governance, in conversation.</h1>
          <p className="idx-intro">
            The Governance Files podcast, the Transformidable Briefing, interviews, and events: where the work
            of Transformidable is discussed, questioned, and put on the record.
          </p>
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <Link className="btn" href="/podcast">Listen to The Governance Files <Arrow /></Link>
            <Link className="link" href="/briefings/live">Attend a briefing <Arrow s={13} /></Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="md-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Series</p>
              <h2 className="h" id="md-h">Watch, listen, and attend.</h2>
            </div>
          </div>
          <div className="dv-grid">
            {SERIES.map((s) => (
              <div className="dv-card" key={s.name}>
                <span className="dv-tag">{s.tag}</span>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
                <Link className="link" href={s.href}>{s.cta} <Arrow s={13} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {episodes.length > 0 && (
        <section className="rule-band" style={{ background: "var(--paper-2)" }} aria-labelledby="md-latest-h">
          <div className="wrap">
            <div className="sec-head" style={{ marginBottom: 28 }}>
              <div><p className="kicker" id="md-latest-h">Latest from The Governance Files</p></div>
              <Link className="link" href="/podcast">All episodes <Arrow s={13} /></Link>
            </div>
            {episodes.map((ep) => (
              <article className="pub" key={ep.id}>
                <span className="p-type">{ep.episodeNumber ? `Episode ${ep.episodeNumber}` : "Episode"}</span>
                <div>
                  <Link className="p-link" href={`/podcast/${ep.slug}`}><h3>{ep.title}</h3></Link>
                  {ep.description && <p className="p-desc">{ep.description}</p>}
                  {ep.publishDate && <span className="p-meta">{fullDate(ep.publishDate)}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rule-band" aria-labelledby="md-qa-h">
        <div className="wrap">
          <p className="kicker" id="md-qa-h">At a glance</p>
          <dl className="dv-qa" style={{ marginTop: 20 }}>
            <div><dt>What it is</dt><dd>The media division of Transformidable: a podcast, briefings, interviews, and events.</dd></div>
            <div><dt>Who it is for</dt><dd>Leaders, board members, practitioners, and anyone following how organizational change is led and governed.</dd></div>
            <div><dt>Available now</dt><dd>The Governance Files podcast, the Transformidable Briefing, and the webinar archive.</dd></div>
            <div><dt>What to do next</dt><dd>Listen to an episode, attend a live briefing, or <a className="link" href="#briefing">subscribe to the Brief</a> to hear about new releases.</dd></div>
          </dl>
        </div>
      </section>
    </ResearchShell>
  );
}
