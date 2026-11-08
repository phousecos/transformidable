// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSpamTrap } from "../useSpamTrap";

const Chevron = () => (
  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);
const ArrowRight = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// Nav model mirrors the blueprint: five divisions, in the order Research,
// Advisory, Academy, Publishing, Media, then About.
const NAV = [
  {
    label: "Research", href: "/research", children: [
      { no: "01.1", name: "Transformidable Research", desc: "Evidence on governance and transformation", href: "/research" },
      { no: "01.2", name: "Research Agenda", desc: "The questions we set out to answer", href: "/research/agenda" },
      { no: "01.3", name: "Governance Method", desc: "Six disciplines for visible, accountable governance", href: "/research/governance-method" },
      { no: "01.4", name: "Case Files", desc: "Anatomies of real governance decisions", href: "/publications/case-files" },
      { no: "01.5", name: "Publications", desc: "Articles, white papers, and annual reports", href: "/publications" },
      { no: "01.6", name: "Research Notes", desc: "Working findings, in progress", href: "/publications/research-notes" },
      { no: "01.7", name: "Datasets & Projects", desc: "The data and active lines of inquiry", href: "/research/datasets" },
      { no: "01.8", name: "Governance Tools", desc: "The codebook, benchmarks, and risk models", href: "/tools/governance-codebook" },
    ],
  },
  {
    label: "Advisory", href: "/advisory", children: [
      { no: "02.1", name: "Transformidable Advisory", desc: "Tell us the governance problem in front of you", href: "/advisory" },
      { no: "02.2", name: "Interim & Fractional CIO", desc: "Technology leadership when your CIO leaves, or before you hire one", href: "/advisory/fractional-cio" },
      { no: "02.3", name: "Executive Technology Office", desc: "Executive technology leadership. Shared expertise.", href: "/advisory/executive-technology-office" },
      { no: "02.4", name: "Book a Conversation", desc: "Start with a 30-minute call", href: "/advisory/conversation" },
    ],
  },
  {
    label: "Academy", href: "/academy", children: [
      { no: "03.1", name: "AI Governance Education", desc: "Programs for boards, councils, and leadership teams", href: "/academy" },
      { no: "03.2", name: "AI Governance for Boards & Councils", desc: "Executive briefing · 90 minutes", href: "/academy/courses/ai-governance-for-boards-and-councils" },
      { no: "03.3", name: "Governing AI Adoption", desc: "Facilitated workshop · 4 hours", href: "/academy/courses/governing-ai-adoption" },
      { no: "03.4", name: "Building AI Governance in Practice", desc: "Applied program · about 7 hours", href: "/academy/courses/building-ai-governance" },
      { no: "03.5", name: "Private Sessions", desc: "For your whole leadership or governing body", href: "/academy/organizations" },
      { no: "03.6", name: "FAQ", desc: "Common questions, answered", href: "/academy/faq" },
    ],
  },
  {
    label: "Publishing", href: "/publishing", children: [
      { no: "04.1", name: "The Transformidable Leader", desc: "The forthcoming book and workbook", href: "/publishing" },
      { no: "04.2", name: "Book Updates", desc: "Hear about the release", href: "/publishing#book-updates" },
    ],
  },
  {
    // Episodic media you watch or listen to.
    label: "Media", href: "/media", children: [
      { no: "05.1", name: "Transformidable Media", desc: "Podcast, briefings, interviews, and events", href: "/media" },
      { no: "05.2", name: "The Governance Files", desc: "The podcast: governance decisions on the record", href: "/podcast" },
      { no: "05.3", name: "Transformidable Briefing", desc: "Mixed-media briefings: video and articles", href: "/publications?type=transformidable-brief" },
      { no: "05.4", name: "Webinar Archive", desc: "Past webinars and recordings", href: "/briefings/webinars" },
      { no: "05.5", name: "Live Sessions", desc: "Upcoming and live briefings", href: "/briefings/live" },
    ],
  },
  { label: "About", href: "/about" },
];

// Utility links: in the top bar on desktop, at the end of the mobile menu.
const UTILITY = [
  { label: "Subscribe", href: "#briefing" },
  { label: "Contact", href: "/contact" },
  { label: "Book a conversation", href: "/advisory/conversation" },
];

export function ResearchNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    const root = document.documentElement;
    let current = root.getAttribute("data-theme");
    if (!current) {
      current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { window.localStorage.setItem("tr-theme", next); } catch {}
  };

  // Apply a saved preference on mount (no-op if none saved).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("tr-theme");
      if (saved === "dark" || saved === "light") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {}
  }, []);

  return (
    <>
      {/* Utility bar */}
      <div className="utility">
        <div className="wrap utility-in">
          <span className="u-brand">Transformidable</span>
          <div className="u-links">
            {UTILITY.map((u) =>
              u.external ? (
                <a className="u-brief" href={u.href} rel="noopener" key={u.label}>{u.label}</a>
              ) : (
                <Link className="u-brief" href={u.href} key={u.label}>{u.label}</Link>
              ),
            )}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <header className="masthead">
        <div className="wrap masthead-in">
          <Link className="wordmark" href="/" aria-label="Transformidable, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/logo-new.png" alt="Transformidable" width={240} height={60} />
          </Link>

          <nav className="primary" aria-label="Primary">
            {NAV.map((item) => (
              <div className="nav-item" key={item.label}>
                <Link href={item.href}>{item.label}{item.children && <Chevron />}</Link>
                {item.children && (
                  <div className="mega" role="menu">
                    {item.children.map((c) => (
                      <Link href={c.href} key={c.name} role="menuitem">
                        <span className="m-no">{c.no}</span>
                        <span><span className="m-name">{c.name}</span><span className="m-desc">{c.desc}</span></span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <button className="burger" aria-expanded={mobileOpen} aria-controls="tr-mobile-menu" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu${mobileOpen ? " is-open" : ""}`} id="tr-mobile-menu">
          <div className="wrap">
            {NAV.map((item) => (
              <div key={item.label}>
                <Link href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</Link>
                {item.children?.map((c) => (
                  <Link className="mm-sub" href={c.href} key={c.name} onClick={() => setMobileOpen(false)}>{c.name}</Link>
                ))}
              </div>
            ))}
            {UTILITY.map((u) =>
              u.external ? (
                <a href={u.href} rel="noopener" key={u.label}>{u.label}</a>
              ) : (
                <Link href={u.href} key={u.label} onClick={() => setMobileOpen(false)}>{u.label}</Link>
              ),
            )}
          </div>
        </div>
      </header>
    </>
  );
}

// `list` is the mailing list to join: the Transformidable Brief (the default)
// or book updates. `onLight` is for a form on a paper surface, not the footer.
export function ResearchSubscribe({ list = "brief", id = "tr-email", buttonLabel = "Subscribe", onLight = false }: { list?: "brief" | "book"; id?: string; buttonLabel?: string; onLight?: boolean }) {
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
        body: JSON.stringify({ email, source: "website", list, ...spamFields() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
        setMessage(data.message || "Thanks. You are subscribed.");
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
    <form className="subscribe" onSubmit={onSubmit}>
      {trap}
      <label className="sr-only" htmlFor={id}>Email address</label>
      <input id={id} type="email" name="email" placeholder="you@institution.org" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Joining…" : buttonLabel}</button>
      {message && (
        <p role="status" style={{ flexBasis: "100%", margin: "4px 0 0", fontSize: 12, color: onLight ? (state === "error" ? "var(--wine)" : "var(--ink-body)") : state === "error" ? "#fff" : "var(--on-wine)" }}>{message}</p>
      )}
    </form>
  );
}

export { ArrowRight };
