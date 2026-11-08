// @ts-nocheck
import Link from "next/link";
import { GuidePage } from "../../components/guides/Guide";
import { pageMetadata } from "../../../../lib/seo.ts";

// Search page: "ai acceptable use policy", "generative ai policy", "ai policy
// for nonprofits", "university ai policy" (Keyword Planner, Nov 2026).
export const metadata = pageMetadata({
  title: "AI Acceptable Use Policy for Boards & Leaders | Transformidable",
  absolute: true,
  description:
    "Staff are already using generative AI. What an AI acceptable use policy should cover, what the board's role is, and where nonprofits and universities should start.",
  path: "/advisory/ai-policy",
});

const FAQ = [
  {
    q: "Is a generative AI policy different from an AI acceptable use policy?",
    a: "They usually mean the same thing in practice: rules for how staff may use AI tools like ChatGPT, Copilot, and Gemini. \"Acceptable use\" emphasizes what's allowed; \"generative AI policy\" names the kind of tool. A broader AI governance policy also covers how the organization decides to build or buy AI.",
  },
  {
    q: "Should we just ban AI tools?",
    a: "Bans are hard to enforce and tend to push use out of sight, where the risks are worse. Most organizations do better approving a small number of tools and being specific about what information can't be used.",
  },
  {
    q: "Who should own the AI policy?",
    a: "A named executive, not a committee. Committees can advise, but one person should be accountable for the policy, its exceptions, and reporting to the board.",
  },
  {
    q: "How often should an AI policy be reviewed?",
    a: "At least annually, and whenever you adopt a significant new tool or a vendor adds AI features. Many organizations review every six months while their use of AI is changing quickly.",
  },
  {
    q: "Do we need a lawyer to write it?",
    a: "Involve legal counsel, especially where you handle regulated information. Transformidable advises on governance and oversight; we are not a law firm and don't give legal advice.",
  },
];

export default function AiPolicyPage() {
  return (
    <GuidePage
      kicker="Transformidable Advisory · AI Governance"
      title="Your staff are already using AI. Start with an acceptable use policy."
      intro={[
        "In most organizations, AI arrived before the policy did. Staff are drafting emails, summarizing documents, and analyzing data with generative AI tools, often free ones, often with organizational information.",
        "That isn't a reason to panic, and banning AI rarely works. It is a reason to decide, deliberately, what is acceptable: which tools, for what work, with what information, and who answers for the results.",
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

      <h2>What an AI acceptable use policy should cover</h2>
      <p>A useful policy is short enough that people read it. It should answer:</p>
      <ol>
        <li><strong>Approved tools.</strong> Which AI tools staff may use, and how a new tool gets approved.</li>
        <li><strong>Information that must never go in.</strong> Confidential, personal, and regulated information, named specifically for your organization.</li>
        <li><strong>Acceptable and unacceptable uses.</strong> Drafting and summarizing are usually fine. Decisions about people (hiring, admissions, eligibility, discipline) need far more care.</li>
        <li><strong>Human review.</strong> Who checks AI output before it&rsquo;s relied on, published, or sent.</li>
        <li><strong>Disclosure.</strong> When staff should say AI was used, internally and to the people you serve.</li>
        <li><strong>Vendors and procurement.</strong> What contracts must say about your data, and how AI features in existing software are reviewed.</li>
        <li><strong>Ownership and review.</strong> Who owns the policy, who handles exceptions and incidents, and how often it&rsquo;s revisited.</li>
        <li><strong>Training.</strong> How staff learn what the policy means in their own work.</li>
      </ol>

      <h2>A policy is not the same as governance</h2>
      <p>
        Management writes and enforces the policy. The board&rsquo;s job is different: to make sure the organization is
        making deliberate, defensible decisions about AI, and to know when it isn&rsquo;t. A policy no one follows, or
        that no one has the authority to enforce, gives the board false comfort.
      </p>
      <p>Questions a board should ask:</p>
      <ul>
        <li>Who in management is accountable for how we use AI?</li>
        <li>What AI is in use today, including AI built into software we already have?</li>
        <li>What information is at risk, and what have we done about it?</li>
        <li>How would we know if something went wrong, and who would tell us?</li>
        <li>When will we see this again?</li>
      </ul>

      <h2>AI policy for nonprofits</h2>
      <p>
        Nonprofits often face the same AI decisions as large organizations with a fraction of the staff. The biggest
        risks are usually donor and client information entered into free tools, grant and funder requirements about
        data, and AI-generated content that goes out under the organization&rsquo;s name. Keep the policy short, name
        the information that must never be entered, and give staff one approved tool rather than none.
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
          and shape the governance around it: decision rights, approval of new uses, oversight, and reporting to the
          board.
        </li>
        <li>
          <strong>Academy.</strong>{" "}
          <Link href="/academy/courses/ai-governance-for-boards-and-councils">AI Governance for Boards &amp; Councils</Link>,
          a 90-minute briefing, gives your board a shared vocabulary, oversight questions, and an AI Governance
          Oversight Checklist. See all <Link href="/academy/board-governance-training">board governance training</Link>.
        </li>
        <li>
          <strong>Briefings.</strong> <Link href="/briefings/live">Upcoming live briefings</Link> on AI governance for
          boards and executives.
        </li>
      </ul>
    </GuidePage>
  );
}
