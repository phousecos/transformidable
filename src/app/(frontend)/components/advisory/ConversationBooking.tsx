// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { CAL_LINK, CAL_ORIGIN } from "../site";
import { INBOUND_KEYS, captureInbound } from "./inbound";

// One booking form per page, so fixed ids are safe (the embed needs a
// plain CSS selector for its container).
const idp = "av";

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
  const notes = [`What's the governance problem?\n${fields.problem.trim()}`, details.join("\n")].filter(Boolean).join("\n\n");
  const config: Record<string, string> = { name: fields.name.trim(), notes };
  for (const k of INBOUND_KEYS) {
    if (!inbound[k]) continue;
    config[`metadata[${k}]`] = inbound[k];
    if (k.startsWith("utm_")) config[k] = inbound[k];
  }
  return config;
}

export function ConversationBooking() {
  const [fields, setFields] = useState({ name: "", organization: "", role: "", problem: "", area: "" });
  const [inbound, setInbound] = useState({});
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

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

  const onSubmit = (e) => {
    e.preventDefault();
    if (!fields.name.trim() || !fields.problem.trim()) {
      setError("Please add your name and a few words about the governance problem.");
      document.getElementById(fields.name.trim() ? `${idp}-problem` : `${idp}-name`)?.focus();
      return;
    }
    setError("");
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
          <div className="av-form-grid">
            <div>
              <label className="case-form-label" htmlFor={`${idp}-name`}>Name</label>
              <input id={`${idp}-name`} className="case-form-input" type="text" required aria-required="true" autoComplete="name" value={fields.name} onChange={set("name")} {...invalid("name")} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-org`}>Organization <span className="case-form-optional">(optional)</span></label>
              <input id={`${idp}-org`} className="case-form-input" type="text" autoComplete="organization" value={fields.organization} onChange={set("organization")} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-role`}>Role <span className="case-form-optional">(optional)</span></label>
              <input id={`${idp}-role`} className="case-form-input" type="text" autoComplete="organization-title" value={fields.role} onChange={set("role")} />
            </div>
            <div>
              <label className="case-form-label" htmlFor={`${idp}-area`}>Area <span className="case-form-optional">(optional)</span></label>
              <select id={`${idp}-area`} className="case-form-input" value={fields.area} onChange={set("area")}>
                <option value="">Choose one</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <label className="case-form-label" htmlFor={`${idp}-problem`}>What&rsquo;s the governance problem?</label>
          <textarea id={`${idp}-problem`} className="case-form-textarea" rows={5} required aria-required="true" maxLength={2000} value={fields.problem} onChange={set("problem")} {...invalid("problem")} />

          <div id={`${idp}-error`} role="alert" aria-live="assertive" className="case-form-msg">{error}</div>

          <button type="submit" className="case-form-btn">{config ? "Update and choose a time" : "Choose a time"}</button>
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
