// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { useSpamTrap } from "../components/useSpamTrap";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { trap, spamFields } = useSpamTrap();
  const successRef = useRef<HTMLDivElement>(null);

  // The form (and the focused submit button) is replaced by the confirmation,
  // so move focus there rather than letting it fall back to <body>.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source: "website", ...spamFields() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Thank you for subscribing!");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <SiteNav />
      <main id="main-content" className="bg-parchment">
        <div className="mx-auto max-w-xl px-6 py-16 md:py-24">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-oxblood md:text-xs">
            Newsletter
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold italic text-obsidian md:text-4xl">
            Stay in the conversation.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-obsidian/70 md:text-lg">
            Subscribe to Transformidable for executive insight on technology strategy,
            project execution, and leadership, delivered to your inbox.
          </p>

          <div className="mt-4 h-[2px] w-16 bg-oxblood" aria-hidden="true" />

          {status === "success" ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="mt-10 rounded-sm border border-gold/40 bg-gold/5 px-6 py-8 text-center"
            >
              <p className="font-serif text-xl font-semibold text-obsidian">{message}</p>
              <p className="mt-2 text-sm text-obsidian/70">
                We&apos;ll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
              {trap}
              <div>
                <label htmlFor="name" className="block text-[10px] font-medium uppercase tracking-[0.2em] text-obsidian/70 md:text-xs">
                  Name <span className="normal-case tracking-normal text-obsidian/70">(optional)</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full border border-obsidian/50 bg-transparent px-4 py-3 text-sm text-obsidian placeholder:text-obsidian/70 focus:border-oxblood focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-oxblood"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-[10px] font-medium uppercase tracking-[0.2em] text-obsidian/70 md:text-xs">
                  Email <span className="text-oxblood" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "subscribe-error" : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full border border-obsidian/50 bg-transparent px-4 py-3 text-sm text-obsidian placeholder:text-obsidian/70 focus:border-oxblood focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-oxblood"
                />
              </div>

              {/* aria-live="assertive" so screen readers interrupt to announce
                  validation failures immediately after submit. */}
              <div id="subscribe-error" role="alert" aria-live="assertive" className="min-h-[1.25rem]">
                {status === "error" && (
                  <p className="text-sm font-medium text-oxblood">{message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                aria-busy={status === "loading"}
                className="w-full rounded-sm bg-obsidian px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-obsidian/90 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>

              <p className="text-[10px] text-obsidian/70 leading-relaxed">
                No spam. Unsubscribe anytime. We respect your inbox.
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
