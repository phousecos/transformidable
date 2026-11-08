// @ts-nocheck
import Link from "next/link";
import { AcademyFaq, AcademyHero, AcademyRegister, AcademyShell, Arrow } from "../../components/academy/AcademySections";
import { OTHER_AUDIENCES, PRIMARY_AUDIENCES, PROGRAMS, faqIn, programHref } from "../content";
import { pageMetadata } from "../../../../lib/seo.ts";

const DESCRIPTION =
  "Private AI governance training for city councils, county commissions, university and nonprofit boards, and executive leadership teams, delivered to your organization.";

export const metadata = pageMetadata({ title: "Private Board Governance Training Sessions", description: DESCRIPTION, path: "/academy/organizations" });

export default function OrganizationsPage() {
  return (
    <AcademyShell>
      <AcademyHero
        kicker="For organizations"
        title="Private sessions for your entire leadership or governing body."
        intro="Every Academy program can be arranged as a private session for your council, commission, board, or executive team, virtually or in person. Participants need no technical expertise, and leave with practical governance tools."
        seed={113}
      >
        <div className="ac-hero-cta">
          <a className="btn" href="#register">Request a private session <Arrow s={14} /></a>
        </div>
      </AcademyHero>

      <section className="ac-band" aria-labelledby="ac-start-h">
        <div className="wrap">
          <p className="kicker">Choose a starting point</p>
          <h2 className="ac-h2" id="ac-start-h">Three programs. No prerequisites.</h2>
          <div className="ac-courses">
            {PROGRAMS.map((p) => (
              <Link className="ac-course" href={programHref(p.slug)} key={p.slug}>
                <span className="ac-no">{p.stage.name} &middot; {p.stage.format}</span>
                <span className="ac-course-title">{p.title}</span>
                <span className="ac-course-desc">{p.stage.line}</span>
                <span className="ac-course-meta">Take away: {p.tools.join(" and ")}</span>
                <span className="ac-course-go">View program <Arrow /></span>
              </Link>
            ))}
          </div>
          <p className="ac-note">
            A council may want only the briefing; an executive team may be ready for the workshop; an organization
            building an AI governance program may need the applied course. We can help you choose.
          </p>
        </div>
      </section>

      <section className="ac-band ac-band--parchment" aria-labelledby="ac-includes-h">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">Private sessions</p>
            <h2 className="ac-h2" id="ac-includes-h">What a private session includes</h2>
          </div>
          <ul className="ac-outcomes">
            <li>A facilitated session for your whole council, commission, board, or leadership team</li>
            <li>Discussion focused on governance, accountability, and informed decision-making, not technical detail</li>
            <li>Adaptation to your sector, existing AI activities, and governance responsibilities</li>
            <li>Practical governance tools participants keep and use after the session</li>
            <li>Delivery in person or virtually</li>
          </ul>
        </div>
      </section>

      <section className="ac-band" aria-labelledby="ac-who-h">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">Who we work with</p>
            <h2 className="ac-h2" id="ac-who-h">Governing bodies and the leaders who answer to them</h2>
          </div>
          <div>
            <ul className="ac-audiences">
              {PRIMARY_AUDIENCES.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p className="ac-note">{OTHER_AUDIENCES}</p>
          </div>
        </div>
      </section>

      <section className="ac-band ac-band--parchment" aria-labelledby="ac-how-h">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">How it works</p>
            <h2 className="ac-h2" id="ac-how-h">From first conversation to session</h2>
            <p className="ac-note">An inquiry carries no commitment.</p>
          </div>
          <ol className="ac-steps">
            <li><b>A conversation</b><span>We learn about your group, your sector, and the AI decisions in front of you.</span></li>
            <li><b>A recommendation</b><span>Which program fits, and how it should be adapted, scheduled, and priced for your group.</span></li>
            <li><b>The session</b><span>Delivered to your group in person or virtually.</span></li>
            <li><b>Tools to keep</b><span>Participants leave with the program&rsquo;s governance tools to support future discussions and decisions.</span></li>
          </ol>
        </div>
      </section>

      <AcademyFaq items={faqIn("organizations")} heading="Questions from organizations" />

      <AcademyRegister
        type="organization"
        source="/academy/organizations"
        title="Request a private session."
        intro="Tell us about your group, which program interests you, and your preferred timing. We will be in touch to arrange a conversation."
      />
    </AcademyShell>
  );
}
