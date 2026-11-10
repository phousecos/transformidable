// @ts-nocheck
// One template for every course: /academy/courses/{slug} renders whichever
// Courses entry has that slug and "Has a course page" on. Copy comes from the
// entry and the Academy Page global; dates, seats and prices from the class
// platform. The date, price and Register button come before any explanation.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AcademyHero,
  AcademyShell,
  ButtonRow,
  Em,
  Faq,
  FinalCta,
  Headline,
  Instructors,
  JsonLd,
  TakeawayVisual,
  TwoWays,
  WaitlistLine,
} from "../../../components/academy/Academy";
import {
  ACADEMY_TIMEZONE,
  DEDICATED_HREF,
  INTEREST_HREF,
  buildCatalog,
  courseHref,
  fullName,
  getAcademyFeed,
  getAcademyPage,
  getCourses,
  isReduced,
  money,
  registerHref,
  seatsText,
  sessionTimes,
} from "../../../../../lib/academy.ts";
import { SITE_URL, pageMetadata } from "../../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const [courses, feed, page] = await Promise.all([getCourses(), getAcademyFeed(), getAcademyPage()]);
  const course = buildCatalog(courses.filter((c) => c.slug === slug), feed)[0] || null;
  return { course, page };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { course } = await load(slug);
  if (!course?.hasPage) return {};
  return pageMetadata({
    title: course.seoTitle || `${fullName(course)} | Transformidable Academy`,
    absolute: true,
    description: course.seoDescription || course.oneLine,
    path: courseHref(course.slug),
    noindex: !course.listed,
  });
}

const hasItems = (list) => Array.isArray(list) && list.length > 0;

function priceFact(course, s, foundingLabel) {
  if (!s) return course.priceLabel || null;
  const cur = course.series.currency;
  return isReduced(s)
    ? `${money(s.priceCents, cur)} ${foundingLabel || "founding rate"} (regular ${money(s.regularPriceCents, cur)})`
    : `${money(s.priceCents, cur)} per seat`;
}

/** "January 2027", in Eastern, to group dates by month. */
const monthOf = (iso) => new Intl.DateTimeFormat("en-US", { timeZone: ACADEMY_TIMEZONE, month: "long", year: "numeric" }).format(new Date(iso));

/**
 * Every upcoming date the class platform sends, grouped by month: one row per
 * date with its time, seats, price and Register (or the waitlist when full).
 * The next open date is marked; founding-rate dates show the regular price
 * struck through.
 */
function CohortList({ course }) {
  const sessions = course.sessions;
  if (!sessions.length) {
    return (
      <div className="aa-cohort-empty">
        <p className="aa-body">{course.statusLabel ? <><b>{course.statusLabel}.</b> </> : null}No dates are open right now.</p>
        <a className="aa-btn aa-btn--wine" href={`${INTEREST_HREF}?course=${course.slug}&reason=waitlist`}>Tell me when dates open</a>
      </div>
    );
  }
  const firstOpen = sessions.find((s) => !s.full);
  const months = [];
  for (const s of sessions) {
    const m = monthOf(s.startsAt);
    if (months.at(-1)?.month !== m) months.push({ month: m, sessions: [] });
    months.at(-1).sessions.push(s);
  }
  const cur = course.series.currency;
  return (
    <div className="aa-dates">
      {months.map(({ month, sessions: list }) => (
        <section className="aa-month" key={month} aria-label={month}>
          <h3 className="aa-month-h">{month}</h3>
          <ul className="aa-date-list" role="list">
            {list.map((s) => {
              const t = sessionTimes(s);
              const seats = seatsText(s);
              const next = s === firstOpen;
              return (
                <li key={s.id} className={[s.full ? "aa-date aa-date--full" : "aa-date", next ? "aa-date--next" : ""].join(" ").trim()}>
                  <p className="aa-date-when">
                    <time dateTime={t.iso}>{t.date}</time>
                    {next && <span className="aa-date-tag">Next cohort</span>}
                    {!next && isReduced(s) && !s.full && <span className="aa-date-tag aa-date-tag--quiet">Founding</span>}
                  </p>
                  <p className="aa-date-time">{t.time}</p>
                  <p className={s.seatsLeft != null && s.seatsLeft <= 5 && !s.full ? "aa-date-seats aa-low" : "aa-date-seats"}>{seats || "Seats available"}</p>
                  <p className="aa-date-price">
                    {money(s.priceCents, cur)}
                    {isReduced(s) && <> <s><span className="sr-only">regular price </span>{money(s.regularPriceCents, cur)}</s></>}
                  </p>
                  <div className="aa-date-go">
                    {s.full ? (
                      <a className="aa-btn aa-btn--line aa-btn--sm" href={`${INTEREST_HREF}?course=${course.slug}&reason=waitlist`}>Join waitlist<span className="sr-only"> for {t.date}</span></a>
                    ) : (
                      <a className="aa-btn aa-btn--wine aa-btn--sm" href={registerHref(course.series, s)}>Register<span className="sr-only"> for {t.date}</span></a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const { course, page } = await load(slug);
  if (!course) notFound();
  // A course without its own page yet: its card on the Academy page says what's on offer.
  if (!course.hasPage) redirect("/academy#courses");

  const next = course.sessions.find((s) => !s.full) || null;
  const nextDate = next ? sessionTimes(next).date : null;
  const primary = next
    ? { label: `Register for ${nextDate}`, href: registerHref(course.series, next) }
    : { label: "Join the interest list", href: `${INTEREST_HREF}?course=${course.slug}` };
  const dedicatedHref = `${DEDICATED_HREF}?course=${course.slug}`;
  const facts = [...(course.facts || []).map((f) => f.text), priceFact(course, next, page.foundingLabel)].filter(Boolean);
  const nextCourse = course.nextCourse && typeof course.nextCourse === "object" ? course.nextCourse : null;
  const nextCourseHref = nextCourse
    ? nextCourse.hasPage ? courseHref(nextCourse.slug) : nextCourse.availability === "private" ? `${DEDICATED_HREF}?course=${nextCourse.slug}` : `${INTEREST_HREF}?course=${nextCourse.slug}`
    : null;

  return (
    <AcademyShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: fullName(course),
          description: course.seoDescription || course.oneLine,
          url: `${SITE_URL}${courseHref(course.slug)}`,
          ...(course.code && { courseCode: course.code }),
          provider: { "@type": "Organization", name: "Transformidable Academy", sameAs: SITE_URL },
          ...(course.sessions.length > 0 && {
            hasCourseInstance: course.sessions.map((s) => ({
              "@type": "CourseInstance",
              courseMode: "Online",
              startDate: s.startsAt,
              endDate: s.endsAt,
              offers: {
                "@type": "Offer",
                price: (s.priceCents / 100).toFixed(2),
                priceCurrency: course.series.currency.toUpperCase(),
                url: registerHref(course.series, s),
                availability: s.full ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
              },
            })),
          }),
        }}
      />

      <AcademyHero
        eyebrow={course.eyebrow || [course.code, course.format].filter(Boolean).join(" · ")}
        headline={course.headline || course.title}
        accent={course.headlineAccent}
        subhead={course.subhead || course.oneLine}
        breadcrumb={
          <nav className="aa-crumbs" aria-label="Breadcrumb">
            <Link href="/academy">Academy</Link> <span aria-hidden="true">/</span> <span aria-current="page">{course.code || course.title}</span>
          </nav>
        }
      >
        {facts.length > 0 && (
          <ul className="aa-facts" role="list">
            {facts.map((f, i) => (
              <li key={i} className={i === facts.length - 1 && next && isReduced(next) ? "aa-fact aa-fact--gold" : "aa-fact"}>{f}</li>
            ))}
          </ul>
        )}
        <ButtonRow primary={primary} secondary={{ label: page.heroSecondary, href: dedicatedHref }} />
      </AcademyHero>

      <section className="aa-band" id="cohorts" aria-labelledby="aa-cohorts-h">
        <div className="wrap">
          <h2 className="aa-h2" id="aa-cohorts-h">Choose a cohort</h2>
          {course.sessions.length > 0 && page.sessionsIntro && <p className="aa-intro aa-intro--tight">{page.sessionsIntro}</p>}
          <CohortList course={course} />
          {course.sessions.length > 0 && <WaitlistLine page={page} course={course} />}
        </div>
      </section>

      <TwoWays page={page} ownHref="#cohorts" ownButton="Register for a seat" course={course} />

      {(course.whyHeadline || course.whyBody) && (
        <section className="aa-why" aria-labelledby="aa-why-h">
          <div className="wrap aa-why-in">
            <Headline id="aa-why-h" className="aa-why-h" text={course.whyHeadline} accent={course.whyAccent} />
            {course.whyBody && <p><Em>{course.whyBody}</Em></p>}
          </div>
        </section>
      )}

      {hasItems(course.agenda) && (
        <section className="aa-band" aria-labelledby="aa-agenda-h">
          <div className="wrap">
            {course.agendaEyebrow && <p className="aa-eyebrow">{course.agendaEyebrow}</p>}
            <Headline id="aa-agenda-h" text={course.agendaHeadline} />
            <ol className="aa-agenda" role="list">
              {course.agenda.map((part, i) => (
                <li key={part.id || i} className={i === course.agenda.length - 1 ? "aa-part aa-part--last" : "aa-part"}>
                  <div className="aa-part-block" aria-hidden="true">
                    <span className="aa-part-no">{String(i + 1).padStart(2, "0")}</span>
                    {part.minutes ? <span className="aa-part-min">{part.minutes} min</span> : null}
                  </div>
                  <h3>{part.title}{part.minutes ? <span className="sr-only">, {part.minutes} minutes</span> : null}</h3>
                  {part.description && <p><Em>{part.description}</Em></p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {(hasItems(course.outcomes) || hasItems(course.leaveWith) || course.takeawayName) && (
        <section className="aa-band aa-band--sand" aria-label="What you leave with">
          <div className="wrap aa-outcomes-grid">
            <div>
              {hasItems(course.outcomes) && (
                <>
                  <h2 className="aa-eyebrow aa-eyebrow--h">{course.outcomesHeadline || "By the end, you’ll be able to"}</h2>
                  <ul className="aa-checks" role="list">
                    {course.outcomes.map((o, i) => <li key={o.id || i}><Em>{o.text}</Em></li>)}
                  </ul>
                </>
              )}
              {hasItems(course.leaveWith) && (
                <>
                  <h2 className="aa-eyebrow aa-eyebrow--h">{course.leaveWithHeadline || "You leave with"}</h2>
                  <p className="aa-leave">
                    {course.leaveWith.map((l, i) => (
                      <span key={l.id || i}>{i > 0 && <span aria-hidden="true"> · </span>}<Em>{l.text}</Em></span>
                    ))}
                  </p>
                </>
              )}
            </div>
            <TakeawayVisual course={course} />
          </div>
        </section>
      )}

      {(course.whoFor || hasItems(course.howItRuns)) && (
        <section className="aa-band" aria-label="Who it’s for and how it runs">
          <div className="wrap aa-two">
            {course.whoFor && (
              <div>
                <h2 className="aa-h3">Who it’s for</h2>
                <p className="aa-body"><Em>{course.whoFor}</Em></p>
                {course.notFor && <p className="aa-body aa-muted"><b>Not for:</b> <Em>{course.notFor}</Em></p>}
              </div>
            )}
            {hasItems(course.howItRuns) && (
              <div>
                <h2 className="aa-h3">How it runs</h2>
                <ul className="aa-bullets" role="list">
                  {course.howItRuns.map((h, i) => <li key={h.id || i}><Em>{h.text}</Em></li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <Instructors page={page} sand />
      <Faq heading={page.faqHeadline} items={course.faq} />

      <FinalCta headline={course.finalHeadline} accent={course.finalAccent} button={primary.label} href={primary.href}>
        <p className="aa-final-links">
          {page.heroSecondary && <a href={dedicatedHref}>{page.heroSecondary}</a>}
          {nextCourse && nextCourseHref && (
            <>
              {page.heroSecondary && <span aria-hidden="true"> · </span>}
              <a href={nextCourseHref}>Next course: {nextCourse.title} <span aria-hidden="true">→</span></a>
            </>
          )}
        </p>
      </FinalCta>
    </AcademyShell>
  );
}
