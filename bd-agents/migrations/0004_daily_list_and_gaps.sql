-- bd-agents 0004: what the daily LinkedIn list needs from KADE, and the research-needed list.
ALTER TABLE people ADD COLUMN kade_summary TEXT;   -- why the organization scored hot (KADE screening summary)
ALTER TABLE people ADD COLUMN role_category TEXT;  -- KADE role family (top_technology, finance, board, ...)

-- Hot organizations with no leadership contact in KADE. Research happens in KADE; this
-- records who asked for it. 'resolved' = KADE now has people there (or it is no longer hot).
CREATE TABLE research_gaps (
  kade_account_id TEXT PRIMARY KEY,
  organization    TEXT NOT NULL,
  entity_type     TEXT,
  state_province  TEXT,
  kade_tier       TEXT,
  kade_heat       REAL,
  kade_summary    TEXT,
  pursued         INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','dismissed','resolved')),
  decided_by      TEXT,
  decided_at      TEXT,
  first_seen_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_gaps_status_heat ON research_gaps(status, kade_heat);
