// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { ADVISORY_ENTITY } from "../components/site";
import { pageMetadata } from "../../../lib/seo.ts";

// PENDING CONFIRMATION: every commitment below must be confirmed true as
// written (especially "no vendor compensation" and "no referral fees") before
// the page is indexed. Once confirmed, remove `robots` from the metadata and
// add /independence to STATIC_PATHS in sitemap.ts.
export const metadata = pageMetadata({ title: "Independence", description: "The commitments that govern how Transformidable's research, advisory, and other divisions relate to one another.", path: "/independence", noindex: true });

export default function IndependencePage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="about" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Policy</p>
          <h1 className="idx-title">Independence</h1>
          <p className="idx-intro">
            Transformidable&rsquo;s value depends on the integrity of its evidence. These commitments govern how our
            divisions relate to one another.
          </p>
        </div>
      </section>

      <article className="detail">
        <div className="detail-wrap">
          <div className="prose" style={{ marginTop: 0 }}>
            <ul>
              <li>
                <strong>Research is independent.</strong> Transformidable research, including Case Files, is never
                commissioned by, funded by, or reviewed by advisory clients.
              </li>
              <li>
                <strong>No vendor compensation.</strong> We do not resell, implement, or accept referral fees,
                commissions, or sponsorship from technology vendors whose products we may assess.
              </li>
              <li>
                <strong>Case selection is ours.</strong> Advisory engagements do not influence which cases we study or
                publish, and we do not publish confidential client information.
              </li>
              <li>
                <strong>Clear contracting.</strong> Advisory engagements are contracted through {ADVISORY_ENTITY}, an
                affiliate of Transformidable.
              </li>
            </ul>
            <p>
              Questions about these commitments: <Link href="/contact">Contact us</Link>.
            </p>
          </div>
        </div>
      </article>
    </ResearchShell>
  );
}
