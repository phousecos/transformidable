// @ts-nocheck
// The page around each Academy form: heading copy from the Academy Page
// global (Forms tab), course choices from Courses, and the course the visitor
// came from (?course=slug) preselected.
import { AcademyShell, Em, PublicNote } from "./Academy";
import { AcademyForm } from "./AcademyForm";
import { fullName, getAcademyPage, getCourses, offersPrivate } from "../../../../lib/academy.ts";

export async function AcademyFormPage({ kind, searchParams }) {
  const [{ course = "", reason = "" } = {}, page, courses] = await Promise.all([searchParams, getAcademyPage(), getCourses()]);
  // The dedicated-session form offers courses with a private session; the interest form, every listed course.
  const listed = courses.filter((c) => c.listed && (kind !== "dedicated" || offersPrivate(c)));
  const options = listed.map((c) => ({ slug: c.slug, label: fullName(c) }));
  const chosen = options.some((o) => o.slug === course) ? course : "";
  const eyebrow = kind === "dedicated" ? page.dedicatedEyebrow : page.interestEyebrow;
  const headline = kind === "dedicated" ? page.dedicatedHeadline : page.interestHeadline;
  const intro = kind === "dedicated" ? page.dedicatedIntro : page.interestIntro;
  return (
    <AcademyShell>
      <section className="aa-band aa-form-page">
        <div className="wrap aa-form-wrap">
          <nav className="aa-crumbs aa-crumbs--light" aria-label="Breadcrumb">
            <a href="/academy">Academy</a> <span aria-hidden="true">/</span> <span aria-current="page">{eyebrow || headline}</span>
          </nav>
          {eyebrow && <p className="aa-eyebrow">{eyebrow}</p>}
          <h1 className="aa-h2">{headline}</h1>
          {intro && <p className="aa-intro"><Em>{intro}</Em></p>}
          <AcademyForm kind={kind} courses={options} course={chosen} reason={String(reason)} />
          {kind === "dedicated" && <PublicNote page={page} />}
        </div>
      </section>
    </AcademyShell>
  );
}
