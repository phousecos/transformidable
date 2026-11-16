// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import { CAL_LINK, CAL_ORIGIN } from "../site";
import { INBOUND_KEYS, captureInbound } from "./inbound";
import { useSpamTrap } from "../useSpamTrap";

// One booking form per page, so fixed ids are safe (the embed needs a
// plain CSS selector for its container).
const idp = "av";

// The full intake is emailed (api/advisory-intake) when the scheduler opens.
// Cal.com caps the booking's notes at 1,000 characters, so the booking gets a
// shortened copy: the problem is cut to PROBLEM_IN_NOTES with a pointer to the
// email, and the whole note is trimmed to NOTES_MAX as a backstop (campaign
// tags go last and are also sent as booking metadata).
const NOTES_MAX = 1000;
const PROBLEM_MAX = 2000;
const PROBLEM_IN_NOTES = 600;
const SHORT_MAX = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AREAS = ["M&A", "Troubled program", "IT controls", "AI", "Something else"];

const EMBED_SCRIPT = "https://app.cal.com/embed/embed.js";

// Cal.com's documented loader: queues calls on window.Cal until embed.js
// has loaded, then replays them.
function loadCal() {
  const C = window as any;
  if (C.Cal) return C.Cal;
  const push = (api, args) => api.q.push(args);
  C.Cal = function () {
    const cal = C.Cal;
    const args = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      document.head.appendChild(document.createElement("script")).src = EMBED_SCRIPT;
      cal.loaded = true;
    }
    if (args[0] === "init") {
      const api = function () { push(api, arguments); };
      const namespace = args[1];
      api.q = api.q || [];
      if (typeof namespace === "string") {
        cal.ns[namespace] = cal.ns[namespace] || api;
        push(cal.ns[namespace], args);
        push(cal, ["initNamespace", namespace]);
      } else push(cal, args);
      return;
    }
    push(cal, args);
  };
  C.Cal("init", { origin: CAL_ORIGIN });
  return C.Cal;
}

// The intake travels with the booking: the answers go in the booking notes
// (so they show in the confirmation and in Cal.com), and the campaign tags go
// both in the notes and as booking metadata and UTM fields for reporting.
function bookingConfig(fields, inbound) {
  const details = [
    fields.organization.trim() && `Organization: ${fields.organization.trim()}`,
    fields.role.trim() && `Role: ${fields.role.trim()}`,
    fields.area && `Area: ${fields.area}`,
    ...INBOUND_KEYS.filter((k) => inbound[k]).map((k) => `${k}: ${inbound[k]}`),
  ].filter(Boolean);
  const problem = fields.problem.trim();
  const shortProblem =
    problem.length > PROBLEM_IN_NOTES ? `${problem.slice(0, PROBLEM_IN_NOTES).trimEnd()}… [full text in the intake email]` : problem;
  const notes = [`What's the governance problem?\n${shortProblem}`, details.join("\n")]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, NOTES_MAX);
  const config: Record<string, string> = { name: fields.name.trim(), email: fields.email.trim(), notes };
  for (const k of INBOUND_KEYS) {
    if (!inbound[k]) continue;
    config[`metadata[${k}]`] = inbound[k];
    if (k.startsWith("utm_")) config[k] = inbound[k];
  }
  return config;
}

export function ConversationBooking() {
  const [fields, setFields] = useState({ name: "", email: "", organization: "", role: "", problem: "", area: "" });
  const [inbound, setInbound] = useState({});
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  // The intake last emailed, so "Update and choose a time" only re-sends after a change.
  const lastSent = useRef("");
  const { trap, spamFields } = useSpamTrap();

  useEffect(() => {
    setInbound(captureInbound());
  }, []);

  useEffect(() => {
    if (!config) return;
    const el = document.getElementById(`${idp}-cal`);
    if (!el) return;
    el.innerHTML = "";
    // The embed's iframe has no title of its own; name it for screen readers.
    const titleFrames = () =>
      el.querySelectorAll("iframe:not([title])").forEach((f) => f.setAttribute("title", "Choose a time: Cal.com scheduler"));
    const observer = new MutationObserver(titleFrames);
    observer.observe(el, { childList: true, subtree: true });
    loadCal()("inline", { elementOrSelector: `#${idp}-cal`, calLink: CAL_LINK, config });
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    return () => observer.disconnect();
  }, [config]);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  // After a failed submit, flag each required field that is still empty.
  const invalid = (key) => (error && !fields[key].trim() ? { "aria-invalid": true, "aria-describedby": `${idp}-error` } : {});

  const emailOk = EMAIL_RE.test(fields.email.trim());
  const invalidEmail = error && !emailOk ? { "aria-invalid": true, "aria-describedby": `${idp}-error` } : {};

  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const missing = !fields.name.trim() ? "name" : !emailOk ? "email" : !fields.problem.trim() ? "problem" : null;
    if (missing) {
      setError("Please add your name, your email, and a few words about the governance problem.");
      document.getElementById(`${idp}-${missing}`)?.focus();
      return;
    }
    setError("");

    // Email the full intake, then open the scheduler. Only a validation error
    // stops here; if the email can't be sent, booking still goes ahead, and
    // the booking notes carry the short copy.
    const key = JSON.stringify(fields);
    if (key !== lastSent.current) {
      setSending(true);
      try {
        const res = await fetch("/api/advisory-intake", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...fields, inbound, ...spamFields() }),
        });
        if (res.status === 400) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Please check the form and try again.");
          return;
        }
        if (res.ok) lastSent.current = key;
      } catch {
        // Network trouble: let them book anyway.
      } finally {
        setSending(false);
      }
    }
    setConfig(bookingConfig(fields, inbound));
  };

  // Same prefill as a plain link, for anyone whose browser blocks the embed.
  const directLink = config
    ? `${CAL_ORIGIN}/${CAL_LINK}?${new URLSearchParams(config).toString()}`
    : `${CAL_ORIGIN}/${CAL_LINK}`;

  return (
    <div className="av-book">
      <div className="av-card">
        <h2>Before we talk</h2>
        <p>A few details so the conversation starts in the right place. Then choose a time.</p>
        <form className="case-form av-form" onSubmit={onSubmit} noValidate>
          {trap}
          <div className="av-form-grid">
            <div>
              <label className="case-form-label" htmlFor={`${idp}-name`}>Name</label>
              <input id={`${idp}-name`} className="case-form-input" type="text" required aria-required="true" autoComplete="name" maxLength={SHORT_MAX} value={fields.name} onChange={set("name")} {...invalid("name")} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-email`}>Email</label>
              <input id={`${idp}-email`} className="case-form-input" type="email" required aria-required="true" autoComplete="email" maxLength={254} value={fields.email} onChange={set("email")} {...invalidEmail} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-org`}>Organization <span className="case-form-optional">(optional)</span></label>
              <input id={`${idp}-org`} className="case-form-input" type="text" autoComplete="organization" maxLength={SHORT_MAX} value={fields.organization} onChange={set("organization")} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-role`}>Role <span className="case-form-optional">(optional)</span></label>
              <input id={`${idp}-role`} className="case-form-input" type="text" autoComplete="organization-title" maxLength={SHORT_MAX} value={fields.role} onChange={set("role")} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-area`}>Area <span className="case-form-optional">(optional)</span></label>
              <select id={`${idp}-area`} className="case-form-input" value={fields.area} onChange={set("area")}>
                <option value="">Choose one</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <label className="case-form-label" htmlFor={`${idp}-problem`}>
            What&rsquo;s the governance problem? <span className="case-form-optional">({PROBLEM_MAX - fields.problem.length} characters left)</span>
          </label>
          <textarea id={`${idp}-problem`} className="case-form-textarea" rows={5} required aria-required="true" maxLength={PROBLEM_MAX} value={fields.problem} onChange={set("problem")} {...invalid("problem")} />

          <div id={`${idp}-error`} role="alert" aria-live="assertive" className="case-form-msg">{error}</div>

          <button type="submit" className="case-form-btn" disabled={sending} aria-busy={sending}>
            {sending ? "One moment…" : config ? "Update and choose a time" : "Choose a time"}
          </button>
        </form>
      </div>

      <div>
        <p className="sr-only" role="status" aria-live="polite">
          {config ? "The scheduler has opened below the form. Choose a time there." : ""}
        </p>
        <div className="av-cal" id={`${idp}-cal`}>
          <p className="av-cal-wait">The calendar opens here once you&rsquo;ve told us a little about the problem.</p>
        </div>
        {config && (
          <p className="av-note">
            Calendar not loading? <a className="link" href={directLink} target="_blank" rel="noopener noreferrer">Open the scheduler in a new tab</a>
          </p>
        )}
      </div>
    </div>
  );
}
