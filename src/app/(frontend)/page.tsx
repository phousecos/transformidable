// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { ResearchShell } from "./components/research/ResearchShell";
import { Sky } from "./components/research/Sky";
import { caseNo, fullDate } from "./components/research/format";
import { ResearchSubscribe } from "./components/research/ResearchNav";
import "./components/home/home.css";
import { pageMetadata } from "../../lib/seo.ts";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Technology, project, and AI governance advisory and governance training for boards and executives in higher education, nonprofits, associations, and mid-market organizations.";

export const metadata = pageMetadata({ title: "Technology, Project & AI Governance for Boards | Transformidable", absolute: true, description: DESCRIPTION, path: "/" });

const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// The five divisions, given equal weight: same card, same order everywhere.
// Advisory sits directly after Research, the evidence it applies.
const DIVISIONS = [
  {
    no: "01",
    name: "Research",
    href: "/research",
    purpose: "Case Files, the governance codebook, evidence-based findings, and the research agenda.",
    primary: { label: "Explore Case Files", href: "/publications/case-files" },
    secondary: { label: "Follow Research Updates", href: "#briefing" },
  },
  {
    no: "02",
    name: "Advisory",
    href: "/advisory",
    purpose: "Independent governance advisory for mergers and acquisitions, troubled programs, IT general controls, and AI adoption, grounded in the research.",
    primary: { label: "See how we help", href: "/advisory" },
    secondary: { label: "Book a conversation", href: "/advisory/conversation" },
  },
  {
    no: "03",
    name: "Academy",
    href: "/academy",
    purpose: "Executive education: governance briefings, workshops, and applied programs for leadership teams and governing bodies.",
    primary: { label: "Explore Programs", href: "/academy" },
    secondary: { label: "Inquire About a Cohort", href: "/academy/organizations" },
  },
  {
    no: "04",
    name: "Publishing",
    href: "/publishing",
    purpose: "The Transformidable Leader, its companion workbook, future books, and substantive publications.",
    primary: { label: "Discover The Transformidable Leader", href: "/publishing" },
    secondary: { label: "Join Book Updates", href: "/publishing#book-updates" },
  },
  {
    no: "05",
    name: "Media",
    href: "/media",
    purpose: "The Governance Files podcast, the Transformidable Briefing, interviews, and events.",
    primary: { label: "Listen to The Governance Files", href: "/podcast" },
    secondary: { label: "Attend a Briefing", href: "/briefings/live" },
  },
];

// The four moments Advisory is most often called in for. Each links to its
// block on the single /advisory page; there are no per-service pages.
const WHERE_WE_HELP = [
  {
    name: "Mergers & Acquisitions",
    href: "/advisory#mergers-acquisitions",
    text: "The deal closes on paper long before the systems, data, and controls actually come together. We help govern the technology side from diligence through integration.",
  },
  {
    name: "Troubled Programs",
    href: "/advisory#troubled-programs",
    text: "When the status reports stay green and the program doesn't, leadership has lost the truth. We help restore it, then the plan.",
  },
  {
    name: "IT General Controls",
    href: "/advisory#it-general-controls",
    text: "When control findings keep coming back, the gap is usually ownership and coordination, not effort. We help put remediation on a footing that lasts.",
  },
  {
    name: "AI Governance",
    href: "/advisory#ai-governance",
    text: "Moving from an AI policy on paper to clear answers about who sees, decides, owns, and escalates AI use.",
  },
];

async function latest(payload: any, collection: string, sort: string) {
  try {
    const res = await payload.find({
      collection,
      where: { status: { equals: "published" } },
      sort,
      depth: 0,
      limit: 1,
    });
    return res.docs?.[0] || null;
  } catch {
    // Collection may not be migrated yet in a fresh environment.
    return null;
  }
}

async function currentCaseFile(payload: any) {
  try {
    const res = await payload.find({
      collection: "case-files",
      where: { status: { equals: "published" }, featured: { equals: true } },
      sort: "-publishedAt",
      depth: 0,
      limit: 1,
    });
    return res.docs?.[0] || (await latest(payload, "case-files", "-publishedAt"));
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const payload = await getPayload({ config });
  const [caseFile, episode] = await Promise.all([
    currentCaseFile(payload),
    latest(payload, "podcast-episodes", "-publishDate"),
  ]);

  return (
    <ResearchShell>
      <section className="hero tr-onsky">
        <Sky variant="home" />
        <div className="wrap hero-in">
          <div className="hero-tags fade">
            <span>Research</span><span className="dot" aria-hidden="true"></span>
            <span>Advisory</span><span className="dot" aria-hidden="true"></span>
            <span>Academy</span><span className="dot" aria-hidden="true"></span>
            <span>Publishing</span><span className="dot" aria-hidden="true"></span>
            <span>Media</span>
          </div>
          <h1 className="hero-head fade d1">
            Leadership and governance for consequential <span className="em">transformation.</span>
          </h1>
          <p className="lead hm-lead fade d2" style={{ maxWidth: "60ch" }}>
            We study how transformation succeeds and fails, then help leaders and governing bodies apply that
            evidence to their own consequential decisions.
          </p>
          <div className="hero-cta fade d2" style={{ marginTop: 28 }}>
            <Link className="btn" href="/advisory/conversation">Book a conversation <Arrow /></Link>
            <Link className="link" href="/research">Explore the research <Arrow s={13} /></Link>
          </div>
        </div>
      </section>

      <section className="hm-divisions" id="divisions" aria-labelledby="hm-div-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Five divisions</p>
              <h2 className="h" id="hm-div-h">One commitment to stronger leadership and governance.</h2>
            </div>
          </div>
          <div className="hm-grid hm-grid--5">
            {DIVISIONS.map((d) => (
              <article className="hm-div" key={d.name}>
                <span className="hm-no">{d.no}</span>
                <h3><Link href={d.href}>{d.name}</Link></h3>
                <p>{d.purpose}</p>
                <div className="hm-actions">
                  <Link className="hm-primary" href={d.primary.href}>{d.primary.label} <Arrow s={12} /></Link>
                  <Link className="hm-secondary" href={d.secondary.href}>{d.secondary.label}</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rule-band hm-help" id="where-we-help" aria-labelledby="hm-help-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Advisory</p>
              <h2 className="h" id="hm-help-h">Four moments when governance decides the outcome.</h2>
            </div>
          </div>
          <div className="hm-grid">
            {WHERE_WE_HELP.map((w) => (
              <Link className="hm-feat" href={w.href} key={w.name}>
                <span className="hm-feat-title">{w.name}</span>
                <span className="hm-feat-desc">{w.text}</span>
                <span className="hm-feat-go">How we help <Arrow s={12} /></span>
              </Link>
            ))}
          </div>
          <p className="hm-help-close">
            Something else? Tell us the governance problem.{" "}
            <Link className="link" href="/advisory/conversation">Book a conversation <Arrow s={13} /></Link>
          </p>
        </div>
      </section>

      <section className="rule-band hm-featured" aria-labelledby="hm-feat-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Featured work</p>
              <h2 className="h" id="hm-feat-h">What is current across Transformidable.</h2>
            </div>
          </div>
          <div className="hm-grid">
            <Link className="hm-feat" href={caseFile ? `/publications/case-files/${caseFile.slug}` : "/publications/case-files"}>
              <span className="hm-feat-label">Research &middot; Current Case File</span>
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

            <Link className="hm-feat" href="/advisory">
              <span className="hm-feat-label">Advisory</span>
              <span className="hm-feat-title">When the reports stay green.</span>
              <span className="hm-feat-desc">Tell us the governance problem in front of you.</span>
              <span className="hm-feat-go">See how we help <Arrow s={12} /></span>
            </Link>

            <Link className="hm-feat" href="/academy/courses/ai-governance-for-boards-and-councils">
              <span className="hm-feat-label">Academy &middot; Executive briefing</span>
              <span className="hm-feat-title">AI Governance for Boards &amp; Councils</span>
              <span className="hm-feat-desc">A 90-minute briefing for city councils, county commissions, university boards, and leadership teams, available as a private session.</span>
              <span className="hm-feat-go">View the briefing <Arrow s={12} /></span>
            </Link>

            <Link className="hm-feat" href={episode ? `/podcast/${episode.slug}` : "/podcast"}>
              <span className="hm-feat-label">Media &middot; {episode ? "Latest episode" : "The podcast"}</span>
              <span className="hm-feat-title">{episode ? episode.title : "The Governance Files"}</span>
              <span className="hm-feat-desc">
                {episode
                  ? [episode.episodeNumber && `Episode ${episode.episodeNumber}`, episode.publishDate && fullDate(episode.publishDate)].filter(Boolean).join(" · ")
                  : "Governance decisions, examined on the record."}
              </span>
              <span className="hm-feat-go">Listen <Arrow s={12} /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="rule-band hm-approach" aria-labelledby="hm-approach-h">
        <div className="wrap hm-approach-in">
          <div>
            <p className="kicker">Our approach</p>
            <h2 className="hm-h2" id="hm-approach-h">Understand consequential change. Decide better. Act with conviction.</h2>
          </div>
          <div>
            <p className="body">
              Transformidable advances the leadership and governance of organizational transformation. Each division
              serves its own audience. Research builds the evidence. Advisory applies it to an organization's own
              decisions. The Academy turns it into executive education. Publishing carries the ideas further, and
              Media brings them into conversation.
            </p>
            <p className="body">
              What connects them is one intellectual identity and a firm line between evidence and engagement: our
              research is never commissioned by advisory clients, and we accept no compensation from technology vendors.
            </p>
            <p className="hm-approach-links">
              <Link className="link" href="/about">About Transformidable <Arrow s={13} /></Link>
              <Link className="link" href="/independence">Our independence policy <Arrow s={13} /></Link>
            </p>
          </div>
        </div>
      </section>

      <section className="rule-band hm-ways" aria-labelledby="hm-ways-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 className="h" id="hm-ways-h">Start where you are.</h2>
            </div>
          </div>
          <div className="hm-ways-grid">
            <div className="hm-way">
              <h3>Talk it through</h3>
              <p>A 30-minute conversation about the decision in front of you.</p>
              <Link className="btn" href="/advisory/conversation">Book a conversation <Arrow /></Link>
            </div>
            <div className="hm-way">
              <h3>See it in practice</h3>
              <p>Join a live briefing on the governance questions leaders are facing now.</p>
              <Link className="link" href="/briefings/live">Attend a live briefing <Arrow s={13} /></Link>
            </div>
            <div className="hm-way">
              <h3>Follow the work</h3>
              <p>The Transformidable Brief: research, case files, and briefings by email.</p>
              <ResearchSubscribe id="hm-ways-email" onLight />
            </div>
          </div>
        </div>
      </section>
    </ResearchShell>
  );
}
