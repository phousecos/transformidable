"use client";
import { useRef, useState } from "react";
import { DOMAINS } from "../../../../lib/governanceDomains";

export function MechanismExplorer() {
  const [active, setActive] = useState(DOMAINS[0].code);
  const domain = DOMAINS.find((d) => d.code === active) || DOMAINS[0];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA tabs: arrow keys move between tabs (and select), Home/End jump.
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = DOMAINS.length;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(DOMAINS[next].code);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <div className="mech-grid" role="tablist" aria-label="Governance domains">
        {DOMAINS.map((d, i) => (
          <button
            key={d.code}
            ref={(el) => { tabs.current[i] = el; }}
            id={`mech-tab-${d.code}`}
            type="button"
            role="tab"
            aria-selected={d.code === active}
            aria-controls="mech-panel"
            tabIndex={d.code === active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`mech-tile${d.code === active ? " is-active" : ""}`}
            onClick={() => setActive(d.code)}
          >
            <span className="mt-code">{d.code}</span>
            <span className="mt-name">{d.name}</span>
          </button>
        ))}
      </div>

      <div className="mech-panel" id="mech-panel" role="tabpanel" aria-labelledby={`mech-tab-${domain.code}`} tabIndex={0}>
        <p className="case-h" style={{ marginBottom: 6 }}>{domain.code}</p>
        <h3 className="mp-h">{domain.name}</h3>
        <p className="mp-q">{domain.question}</p>
        <div className="prose" style={{ marginTop: 20 }}>
          <p>{domain.definition}</p>
          <p><strong>Includes:</strong> {domain.includes}</p>
          {domain.note && <p><em>{domain.note}</em></p>}
        </div>
      </div>
    </div>
  );
}
