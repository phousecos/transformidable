// @ts-nocheck
// The Academy's page sections. Every word comes from Payload (Courses and
// the Academy Page global) or from the class platform's feed (dates, seats,
// prices); nothing here is about one course. An empty field leaves its
// element out, and an empty section leaves the section out.
import { Fragment } from "react";
import Link from "next/link";
import { ResearchShell } from "../research/ResearchShell";
import { Sky } from "../research/Sky";
import {
  BUYING_MODEL_TEXT,
  DEDICATED_HREF,
  INTEREST_HREF,
  cardLabel,
  fullName,
  isReduced,
  money,
  registerHref,
  seatsText,
  sessionTimes,
} from "../../../../lib/academy.ts";
import "./academy.css";

export const Arrow = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/** Text with *asterisks* shown in italics. */
export function Em({ children }: { children?: string }) {
  if (!children) return null;
  return String(children).split(/(\*[^*]+\*)/g).map((part, i) =>
    /^\*[^*]+\*$/.test(part) ? <em key={i}>{part.slice(1, -1)}</em> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** A headline with its accent in color: "Govern technology. *No technical background required.*" */
export function Headline({ as: Tag = "h2", id, text, accent, className = "aa-h2" }) {
  if (!text && !accent) return null;
  return (
    <Tag className={className} id={id}>
      <Em>{text}</Em>{text && accent ? " " : null}{accent && <span className="aa-accent"><Em>{accent}</Em></span>}
    </Tag>
  );
}

const has = (list) => Array.isArray(list) && list.length > 0;

export function AcademyShell({ children }) {
  return (
    <ResearchShell>
      <div className="aa">{children}</div>
    </ResearchShell>
  );
}

export function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

// ---- Hero -----------------------------------------------------------------

export function AcademyHero({ eyebrow, headline, accent, subhead, breadcrumb = null, children = null }) {
  return (
    <section className="aa-hero tr-onsky">
      <Sky variant="academy" />
      <div className="wrap aa-hero-in">
        {breadcrumb}
        {eyebrow && <p className="aa-eyebrow">{eyebrow}</p>}
        <Headline as="h1" className="aa-title" text={headline} accent={accent} />
        {subhead && <p className="aa-hero-sub">{subhead}</p>}
        {children}
      </div>
    </section>
  );
}

export function ButtonRow({ primary, secondary }) {
  if (!primary?.label && !secondary?.label) return null;
  return (
    <div className="aa-buttons">
      {primary?.label && <a className="aa-btn aa-btn--gold" href={primary.href}>{primary.label}</a>}
      {secondary?.label && <a className="aa-btn aa-btn--ghost" href={secondary.href}>{secondary.label}</a>}
    </div>
  );
}

/** The next date across every course, under the Academy hero. */
export function NextSessionStrip({ course, foundingLabel }) {
  const s = course?.next;
  if (!s) return null;
  const t = sessionTimes(s);
  const seats = seatsText(s);
  return (
    <a className="aa-next" href={registerHref(course.series, s)}>
      <span className="aa-next-label">Next session</span>
      <span>{fullName(course)}</span>
      <span><time dateTime={t.iso}>{t.date}</time> · {t.time}</span>
      {seats && <span>{seats}</span>}
      <span className="aa-next-price">
        {money(s.priceCents, course.series.currency)}{isReduced(s) && foundingLabel ? ` ${foundingLabel}` : ""}
      </span>
    </a>
  );
}

// ---- Founding offer -------------------------------------------------------

export function FoundingBand({ page, href }) {
  if (!page.foundingShow || (!page.foundingHeadline && !page.foundingAccent)) return null;
  return (
    <section className="aa-founding" aria-labelledby="aa-founding-h">
      <div className="wrap aa-founding-in">
        <div>
          <Headline id="aa-founding-h" className="aa-founding-h" text={page.foundingHeadline} accent={page.foundingAccent} />
          {page.foundingBody && <p><Em>{page.foundingBody}</Em></p>}
        </div>
        {page.foundingButton && <a className="aa-btn aa-btn--light" href={href}>{page.foundingButton}</a>}
      </div>
    </section>
  );
}

// ---- Courses --------------------------------------------------------------

/**
 * A card's one-line status and its button. Courses with open dates say when
 * the next one is and offer "Find a cohort" (the course page's dates, or the
 * sessions table); the others say where they stand.
 */
function cardStatus(c) {
  if (c.availability === "scheduled") {
    const href = c.href ? `${c.href}#cohorts` : "#sessions";
    if (c.next) {
      const line = c.next.full ? "Next cohort full · more dates soon" : `Next cohort: ${sessionTimes(c.next).date}`;
      return { line, label: "Find a cohort", href, primary: true };
    }
    return { line: c.statusLabel || "New dates soon", label: "Find a cohort", href };
  }
  if (c.availability === "private") {
    return { line: c.statusLabel || "Available on request", label: c.href ? "Course details" : "Ask about a session", href: c.href || `${DEDICATED_HREF}?course=${c.slug}` };
  }
  return { line: c.statusLabel || "Coming soon", label: "Register interest", href: `${INTEREST_HREF}?course=${c.slug}` };
}

export function CourseCards({ catalog }) {
  if (!has(catalog)) return null;
  return (
    <ul className="aa-cards" role="list">
      {catalog.map((c, i) => {
        const status = cardStatus(c);
        const featured = i === 0 && Boolean(c.next);
        return (
          <li className={featured ? "aa-card aa-card--featured" : "aa-card"} key={c.id}>
            <p className="aa-card-top">
              <span className="aa-card-code">{cardLabel(c)}</span>
              {c.topicTag && <span className="aa-tag">{c.topicTag}</span>}
            </p>
            <h3 className="aa-card-title">
              {c.href ? <Link href={c.href}>{c.title}</Link> : c.title}
            </h3>
            {c.oneLine && <p className="aa-card-line"><Em>{c.oneLine}</Em></p>}
            <p className="aa-card-format">{[c.format, BUYING_MODEL_TEXT[c.buyingModel]].filter(Boolean).join(" · ")}</p>
            <div className="aa-card-foot">
              <p className="aa-card-status"><b>{status.line}</b></p>
              <a className={status.primary ? "aa-btn aa-btn--gold aa-btn--sm" : "aa-btn aa-btn--line aa-btn--sm"} href={status.href}>
                {status.label}<span className="sr-only">: {fullName(c)}</span>
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---- Upcoming sessions ----------------------------------------------------

function PriceCell({ s, currency }) {
  return (
    <>
      {money(s.priceCents, currency)}
      {isReduced(s) && (
        <>
          {" "}<s><span className="sr-only">regular price </span>{money(s.regularPriceCents, currency)}</s>
        </>
      )}
    </>
  );
}

/**
 * Every upcoming date of every course, then per-seat courses that are coming
 * with an interest-list row. The topic filter appears only when the rows span
 * more than one topic; it is plain links, so it works without JavaScript.
 */
export function SessionsTable({ catalog, topic = "", basePath = "/academy" }) {
  const rows = [];
  for (const c of catalog) {
    for (const s of c.sessions) rows.push({ c, s });
  }
  rows.sort((a, b) => a.s.startsAt.localeCompare(b.s.startsAt));
  const coming = catalog.filter((c) => !c.sessions.length && c.availability !== "private" && c.buyingModel === "per-seat");
  const topics = [...new Set([...rows.map((r) => r.c.topicTag), ...coming.map((c) => c.topicTag)].filter(Boolean))];
  const show = (c) => !topic || c.topicTag === topic;
  const shown = rows.filter((r) => show(r.c));
  const shownComing = coming.filter(show);

  if (!rows.length && !coming.length) {
    return <p className="aa-empty">New dates are being scheduled. <a className="aa-inline" href={`${INTEREST_HREF}?reason=waitlist`}>Join the waitlist</a> and we’ll tell you when they open.</p>;
  }

  return (
    <>
      {topics.length > 1 && (
        <nav className="aa-filter" aria-label="Filter sessions by topic">
          <a href={`${basePath}#sessions`} aria-current={!topic ? "true" : undefined}>All topics</a>
          {topics.map((t) => (
            <a key={t} href={`${basePath}?topic=${encodeURIComponent(t)}#sessions`} aria-current={topic === t ? "true" : undefined}>{t}</a>
          ))}
        </nav>
      )}
      <div className="aa-table-wrap">
        <table className="aa-table">
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Date · time (ET)</th>
              <th scope="col">Seats left</th>
              <th scope="col">Price</th>
              <th scope="col"><span className="sr-only">Register</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ c, s }) => {
              const t = sessionTimes(s);
              const seats = s.full ? "Full" : s.seatsLeft != null && s.capacity ? `${s.seatsLeft} of ${s.capacity}` : "Open";
              return (
                <tr key={`${c.id}-${s.id}`}>
                  <th scope="row"><b>{c.code || c.title}</b>{c.code && <span>{c.title}</span>}</th>
                  <td><time dateTime={t.iso}>{t.date}</time> · {t.timeBare}</td>
                  <td className={s.seatsLeft != null && s.seatsLeft <= 5 && !s.full ? "aa-low" : undefined}>{seats}{s.capacity && !s.full ? <span className="aa-narrow-only"> seats left</span> : null}</td>
                  <td><PriceCell s={s} currency={c.series.currency} /></td>
                  <td>
                    {s.full ? (
                      <a className="aa-btn aa-btn--line aa-btn--sm" href={`${INTEREST_HREF}?course=${c.slug}&reason=waitlist`}>Waitlist<span className="sr-only">: {fullName(c)}, {t.date}</span></a>
                    ) : (
                      <a className="aa-btn aa-btn--wine aa-btn--sm" href={registerHref(c.series, s)}>Register<span className="sr-only">: {fullName(c)}, {t.date}</span></a>
                    )}
                  </td>
                </tr>
              );
            })}
            {shownComing.map((c) => (
              <tr key={`coming-${c.id}`}>
                <th scope="row"><b>{c.code || c.title}</b>{c.code && <span>{c.title}</span>}</th>
                <td>{c.statusLabel || "Dates soon"}</td>
                <td className="aa-wide-only">Dates soon</td>
                <td>{c.priceLabel || ""}</td>
                <td><a className="aa-btn aa-btn--line aa-btn--sm" href={`${INTEREST_HREF}?course=${c.slug}`}>Interest list<span className="sr-only">: {fullName(c)}</span></a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function WaitlistLine({ page, course = null }) {
  if (!page.waitlistLink) return null;
  const href = `${INTEREST_HREF}?${course ? `course=${course.slug}&` : ""}reason=waitlist`;
  return (
    <p className="aa-waitlist">
      {page.waitlistLine && <>{page.waitlistLine} </>}
      <a className="aa-inline" href={href}>{page.waitlistLink}</a>
      {page.waitlistAfter && <> {page.waitlistAfter}</>}
    </p>
  );
}

// ---- How the classes work --------------------------------------------------

export function HowTiles({ page }) {
  if (!has(page.howTiles)) return null;
  return (
    <section className="aa-band aa-band--sand" aria-labelledby="aa-how-h">
      <div className="wrap">
        {page.howEyebrow && <p className="aa-eyebrow">{page.howEyebrow}</p>}
        <Headline id="aa-how-h" text={page.howHeadline} />
        <ol className="aa-tiles" role="list">
          {page.howTiles.map((t, i) => (
            <li className={i === page.howTiles.length - 1 ? "aa-tile aa-tile--wine" : "aa-tile"} key={t.id || t.title}>
              <span className="aa-tile-no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3>{t.title}</h3>
              <p><Em>{t.text}</Em></p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---- Take-away cards -------------------------------------------------------

/** The card itself: the uploaded preview, or a typeset one from the course's fields. */
export function TakeawayVisual({ course }) {
  const img = course.takeawayImage;
  if (img?.url) {
    return (
      <figure className="aa-card-visual">
        <img src={img.url} alt={img.alt || `Preview of the ${course.takeawayName} card`} width={img.width || undefined} height={img.height || undefined} loading="lazy" />
      </figure>
    );
  }
  if (!course.takeawayName) return null;
  return (
    <figure className="aa-card-visual aa-card-visual--typeset" aria-label={`Preview of the ${course.takeawayName} card`}>
      <div className="aa-tv-head">
        <span>Transformidable Academy{course.code ? ` · ${course.code}` : ""} take-away</span>
        <b>{course.takeawayName}</b>
      </div>
      <div className="aa-tv-body" aria-hidden="true">
        {(course.outcomes || []).slice(0, 6).map((o, i) => <span key={i} className="aa-tv-line" style={{ width: `${92 - ((i * 13) % 34)}%` }} />)}
        {!has(course.outcomes) && [0, 1, 2, 3, 4].map((i) => <span key={i} className="aa-tv-line" style={{ width: `${92 - ((i * 13) % 34)}%` }} />)}
      </div>
    </figure>
  );
}

export function TakeawaySection({ page, courses, single = false }) {
  const withCards = courses.filter((c) => c.takeawayName);
  if (!withCards.length) return null;
  return (
    <section className="aa-band" aria-labelledby="aa-takeaway-h">
      <div className="wrap">
        {withCards.map((c, i) => (
          <div className="aa-takeaway" key={c.id}>
            <div>
              {i === 0 && page.takeawayEyebrow && <p className="aa-eyebrow">{page.takeawayEyebrow}</p>}
              {i === 0 ? <Headline id="aa-takeaway-h" text={page.takeawayHeadline} accent={page.takeawayAccent} /> : <h3 className="aa-h3"><Em>{c.takeawayName}</Em></h3>}
              {c.takeawayDescription && <p className="aa-body"><Em>{c.takeawayDescription}</Em>{!single && i === withCards.length - 1 && page.takeawayOutro ? <> {page.takeawayOutro}</> : null}</p>}
              {has(c.takeawayHighlights) && (
                <ol className="aa-highlights" role="list">
                  {c.takeawayHighlights.map((h, j) => (
                    <li key={h.id || j}><span aria-hidden="true">{String(j + 1).padStart(2, "0")}</span> {h.text}</li>
                  ))}
                </ol>
              )}
            </div>
            <TakeawayVisual course={c} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Two ways to attend ------------------------------------------------------

function AttendCard({ card, href, wine = false }) {
  if (!card?.title) return null;
  return (
    <div className={wine ? "aa-attend aa-attend--wine" : "aa-attend"}>
      <p className="aa-attend-label">
        {card.label}
        {card.badge && <span className="aa-badge">{card.badge}</span>}
      </p>
      <h3>{card.title}</h3>
      {has(card.points) && (
        <ul>
          {card.points.map((p, i) => <li key={p.id || i}><Em>{p.text}</Em></li>)}
        </ul>
      )}
      <div className="aa-attend-foot">
        {card.priceLine && <p className="aa-attend-price"><Em>{card.priceLine}</Em></p>}
        {card.button && <a className={wine ? "aa-btn aa-btn--gold aa-btn--sm" : "aa-btn aa-btn--line aa-btn--sm"} href={href}>{card.button}</a>}
      </div>
    </div>
  );
}

export function PublicNote({ page }) {
  if (!page.publicNote) return null;
  return (
    <p className="aa-public-note">
      {page.publicNoteLead && <b>{page.publicNoteLead} </b>}
      <Em>{page.publicNote}</Em>
    </p>
  );
}

export function TwoWays({ page, ownHref, ownButton = null, course = null }) {
  if (!page.attendOwn?.title && !page.attendBody?.title) return null;
  const dedicated = course ? `${DEDICATED_HREF}?course=${course.slug}` : DEDICATED_HREF;
  return (
    <section className="aa-band aa-band--sand" id="two-ways" aria-labelledby="aa-attend-h">
      <div className="wrap">
        {page.attendEyebrow && <p className="aa-eyebrow">{page.attendEyebrow}</p>}
        <Headline id="aa-attend-h" text={page.attendHeadline} accent={page.attendAccent} />
        {page.attendIntro && <p className="aa-intro"><Em>{page.attendIntro}</Em></p>}
        <div className="aa-attend-grid">
          <AttendCard card={ownButton ? { ...page.attendOwn, button: ownButton } : page.attendOwn} href={ownHref} />
          <AttendCard card={page.attendBody} href={dedicated} wine />
        </div>
        <PublicNote page={page} />
      </div>
    </section>
  );
}

// ---- Instructor -----------------------------------------------------------

export function Instructors({ page, sand = false }) {
  const people = page.instructors || [];
  if (!people.length) return null;
  const one = people.length === 1;
  return (
    <section className={sand ? "aa-band aa-band--sand" : "aa-band"} aria-labelledby="aa-faculty-h">
      <div className="wrap">
        {!one && <Headline id="aa-faculty-h" text="Faculty" />}
        <div className={one ? "aa-faculty aa-faculty--one" : "aa-faculty"}>
          {people.map((p, i) => (
            <div className="aa-person" key={p.id || p.name}>
              {p.photo?.url && (
                <img className="aa-person-photo" src={p.photo.url} alt={p.photo.alt || p.name} width={p.photo.width || undefined} height={p.photo.height || undefined} loading="lazy" />
              )}
              <div>
                {one && <p className="aa-eyebrow">Your instructor</p>}
                {one ? <h2 className="aa-h2 aa-person-name" id="aa-faculty-h">{p.name}</h2> : <h3 className="aa-h3">{p.name}</h3>}
                <p className="aa-body">{p.bio}</p>
                {p.credentials && <p className="aa-creds">{p.credentials}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Questions and the closing band ------------------------------------------

export function Faq({ heading, items, sand = false }) {
  if (!has(items)) return null;
  return (
    <section className={sand ? "aa-band aa-band--sand" : "aa-band"} id="faq" aria-labelledby="aa-faq-h">
      <div className="wrap aa-faq-wrap">
        <h2 className="aa-h2" id="aa-faq-h">{heading || "Questions"}</h2>
        <div className="aa-faq">
          {items.map((q) => (
            <details key={q.id || q.question}>
              <summary>{q.question}</summary>
              <p><Em>{q.answer}</Em></p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ headline, accent, button, href, children = null }) {
  if (!headline && !accent) return null;
  return (
    <section className="aa-final tr-onsky" aria-labelledby="aa-final-h">
      <Sky variant="academy" />
      <div className="wrap aa-final-in">
        <div>
          <Headline id="aa-final-h" className="aa-final-h" text={headline} accent={accent} />
          {children}
        </div>
        {button && <a className="aa-btn aa-btn--gold" href={href}>{button}</a>}
      </div>
    </section>
  );
}
