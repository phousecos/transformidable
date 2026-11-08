// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import "../../components/home/home.css";
import { jsonLdHtml, pageMetadata, serviceJsonLd } from "../../../../lib/seo.ts";

const DESCRIPTION =
  "Transformidable's Executive Technology Office gives associations, nonprofits, and mid-market organizations shared, CIO-level technology leadership: technology governance, strategy, vendors, and AI, without a full-time hire.";

export const metadata = pageMetadata({ title: "Executive Technology Office: Shared CIO for Associations & Nonprofits", absolute: true, description: DESCRIPTION, path: "/advisory/executive-technology-office" });

const BOOK_HREF = "/advisory/conversation";
const BOOK_LABEL = "Schedule an Executive Conversation";

const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

const QUESTIONS = [
  "Which technology investments deserve priority?",
  "Are vendors delivering what they promised?",
  "Is the organization prepared for emerging cybersecurity and AI risks?",
  "Are major transformation initiatives appropriately governed?",
  "Does leadership have the information needed to make sound decisions?",
];

const ASSOCIATION_RESOURCES = [
  "Executive technology briefings and educational sessions",
  "Technology governance and risk guidance",
  "AI adoption and governance resources",
  "Group advisory sessions and office hours",
  "Limited individual executive consultations",
  "Technology planning and vendor evaluation resources",
  "Access to additional advisory and fractional leadership services",
];

const ORGANIZATION_SERVICES = [
  "Technology strategy and investment prioritization",
  "Technology governance and executive decision support",
  "Vendor selection, contract oversight, and performance review",
  "Cybersecurity and third-party risk governance",
  "AI governance and responsible adoption",
  "Transformation and systems implementation oversight",
  "Technology roadmap development",
  "Executive and board-level reporting",
];

const SECTORS = [
  {
    name: "Credit unions and financial institutions",
    text: "Core systems, digital banking, vendor governance, cybersecurity oversight, regulatory expectations, and technology modernization.",
  },
  {
    name: "Associations and Chambers of Commerce",
    text: "Shared technology expertise, member education, advisory access, and differentiated member benefits.",
  },
  {
    name: "Growing businesses",
    text: "Technology planning, AI adoption, systems integration, vendor decisions, and executive leadership gaps.",
  },
  {
    name: "Nonprofits and mission-driven organizations",
    text: "Technology investment decisions, limited internal resources, operational resilience, and digital transformation.",
  },
  {
    name: "Other membership networks",
    text: "A scalable way to make executive technology capabilities available across a diverse membership.",
  },
];

export default function ExecutiveTechnologyOfficePage() {
  return (
    <ResearchShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(
          serviceJsonLd({
            name: "Executive Technology Office",
            description: DESCRIPTION,
            path: "/advisory/executive-technology-office",
            serviceType: ["Shared CIO", "Fractional CIO", "Technology governance", "Technology strategy", "AI governance"],
          }),
        )}
      />
      <section className="idx-hero tr-onsky">
        <Sky variant="advisory" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Transformidable Advisory</p>
          <h1 className="idx-title">Executive Technology Office</h1>
          <p className="eto-tagline">Executive technology leadership. Shared expertise. Smarter decisions.</p>
          <p className="idx-intro">
            Technology decisions are no longer confined to IT departments. They influence organizational strategy,
            financial performance, operational resilience, regulatory exposure, and the ability to grow.
          </p>
          <p className="idx-intro">
            Yet many organizations lack access to experienced technology leadership when they need it most.
          </p>
          <p className="idx-intro">
            Transformidable&rsquo;s Executive Technology Office (ETO) makes executive-level technology expertise
            accessible through a flexible, shared advisory model.
          </p>
          <p className="idx-intro">
            Whether you&rsquo;re an association seeking to strengthen the capabilities of your members or an
            organization navigating complex technology decisions, ETO provides experienced guidance without requiring a
            full-time executive appointment.
          </p>
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <Link className="btn" href={BOOK_HREF}>{BOOK_LABEL} <Arrow /></Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="eto-reach-h">
        <div className="wrap av-lead">
          <div>
            <h2 className="hm-h2" id="eto-reach-h">Technology leadership shouldn&rsquo;t be out of reach.</h2>
            <p className="body" style={{ marginTop: 18 }}>
              Organizations of every size face increasingly consequential technology decisions.
            </p>
            <p className="body" style={{ marginTop: 16 }}>
              These questions require more than technical support. They require informed executive judgment.
            </p>
            <p className="body" style={{ marginTop: 16 }}>
              ETO bridges the gap between day-to-day technology operations and strategic technology leadership.
            </p>
          </div>
          <ul className="eto-questions">
            {QUESTIONS.map((q) => <li key={q}>{q}</li>)}
          </ul>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="eto-levels-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 className="h" id="eto-levels-h">One service. Three levels of engagement.</h2>
            </div>
          </div>
          <div className="eto-levels">
            <div className="dv-card eto-level" id="association">
              <span className="dv-tag">01</span>
              <h3>Association Executive Technology Office</h3>
              <p className="eto-sub">Give your members access to expertise they might not otherwise have.</p>
              <p>
                ETO enables associations, Chambers of Commerce, and membership organizations to offer executive
                technology advisory services as a valuable member benefit.
              </p>
              <p>Through an association-level engagement, members can access shared resources such as:</p>
              <ul className="eto-list">
                {ASSOCIATION_RESOURCES.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p>
                Associations can strengthen their value proposition, support member growth, and potentially create new
                non-dues revenue opportunities.
              </p>
            </div>

            <div className="dv-card eto-level" id="organizational-advisory">
              <span className="dv-tag">02</span>
              <h3>Organizational Technology Advisory</h3>
              <p className="eto-sub">Independent guidance for consequential technology decisions.</p>
              <p>
                Organizations needing more individualized support can engage ETO for ongoing executive advisory
                services.
              </p>
              <p>Services may include:</p>
              <ul className="eto-list">
                {ORGANIZATION_SERVICES.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p>
                ETO works alongside existing leadership, internal IT teams, and technology providers&mdash;helping
                ensure decisions are aligned with organizational objectives.
              </p>
            </div>

            <div className="dv-card eto-level" id="fractional-cio">
              <span className="dv-tag">03</span>
              <h3>Fractional CIO Leadership</h3>
              <p className="eto-sub">Executive leadership when you need more than advice.</p>
              <p>
                For organizations that require sustained technology leadership but are not ready to appoint a full-time
                CIO, ETO offers fractional executive engagements.
              </p>
              <p>
                Depending on the organization&rsquo;s needs, a fractional CIO may help lead technology strategy,
                establish governance structures, oversee technology investments, coordinate vendors and internal teams,
                and support executive and board decision-making.
              </p>
              <p>
                Engagements are structured around the organization&rsquo;s priorities, responsibilities, and required
                level of involvement.
              </p>
              <p>
                <Link className="link" href="/advisory/fractional-cio">Interim, fractional, or outsourced CIO? Compare the options <Arrow s={13} /></Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="eto-who-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 className="h" id="eto-who-h">Built for organizations navigating change</h2>
            </div>
          </div>
          <p className="body">ETO is especially relevant to:</p>
          <dl className="eto-sectors">
            {SECTORS.map((s) => (
              <div key={s.name}>
                <dt>{s.name}</dt>
                <dd>{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="eto-judgment-h">
        <div className="wrap">
          <h2 className="hm-h2" id="eto-judgment-h">Independent judgment. Practical guidance.</h2>
          <p className="body" style={{ marginTop: 18 }}>
            Transformidable approaches technology leadership through the lens of governance, accountability, and
            organizational outcomes.
          </p>
          <p className="body" style={{ marginTop: 16 }}>
            Our role is not simply to recommend technology. It is to help leaders understand their options, evaluate
            risks, establish appropriate oversight, and make decisions they can defend.
          </p>
          <p className="body" style={{ marginTop: 16 }}>
            We work with existing technology providers rather than requiring organizations to replace them. Specialized
            implementation and technical services can be coordinated through qualified partners when needed.
          </p>
          <p className="av-note">
            <Link className="link" href="/independence">Independence policy</Link>
          </p>
        </div>
      </section>

      <section className="rule-band av-cta" aria-labelledby="eto-cta-h">
        <div className="wrap av-cta-in">
          <div>
            <h2 className="av-cta-t" id="eto-cta-h">Explore an Executive Technology Office partnership</h2>
            <p className="eto-cta-body">
              Whether you&rsquo;re seeking to expand the services available to your members or strengthen technology
              leadership within your own organization, ETO offers a flexible starting point.
            </p>
            <p className="eto-cta-body">
              Let&rsquo;s discuss the decisions your organization&mdash;or your members&mdash;need help making.
            </p>
          </div>
          <div className="av-cta-btns">
            <Link className="btn" href={BOOK_HREF}>{BOOK_LABEL} <Arrow /></Link>
          </div>
        </div>
      </section>
    </ResearchShell>
  );
}
