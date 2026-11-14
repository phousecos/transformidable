-- Influence (KADE docs/influence.md, November 14, 2026). People are Signals records; this database keeps only
-- Influence's own view of them, its settings and the posts.

-- The plan's communities, types, scoring criteria and tiers, as this tenant's settings.
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value_json  TEXT NOT NULL CHECK (json_valid(value_json)),
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO settings (key, value_json) VALUES ('network', json('{
  "communities": [
    {"key": "ai_governance", "label": "AI governance and responsible AI", "target": 10, "serves": ["Research", "Advisory", "Academy"]},
    {"key": "cio", "label": "CIOs and technology executives", "target": 10, "serves": ["Advisory", "Media"]},
    {"key": "erp_transformation", "label": "ERP and digital transformation", "target": 10, "serves": ["Research", "Advisory", "Media"]},
    {"key": "board_governance", "label": "Corporate and board governance", "target": 8, "serves": ["Advisory", "Academy"]},
    {"key": "leadership", "label": "Organizational transformation and leadership", "target": 7, "serves": ["Research", "Media", "Academy"]},
    {"key": "risk_audit", "label": "Technology risk, audit and assurance", "target": 7, "serves": ["Research", "Advisory"]},
    {"key": "sector", "label": "Sector-specific executive voices", "target": 8, "serves": ["Advisory", "Academy"]}
  ],
  "types": [
    {"key": "peer", "label": "Intellectual peer"}, {"key": "gatekeeper", "label": "Audience gatekeeper"},
    {"key": "expert", "label": "Complementary expert"}, {"key": "practitioner", "label": "Market practitioner"},
    {"key": "competitor", "label": "Competitive voice"}
  ],
  "criteria": [
    {"key": "alignment", "label": "Alignment with your expertise", "weight": 25},
    {"key": "audience", "label": "Audience relevance", "weight": 25},
    {"key": "content", "label": "Content quality", "weight": 15},
    {"key": "engagement", "label": "Opportunity for meaningful engagement", "weight": 15},
    {"key": "consistency", "label": "Posting consistency", "weight": 10},
    {"key": "collaboration", "label": "Collaboration potential", "weight": 10}
  ],
  "tiers": [
    {"tier": 1, "label": "Core relationships", "min": 80, "target": 10},
    {"tier": 2, "label": "Strategic visibility", "min": 65, "target": 20},
    {"tier": 3, "label": "Learning and intelligence", "min": 50, "target": 30}
  ]
}'));

-- A person in the influence network. person_id is the Signals person; everything else is Influence's own view.
CREATE TABLE network (
  person_id        TEXT PRIMARY KEY,
  full_name        TEXT NOT NULL,          -- as last read from Signals, for sorting and search
  linkedin_url     TEXT,
  affiliation      TEXT,                   -- role and organization as observed (many have no Signals role)
  community        TEXT,                   -- primary community key
  communities_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(communities_json)),
  type             TEXT CHECK (type IN ('peer', 'gatekeeper', 'expert', 'practitioner', 'competitor')),
  -- Scores 1 to 5 by criterion, null when unknown, each with its evidence: {"alignment": {"score": 4, "evidence": "..."}}.
  scores_json      TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(scores_json)),
  score            REAL,                   -- weighted, out of 100, over the criteria scored
  tier             INTEGER CHECK (tier IN (1, 2, 3)),
  tier_set_by      TEXT,                   -- null when the tier follows the score; the owner's email when she set it
  stage_override   TEXT CHECK (stage_override IN ('dialogue', 'collaboration', 'active')),
  plan_json        TEXT CHECK (plan_json IS NULL OR json_valid(plan_json)),   -- Tier 1 relationship plan
  next_action      TEXT,
  notes            TEXT,
  source           TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'network_list', 'research')),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('candidate', 'active', 'removed')),
  added_by         TEXT,
  added_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_network_tier ON network(status, tier, score);

-- Posts (moved from Network): page and profile posts and the weekly short video.
CREATE TABLE review_queue (
  id                 TEXT PRIMARY KEY,
  system             TEXT NOT NULL DEFAULT 'media' CHECK (system IN ('media')),
  item_type          TEXT NOT NULL CHECK (item_type IN ('post_page', 'post_profile', 'short_video')),
  channel            TEXT CHECK (channel IN ('linkedin', 'page', 'profile')),
  title              TEXT,
  draft              TEXT NOT NULL,
  final_text         TEXT,
  context_json       TEXT,
  status             TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'edited', 'rejected', 'sent', 'expired')),
  created_by_agent   TEXT NOT NULL,
  approved_by        TEXT,
  approved_at        TEXT,
  sent_at            TEXT,
  due_date           TEXT,
  created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_posts_due ON review_queue(due_date, status);
