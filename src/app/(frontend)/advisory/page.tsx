// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { caseNo } from "../components/research/format";
import { TOOLS_PATH, assetTypeLabel, listedToolsWhere } from "../../../lib/advisoryTools.ts";
import "../components/home/home.css";
import { jsonLdHtml, pageMetadata, serviceJsonLd } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Tell us the technology, project, or AI governance problem in front of you: a troubled ERP program, an audit finding, a leadership gap, or AI already in use without a policy. We'll tell you honestly whether and how we can help.";

export const metadata = pageMetadata({ title: "Technology, Project & AI Governance Advisory", description: DESCRIPTION, path: "/advisory" });

const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// Advisory is organized by problem, not product: four short blocks, no pricing.
// The one named offering, the Executive Technology Office, has its own page
// and is linked from the block below these. The anchors are linked from the
// homepage's "Where we help" cards.
const AREAS = [
  {
    id: "mergers-acquisitions",
    name: "Mergers & Acquisitions",
    text: "The deal closes on paper long before the systems, data, and controls come together. We help leadership set the decision rights, dependencies, and accountability that integration or separation actually needs, from Day One through transition services.",
  },
  {
    id: "troubled-programs",
    name: "Troubled Programs",
    text: "Status reports stay green while milestones slip, and the steering committee hears about problems after they become expensive. We help leadership get to reliable facts, make the recovery decisions, and put oversight in place that can change the trajectory.",
    related: [{ label: "IV&V and troubled project recovery", href: "/advisory/independent-verification-and-validation" }],
  },
  {
    id: "it-general-controls",
    name: "IT General Controls",
    text: "When control findings persist, the gap is usually ownership, coordination, and evidence, not effort. We help organize how remediation is owned, coordinated, and overseen so the change lasts. We do not act as auditors or provide assurance conclusions.",
  },
  {
    id: "ai-governance",
    name: "AI Governance",
    text: "Many organizations have an AI policy but no clear answer to five questions: who sees AI use, who decides, who owns it, when it escalates, and what evidence exists. We help turn the policy into practice.",
    related: [
      { label: "Where to start: an AI acceptable use policy", href: "/advisory/ai-policy" },
      { label: "Academy: AI Governance for Boards & Councils", href: "/academy/courses/ai-governance-for-boards-and-councils" },
    ],
  },
];

// The "From the research" card points at Case File No. 001, UCPath.
const CASE_SLUG = "ucpath";

async function caseFileCard() {
  try {
    const payload = await getPayload({ config });
    const res = await payload.find({
      collection: "case-files",
      where: { status: { equals: "published" }, slug: { equals: CASE_SLUG } },
      depth: 0,
      limit: 1,
    });
    return res.docs?.[0] || null;
  } catch {
    // Collection may not be migrated yet in a fresh environment.
    return null;
  }
}

// Final assets tagged "Website download", newest first. Empty until some are.
async function advisoryTools() {
  try {
    const payload = await getPayload({ config });
    const res = await payload.find({
      collection: "assets",
      where: listedToolsWhere,
      sort: ["-versionDate", "-updatedAt"],
      depth: 0,
      limit: 24,
      overrideAccess: true,
    });
    return res.docs || [];
  } catch {
    return [];
  }
}

export default async function AdvisoryPage() {
  const [caseFile, tools] = await Promise.all([caseFileCard(), advisoryTools()]);

  return (
    <ResearchShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(
          serviceJsonLd({
            name: "Transformidable Advisory",
            description: DESCRIPTION,
            path: "/advisory",
            serviceType: ["Technology governance", "Project governance", "AI governance", "ERP transformation governance", "IT general controls and material weakness remediation", "Mergers, acquisitions, and separation", "Technology vendor portfolio and renewals", "Fractional CIO"],
          }),
        )}
      />
      <section className="idx-hero tr-onsky">
        <Sky variant="advisory" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Transformidable Advisory · Technology, Project &amp; AI Governance</p>
          <h1 className="idx-title">Tell us the governance problem in front of you.</h1>
          <p className="idx-intro">
            Most transformations don&rsquo;t fail for technical reasons. They fail because the people responsible
            can&rsquo;t see what is actually happening, or can see it and don&rsquo;t act. Transformidable Advisory
            brings the evidence from our research to your organization&rsquo;s own decisions. Transformidable Advisory
            does not have a menu of services. Tell us the problem; we&rsquo;ll tell you honestly whether and how we can help.
          </p>
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <Link className="btn" href="/advisory/conversation">Book a conversation <Arrow /></Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="av-areas-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Where we help</p>
              <h2 className="h" id="av-areas-h">Where we&rsquo;re most often called in.</h2>
            </div>
          </div>
          <div className="av-areas">
            {AREAS.map((a) => (
              <div className="dv-card av-area" id={a.id} key={a.id}>
                <h3>{a.name}</h3>
                <p>{a.text}</p>
                {a.related?.map((r) => (
                  <p key={r.href} style={{ marginTop: 10 }}><Link className="link" href={r.href}>{r.label} <Arrow s={13} /></Link></p>
                ))}
              </div>
            ))}
          </div>
          <p className="av-close">
            Not on this list? Most governance problems aren&rsquo;t.{" "}
            <Link className="link" href="/advisory/conversation">Tell us yours <Arrow s={13} /></Link>
          </p>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="av-cio-h">
        <div className="wrap">
          <p className="kicker">Interim &amp; fractional CIO</p>
          <h2 className="hm-h2" id="av-cio-h">When your CIO leaves, or before you hire one.</h2>
          <p className="body" style={{ marginTop: 18 }}>
            Interim CIO leadership keeps technology decisions and major work moving after a departure, and helps you
            define and fill the role. Fractional CIO leadership gives you sustained executive judgment without a
            full-time appointment.
          </p>
          <p className="av-close">
            <Link className="link" href="/advisory/fractional-cio">Interim, fractional, or outsourced CIO? Compare the options <Arrow s={13} /></Link>
          </p>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="av-eto-h">
        <div className="wrap">
          <p className="kicker">Executive Technology Office</p>
          <h2 className="hm-h2" id="av-eto-h">Executive technology leadership. Shared expertise. Smarter decisions.</h2>
          <p className="body" style={{ marginTop: 18 }}>
            Transformidable&rsquo;s Executive Technology Office (ETO) makes executive-level technology expertise
            accessible through a flexible, shared advisory model.
          </p>
          <p className="av-close">
            <Link className="link" href="/advisory/executive-technology-office">Explore the Executive Technology Office <Arrow s={13} /></Link>
          </p>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="av-how-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">How it works</p>
              <h2 className="h" id="av-how-h">Start with a conversation.</h2>
            </div>
          </div>
          <ol className="av-steps">
            <li><strong>Conversation.</strong> Thirty minutes on the situation and the decision in front of you.</li>
            <li><strong>Our honest read.</strong> Whether we can help, how, and what it would involve, or a pointer elsewhere if we&rsquo;re not the right fit.</li>
            <li><strong>Work together.</strong> Shaped around the problem, alongside your executives, steering committee, or board.</li>
          </ol>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="av-who-h">
        <div className="wrap av-lead">
          <div>
            <p className="kicker">Who leads engagements</p>
            <h2 className="hm-h2" id="av-who-h">Dr. Jerri Bland</h2>
            <p className="body" style={{ marginTop: 18 }}>
              Dr. Jerri Bland has spent more than 25 years in enterprise technology leadership, including as Deputy
              CIO at Columbia University and as Associate Vice Chancellor for Enterprise Applications at UNC&ndash;Chapel
              Hill, where she led a $42M+ implementation portfolio. She leads Transformidable&rsquo;s research on why
              enterprise programs succeed or fail, and is the author of The Transformidable Leader.
            </p>
            <p className="av-creds">Ed.D. &middot; PMP &middot; CSM &middot; ITIL</p>
          </div>
          <div>
            <Link className="hm-feat" href={caseFile ? `/publications/case-files/${CASE_SLUG}` : "/publications/case-files"}>
              <span className="hm-feat-label">From the research</span>
              {caseFile ? (
                <>
                  {caseFile.caseNumber && <span className="hm-feat-meta">{caseNo(caseFile.caseNumber)}</span>}
                  <span className="hm-feat-title">{caseFile.title}</span>
                  {caseFile.dek && <span className="hm-feat-desc">{caseFile.dek}</span>}
                </>
              ) : (
                <>
                  <span className="hm-feat-title">Case Files</span>
                  <span className="hm-feat-desc">Anatomies of real governance decisions, traced from decision to outcome.</span>
                </>
              )}
              <span className="hm-feat-go">Read the case <Arrow s={12} /></span>
            </Link>
            <p className="av-note">
              We don&rsquo;t resell, implement, or take referral fees from technology vendors.{" "}
              <Link className="link" href="/independence">Independence policy</Link>
            </p>
          </div>
        </div>
      </section>

      {tools.length > 0 && (
        <section className="rule-band" id="tools" aria-labelledby="av-tools-h">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker">Advisory tools</p>
                <h2 className="h" id="av-tools-h">Tools to take into the room.</h2>
              </div>
            </div>
            <div className="av-tools">
              {tools.map((t) => (
                <Link className="hm-feat" href={`${TOOLS_PATH}/${t.slug}`} key={t.id}>
                  {assetTypeLabel(t.assetType) && <span className="hm-feat-label">{assetTypeLabel(t.assetType)}</span>}
                  <span className="hm-feat-title">{t.title}</span>
                  {t.summary && <span className="hm-feat-desc">{t.summary}</span>}
                  <span className="hm-feat-go">Download <Arrow s={12} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rule-band av-cta" aria-label="Book a conversation">
        <div className="wrap av-cta-in">
          <p className="av-cta-t">Tell us the governance problem in front of you.</p>
          <div className="av-cta-btns">
            <Link className="btn" href="/advisory/conversation">Book a conversation <Arrow /></Link>
            <Link className="link" href="/briefings/live">Attend a live briefing <Arrow s={13} /></Link>
          </div>
        </div>
      </section>
    </ResearchShell>
  );
}
