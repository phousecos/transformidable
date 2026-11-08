// @ts-nocheck
import Link from "next/link";
import { GuidePage } from "../../components/guides/Guide";
import { pageMetadata } from "../../../../lib/seo.ts";

// Search page: "iv&v", "troubled project recovery" (Keyword Planner, Nov 2026).
export const metadata = pageMetadata({
  title: "IV&V for ERP & Major Technology Programs | Transformidable",
  absolute: true,
  description:
    "Independent verification and validation (IV&V) for ERP implementations and major technology programs, and recovery for projects already in trouble.",
  path: "/advisory/independent-verification-and-validation",
});

const FAQ = [
  {
    q: "What is IV&V?",
    a: "Independent verification and validation (IV&V) is an independent assessment of a technology program. Verification asks whether the system is being built correctly; validation asks whether it's the right system for the organization's needs. \"Independent\" means the assessor is separate from the team, vendor, and partner delivering the work.",
  },
  {
    q: "How is IV&V different from quality assurance or a PMO?",
    a: "Quality assurance and a project management office are part of delivering the program, and they report within it. IV&V stands outside the program and reports to the people accountable for it: sponsors, steering committees, boards, and funders.",
  },
  {
    q: "When should IV&V start?",
    a: "As early as possible, ideally at planning or vendor selection. Problems found early are far cheaper to fix than problems found at go-live. IV&V can still start mid-program, and often does when concerns surface.",
  },
  {
    q: "Who should IV&V report to?",
    a: "To the executive sponsor, steering committee, or board, not to the project team or implementation partner being assessed.",
  },
  {
    q: "Can IV&V help a project that's already in trouble?",
    a: "Yes. An independent assessment is usually the first step in recovery: it establishes the true state of the program so leadership can decide whether to continue, restructure, or stop.",
  },
];

export default function IvvPage() {
  return (
    <GuidePage
      kicker="Transformidable Advisory · Project Governance"
      title="Independent verification and validation (IV&V) for ERP and major technology programs"
      intro={[
        "On a large technology program, the people reporting on progress are usually the people responsible for it: the project team, the implementation partner, the software vendor. Boards, executives, and funders accountable for a multi-year program need a view that doesn't depend on them.",
        "IV&V provides it: an independent assessment of whether the program is being built right, whether it's building the right thing, and whether what leadership is told matches what is actually happening.",
      ]}
      faq={FAQ}
      closing={{
        title: "Concerned about a program, or about to start one?",
        body: "Tell us where it stands. We'll tell you honestly whether independent oversight would help, and what it would look at first.",
      }}
    >
      <h2>When organizations bring in IV&amp;V</h2>
      <ul>
        <li><strong>Before major commitments:</strong> at funding decisions, vendor selection, or contract signature.</li>
        <li><strong>When a funder, legislature, or policy requires it,</strong> as is common for large public-sector and higher education systems.</li>
        <li><strong>Before go-live,</strong> to give leadership an independent read on readiness.</li>
        <li><strong>When status reports stay green but something feels wrong.</strong></li>
        <li><strong>After a missed milestone, a key departure, or a change of implementation partner.</strong></li>
      </ul>

      <h2>What IV&amp;V looks at</h2>
      <ol>
        <li><strong>Governance and decision-making:</strong> whether decisions are made by the right people, on time, with the right information.</li>
        <li><strong>Scope and requirements:</strong> whether what&rsquo;s being built traces back to what the organization needs.</li>
        <li><strong>Schedule and budget realism:</strong> whether the plan is achievable, or only reportable.</li>
        <li><strong>Vendor and partner performance:</strong> delivery against contract and commitments.</li>
        <li><strong>Data conversion, testing, and cutover:</strong> where most go-lives are actually won or lost.</li>
        <li><strong>Organizational readiness:</strong> whether the people who will use the system are ready to.</li>
        <li><strong>Risk and issue management:</strong> whether known risks are owned, tracked, and acted on.</li>
        <li><strong>Reporting:</strong> whether what reaches executives and the board reflects reality.</li>
      </ol>

      <h2>Independence is the point</h2>
      <p>
        IV&amp;V only works if it is independent of the people delivering the program. Transformidable does not sell or
        implement the systems we assess, and works alongside your existing vendors and partners rather than competing
        with them (<Link href="/independence">independence policy</Link>). Our IV&amp;V reports to the program&rsquo;s
        sponsor, steering committee, or board, not to the project team being assessed.
      </p>

      <h2>Troubled project recovery</h2>
      <p>Sometimes the question isn&rsquo;t whether a program might fail, but what to do now that it&rsquo;s in trouble.</p>
      <h3>Signs a project is failing</h3>
      <ul>
        <li>Status was green for months, then suddenly red.</li>
        <li>Go-live dates move, but scope and budget don&rsquo;t.</li>
        <li>Testing time is being cut to protect the date.</li>
        <li>Change orders keep arriving, and no one can say what they add up to.</li>
        <li>Decisions escalate, and nothing comes back.</li>
        <li>Key people on your side, or the partner&rsquo;s, are leaving.</li>
      </ul>
      <h3>How recovery works</h3>
      <ol>
        <li><strong>An independent assessment of the true state:</strong> schedule, budget, quality, readiness, and the relationship with the partner.</li>
        <li><strong>A reset of governance:</strong> who decides what, and how fast.</li>
        <li><strong>An honest re-baseline</strong> of scope, schedule, and cost.</li>
        <li><strong>A clear decision for leadership:</strong> continue, pause, restructure, or stop, with the evidence for each.</li>
        <li><strong>Reporting the board can rely on</strong> from that point forward.</li>
      </ol>

      <h2>For higher education ERP and student system implementations</h2>
      <p>
        Finance, HR, and student information system replacements are among the largest and riskiest programs a
        university undertakes. They touch every office, run for years, and are often watched closely by trustees and
        state oversight. IV&amp;V gives presidents, CFOs, and governing boards an independent view throughout, not just
        at the end.
      </p>

      <h2>Experience behind the assessment</h2>
      <p>
        Our IV&amp;V and recovery work is led by Dr. Jerri Bland, who has spent more than 25 years in enterprise
        technology leadership, including as Deputy CIO at Columbia University and as Associate Vice Chancellor for
        Enterprise Applications at UNC&ndash;Chapel Hill, where she led a $42M+ implementation portfolio. She also leads
        Transformidable&rsquo;s research on why technology programs succeed or fail. See the{" "}
        <Link href="/publications/case-files">Case Files</Link>.
      </p>
    </GuidePage>
  );
}
