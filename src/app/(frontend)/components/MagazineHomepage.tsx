// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./magazine.css";
import { useSpamTrap } from "./useSpamTrap";

interface MagazineHomepageProps {
  issue: any;
  articles: any[];
  issues?: any[];
  books?: any[];
  latestPodcast?: any;
}

// HTML-escape untrusted text so it cannot break out of attribute or element
// context. Lexical text nodes are author-controlled, but we still treat them
// as untrusted: the rendered HTML feeds dangerouslySetInnerHTML, so any
// unescaped `<` or `&` becomes a stored XSS sink.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// No h1: the article title is the page's only h1, so body headings start at h2.
const ALLOWED_HEADING_TAGS = new Set(["h2", "h3", "h4", "h5", "h6"]);

function lexicalToHtml(node: any): string {
  if (!node) return "";
  if (node.type === "text" || (!node.type && typeof node.text === "string")) {
    let text = escapeHtml(node.text ?? "");
    const fmt = typeof node.format === "number" ? node.format : 0;
    if (fmt & 1) text = `<strong>${text}</strong>`;
    if (fmt & 2) text = `<em>${text}</em>`;
    return text;
  }
  const children = (node.children ?? []).map(lexicalToHtml).join("");
  switch (node.type) {
    case "root": return children;
    case "paragraph": return children ? `<p>${children}</p>` : `<p><br /></p>`;
    case "heading": {
      const tag = ALLOWED_HEADING_TAGS.has(node.tag) ? node.tag : "h2";
      return `<${tag}>${children}</${tag}>`;
    }
    case "quote": return `<blockquote>${children}</blockquote>`;
    case "list": return node.listType === "number" ? `<ol>${children}</ol>` : `<ul>${children}</ul>`;
    case "listitem": return `<li>${children}</li>`;
    case "linebreak": return "<br />";
    default: return children;
  }
}

function normalizeBody(body: any): string {
  if (typeof body === "string") return body;
  if (body?.root) return lexicalToHtml(body.root);
  return "";
}

function mediaUrl(m: any): string | null {
  if (m && typeof m === "object" && typeof m.url === "string") return m.url;
  return null;
}

// The theme accent: the last word of a title picks up the wine accent, the way
// the mockup colors "needs." Falls back gracefully on one-word titles.
function AccentTitle({ text }: { text: string }) {
  const words = (text || "").trim().split(/\s+/);
  if (words.length <= 1) return <>{text}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <span style={{ color: "var(--wine)" }}>{last}</span>
    </>
  );
}

function scrollToTopRespectingMotion() {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

type View = { kind: "index" } | { kind: "article"; article: any; position: number };

export default function MagazineHomepage({ issue, articles, issues = [], books = [], latestPodcast = null }: MagazineHomepageProps) {
  const [view, setView] = useState<View>({ kind: "index" });
  const [navOpen, setNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const issuesToggleRef = useRef<HTMLButtonElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const isFirstView = useRef(true);

  const num = issue.issueNumber ?? 1;
  const issueNumberFormatted = String(num).padStart(2, "0");

  const sortedArticles = [...articles].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const flagship = sortedArticles.find((a) => a.isFlagship) ?? sortedArticles[0] ?? null;
  const remaining = sortedArticles.filter((a) => a !== flagship);

  // The column: prefer a guest-contributed piece so the guest byline pattern is
  // exercised; otherwise the next article in order.
  const isGuest = (a: any) => a?.author && typeof a.author === "object" && a.author.type === "guestContributor";
  const column = remaining.find(isGuest) ?? remaining[0] ?? null;

  const sortedIssues = [...issues].sort((a, b) => (b.issueNumber ?? 0) - (a.issueNumber ?? 0));
  const issueCount = sortedIssues.length || issue.volume || 1;

  const openArticle = (article: any, position: number) => {
    setView({ kind: "article", article, position });
    setNavOpen(false);
    setDrawerOpen(false);
    scrollToTopRespectingMotion();
  };

  // Escape closes the issues drawer (or, if it is shut, the mobile menu) and
  // returns focus to the toggle that opened it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drawerOpen) {
        setDrawerOpen(false);
        issuesToggleRef.current?.focus();
      } else if (navOpen) {
        setNavOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, navOpen]);

  // Switching between the issue index and an article swaps out the button the
  // reader just activated, so move focus to the new view's h1 (WCAG 2.4.3).
  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    document.querySelector<HTMLElement>("#main-content h1")?.focus({ preventScroll: true });
  }, [view]);

  const monthYear = (d: any) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="mag">
      <div className="page">

        {/* Masthead + nav */}
        <div className="masthead-row">
          <header className="w masthead" style={{ flex: 1 }}>
            <Link className="wordmark" href="/">
              <span className="mark" aria-hidden="true"></span>
              <span className="name">TRANSFORMIDABLE</span>
            </Link>
            <button
              className="burger"
              id="menu-toggle"
              ref={menuToggleRef}
              aria-expanded={navOpen}
              aria-controls="nav"
              aria-label="Menu"
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </header>

          <nav className={`nav${navOpen ? " is-open" : ""}`} id="nav" aria-label="Main">
            <button
              className="nav-item"
              id="issues-toggle"
              ref={issuesToggleRef}
              aria-expanded={drawerOpen}
              aria-controls="issues-drawer"
              onClick={() => setDrawerOpen((v) => !v)}
            >
              Issues
              <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <Link className="nav-item" href="/podcast">Podcast</Link>
            <Link className="nav-item" href="/about">About</Link>
            <Link className="nav-item" href="/archive">
              Archive
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </Link>
          </nav>
        </div>

        {/* Issues archive drawer */}
        {/* inert while shut: the collapsed drawer is only height-clipped, so its
            links would otherwise stay in the tab order while invisible. */}
        <div className={`drawer${drawerOpen ? " is-open" : ""}`} id="issues-drawer" inert={!drawerOpen}>
          <div className="drawer-inner">
            <div className="w drawer-head">
              <h2 className="kicker">The archive</h2>
              <Link className="link" href="/archive">All {issueCount} issues
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            </div>
            <div className="shelf">
              {(sortedIssues.length ? sortedIssues : [issue]).map((it) => {
                const cover = mediaUrl(it.seo?.ogImage);
                const isCurrent = it.issueNumber === issue.issueNumber;
                const n = String(it.issueNumber ?? 0).padStart(2, "0");
                return (
                  <Link className="shelf-item" href={`/issues/${it.issueNumber}`} key={it.id ?? it.issueNumber} aria-current={isCurrent ? "page" : undefined}>
                    {cover ? <img className="cover cover--issue" src={cover} alt="" /> : <div className="ph ph--issue" aria-hidden="true">cover</div>}
                    <div className="shelf-current" style={isCurrent ? undefined : { color: "var(--ink-mute)" }}>
                      {isCurrent ? `${n} · CURRENT` : n}
                    </div>
                    <div className="shelf-title" style={{ marginTop: 0 }}>{it.themeTagline || it.title}</div>
                    <div className="meta">{monthYear(it.publicationDate)}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <main id="main-content">
          {view.kind === "index" ? (
            <IndexView
              issue={issue}
              flagship={flagship}
              column={column}
              books={books}
              latestPodcast={latestPodcast}
              issueCount={issueCount}
              onOpenArticle={openArticle}
            />
          ) : (
            <ArticleReadView
              article={view.article}
              position={view.position}
              issue={issue}
              allArticles={sortedArticles}
              onOpenArticle={openArticle}
              onBackToIssue={() => { setView({ kind: "index" }); scrollToTopRespectingMotion(); }}
            />
          )}
        </main>

        <footer className="w">
          <SubscribeForm />
          <div className="colophon">
            <div>
              <h2 className="kicker" style={{ marginBottom: 12 }}>Colophon</h2>
              <p>
                Edited by <strong>Jerri Bland, Ed.D.</strong> Set in Archivo and Source Serif.
                Published monthly from Durham, North Carolina. {numberWord(issueCount)} issue{issueCount === 1 ? "" : "s"} and counting.
              </p>
            </div>
            <div className="colophon-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                <span style={{ width: 12, height: 12, background: "var(--wine)", transform: "rotate(45deg)" }} aria-hidden="true"></span>
                <span style={{ fontFamily: "var(--display)", fontSize: 12, letterSpacing: "0.04em" }}>TRANSFORMIDABLE</span>
              </div>
              <div className="meta">© {new Date().getFullYear()} · All rights reserved</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Spell out small issue counts so the colophon reads like prose ("Twelve
// issues and counting") rather than a stat.
function numberWord(n: number): string {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  return n >= 0 && n <= 12 ? words[n] : String(n);
}

function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const { trap, spamFields } = useSpamTrap();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "website", ...spamFields() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
        setMessage(data.message || "Thanks, you are subscribed.");
        setEmail("");
      } else {
        setState("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="subscribe">
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 15, marginBottom: 4 }}>Get the next issue</div>
        <div className="meta" style={{ marginBottom: 14 }}>One email. Monthly. No filler.</div>
        {/* Always mounted so screen readers pick up the message when it changes;
            a live region inserted together with its text is often not announced. */}
        <div id="mag-subscribe-status" className="meta" role="status" aria-live="polite" style={{ marginBottom: message ? 12 : 0, color: state === "error" ? "var(--wine)" : "var(--ink)" }}>{message}</div>
      </div>
      <form className="subscribe-form" onSubmit={onSubmit}>
        {trap}
        <label className="sr-only" htmlFor="email">Email address</label>
        <input id="email" type="email" name="email" autoComplete="email" placeholder="you@company.com" required aria-invalid={state === "error" || undefined} aria-describedby={state === "error" ? "mag-subscribe-status" : undefined} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Joining…" : "Join"}</button>
      </form>
    </div>
  );
}

function Byline({ author, fallbackName, meta, affiliation, forOutlet }: { author?: any; fallbackName?: string; meta?: string; affiliation?: string; forOutlet?: string }) {
  const name = (author && typeof author === "object" && author.name) || fallbackName || "Jerri Bland";
  const headshot = author && typeof author === "object" ? mediaUrl(author.headshot) : null;
  const role = affiliation || (author && typeof author === "object" ? author.role : null);
  const guest = author && typeof author === "object" && author.type === "guestContributor";
  const authorSlug = author && typeof author === "object" ? author.slug : null;
  return (
    <div className="byline" style={{ marginBottom: 18 }}>
      {headshot ? <img className="avatar" src={headshot} alt="" /> : <div className="ph avatar" aria-hidden="true"></div>}
      {guest && authorSlug ? (
        <Link className="who" href={`/contributors/${authorSlug}`}>{name}</Link>
      ) : (
        <span className="who">{name}</span>
      )}
      {forOutlet && <span className="what">for <span className="outlet">{forOutlet}</span></span>}
      {role && !forOutlet && (
        <>
          <span className="dot" aria-hidden="true"></span>
          <span className="what">{role}</span>
        </>
      )}
      {meta && (
        <>
          <span className="dot" aria-hidden="true"></span>
          <span className="what">{meta}</span>
        </>
      )}
    </div>
  );
}

function IndexView({ issue, flagship, column, books, latestPodcast, issueCount, onOpenArticle }: any) {
  const heroPhoto = mediaUrl(flagship?.featuredImage);
  const columnPhoto = mediaUrl(column?.featuredImage);
  const readingBooks = (books || []).slice(0, 3);
  const podGuest = latestPodcast?.guest && typeof latestPodcast.guest === "object" ? latestPodcast.guest : null;
  const podArt = mediaUrl(latestPodcast?.featuredImage) || (podGuest && mediaUrl(podGuest.headshot));

  return (
    <>
      {/* HERO — the lead essay. This is the issue INDEX; the essay reads on its
          own view. */}
      <article className="w" style={{ paddingTop: "var(--section)", paddingBottom: 22 }}>
        <p className="kicker">The lead essay</p>
        <h1 className="display hero-title" tabIndex={-1} style={{ fontSize: 31, margin: "14px 0 16px" }}>
          <AccentTitle text={flagship?.title || issue.themeTagline || issue.title || "This issue"} />
        </h1>
        {(flagship?.dek || issue.themeSubheading) && (
          <p className="body" style={{ marginBottom: 20 }}>{flagship?.dek || issue.themeSubheading}</p>
        )}
        <Byline author={flagship?.author} fallbackName="Jerri Bland" meta={flagship?.readTime ? `${flagship.readTime} min` : undefined} />
        <div className="hero-actions">
          {flagship ? (
            <button className="btn btn--block" onClick={() => onOpenArticle(flagship, flagship.displayOrder ?? 1)}>
              Read the essay
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          ) : null}
        </div>
      </article>
      {heroPhoto ? <img className="cover--bleed" src={heroPhoto} alt="" /> : <div className="ph ph--bleed" aria-hidden="true">photo, full bleed</div>}

      <hr className="rule" style={{ marginTop: "var(--section)" }} />

      {/* COMMENTARY — audio. Static mockup; wire to a real <audio> element and an
          issue-level commentary field when the model exists. */}
      <section className="w section">
        <h2 className="kicker">Commentary</h2>
        <h3 className="display section-title">Why the pilot always survives the audit</h3>
        <Byline fallbackName="Jerri Bland" meta="6 min listen" />
        <div className="player">
          <button className="play" aria-label="Play commentary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <div className="wave" aria-hidden="true">
            {[40, 75, 95, 55, 80, 30, 62, 88, 45, 70, 35, 92, 58, 25, 66, 84, 42, 74, 50, 30, 68, 90, 38, 60].map((h, i) => (
              <span key={i} className={i < 6 ? "played" : undefined} style={{ height: `${h}%` }} />
            ))}
          </div>
          <span className="meta player-time">6:12</span>
        </div>
      </section>

      <hr className="rule" />

      {/* THE COLUMN — a guest byline where available. Photo sits above, full-bleed. */}
      {column && (
        <>
          {columnPhoto ? <img className="cover--bleed-col" src={columnPhoto} alt="" /> : <div className="ph ph--bleed-col" aria-hidden="true">photo</div>}
          <section className="w" style={{ paddingTop: 24, paddingBottom: "var(--section)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 className="kicker">The column</h2>
              {column.vertical && typeof column.vertical === "object" && column.vertical.name && (
                <span className="tag">{column.vertical.name}</span>
              )}
            </div>
            <h3 className="display section-title">{column.title}</h3>
            <Byline author={column.author} fallbackName="Jerri Bland" meta={column.readTime ? `${column.readTime} min` : undefined} />
            {column.dek && <p className="body" style={{ marginBottom: 16 }}>{column.dek}</p>}
            <button className="link link--rule" onClick={() => onOpenArticle(column, column.displayOrder ?? 0)} style={{ background: "none", border: 0, cursor: "pointer" }}>Keep reading</button>
          </section>
        </>
      )}

      {/* ELSEWHERE — pointer to a syndicated piece. Static mockup content. */}
      <section className="w section section--inset">
        <h2 className="kicker">Elsewhere</h2>
        <h3 className="display section-title">The meeting nobody documented</h3>
        <div className="byline" style={{ marginBottom: 20 }}>
          <div className="ph avatar" aria-hidden="true"></div>
          <span className="who">Jerri Bland</span>
          <span className="what">for <span className="outlet">CUSO Magazine</span></span>
          <span className="dot" aria-hidden="true"></span>
          <span className="what">July 9, 2026</span>
        </div>
        <blockquote className="pullquote">
          <p>&ldquo;A $400M credit union doesn&rsquo;t fail its core conversion on day one. It fails it eleven months earlier, in a meeting nobody documented.&rdquo;</p>
        </blockquote>
        <a className="link" href="https://cusomag.com/" rel="noopener noreferrer" target="_blank">
          Read the full piece at CUSO
          <span className="sr-only"> (opens in a new tab)</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
        </a>
      </section>

      {/* PODCAST */}
      {latestPodcast && (
        <section className="w section">
          <h2 className="kicker">Transformidable Thinking · Ep. {latestPodcast.episodeNumber}</h2>
          <div className="split" style={{ marginTop: 18 }}>
            {podArt ? <img className="ph--round cover" src={podArt} alt="" style={{ width: 96, height: 96, borderRadius: "50%", marginBottom: 16 }} /> : <div className="ph ph--round" style={{ marginBottom: 16 }} aria-hidden="true">guest</div>}
            <div style={{ flex: 1 }}>
              <h3 className="display section-title" style={{ marginTop: 0 }}>{latestPodcast.title}</h3>
              {latestPodcast.description && <p className="body" style={{ marginBottom: 16 }}>{latestPodcast.description}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Link className="btn" href="/podcast">
                  Play
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

    </>
  );
}

function ArticleReadView({ article, position, issue, allArticles, onOpenArticle, onBackToIssue }: any) {
  const body = normalizeBody(article.body);
  const sorted = [...allArticles].sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const currentIdx = sorted.findIndex((a: any) => a.id === article.id);
  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  const verticalLabel = (a: any) => (a.vertical && typeof a.vertical === "object" ? a.vertical.name : "");

  const pullQuotes = Array.isArray(article.pullQuotes) ? article.pullQuotes : [];
  const afterIntro = pullQuotes.filter((q: any) => q.position === "after_intro");
  const mid = pullQuotes.filter((q: any) => q.position === "mid");
  const nearEnd = pullQuotes.filter((q: any) => q.position === "near_end");

  const paragraphs = body ? body.split("</p>").filter((p: string) => p.trim()).map((p: string) => p + "</p>") : [];
  const totalParagraphs = paragraphs.length;
  const introBreak = Math.max(2, Math.floor(totalParagraphs * 0.25));
  const midBreak = Math.floor(totalParagraphs * 0.5);
  const endBreak = Math.max(midBreak + 1, Math.floor(totalParagraphs * 0.75));

  const PullQuote = ({ quote }: { quote: string }) => (
    <figure className="article-pullquote"><p>&ldquo;{quote}&rdquo;</p></figure>
  );

  const renderBody = () => {
    if (!body) return null;
    if (pullQuotes.length === 0) {
      return <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />;
    }
    const chunks: { type: "html" | "quote"; content: string }[] = [];
    let current = "";
    paragraphs.forEach((p: string, i: number) => {
      current += p;
      if (i === introBreak - 1 && afterIntro.length > 0) {
        chunks.push({ type: "html", content: current }); current = "";
        afterIntro.forEach((q: any) => chunks.push({ type: "quote", content: q.quote }));
      } else if (i === midBreak - 1 && mid.length > 0) {
        chunks.push({ type: "html", content: current }); current = "";
        mid.forEach((q: any) => chunks.push({ type: "quote", content: q.quote }));
      } else if (i === endBreak - 1 && nearEnd.length > 0) {
        chunks.push({ type: "html", content: current }); current = "";
        nearEnd.forEach((q: any) => chunks.push({ type: "quote", content: q.quote }));
      }
    });
    if (current) chunks.push({ type: "html", content: current });
    return chunks.map((chunk, i) =>
      chunk.type === "quote"
        ? <PullQuote key={`q-${i}`} quote={chunk.content} />
        : <div key={`h-${i}`} className="prose" dangerouslySetInnerHTML={{ __html: chunk.content }} />
    );
  };

  return (
    <>
      <div className="article-hero">
        <div className="w">
          <button className="article-back" onClick={onBackToIssue}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            Back to issue
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span className="kicker">{String(position).padStart(2, "0")}</span>
            {verticalLabel(article) && <span className="kicker">· {verticalLabel(article)}</span>}
          </div>
          <h1 className="display" tabIndex={-1} style={{ fontSize: 30, lineHeight: 1.02 }}>{article.title}</h1>
          {article.dek && <p className="dek">{article.dek}</p>}
          <p className="meta" style={{ marginTop: 14 }}>
            {issue.issueNumber != null && <>Issue {String(issue.issueNumber).padStart(2, "0")}</>}
            {issue.volume != null && <> · Volume {issue.volume}</>}
            {article.readTime ? <> · {article.readTime} min</> : null}
          </p>
        </div>
      </div>
      <div className="w" style={{ paddingBlock: "var(--section)" }}>
        {body ? renderBody() : <p className="body" style={{ fontStyle: "italic" }}>Full article content coming soon.</p>}
        <div className="article-nav">
          {prev ? (
            <button className="navtitle-wrap" onClick={() => onOpenArticle(prev, prev.displayOrder ?? 0)} style={{ background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }}>
              <span className="navlabel">Previous</span>
              <span className="navtitle" style={{ display: "block" }}>{prev.title}</span>
            </button>
          ) : <span />}
          <button className="link" onClick={onBackToIssue} style={{ background: "none", border: 0, cursor: "pointer" }}>This issue</button>
          {next ? (
            <button onClick={() => onOpenArticle(next, next.displayOrder ?? 0)} style={{ background: "none", border: 0, cursor: "pointer", textAlign: "right", padding: 0 }}>
              <span className="navlabel">Next</span>
              <span className="navtitle" style={{ display: "block" }}>{next.title}</span>
            </button>
          ) : <span />}
        </div>
      </div>
    </>
  );
}
