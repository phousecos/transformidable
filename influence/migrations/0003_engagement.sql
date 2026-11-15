-- Influence stage 3, engagement (KADE docs/influence-engagement.md, November 14, 2026). The engagement log itself is
-- Signals' contact history; Influence keeps its content ideas and the rhythm of the daily list.

-- Content intelligence: topics and governance questions, podcast topics and podcast guests.
CREATE TABLE ideas (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL DEFAULT 'topic' CHECK (kind IN ('topic', 'podcast_topic', 'podcast_guest')),
  title            TEXT NOT NULL,
  question         TEXT,                   -- the governance question it raises
  person_id        TEXT,                   -- the network person it came from, or the guest (a Signals person)
  source_url       TEXT,                   -- the discussion or piece it came from
  function         TEXT CHECK (function IS NULL OR function IN ('Research', 'The Governance Files', 'Transformidable Thinking', 'Academy', 'Advisory')),
  format           TEXT,                   -- post, article, episode, briefing, course module...
  research_needed  TEXT,
  priority         INTEGER NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  status           TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'ready', 'used', 'dropped')),
  used_in          TEXT,                   -- the post (review_queue id) that used it
  origin           TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'comment', 'suggested')),
  notes            TEXT,
  created_by       TEXT,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ideas_status ON ideas(status, kind, priority);

-- The weekly rhythm from the owner's plan, people per day, the weekly targets and the four comment approaches.
INSERT INTO settings (key, value_json) VALUES ('rhythm', json('{
  "perDay": 5,
  "days": {
    "1": {"label": "What Tier 1 is discussing", "tiers": [1]},
    "2": {"label": "AI governance and board governance voices", "communities": ["ai_governance", "board_governance"]},
    "3": {"label": "CIO, ERP and transformation voices", "communities": ["cio", "erp_transformation", "leadership"]},
    "4": {"label": "Continuing conversations, then Tier 2", "continuing": true, "tiers": [2]},
    "5": {"label": "Outcomes, and ideas to capture", "outcomes": true}
  },
  "targets": {"commentsMin": 8, "commentsMax": 12, "people": 5, "continued": 2, "ideasMin": 1, "ideasMax": 2},
  "approaches": [
    {"key": "research_extension", "label": "Research extension", "hint": "Connect the discussion to evidence: a study, a pattern seen across many organizations, a known failure mechanism."},
    {"key": "governance_lens", "label": "Governance lens", "hint": "Add the accountability or oversight dimension: who decides, who answers for it, what the board should ask."},
    {"key": "constructive_challenge", "label": "Constructive challenge", "hint": "Offer a distinction or a competing reading, respectfully, that sharpens the argument."},
    {"key": "executive_translation", "label": "Executive translation", "hint": "Say what the issue means for leaders and boards in practical terms."}
  ]
}'));
