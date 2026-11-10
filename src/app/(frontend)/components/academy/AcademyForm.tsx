// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import { useSpamTrap } from "../useSpamTrap";

// The Academy's two forms, saved to Academy Inquiries by /api/academy-inquiry:
//   dedicated  "Plan a session for your board": a dedicated session for a
//              whole governing body.
//   interest   the waitlist for new dates, the interest list for a course
//              that's coming, or "tell us what you're being asked to approve".
// Registration and payment for open sessions happen on the class platform.

const REASONS = {
  waitlist: "Tell me when new dates open",
  interest: "Tell me when this course is scheduled",
  topic: "Our body is being asked to approve something you don’t cover yet",
};

function Field({ id, label, optional = false, children, hint = null }) {
  return (
    <div className="aa-field">
      <label htmlFor={id}>
        {label} {optional && <span className="aa-optional">(optional)</span>}
      </label>
      {hint && <p className="aa-hint" id={`${id}-hint`}>{hint}</p>}
      {children}
    </div>
  );
}

export function AcademyForm({ kind, courses, course = "", reason = "" }) {
  const dedicated = kind === "dedicated";
  const initial = {
    name: "", email: "", jobTitle: "", organization: "", governingBody: "",
    members: "", staff: "", preferredMonths: "", publicNotice: "",
    course, reason: reason in REASONS ? reason : course ? "interest" : "waitlist", message: "",
  };
  const [f, setF] = useState(initial);
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const { trap, spamFields } = useSpamTrap();
  const doneRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const id = (k) => `aa-${kind}-${k}`;

  useEffect(() => {
    if (status === "success") doneRef.current?.focus();
  }, [status]);

  const submit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setFeedback("");
    try {
      const res = await fetch("/api/academy-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, type: kind, source: window.location.pathname + window.location.search, ...spamFields() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setFeedback(data.message || "Thank you. We’ll be in touch.");
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
      <div className="aa-form aa-form--done" role="status" aria-live="polite" ref={doneRef} tabIndex={-1}>
        <p>{feedback}</p>
        <a className="aa-inline" href="/academy">Back to the Academy</a>
      </div>
    );
  }

  return (
    <form className="aa-form" onSubmit={submit} noValidate aria-describedby={id("error")}>
      {trap}
      {dedicated && (
        <div className="aa-form-grid">
          <Field id={id("org")} label="Organization">
            <input id={id("org")} type="text" required aria-required="true" autoComplete="organization" value={f.organization} onChange={set("organization")} />
          </Field>
          <Field id={id("body")} label="Body">
            <input id={id("body")} type="text" required aria-required="true" placeholder="e.g., Board of Commissioners" value={f.governingBody} onChange={set("governingBody")} />
          </Field>
        </div>
      )}
      <div className="aa-form-grid">
        <Field id={id("name")} label={dedicated ? "Contact name" : "Full name"}>
          <input id={id("name")} type="text" required aria-required="true" autoComplete="name" value={f.name} onChange={set("name")} />
        </Field>
        <Field id={id("title")} label="Title" optional={!dedicated}>
          <input id={id("title")} type="text" required={dedicated} aria-required={dedicated || undefined} autoComplete="organization-title" placeholder="e.g., Clerk to the Board" value={f.jobTitle} onChange={set("jobTitle")} />
        </Field>
        <Field id={id("email")} label="Work email">
          <input id={id("email")} type="email" required aria-required="true" autoComplete="email" value={f.email} onChange={set("email")} />
        </Field>
        {!dedicated && (
          <Field id={id("body")} label="Which body do you serve on?" optional>
            <input id={id("body")} type="text" placeholder="e.g., Riverbend County Board of Commissioners" value={f.governingBody} onChange={set("governingBody")} />
          </Field>
        )}
        {dedicated && (
          <Field id={id("course")} label="Course" optional>
            <select id={id("course")} value={f.course} onChange={set("course")}>
              <option value="">Not sure yet</option>
              {courses.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </Field>
        )}
      </div>

      {dedicated ? (
        <>
          <div className="aa-form-grid aa-form-grid--3">
            <Field id={id("members")} label="Members of the body">
              <input id={id("members")} type="number" inputMode="numeric" min="1" max="500" required aria-required="true" value={f.members} onChange={set("members")} />
            </Field>
            <Field id={id("staff")} label="Staff who might join" optional>
              <input id={id("staff")} type="number" inputMode="numeric" min="0" max="500" value={f.staff} onChange={set("staff")} />
            </Field>
            <Field id={id("months")} label="Preferred months" optional>
              <input id={id("months")} type="text" placeholder="e.g., February or March" value={f.preferredMonths} onChange={set("preferredMonths")} />
            </Field>
          </div>
          <Field id={id("notice")} label="Who handles public notice for your body?" hint="If a quorum attends, the session may need notice under open meetings law. We’ll work with that person.">
            <input id={id("notice")} type="text" required aria-required="true" aria-describedby={id("notice-hint")} placeholder="e.g., the clerk, or our county attorney" value={f.publicNotice} onChange={set("publicNotice")} />
          </Field>
        </>
      ) : (
        <fieldset className="aa-fieldset">
          <legend>What would you like?</legend>
          {Object.entries(REASONS).map(([value, label]) => (
            <label key={value} className="aa-radio">
              <input type="radio" name={id("reason")} value={value} checked={f.reason === value} onChange={set("reason")} /> {label}
            </label>
          ))}
          {f.reason !== "topic" && (
            <Field id={id("course")} label="Course" optional>
              <select id={id("course")} value={f.course} onChange={set("course")}>
                <option value="">Any course</option>
                {courses.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </Field>
          )}
        </fieldset>
      )}

      <Field id={id("message")} label={dedicated ? "Anything we should know?" : f.reason === "topic" ? "What is your body being asked to approve?" : "What AI question is on your body’s agenda, or likely to be soon?"} optional={!(f.reason === "topic" && !dedicated)}>
        <textarea id={id("message")} rows={4} required={f.reason === "topic" && !dedicated} value={f.message} onChange={set("message")} />
      </Field>

      <div id={id("error")} role="alert" aria-live="assertive" className="aa-form-error">
        {status === "error" && feedback}
      </div>
      <button type="submit" className="aa-btn aa-btn--wine" disabled={status === "loading"} aria-busy={status === "loading"}>
        {status === "loading" ? "Sending…" : dedicated ? "Plan a session" : "Send"}
      </button>
      <p className="aa-form-note">{dedicated ? "No commitment. We’ll propose dates and confirm the details with you first." : "This isn’t a registration and carries no commitment."}</p>
    </form>
  );
}
