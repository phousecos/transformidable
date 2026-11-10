// @ts-nocheck
// The Academy front door. Sells the next session in any course: copy from
// Payload (Academy Page, Courses), dates, seats and prices from the class
// platform (lib/academy.ts). Rendered on every request, so a change in either
// shows up without a deploy.
import {
  AcademyHero,
  AcademyShell,
  ButtonRow,
  CourseCards,
  Em,
  Faq,
  FinalCta,
  FoundingBand,
  Headline,
  HowTiles,
  Instructors,
  JsonLd,
  NextSessionStrip,
  SessionsTable,
  TakeawaySection,
  TwoWays,
  WaitlistLine,
} from "../components/academy/Academy";
import { INTEREST_HREF, fullName, getAcademyPage, getCatalog, registerHref } from "../../../lib/academy.ts";
import { SITE_URL, pageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getAcademyPage();
  return pageMetadata({
    title: page.seoTitle || "Transformidable Academy",
    absolute: Boolean(page.seoTitle),
    description: page.seoDescription,
    path: "/academy",
  });
}

export default async function AcademyPage({ searchParams }) {
  const [{ topic = "" } = {}, page, { catalog }] = await Promise.all([searchParams, getAcademyPage(), getCatalog()]);
  const next = catalog.find((c) => c.next && !c.next.full) || null;
  const founding = catalog.find((c) => c.next && c.next.priceCents < c.next.regularPriceCents) || next;

  const instance = (c, s) => ({
    "@type": "CourseInstance",
    courseMode: "Online",
    startDate: s.startsAt,
    endDate: s.endsAt,
    offers: {
      "@type": "Offer",
      price: (s.priceCents / 100).toFixed(2),
      priceCurrency: c.series.currency.toUpperCase(),
      url: registerHref(c.series, s),
      availability: s.full ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  });

  return (
    <AcademyShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: page.heroEyebrow || "Transformidable Academy",
          itemListElement: catalog.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Course",
              name: fullName(c),
              description: c.oneLine,
              ...(c.href && { url: `${SITE_URL}${c.href}` }),
              provider: { "@type": "Organization", name: "Transformidable Academy", sameAs: SITE_URL },
              ...(c.sessions.length > 0 && { hasCourseInstance: c.sessions.map((s) => instance(c, s)) }),
            },
          })),
        }}
      />

      <AcademyHero eyebrow={page.heroEyebrow} headline={page.heroHeadline} accent={page.heroAccent} subhead={page.heroSubhead}>
        <ButtonRow primary={{ label: page.heroPrimary, href: "#sessions" }} secondary={{ label: page.heroSecondary, href: "#two-ways" }} />
        <NextSessionStrip course={next} foundingLabel={page.foundingLabel} />
      </AcademyHero>

      <FoundingBand page={page} href={founding?.next ? registerHref(founding.series, founding.next) : "#sessions"} />

      {catalog.length > 0 && (
        <section className="aa-band" id="courses" aria-labelledby="aa-courses-h">
          <div className="wrap">
            {page.coursesEyebrow && <p className="aa-eyebrow">{page.coursesEyebrow}</p>}
            <Headline id="aa-courses-h" text={page.coursesHeadline} accent={page.coursesAccent} />
            <CourseCards catalog={catalog} />
            {(page.coursesNote || page.coursesNoteLink) && (
              <p className="aa-under">
                <Em>{page.coursesNote}</Em>{" "}
                {page.coursesNoteLink && <a className="aa-inline" href={`${INTEREST_HREF}?reason=topic`}>{page.coursesNoteLink}</a>}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="aa-band" id="sessions" aria-labelledby="aa-sessions-h">
        <div className="wrap">
          <Headline id="aa-sessions-h" text={page.sessionsHeadline || "Upcoming sessions"} />
          {page.sessionsIntro && <p className="aa-intro aa-intro--tight">{page.sessionsIntro}</p>}
          <SessionsTable catalog={catalog} topic={topic} />
          <WaitlistLine page={page} />
        </div>
      </section>

      <HowTiles page={page} />
      <TakeawaySection page={page} courses={catalog} />
      <TwoWays page={page} ownHref="#sessions" />
      <Instructors page={page} />
      <Faq heading={page.faqHeadline} items={page.faq} sand />
      <FinalCta headline={page.finalHeadline} accent={page.finalAccent} button={page.finalButton} href="#sessions" />
    </AcademyShell>
  );
}
