// @ts-nocheck
import Link from "next/link";
import "./briefings.css";
import { sessionWhen } from "../../../../lib/briefings.ts";

export const BRIEFINGS_SITE = "https://briefings.betransformidable.com";

export const Arrow = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// One briefing on a listing page. The whole card links to the briefing's page
// on this site; registering happens from there.
export function BriefingCard({ series, recorded = false }) {
  const next = series.sessions[0];
  const when = next && !recorded ? sessionWhen(next.startsAt, series.timezone) : null;
  const more = series.sessions.length - 1;
  return (
    <Link className="cf-card br-card" href={`/briefings/${series.slug}`}>
      <span className="cn">
        {when ? `${when.date} · ${when.time}` : "On demand · Register to watch"}
      </span>
      <h3>{series.name}</h3>
      {series.tagline && <p>{series.tagline}</p>}
      <div className="cm">
        <span>{series.formatLabel}</span>
        {series.topics.map((t) => <span key={t.slug}>{t.name}</span>)}
        {when && more > 0 && <span>+{more} more {more === 1 ? "date" : "dates"}</span>}
      </div>
    </Link>
  );
}

// Shown when the briefings platform can't be reached: the dates still exist,
// so send people there rather than saying there are none.
export function FeedUnavailable() {
  return (
    <p className="empty">
      Briefing dates can&rsquo;t be shown here right now. See them on{" "}
      <a className="link" href={BRIEFINGS_SITE}>the briefings site</a>.
    </p>
  );
}
