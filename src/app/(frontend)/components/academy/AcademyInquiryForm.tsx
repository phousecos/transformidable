// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import { useSpamTrap } from "../useSpamTrap";
import {
  ACADEMY_DELIVERY,
  ACADEMY_PARTICIPANTS,
  ACADEMY_PROGRAM_CHOICES,
  ACADEMY_SECTORS,
  ACADEMY_TIMEFRAMES,
} from "../../../../lib/academyOptions.ts";

const EMPTY = {
  name: "",
  email: "",
  jobTitle: "",
  organization: "",
  phone: "",
  sector: "",
  program: "",
  participants: "",
  delivery: "",
  timeframe: "",
  message: "",
};

const PROGRAM_VALUES = ACADEMY_PROGRAM_CHOICES.map((o) => o.value);

// The beta covers the first two classes only; "more than one program" reads as both.
const BETA_PROGRAM_CHOICES = [
  ...ACADEMY_PROGRAM_CHOICES.filter((o) => o.value === "course-1" || o.value === "course-2"),
  { label: "Both beta classes", value: "foundation-certificate" },
  { label: "Not sure yet", value: "not-sure" },
];

function Select({ id, label, value, onChange, options, optional = true }) {
  return (
    <>
      <label className="case-form-label" htmlFor={id}>
        {label} {optional && <span className="case-form-optional">(optional)</span>}
      </label>
      <select id={id} className="case-form-input ac-select" value={value} onChange={onChange} required={!optional} aria-required={!optional || undefined}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </>
  );
}

// One form per audience: organizations asking about a private cohort, and
// individuals joining the interest list. Organizational buyers need sizing and
// timing questions that would only get in an individual's way. A course page
// links here with ?program=<value> so the program it came from is preselected;
// a program page that carries the form itself passes `program` instead.
// With `beta`, the same form is the beta application.
export function AcademyInquiryForm({
  source,
  type,
  program: defaultProgram = "",
  heading,
  beta = false,
}: {
  source: string;
  type: "organization" | "individual";
  program?: string;
  heading?: string;
  beta?: boolean;
}) {
  const initial = { ...EMPTY, program: defaultProgram };
  const [fields, setFields] = useState(initial);
  const { trap, spamFields } = useSpamTrap();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const successRef = useRef(null);
  const headingRef = useRef(null);
  const wasSuccess = useRef(false);

  // The form and its confirmation replace each other; move focus with them so
  // keyboard and screen reader users aren't left on a control that is gone.
  useEffect(() => {
    if (status === "success") {
      wasSuccess.current = true;
      successRef.current?.focus();
    } else if (status === "idle" && wasSuccess.current) {
      wasSuccess.current = false;
      headingRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    const program = new URLSearchParams(window.location.search).get("program");
    if (program && PROGRAM_VALUES.includes(program)) setFields((f) => ({ ...f, program }));
  }, []);

  // A beta card's "Join the beta" button names its class on the way down.
  useEffect(() => {
    if (!beta) return;
    const pick = (e) => setFields((f) => ({ ...f, program: e.detail }));
    window.addEventListener("ac-beta-program", pick);
    return () => window.removeEventListener("ac-beta-program", pick);
  }, [beta]);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const isOrg = type === "organization";
  const idp = `ac-${type}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setFeedback("");
    try {
      const res = await fetch("/api/academy-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, type, source, beta, ...spamFields() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setFeedback(data.message || "Thank you. We will be in touch.");
        setFields(initial);
      } else {
        setStatus("error");
        setFeedback(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setFeedback("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="ac-form-card">
        <div className="case-form-success" role="status" aria-live="polite" ref={successRef} tabIndex={-1}>
          <p>{feedback}</p>
        </div>
        <button type="button" className="link" onClick={() => setStatus("idle")}>{beta ? "Submit another application" : "Submit another inquiry"}</button>
      </div>
    );
  }

  return (
    <div className="ac-form-card">
      <h3 className="ac-form-h" ref={headingRef} tabIndex={-1}>{heading || (beta ? "Apply for the beta" : isOrg ? "Request a private session" : "Join the interest list")}</h3>
      <p className="ac-form-sub">
        {beta
          ? isOrg
            ? "Tell us about your team and which class you would like to take. We will confirm fit and scheduling with you."
            : "Tell us about yourself and which class you would like to take. We will be in touch about joining a session."
          : isOrg
            ? "Tell us about your group and we will arrange a conversation about scope, format, and timing."
            : "We will let you know when an open program is scheduled."}
      </p>

      <form className="case-form" onSubmit={handleSubmit} noValidate>
        {trap}

        {isOrg && (
          <>
            <label className="case-form-label" htmlFor={`${idp}-org`}>Organization name</label>
            <input id={`${idp}-org`} className="case-form-input" type="text" required aria-required="true" autoComplete="organization" value={fields.organization} onChange={set("organization")} />
          </>
        )}

        <div className="ac-form-grid">
          <div>
            <label className="case-form-label" htmlFor={`${idp}-name`}>{isOrg ? "Contact name" : "Name"}</label>
            <input id={`${idp}-name`} className="case-form-input" type="text" required aria-required="true" autoComplete="name" value={fields.name} onChange={set("name")} />
          </div>
          <div>
            <label className="case-form-label" htmlFor={`${idp}-title`}>Title or role <span className="case-form-optional">(optional)</span></label>
            <input id={`${idp}-title`} className="case-form-input" type="text" autoComplete="organization-title" value={fields.jobTitle} onChange={set("jobTitle")} />
          </div>
          <div>
            <label className="case-form-label" htmlFor={`${idp}-email`}>{isOrg ? "Work email" : "Email"}</label>
            <input id={`${idp}-email`} className="case-form-input" type="email" required aria-required="true" autoComplete="email" value={fields.email} onChange={set("email")} />
          </div>
          {isOrg ? (
            <div>
              <label className="case-form-label" htmlFor={`${idp}-phone`}>Phone <span className="case-form-optional">(optional)</span></label>
              <input id={`${idp}-phone`} className="case-form-input" type="tel" autoComplete="tel" value={fields.phone} onChange={set("phone")} />
            </div>
          ) : (
            <div>
              <label className="case-form-label" htmlFor={`${idp}-org`}>Organization <span className="case-form-optional">(optional)</span></label>
              <input id={`${idp}-org`} className="case-form-input" type="text" autoComplete="organization" value={fields.organization} onChange={set("organization")} />
            </div>
          )}
          <div>
            <Select id={`${idp}-sector`} label="Sector" value={fields.sector} onChange={set("sector")} options={ACADEMY_SECTORS} />
          </div>
          <div>
            <Select id={`${idp}-program`} label={beta ? "Beta class" : "Program interest"} value={fields.program} onChange={set("program")} options={beta ? BETA_PROGRAM_CHOICES : ACADEMY_PROGRAM_CHOICES} />
          </div>
          {isOrg && (
            <>
              <div>
                <Select id={`${idp}-participants`} label="Expected participants" value={fields.participants} onChange={set("participants")} options={ACADEMY_PARTICIPANTS} />
              </div>
              <div>
                <Select id={`${idp}-timeframe`} label="Preferred timing" value={fields.timeframe} onChange={set("timeframe")} options={ACADEMY_TIMEFRAMES} />
              </div>
            </>
          )}
          <div>
            <Select id={`${idp}-delivery`} label="Preferred delivery" value={fields.delivery} onChange={set("delivery")} options={ACADEMY_DELIVERY} />
          </div>
        </div>

        <label className="case-form-label" htmlFor={`${idp}-message`}>
          {isOrg ? "What would you like the program to address?" : "Anything you would like us to know?"} <span className="case-form-optional">(optional)</span>
        </label>
        <textarea id={`${idp}-message`} className="case-form-textarea" rows={4} value={fields.message} onChange={set("message")} />

        <div id={`${idp}-error`} role="alert" aria-live="assertive" className="case-form-msg">
          {status === "error" && feedback}
        </div>

        <button type="submit" className="case-form-btn ac-submit" disabled={status === "loading"} aria-busy={status === "loading"}>
          {status === "loading" ? "Sending…" : beta ? "Apply for the beta" : isOrg ? "Request a discussion" : "Register interest"}
        </button>
        <p className="ac-form-note">
          {beta
            ? "Applying carries no commitment. Your place, schedule, and price are confirmed with you first."
            : isOrg ? "An inquiry carries no commitment." : "Joining the interest list is not enrollment and carries no financial commitment."}
        </p>
      </form>
    </div>
  );
}
