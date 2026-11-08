// @ts-nocheck
import Link from "next/link";
import { GuidePage } from "../../components/guides/Guide";
import { pageMetadata } from "../../../../lib/seo.ts";

// Search page: "interim cio", "fractional cio", "outsourced cio", "part time
// cio", "hiring a cio", "cio succession planning" (Keyword Planner, Nov 2026).
export const metadata = pageMetadata({
  title: "Interim vs. Fractional vs. Outsourced CIO | Transformidable",
  absolute: true,
  description:
    "Your CIO left, or you've never had one. Compare interim, fractional, part-time, and outsourced CIO options, when each fits, and when to hire full-time.",
  path: "/advisory/fractional-cio",
});

const FAQ = [
  {
    q: "What does a fractional CIO do?",
    a: "A fractional CIO provides executive technology leadership part-time: setting technology strategy, prioritizing investments, overseeing vendors and major projects, establishing governance, and reporting to executives and the board. Unlike a consultant on a single project, a fractional CIO stays engaged over time.",
  },
  {
    q: "What's the difference between an interim CIO and a fractional CIO?",
    a: "An interim CIO fills a vacancy, usually close to full-time, until a permanent hire starts. A fractional CIO is an ongoing, part-time arrangement for organizations that need executive technology leadership but not a full-time role.",
  },
  {
    q: "Is a \"virtual CIO\" (vCIO) the same thing?",
    a: "The terms overlap. \"vCIO\" is most often offered by managed IT service providers as part of a support contract. Ask whether the advice is independent of the services they sell.",
  },
  {
    q: "How many hours does a fractional CIO work?",
    a: "It depends on what's in motion. Engagements are structured around your priorities and the level of involvement you need, and can change as those do.",
  },
  {
    q: "When should we hire a full-time CIO instead?",
    a: "When technology leadership is a full-time job for your organization: technology is central to your strategy, the scope of decisions is large and continuous, and you can define the role's authority clearly. A fractional CIO can help you reach that point and shape the role.",
  },
];

export default function FractionalCioPage() {
  return (
    <GuidePage
      kicker="Transformidable Advisory · Technology Leadership"
      title="Interim, fractional, or outsourced CIO? Choosing the technology leadership you need."
      intro={[
        "Organizations look for CIO-level help at three moments: when a CIO leaves suddenly, when they've grown past what an IT manager or support provider can handle, and when a major decision needs executive judgment they don't have in-house.",
        "The right answer depends on which of those you're facing.",
      ]}
      cta={{ href: "/advisory/conversation", label: "Schedule an executive conversation" }}
      faq={FAQ}
      closing={{
        title: "Need technology leadership now?",
        body: "Tell us what's changed: a departure, a decision you can't make without CIO-level judgment, or an organization that has outgrown its current support. We'll tell you honestly which option fits.",
      }}
    >
      <h2>The options, side by side</h2>
      <div className="gd-table" role="region" aria-label="CIO options compared" tabIndex={0}>
        <table>
          <thead>
            <tr><th scope="col">Option</th><th scope="col">Best when</th><th scope="col">Typical commitment</th><th scope="col">Watch for</th></tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Interim CIO</th>
              <td>Your CIO has left and you need someone running technology while you search</td>
              <td>Full- or near-full-time, for a defined period</td>
              <td>A clear mandate: hold steady, or fix things before the next hire</td>
            </tr>
            <tr>
              <th scope="row">Fractional (part-time) CIO</th>
              <td>You need executive technology leadership, but not 40 hours a week</td>
              <td>A set number of days or hours each month, ongoing</td>
              <td>Decision authority: a fractional CIO who can only advise isn&rsquo;t leading</td>
            </tr>
            <tr>
              <th scope="row">Outsourced CIO or &ldquo;virtual CIO&rdquo;</th>
              <td>Often offered by IT support firms alongside their services</td>
              <td>Bundled with a support contract</td>
              <td>Independence: advice from a firm that also sells you services may favor those services</td>
            </tr>
            <tr>
              <th scope="row">Full-time CIO</th>
              <td>Technology is central to your strategy and the scope fills a full role</td>
              <td>Permanent</td>
              <td>Hiring before you&rsquo;ve defined the role and its authority</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>If your CIO just left</h2>
      <p>The first weeks matter more than the speed of the search.</p>
      <ol>
        <li><strong>Name an accountable executive</strong> so decisions don&rsquo;t stall.</li>
        <li><strong>Take stock of what&rsquo;s in flight:</strong> major projects, contract renewals and deadlines, and anything the CIO was personally holding together.</li>
        <li><strong>Keep key vendor and staff relationships steady,</strong> and tell them who&rsquo;s in charge.</li>
        <li><strong>Decide what the next CIO should be</strong> before you write the job description. A departure is a chance to reconsider the role, its reporting line, and its authority.</li>
        <li><strong>Choose interim or fractional cover</strong> for the gap, based on how much is in motion.</li>
      </ol>

      <h2>Before hiring a CIO</h2>
      <p>
        Boards and presidents get better hires when they decide a few things first: what the role is accountable for,
        whom it reports to, what decisions it can make without approval, and what success looks like in the first
        year. Succession planning works the same way. Name who would step in, and what they would need to know, before
        you need them.
      </p>

      <h2>How Transformidable helps</h2>
      <p>
        Through our <Link href="/advisory/executive-technology-office">Executive Technology Office</Link>, we provide
        technology leadership at the level you need:
      </p>
      <ul>
        <li><strong>Interim CIO leadership:</strong> when your CIO has left, we keep technology decisions and major work moving, and help you define and fill the role.</li>
        <li><strong>Fractional CIO leadership:</strong> sustained executive leadership for organizations not ready to appoint a full-time CIO. That includes leading technology strategy, establishing governance, overseeing investments, coordinating vendors and teams, and supporting executive and board decisions.</li>
        <li><strong>Organizational technology advisory:</strong> independent guidance on consequential technology decisions, alongside your existing leadership and providers.</li>
        <li><strong>Association Executive Technology Office:</strong> shared executive technology expertise offered to members as a benefit.</li>
      </ul>
      <p>
        We work with your existing technology providers rather than replacing them, and we don&rsquo;t sell the systems
        we advise on (<Link href="/independence">independence policy</Link>).
      </p>
      <p>
        Our technology leadership is led by Dr. Jerri Bland, who has spent more than 25 years in enterprise technology
        leadership, including as Deputy CIO at Columbia University and Associate Vice Chancellor for Enterprise
        Applications at UNC&ndash;Chapel Hill.
      </p>
    </GuidePage>
  );
}
