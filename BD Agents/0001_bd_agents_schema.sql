-- bd-agents: shared store for the BD Agent Team (Transformidable account)
-- Migration 0001 — people, review_queue, recommendations, actions, touches, results

CREATE TABLE people (
  id                TEXT PRIMARY KEY,
  kade_contact_id   TEXT UNIQUE,
  kade_account_id   TEXT,
  apollo_id         TEXT,
  full_name         TEXT NOT NULL,
  title             TEXT,
  organization      TEXT,
  segment           TEXT NOT NULL CHECK (segment IN ('cohort_target','warm','influencer','official')),
  track             TEXT,
  linkedin_url      TEXT,
  email             TEXT,
  connection_status TEXT NOT NULL DEFAULT 'none' CHECK (connection_status IN ('none','pending','connected','withdrawn')),
  invited_at        TEXT,
  connected_at      TEXT,
  do_not_contact    INTEGER NOT NULL DEFAULT 0,
  synced_at         TEXT,
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_people_segment_track ON people(segment, track);
CREATE INDEX idx_people_kade_account ON people(kade_account_id);

CREATE TABLE recommendations (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL CHECK (kind IN ('webinar','episode','short_video','briefing','academy_session','campaign','other')),
  title            TEXT NOT NULL,
  rationale        TEXT NOT NULL,
  evidence_json    TEXT,
  expected_impact  TEXT,
  time_cost_hours  REAL,
  needs_jerri      INTEGER NOT NULL DEFAULT 1,
  priority         INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','declined','done','expired')),
  decided_by       TEXT,
  decided_at       TEXT,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_recs_status_priority ON recommendations(status, priority);

CREATE TABLE review_queue (
  id                 TEXT PRIMARY KEY,
  system             TEXT NOT NULL CHECK (system IN ('advisory','academy','media','strategist','conversation')),
  item_type          TEXT NOT NULL CHECK (item_type IN ('connection_note','dm','comment','reshare','email','post_page','post_profile','webinar','episode','short_video','newsletter','invite','proposal','meeting_brief','follow_up','other')),
  channel            TEXT CHECK (channel IN ('linkedin','email','page','profile','event','podcast','internal')),
  person_id          TEXT REFERENCES people(id),
  recommendation_id  TEXT REFERENCES recommendations(id),
  track              TEXT,
  playbook_step      INTEGER,
  title              TEXT,
  draft              TEXT NOT NULL,
  final_text         TEXT,
  context_json       TEXT,
  reviewer_checks_json TEXT,
  needs_jerri        INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','edited','rejected','sent','expired')),
  created_by_agent   TEXT NOT NULL,
  approved_by        TEXT,
  approved_at        TEXT,
  sent_at            TEXT,
  due_date           TEXT,
  created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_queue_status ON review_queue(status, system);
CREATE INDEX idx_queue_person ON review_queue(person_id);

CREATE TABLE actions (
  id           TEXT PRIMARY KEY,
  action_date  TEXT NOT NULL,
  rank         INTEGER NOT NULL,
  action_type  TEXT NOT NULL CHECK (action_type IN ('follow_up','comment','connect','reshare','withdraw_invite')),
  person_id    TEXT REFERENCES people(id),
  queue_id     TEXT REFERENCES review_queue(id),
  reason       TEXT NOT NULL,
  target_url   TEXT,
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','done','skipped')),
  done_at      TEXT,
  outcome      TEXT,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_actions_date ON actions(action_date, rank);

CREATE TABLE touches (
  id           TEXT PRIMARY KEY,
  person_id    TEXT NOT NULL REFERENCES people(id),
  channel      TEXT NOT NULL CHECK (channel IN ('linkedin','email','event','phone','meeting','other')),
  touch_type   TEXT NOT NULL,
  queue_id     TEXT REFERENCES review_queue(id),
  occurred_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  by_user      TEXT
);
CREATE INDEX idx_touches_person_time ON touches(person_id, occurred_at);

CREATE TABLE results (
  id           TEXT PRIMARY KEY,
  metric_date  TEXT NOT NULL,
  system       TEXT NOT NULL CHECK (system IN ('advisory','academy','media','strategist','conversation')),
  track        TEXT,
  source       TEXT NOT NULL CHECK (source IN ('linkedin','instantly','apollo','webinar','podcast','youtube','newsletter','academy','calendar','manual')),
  metric       TEXT NOT NULL,
  value        REAL NOT NULL,
  person_id    TEXT REFERENCES people(id),
  ref_id       TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_results_lookup ON results(system, track, metric, metric_date);
