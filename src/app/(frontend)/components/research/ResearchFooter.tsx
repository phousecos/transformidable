// @ts-nocheck
import Link from "next/link";
import { ResearchSubscribe } from "./ResearchNav";
import { ADVISORY_ENTITY } from "../site";

export function ResearchFooter() {
  return (
    <footer className="footer">
      <div className="wrap footer-top" id="briefing">
        <p className="kicker">The Transformidable Brief</p>
        <p className="footer-mission">
          <em>Transformidable</em>. Capable of sustained transformation through effective
          governance, leadership, and institutional resilience.
        </p>
        <ResearchSubscribe />
      </div>

      <div className="wrap footer-cols">
        <div className="fcol brand">
          <Link className="fw" href="/" aria-label="Transformidable, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/logo-new.png" alt="Transformidable" width={240} height={60} />
          </Link>
          <p>Research, advisory, executive education, publishing, and media on the leadership and governance of organizational transformation.</p>
        </div>
        <div className="fcol">
          <h5>Research</h5>
          <Link href="/research">Transformidable Research</Link>
          <Link href="/research/agenda">Research Agenda</Link>
          <Link href="/research/governance-method">Governance Method</Link>
          <Link href="/publications/case-files">Case Files</Link>
          <Link href="/publications">Publications</Link>
          <Link href="/publications/research-notes">Research Notes</Link>
          <Link href="/research/datasets">Datasets</Link>
          <Link href="/research/projects">Research Projects</Link>
          <Link href="/tools/governance-codebook">Governance Tools</Link>
        </div>
        <div className="fcol">
          <h5>Advisory</h5>
          <Link href="/advisory">Transformidable Advisory</Link>
          <Link href="/advisory/executive-technology-office">Executive Technology Office</Link>
          <Link href="/advisory/conversation">Book a Conversation</Link>
        </div>
        <div className="fcol">
          <h5>Academy</h5>
          <Link href="/academy">AI Governance Education</Link>
          <Link href="/academy/courses/ai-governance-for-boards-and-councils">Briefing for Boards &amp; Councils</Link>
          <Link href="/academy/organizations">Private Sessions</Link>
          <Link href="/academy/faq">FAQ</Link>
          <Link href="/academy/individuals">For Individuals</Link>
        </div>
        <div className="fcol">
          <h5>Publishing</h5>
          <Link href="/publishing">The Transformidable Leader</Link>
          <Link href="/publishing#book-updates">Book Updates</Link>
        </div>
        <div className="fcol">
          <h5>Media</h5>
          <Link href="/media">Transformidable Media</Link>
          <Link href="/podcast">The Governance Files</Link>
          <Link href="/publications?type=transformidable-brief">Transformidable Briefing</Link>
          <Link href="/briefings/webinars">Webinar Archive</Link>
          <Link href="/briefings/live">Live Sessions</Link>
        </div>
      </div>

      <div className="wrap footer-legal">
        <span>&copy; 2026 Transformidable &middot; All rights reserved</span>
        <span className="footer-legal-links">
          <Link href="/research#events">Events</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/independence">Independence</Link>
        </span>
        <span>Set in Source Serif &amp; Archivo</span>
      </div>

      {/* Contracting disclosure. Matches /independence. */}
      <div className="wrap">
        <p className="footer-affiliation">
          Advisory engagements are contracted through {ADVISORY_ENTITY}, an affiliate of Transformidable.
          Transformidable research is conducted independently and is never commissioned by advisory clients.{" "}
          <Link href="/independence">Read our independence policy.</Link>
        </p>
      </div>
    </footer>
  );
}
