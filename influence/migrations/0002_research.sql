-- Influence stage 2, discovery and research (KADE docs/influence-research.md, November 14, 2026).
-- Signals finds and checks the work; Influence screens and scores it against the plan and keeps its evaluation here.

ALTER TABLE network ADD COLUMN why TEXT;                 -- discovery's reason for suggesting them
ALTER TABLE network ADD COLUMN screening_json TEXT CHECK (screening_json IS NULL OR json_valid(screening_json));  -- {"publishes": true, ...}; null entries unknown
ALTER TABLE network ADD COLUMN qualified INTEGER;        -- candidates: meets 3 of 7 conditions and scores 50 or more
ALTER TABLE network ADD COLUMN research_key TEXT;        -- the research the last scoring read, so a change rescores
ALTER TABLE network ADD COLUMN scored_at TEXT;
CREATE INDEX idx_network_status ON network(status, qualified);

-- The research settings: weekly discovery, footprint cadence by tier, the screening conditions, and what to look for.
INSERT INTO settings (key, value_json) VALUES ('research', json('{
  "discoveryWeekly": 5,
  "footprintDays": {"1": 7, "2": 14, "3": 30, "reassess": 30},
  "focus": "A governance advisor and researcher: governance of enterprise technology decisions (ERP and core systems, IT controls, AI governance, M&A technology integration) for boards and executives (CFO, COO, CIO), in mid-market companies, higher education, credit unions and the public sector. She runs a podcast and publishes on accountable leadership.",
  "subjects": {
    "ai_governance": "AI governance, responsible AI, AI risk management, AI policy and regulation for organizations",
    "cio": "CIO and technology executive leadership, IT strategy, technology operating models",
    "erp_transformation": "ERP implementations and failures, digital transformation, enterprise systems programs",
    "board_governance": "Corporate and board governance, board oversight of technology and risk, directors",
    "leadership": "Organizational transformation, change leadership, executive decision-making and accountability",
    "risk_audit": "Technology risk, IT audit, internal controls, SOX and IT general controls, assurance",
    "sector": "Executive voices in banking, credit unions, higher education, healthcare and the public sector on technology and governance"
  },
  "screening": [
    {"key": "publishes", "label": "Publishes on her subjects"},
    {"key": "audience", "label": "Has a relevant audience"},
    {"key": "original", "label": "Posts original content consistently"},
    {"key": "discussion", "label": "Draws substantive discussion"},
    {"key": "expertise", "label": "Has credible expertise"},
    {"key": "collaboration", "label": "Has collaboration potential"},
    {"key": "distinctive", "label": "Offers a distinctive perspective"}
  ],
  "qualifyConditions": 3,
  "qualifyScore": 50
}'));
INSERT INTO settings (key, value_json) VALUES ('research_state', json('{"discoveriesSince": "1970-01-01T00:00:00Z"}'));
