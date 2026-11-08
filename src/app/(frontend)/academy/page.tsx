// @ts-nocheck
import Link from "next/link";
import { AcademyFaq, AcademyHero, AcademyShell, Arrow } from "../components/academy/AcademySections";
import { BetaApply, ProgramFinder } from "../components/academy/AcademyTraining";
import { LegacyAcademyAnchors } from "../components/academy/LegacyAcademyAnchors";
import { BETA, BETA_STEPS, FACULTY, OTHER_AUDIENCES, PRIMARY_AUDIENCES, PROGRAMS, PROMISES, betaPrice, faqIn, formatPrice } from "./content";
import { pageMetadata } from "../../../lib/seo.ts";

const DESCRIPTION =
  "AI governance training for city councils, county commissions, university and nonprofit boards, and executive leadership teams. Beta enrollment open at 50% off the first two classes.";

export const metadata = pageMetadata({ title: "AI Governance Training for Boards and Executives", description: DESCRIPTION, path: "/academy" });

const pct = `${BETA.discount * 100}%`;

// The Academy front door, in training mode: lead with the beta offer, help
// visitors find the program that fits, then take the application.
export default function AcademyPage() {
  return (
    <AcademyShell>
      <LegacyAcademyAnchors />

      <AcademyHero
        badge={<>Beta enrollment open &middot; {pct} off &middot; {BETA.orgSpots} organization spots</>}
        kicker="Transformidable Academy · AI Governance Training"
        title="Govern the technology shaping your organization."
        intro="Executive education for the leaders and governing bodies who oversee decisions about artificial intelligence. Designed for decision-makers rather than technical specialists, with practical governance tools to take back to your organization."
        image={{ src: "/academy-hero-jerri-bland-knee.webp", alt: "Jerri Bland, Ed.D., Lead Faculty", width: 548, height: 800 }}
      >
        <div className="ac-hero-cta">
          <a className="btn" href="#beta">Join the beta <Arrow s={14} /></a>
          <a className="link" href="#programs">Find your program <Arrow /></a>
        </div>
      </AcademyHero>

      <section className="ac-t-beta" aria-labelledby="ac-beta-h">
        <div className="wrap">
          <div className="ac-t-beta-top">
            <div>
              <p className="ac-t-label">Beta program</p>
              <h2 className="ac-t-h2" id="ac-beta-h">Take the first two classes at {pct} off, and help shape the certificate.</h2>
              <p className="ac-t-lede">
                We are opening the first two classes of the AI Governance certificate pathway to a small group of beta
                participants. Organizations come first, and individuals are welcome.
              </p>
            </div>
            <ul className="ac-t-stats">
              <li><b>{pct}</b><span>off both beta classes</span></li>
              <li><b>{BETA.orgSpots}</b><span>organization spots</span></li>
              <li><b>{BETA.programs.length}</b><span>classes in the beta</span></li>
            </ul>
          </div>
          <ol className="ac-t-steps">
            {BETA_STEPS.map((s) => (
              <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ac-band ac-t-band" id="programs" aria-labelledby="ac-programs-h">
        <div className="wrap">
          <p className="ac-t-label">Find your program</p>
          <h2 className="ac-t-h2" id="ac-programs-h">Find the program that fits your team.</h2>
          <p className="ac-t-intro">
            Three programs, each standing on its own. None is a prerequisite, so start wherever your organization is.
          </p>
          <ProgramFinder programs={PROGRAMS} />
        </div>
      </section>

      <section className="ac-band ac-band--parchment ac-t-band" aria-labelledby="ac-promises-h">
        <div className="wrap">
          <p className="ac-t-label">Every program</p>
          <h2 className="ac-t-h2" id="ac-promises-h">Built for the people responsible for oversight.</h2>
          <div className="ac-t-promises">
            {PROMISES.map((x) => (
              <div className="ac-t-promise" key={x.title}>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </div>
            ))}
          </div>
          <div className="ac-t-who">
            <p className="ac-t-label">Designed for</p>
            <ul>
              {PRIMARY_AUDIENCES.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p className="ac-t-small">{OTHER_AUDIENCES}</p>
            <p className="ac-t-small">
              <Link className="ac-inline" href="/academy/board-governance-training">About board governance training</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="ac-band ac-t-band" aria-labelledby="ac-faculty-h">
        <div className="wrap ac-t-faculty">
          <div>
            <p className="ac-t-label">Your faculty</p>
            <h2 className="ac-t-h2" id="ac-faculty-h">{FACULTY.name}</h2>
            <p className="ac-t-role">{FACULTY.role} &middot; {FACULTY.creds}</p>
          </div>
          <div>
            <p className="ac-t-body">{FACULTY.bio}</p>
            <p className="ac-t-body">
              Every program draws on Transformidable&rsquo;s governance <a className="ac-inline" href="/research">research</a>,
              turned into practical tools leaders can use the next day.
            </p>
          </div>
        </div>
      </section>

      <section className="ac-band ac-band--parchment ac-t-band" id="beta" aria-labelledby="ac-apply-h">
        <div className="wrap ac-register">
          <div className="ac-register-copy">
            <p className="ac-t-label">Apply for the beta</p>
            <h2 className="ac-t-h2" id="ac-apply-h">Reserve one of {BETA.orgSpots} organization spots.</h2>
            <p className="ac-t-body">
              Tell us who you are and which class you would like. We will confirm fit and scheduling with you before
              anything is booked.
            </p>
            <ul className="ac-t-pricelist">
              {BETA.programs.map((p) => (
                <li key={p.slug}>
                  <span>{p.title}<small>{p.stage.format}</small></span>
                  <span className="ac-t-price"><s>{formatPrice(p.beta.price)}</s><b>{formatPrice(betaPrice(p.beta.price))}</b></span>
                </li>
              ))}
            </ul>
          </div>
          <BetaApply source="/academy (beta)" />
        </div>
      </section>

      <AcademyFaq items={[...faqIn("beta"), ...faqIn("general")]} heading="Common questions" />
    </AcademyShell>
  );
}
