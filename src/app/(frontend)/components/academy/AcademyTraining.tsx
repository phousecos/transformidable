// @ts-nocheck
"use client";
import Link from "next/link";
import { useState } from "react";
import { FINDER_ROLES, FINDER_TIMES, betaPrice, formatPrice, programHref } from "../../academy/content";
import { AcademyInquiryForm } from "./AcademyInquiryForm";

const Arrow = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

function Chips({ legend, options, value, onChange }) {
  return (
    <fieldset className="ac-t-chips">
      <legend>{legend}</legend>
      <div>
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            className="ac-t-chip"
            aria-pressed={value === o.value}
            onClick={() => onChange(value === o.value ? "" : o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// "Find your program": two optional questions narrow the three programs.
// Every card stays visible; the ones that fit are marked, the rest step back.
export function ProgramFinder({ programs }) {
  const [role, setRole] = useState("");
  const [time, setTime] = useState("");
  const fits = (p) => (!role || p.fit.roles.includes(role)) && (!time || p.fit.time === time);
  const filtering = Boolean(role || time);
  const matches = programs.filter(fits).length;

  return (
    <>
      <div className="ac-t-finder">
        <Chips legend="I am a…" options={FINDER_ROLES} value={role} onChange={setRole} />
        <Chips legend="Time available" options={FINDER_TIMES} value={time} onChange={setTime} />
        <p className="ac-t-finder-status">
          {/* Only the result text is live, so the Clear button isn't read out with it. */}
          <span role="status" aria-live="polite">
            {filtering &&
              (matches
                ? `${matches} program${matches > 1 ? "s" : ""} ${matches > 1 ? "fit" : "fits"} your answers.`
                : "No exact match. Every program can be adapted, so tell us what you need.")}
          </span>
          {filtering && (
            <button type="button" className="ac-t-reset" onClick={() => { setRole(""); setTime(""); }}>
              Clear<span className="sr-only"> answers</span>
            </button>
          )}
        </p>
      </div>

      <div className="ac-t-cards">
        {programs.map((p) => {
          const fit = fits(p);
          return (
            <article className={`ac-t-card${filtering ? (fit ? " is-fit" : " is-dim") : ""}`} key={p.slug}>
              <div className="ac-t-card-top">
                <span className="ac-t-stage">{p.stage.name}</span>
                {p.beta ? <span className="ac-t-badge">Beta &middot; 50% off</span> : <span className="ac-t-badge ac-t-badge--soon">Coming next</span>}
              </div>
              {filtering && fit && <p className="ac-t-fit">Good fit</p>}
              {filtering && !fit && <p className="sr-only">Not a match for your answers</p>}
              <h3 className="ac-t-card-title"><Link href={programHref(p.slug)}>{p.title}</Link></h3>
              <p className="ac-t-card-sub">{p.stage.line}</p>
              <dl className="ac-t-meta">
                <div><dt>Format</dt><dd>{p.stage.format}</dd></div>
                <div><dt>Delivery</dt><dd>{p.facts.delivery}</dd></div>
                <div><dt>You leave with</dt><dd>{p.tools.join(", ")}</dd></div>
              </dl>
              <div className="ac-t-card-foot">
                {p.beta ? (
                  <p className="ac-t-price">
                    <s><span className="sr-only">Regular price </span>{formatPrice(p.beta.price)}</s>
                    <b>{formatPrice(betaPrice(p.beta.price))}</b>
                    <span>beta price</span>
                  </p>
                ) : (
                  <p className="ac-t-price ac-t-price--soon">Not part of the beta. Register interest for the first sessions.</p>
                )}
                <div className="ac-t-actions">
                  {p.beta ? (
                    <a className="btn ac-t-btn" href="#beta" onClick={() => window.dispatchEvent(new CustomEvent("ac-beta-program", { detail: p.program }))}>Join the beta<span className="sr-only">: {p.title}</span></a>
                  ) : (
                    <Link className="btn ac-t-btn ac-t-btn--ghost" href={`/academy/organizations?program=${p.program}#register`}>Register interest<span className="sr-only">: {p.title}</span></Link>
                  )}
                  <Link className="ac-t-more" href={programHref(p.slug)}>Course details<span className="sr-only">: {p.title}</span> <Arrow /></Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

// The beta application: organizations first, individuals welcome.
export function BetaApply({ source }) {
  const [type, setType] = useState<"organization" | "individual">("organization");
  return (
    <div className="ac-t-apply">
      <div className="ac-t-toggle" role="group" aria-label="Applying as">
        <button type="button" aria-pressed={type === "organization"} onClick={() => setType("organization")}>For my organization</button>
        <button type="button" aria-pressed={type === "individual"} onClick={() => setType("individual")}>Just me</button>
      </div>
      <AcademyInquiryForm key={type} beta type={type} source={source} />
    </div>
  );
}
