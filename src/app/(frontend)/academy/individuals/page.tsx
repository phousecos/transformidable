// @ts-nocheck
import Link from "next/link";
import { AcademyFaq, AcademyHero, AcademyRegister, AcademyShell, Arrow } from "../../components/academy/AcademySections";
import { PROGRAMS, faqIn, programHref } from "../content";
import { pageMetadata } from "../../../../lib/seo.ts";

const DESCRIPTION =
  "Join the Transformidable Academy interest list to hear when an open AI governance program is scheduled for individual executives and professionals.";

export const metadata = pageMetadata({ title: "AI Governance Training for Individuals", description: DESCRIPTION, path: "/academy/individuals" });

// Kept deliberately short: the Academy leads with organizations, and this page
// is for the individuals who find it anyway.
export default function IndividualsPage() {
  return (
    <AcademyShell>
      <AcademyHero
        kicker="For individuals"
        title="Interested as an individual?"
        intro="Academy programs are currently offered as private sessions for organizations. If you would like to take part on your own, join the interest list and we will let you know when an open program is scheduled."
        seed={127}
      >
        <div className="ac-hero-cta">
          <a className="btn" href="#register">Join the interest list <Arrow s={14} /></a>
        </div>
      </AcademyHero>

      <section className="ac-band" aria-labelledby="ac-ind-programs-h">
        <div className="wrap">
          <p className="kicker">The programs</p>
          <h2 className="ac-h2" id="ac-ind-programs-h">What is offered today</h2>
          <div className="ac-courses">
            {PROGRAMS.map((p) => (
              <Link className="ac-course" href={programHref(p.slug)} key={p.slug}>
                <span className="ac-no">{p.stage.name} &middot; {p.stage.format}</span>
                <span className="ac-course-title">{p.title}</span>
                <span className="ac-course-desc">{p.stage.line}</span>
                <span className="ac-course-go">View program <Arrow /></span>
              </Link>
            ))}
          </div>
          <p className="ac-note">
            Could your organization bring a group? <Link className="ac-inline" href="/academy/organizations">See private sessions</Link>.
          </p>
        </div>
      </section>

      <AcademyFaq items={faqIn("individuals")} heading="Questions from individuals" />

      <AcademyRegister
        type="individual"
        source="/academy/individuals"
        title="Join the interest list."
        intro="Tell us a little about yourself and which programs interest you."
      />
    </AcademyShell>
  );
}
