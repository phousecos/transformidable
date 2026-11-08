// @ts-nocheck
import Link from "next/link";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { ResearchSubscribe } from "../components/research/ResearchNav";
import "../components/home/home.css";
import { pageMetadata } from "../../../lib/seo.ts";

// PENDING: add the book's description, subtitle, and release timing once they
// are confirmed. Until then the copy says only what is settled: the book is
// forthcoming and has a companion workbook.
const BOOK_SITE = "https://thetransformidableleader.com";

const DESCRIPTION =
  "Transformidable Publishing: The Transformidable Leader, its companion workbook, future books, and substantive publications on leadership and governance.";

export const metadata = pageMetadata({ title: "Publishing", description: DESCRIPTION, path: "/publishing" });

const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function PublishingPage() {
  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="publishing" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Transformidable Publishing</p>
          <h1 className="idx-title">The Transformidable Leader</h1>
          <p className="idx-intro">
            The forthcoming book from Transformidable, with a companion workbook. Publishing carries the
            ideas behind our research and programs into long-form work for leaders.
          </p>
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <a className="btn" href={BOOK_SITE} rel="noopener">Discover The Transformidable Leader <Arrow /></a>
            <a className="link" href="#book-updates">Join book updates <Arrow s={13} /></a>
          </div>
        </div>
      </section>

      <section aria-labelledby="pb-h">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Books and publications</p>
              <h2 className="h" id="pb-h">What Publishing offers.</h2>
            </div>
          </div>
          <div className="dv-grid">
            <div className="dv-card">
              <span className="dv-tag">Forthcoming</span>
              <h3>The Transformidable Leader</h3>
              <p>The book at the center of Transformidable Publishing, with its own home for launch news, speaking, and the companion workbook.</p>
              <a className="link" href={BOOK_SITE} rel="noopener">Visit the book site <Arrow s={13} /></a>
            </div>
            <div className="dv-card">
              <span className="dv-tag">Forthcoming</span>
              <h3>The companion workbook</h3>
              <p>A practical companion to the book, for readers who want to apply its ideas inside their own organizations.</p>
              <a className="link" href="#book-updates">Hear when it is available <Arrow s={13} /></a>
            </div>
            <div className="dv-card">
              <span className="dv-tag">Available now</span>
              <h3>Substantive publications</h3>
              <p>Case Files, white papers, and reports from Transformidable Research, argued, edited, and on the record.</p>
              <Link className="link" href="/publications">Browse publications <Arrow s={13} /></Link>
            </div>
            <div className="dv-card is-soon">
              <span className="dv-tag">In the future</span>
              <h3>Future books</h3>
              <p>Further titles on leadership and governance will be announced as they are developed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rule-band" aria-labelledby="pb-faq-h">
        <div className="wrap">
          <p className="kicker" id="pb-faq-h">At a glance</p>
          <dl className="dv-qa" style={{ marginTop: 20 }}>
            <div><dt>What it is</dt><dd>The publishing division of Transformidable: books, a companion workbook, and substantive publications on leadership and governance.</dd></div>
            <div><dt>Who it is for</dt><dd>Leaders, executives, board members, and readers responsible for leading and governing consequential change.</dd></div>
            <div><dt>Available now</dt><dd>Research publications, including Case Files and white papers, in the <Link className="link" href="/publications">publications library</Link>.</dd></div>
            <div><dt>Forthcoming</dt><dd>The Transformidable Leader and its companion workbook. Join book updates to hear about the release.</dd></div>
          </dl>
        </div>
      </section>

      <section className="rule-band dv-signup" id="book-updates" aria-labelledby="pb-signup-h">
        <div className="wrap dv-signup-in">
          <div>
            <p className="kicker">Book updates</p>
            <h2 className="hm-h2" id="pb-signup-h">Be the first to hear about The Transformidable Leader.</h2>
          </div>
          <div>
            <p className="body" style={{ marginBottom: 16 }}>Release news, the companion workbook, and launch events. Separate from the Transformidable Brief.</p>
            <ResearchSubscribe list="book" id="book-email" buttonLabel="Join book updates" onLight />
          </div>
        </div>
      </section>
    </ResearchShell>
  );
}
