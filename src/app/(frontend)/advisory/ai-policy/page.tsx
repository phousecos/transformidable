// @ts-nocheck
import Link from "next/link";
import { GuidePage } from "../../components/guides/Guide";
import { pageMetadata } from "../../../../lib/seo.ts";

// Search page: "ai acceptable use policy", "generative ai policy", "ai policy
// for nonprofits", "university ai policy" (Keyword Planner, Nov 2026).
//
// Consistent with the briefing "Are we governing AI, or just letting it
// happen?" (govern the decisions, not the tools; See · Decide · Own ·
// Escalate · Evidence), and deliberately lighter: the thresholds, review
// triggers, and worked scenario are left to the briefing, which this page
// points to.
export const metadata = pageMetadata({
  title: "AI Acceptable Use Policy for Boards & Leaders | Transformidable",
  absolute: true,
  description:
    "Staff are already using generative AI. What an AI acceptable use policy should cover, why a policy alone isn't governance, and where nonprofits and universities should start.",
  path: "/advisory/ai-policy",
});

const FAQ = [
  {
    q: "Is a generative AI policy different from an AI acceptable use policy?",
    a: "They usually mean the same thing in practice: rules for how staff may use AI tools like ChatGPT, Copilot, and Gemini. \"Acceptable use\" emphasizes what's allowed; \"generative AI policy\" names the kind of tool. A broader AI governance approach also covers how the organization decides, owns, and oversees the AI uses that matter.",
  },
  {
    q: "Should our policy list approved AI tools?",
    a: "A short list can help with everyday, low-stakes uses. But a list of tools is out of date almost as soon as it's written, because tools, models, and features change by the week. Base the policy on what stays put: when a use matters, who decides, and who owns the result.",
  },
  {
    q: "Should we just ban AI tools?",
    a: "Bans are hard to enforce and tend to push use out of sight, where the risks are worse. A fast, legitimate path for low-stakes uses keeps people inside the process instead of around it.",
  },
  {
    q: "Who should own the AI policy?",
    a: "A named executive, not a committee. Committees can advise, but one person should be accountable for the policy, its exceptions, and reporting to the board. Each AI use that matters also needs a named business owner for its results.",
  },
  {
    q: "How often should an AI policy be reviewed?",
    a: "Review the policy itself at least annually. Individual uses need a second look sooner, whenever something about them changes or goes wrong, so decide when you approve a use what would send it back for review.",
  },
  {
    q: "Do we need a lawyer to write it?",
    a: "Involve legal counsel, especially where you handle regulated information. Transformidable advises on governance and oversight; we are not a law firm and don't give legal advice.",
  },
];

const FIVE = [
  ["See", "Can we spot the AI uses that matter, including what vendors switch on?"],
  ["Decide", "Is it clear who can approve them?"],
  ["Own", "Is someone on the business side accountable for the outcome?"],
  ["Escalate", "Do we know what needs leadership's attention, and who can pause it?"],
  ["Evidence", "Could we show that governance is actually working?"],
];

export default function AiPolicyPage() {
  return (
    <GuidePage
      kicker="Transformidable Advisory · AI Governance"
      title="Your staff are already using AI. Start with an acceptable use policy."
      intro={[
        "In most organizations, AI arrived before the policy did. Staff are drafting, summarizing, and analyzing with generative AI tools, vendors are switching on AI features in software you already own, and some departments are buying AI on their own.",
        "Banning it rarely works. What works is deciding, deliberately, which uses matter, who gets to say yes, and who answers for the results.",
      ]}
      faq={FAQ}
      closing={{
        title: "Tell us where you are with AI.",
        body: "No policy yet, a policy nobody follows, or a board asking questions management can't yet answer. We'll tell you honestly whether and how we can help.",
      }}
    >
      <h2>Signs you need a policy now</h2>
      <ul>
        <li>Staff use ChatGPT, Copilot, Gemini, or similar tools, and no one has said what&rsquo;s allowed.</li>
        <li>Someone has pasted donor, student, member, patient, or employee information into an AI tool.</li>
        <li>A vendor has switched on AI features in software you already pay for.</li>
        <li>A department wants to buy an AI product, and there&rsquo;s no process for evaluating it.</li>
        <li>Your board has asked &ldquo;what are we doing about AI?&rdquo; and the answer was a shrug.</li>
      </ul>

      <h2>Having a policy isn&rsquo;t the same as governing AI</h2>
      <div className="gd-callout">
        <p>
          In EY&rsquo;s 2026 AI Risk and Governance Survey, 98% of organizations said they have formal AI governance
          policies. 47% said they had skipped their own governance process to meet an urgent deadline.
        </p>
      </div>
      <p>
        That isn&rsquo;t a discipline problem. It&rsquo;s governance built for a slower world: when the process is
        slower than the technology, people go around it. A policy proves you have a policy. It doesn&rsquo;t show
        anyone followed it.
      </p>

      <h2>Govern the decisions, not the tools</h2>
      <p>
        AI changes by the week: new tools, new models, new features in software you already own. A policy built around
        a list of approved tools is out of date almost as soon as it&rsquo;s written. What stays put are the decisions:
        when a use matters, who decides, who owns the result, and what you can show when someone asks how it&rsquo;s
        working. Build the policy on those.
      </p>

      <h2>What an AI acceptable use policy should cover</h2>
      <p>A useful policy is short enough that people read it. It should answer:</p>
      <ol>
        <li><strong>When a use matters.</strong> Clear thresholds for when an AI use needs more attention, such as when it touches sensitive information or influences decisions about people.</li>
        <li><strong>Who decides.</strong> Who can approve which uses, at the right level, so low-stakes uses aren&rsquo;t stuck waiting on the top of the organization.</li>
        <li><strong>A fast lane.</strong> Light checks for everyday, low-stakes uses, so the legitimate path is faster than going around it.</li>
        <li><strong>Information that must never go in.</strong> Confidential, personal, and regulated information, named specifically for your organization.</li>
        <li><strong>Who owns the result.</strong> IT runs the system; the business owns what it produces. Each use that matters needs a named owner.</li>
        <li><strong>Approval with conditions.</strong> Approving a use isn&rsquo;t a one-time event. Decide up front what would send it back for review.</li>
        <li><strong>Human review and disclosure.</strong> Who checks AI output before it&rsquo;s relied on, and when to say AI was used.</li>
        <li><strong>Vendors.</strong> What contracts must say about your data, and how you&rsquo;ll notice AI features a vendor switches on.</li>
        <li><strong>Training.</strong> How staff learn what the policy means in their own work.</li>
      </ol>

      <h2>Five questions to test your policy</h2>
      <p>
        The most important question isn&rsquo;t &ldquo;Do we have a policy?&rdquo; It&rsquo;s &ldquo;Could we explain
        how it actually works, in our organization, right now?&rdquo; Five questions, drawn from the{" "}
        <Link href="/research/governance-method">Transformidable Governance Method</Link>, put it to the test:
      </p>
      <ul>
        {FIVE.map(([name, q]) => <li key={name}><strong>{name}.</strong> {q}</li>)}
      </ul>
      <p>
        None of them is really a technology question. They&rsquo;re questions about how the organization runs, which is
        why AI governance can&rsquo;t live only in IT.
      </p>

      <div className="gd-callout">
        <p>
          <strong>Watch the briefing: &ldquo;Are we governing AI, or just letting it happen?&rdquo;</strong> Dr. Jerri
          Bland walks through each of the five questions, where to draw the lines, what should send an approved use back
          for review, and a real scenario: the day your HR vendor switches on AI.{" "}
          <Link href="/briefings/webinars">Register to watch</Link>.
        </p>
      </div>

      <h2>AI policy for nonprofits</h2>
      <p>
        Nonprofits often face the same AI decisions as large organizations with a fraction of the staff. The biggest
        risks are usually donor and client information entered into free tools, grant and funder requirements about
        data, and AI-generated content that goes out under the organization&rsquo;s name. Keep the policy short, name
        the information that must never be entered, and give staff a fast, approved path for everyday uses rather than
        none.
      </p>

      <h2>AI policy for colleges and universities</h2>
      <p>
        Universities need to separate two conversations that often get blended: AI in teaching and academic integrity,
        which belongs with faculty and shared governance, and AI in administration (admissions, financial aid,
        advising, HR, and operations), which involves student records and regulatory obligations such as FERPA. Many
        institutions have the first policy and not the second. Governing boards should ask which one they&rsquo;re
        looking at.
      </p>

      <h2>How Transformidable helps</h2>
      <ul>
        <li>
          <strong>Advisory.</strong> We can draft your AI acceptable use policy with you, or review the one you have,
          and shape the governance around it: who decides, who owns each use, what escalates, and what you report to
          the board.
        </li>
        <li>
          <strong>Academy.</strong>{" "}
          <Link href="/academy/courses/ai-governance-for-boards-and-councils">AI Governance for Boards &amp; Councils</Link>,
          a 90-minute briefing, gives your board a shared vocabulary, oversight questions, and an AI Governance
          Oversight Checklist. See all <Link href="/academy/board-governance-training">board governance training</Link>.
        </li>
        <li>
          <strong>Briefings.</strong> <Link href="/briefings/live">Upcoming live briefings</Link> and{" "}
          <Link href="/briefings/webinars">recorded briefings</Link> on AI governance for boards and executives.
        </li>
      </ul>
    </GuidePage>
  );
}
