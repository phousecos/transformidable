// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import { ResearchShell } from "../components/research/ResearchShell";
import { Sky } from "../components/research/Sky";
import { useSpamTrap } from "../components/useSpamTrap";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const { trap, spamFields } = useSpamTrap();
  const successRef = useRef<HTMLDivElement>(null);

  // The form is replaced by the confirmation; move focus there so keyboard
  // and screen reader users aren't left on a control that no longer exists.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, ...spamFields() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setFeedback(data.message || "Thanks for reaching out!");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
        setFeedback(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setFeedback("Something went wrong. Please try again.");
    }
  };

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="about" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Get in touch</p>
          <h1 className="idx-title">Contact us.</h1>
          <p className="idx-intro">
            Questions, tips, or feedback on our research — we read every message.
          </p>
        </div>
      </section>

      <article className="detail">
        <div className="detail-wrap" style={{ maxWidth: 560 }}>
          {status === "success" ? (
            <div className="case-form-success" role="status" aria-live="polite" ref={successRef} tabIndex={-1}>
              <p>{feedback}</p>
            </div>
          ) : (
            <form className="case-form" onSubmit={handleSubmit} noValidate>
              {trap}
              <label className="case-form-label" htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                type="text"
                required
                autoComplete="name"
                aria-required="true"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="case-form-input"
              />

              <label className="case-form-label" htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                type="email"
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "contact-error" : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="case-form-input"
              />

              <label className="case-form-label" htmlFor="contact-subject">Subject <span className="case-form-optional">(optional)</span></label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="case-form-input"
              />

              <label className="case-form-label" htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                required
                rows={6}
                aria-required="true"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "contact-error" : undefined}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message"
                className="case-form-textarea"
              />

              <div id="contact-error" role="alert" aria-live="assertive" className="case-form-msg">
                {status === "error" && feedback}
              </div>

              <button
                type="submit"
                className="case-form-btn case-form-submit"
                disabled={status === "loading"}
                aria-busy={status === "loading"}
              >
                {status === "loading" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </article>
    </ResearchShell>
  );
}
