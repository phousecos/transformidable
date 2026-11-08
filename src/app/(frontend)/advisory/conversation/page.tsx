// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../../components/research/ResearchShell";
import { Sky } from "../../components/research/Sky";
import { ConversationBooking } from "../../components/advisory/ConversationBooking";
import "../../components/home/home.css";
import { pageMetadata } from "../../../../lib/seo.ts";

export const metadata = pageMetadata({ title: "Book a Governance Conversation", description: "Thirty minutes, no pitch. Tell Transformidable the technology, project, or AI governance problem in front of you, and we'll tell you honestly whether and how we can help.", path: "/advisory/conversation" });

export default function ConversationPage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="advisory" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Book a conversation</p>
          <h1 className="idx-title">Tell us the governance problem in front of you.</h1>
          <p className="idx-intro">
            Thirty minutes, no pitch. We&rsquo;ll ask questions, tell you honestly whether and how we can help, and
            point you elsewhere if we&rsquo;re not the right fit.
          </p>
        </div>
      </section>

      <section aria-label="Book a conversation">
        <div className="wrap">
          <ConversationBooking />
          <p className="av-fallback">
            Not ready for a call? <Link className="link" href="/briefings/live">Attend a live briefing</Link> or{" "}
            <a className="link" href="#briefing">subscribe to the Brief</a>.
          </p>
        </div>
      </section>
    </ResearchShell>
  );
}
