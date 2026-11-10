// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    // Courses here are the built-in copy; useAcademyMenu() swaps in the
    // current list from Courses (/api/academy-menu) once loaded.
    label: "Academy", href: "/academy", children: [
      { name: "Transformidable Academy", desc: "Live courses for the bodies that govern technology", href: "/academy" },
      { name: "TA-101 Know What You’re Governing", desc: "90 minutes · live online · per seat or private for your organization", href: "/academy/courses/know-what-youre-governing" },
      { name: "Governing AI Adoption", desc: "Half day · private for your organization", href: "/academy/courses/governing-ai-adoption" },
      { name: "Building AI Governance in Practice", desc: "About a full day · private for your organization", href: "/academy/courses/building-ai-governance" },
      { name: "Dedicated Sessions", desc: "A session for your whole board", href: "/academy/dedicated-sessions" },
      { name: "FAQ", desc: "Questions officials ask", href: "/academy#faq" },
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

// The Academy menu, with its courses from the CMS: the first entry (the
// Academy itself), then each listed course, then the last two (Dedicated
// Sessions and FAQ). Keeps the built-in copy if the request fails.
function useAcademyMenu() {
  const [nav, setNav] = useState(NAV);
  useEffect(() => {
    let live = true;
    fetch("/api/academy-menu")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live || !Array.isArray(data?.courses) || !data.courses.length) return;
        setNav((current) => current.map((item) => {
          if (item.label !== "Academy") return item;
          const kids = item.children;
          return { ...item, children: [kids[0], ...data.courses, ...kids.slice(-2)] };
        }));
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  // Menu numbers follow position, e.g. 03.1, 03.2, ...
  return nav.map((item, i) => item.children
    ? { ...item, children: item.children.map((c, j) => ({ ...c, no: c.no || `${String(i + 1).padStart(2, "0")}.${j + 1}` })) }
    : item);
}

export function ResearchNav() {
  const navItems = useAcademyMenu();
  const [mobileOpen, setMobileOpen] = useState(false);
  // The mega menu opens on hover/focus (CSS). Escape dismisses it (WCAG 1.4.13)
  // until the pointer or focus leaves that item.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const current = (href: string) => (href === pathname ? "page" : undefined);

  // Escape closes the mobile menu and returns focus to its toggle.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

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
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme">
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
            {navItems.map((item) => (
              <div
                className="nav-item"
                key={item.label}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && item.children) {
                    setDismissed(item.label);
                    (e.currentTarget.querySelector(":scope > a") as HTMLElement | null)?.focus();
                  }
                }}
                onMouseLeave={() => setDismissed(null)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDismissed(null);
                }}
              >
                <Link href={item.href} aria-current={current(item.href)}>{item.label}{item.children && <Chevron />}</Link>
                {item.children && (
                  <div
                    className="mega"
                    aria-label={`${item.label} pages`}
                    role="group"
                    style={dismissed === item.label ? { visibility: "hidden", opacity: 0 } : undefined}
                  >
                    {item.children.map((c) => (
                      <Link href={c.href} key={c.name} aria-current={current(c.href)}>
                        <span className="m-no">{c.no}</span>
                        <span><span className="m-name">{c.name}</span><span className="m-desc">{c.desc}</span></span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <button ref={burgerRef} type="button" className="burger" aria-expanded={mobileOpen} aria-controls="tr-mobile-menu" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <nav className={`mobile-menu${mobileOpen ? " is-open" : ""}`} id="tr-mobile-menu" aria-label="Mobile">
          <div className="wrap">
            {navItems.map((item) => (
              <div key={item.label}>
                <Link href={item.href} aria-current={current(item.href)} onClick={() => setMobileOpen(false)}>{item.label}</Link>
                {item.children?.map((c) => (
                  <Link className="mm-sub" href={c.href} key={c.name} aria-current={current(c.href)} onClick={() => setMobileOpen(false)}>{c.name}</Link>
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
        </nav>
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
      <input
        id={id}
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@institution.org"
        required
        aria-invalid={state === "error" ? true : undefined}
        aria-describedby={message ? `${id}-msg` : undefined}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Joining…" : buttonLabel}</button>
      {/* Always-present live region so the result is announced. */}
      <span className="sr-only" role="status" aria-live="polite">{message}</span>
      {message && (
        <p id={`${id}-msg`} style={{ flexBasis: "100%", margin: "4px 0 0", fontSize: 12, color: onLight ? (state === "error" ? "var(--wine)" : "var(--ink-body)") : state === "error" ? "#fff" : "var(--on-wine)" }}>{message}</p>
      )}
    </form>
  );
}

export { ArrowRight };
