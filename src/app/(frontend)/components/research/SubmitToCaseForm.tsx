// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import { useSpamTrap } from "../useSpamTrap";

export function SubmitToCaseForm({ caseSlug }: { caseSlug: string }) {
  const [type, setType] = useState<"document" | "feedback">("document");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const { trap, spamFields } = useSpamTrap();
  // The form is replaced on success; move focus to the confirmation so it is
  // announced and keyboard focus is not lost.
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);
  const docRadio = useRef<HTMLButtonElement>(null);
  const fbRadio = useRef<HTMLButtonElement>(null);
  // Radio group keyboard pattern: arrow keys move and select.
  const onRadioKey = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = type === "document" ? "feedback" : "document";
    setType(next);
    (next === "document" ? docRadio : fbRadio).current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const form = new FormData();
      form.set("type", type);
      form.set("caseSlug", caseSlug);
      form.set("message", message);
      if (name) form.set("submitterName", name);
      if (email) form.set("submitterEmail", email);
      if (type === "document" && sourceUrl) form.set("sourceUrl", sourceUrl);
      if (type === "document" && file) form.set("file", file);
      for (const [key, value] of Object.entries(spamFields())) form.set(key, String(value));

      const res = await fetch("/api/case-submit", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setFeedback(data.message || "Thanks — this has been sent for review.");
        setName(""); setEmail(""); setMessage(""); setSourceUrl(""); setFile(null);
      } else {
        setStatus("error");
        setFeedback(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setFeedback("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="case-form-success" role="status" aria-live="polite" tabIndex={-1} ref={successRef}>
        <p>{feedback}</p>
      </div>
    );
  }

  return (
    <form className="case-form" onSubmit={handleSubmit} noValidate>
      {trap}
      <div className="case-form-toggle" role="radiogroup" aria-label="Submission type" onKeyDown={onRadioKey}>
        <button
          type="button"
          role="radio"
          ref={docRadio}
          tabIndex={type === "document" ? 0 : -1}
          aria-checked={type === "document"}
          className={`case-form-toggle-btn${type === "document" ? " is-active" : ""}`}
          onClick={() => setType("document")}
        >
          Document
        </button>
        <button
          type="button"
          role="radio"
          ref={fbRadio}
          tabIndex={type === "feedback" ? 0 : -1}
          aria-checked={type === "feedback"}
          className={`case-form-toggle-btn${type === "feedback" ? " is-active" : ""}`}
          onClick={() => setType("feedback")}
        >
          Feedback
        </button>
      </div>

      <label className="case-form-label" htmlFor="submit-message">
        {type === "document" ? "What is this document?" : "Your feedback"}
      </label>
      <textarea
        id="submit-message"
        required
        aria-required="true"
        aria-invalid={status === "error" ? true : undefined}
        aria-describedby={status === "error" ? "submit-error" : undefined}
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={type === "document" ? "Briefly describe the document and its source." : "What did we get wrong, or miss?"}
        className="case-form-textarea"
      />

      {type === "document" && (
        <>
          <label className="case-form-label" htmlFor="submit-url">Link to document <span className="case-form-optional">(or attach a file below)</span></label>
          <input
            id="submit-url"
            type="url"
            inputMode="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
            className="case-form-input"
          />

          <label className="case-form-label" htmlFor="submit-file">Attach a file <span className="case-form-optional">(PDF or image, 15MB max)</span></label>
          <input
            id="submit-file"
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="case-form-file"
          />
        </>
      )}

      <label className="case-form-label" htmlFor="submit-name">Name <span className="case-form-optional">(optional)</span></label>
      <input
        id="submit-name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="case-form-input"
      />

      <label className="case-form-label" htmlFor="submit-email">Email <span className="case-form-optional">(optional — for follow-up)</span></label>
      <input
        id="submit-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="case-form-input"
      />

      <div id="submit-error" role="alert" className="case-form-msg">
        {status === "error" && feedback}
      </div>

      <button type="submit" className="case-form-btn case-form-submit" disabled={status === "loading"} aria-busy={status === "loading"}>
        {status === "loading" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
