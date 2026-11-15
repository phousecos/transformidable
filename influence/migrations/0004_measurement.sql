-- Influence stage 4, measurement (KADE docs/influence-measurement.md, November 14, 2026). LinkedIn's own numbers,
-- uploaded weekly from its analytics export; the tier log for the monthly review; the review's notes.

CREATE TABLE li_uploads (
  id             TEXT PRIMARY KEY,
  account        TEXT NOT NULL DEFAULT 'profile' CHECK (account IN ('profile', 'page')),
  file_name      TEXT,
  period_start   TEXT NOT NULL,
  period_end     TEXT NOT NULL,
  impressions    INTEGER,
  members_reached INTEGER,
  profile_views  INTEGER,                 -- typed in from her dashboard: the export does not hold it
  search_appearances INTEGER,             -- likewise
  summary_json   TEXT CHECK (summary_json IS NULL OR json_valid(summary_json)),
  uploaded_by    TEXT,
  uploaded_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_li_uploads_end ON li_uploads(account, period_end);

-- By day: a later upload covering the same day replaces it.
CREATE TABLE li_daily (
  account        TEXT NOT NULL DEFAULT 'profile',
  day            TEXT NOT NULL,
  impressions    INTEGER,
  engagements    INTEGER,
  new_followers  INTEGER,
  PRIMARY KEY (account, day)
);

CREATE TABLE li_followers (
  account   TEXT NOT NULL DEFAULT 'profile',
  day       TEXT NOT NULL,
  total     INTEGER NOT NULL,
  PRIMARY KEY (account, day)
);

-- Top posts: each post's latest numbers, matched to the Posts tab where the publish date lines up.
CREATE TABLE li_posts (
  url            TEXT PRIMARY KEY,
  account        TEXT NOT NULL DEFAULT 'profile',
  published_date TEXT,
  impressions    INTEGER,
  engagements    INTEGER,
  post_id        TEXT,                    -- review_queue id
  seen_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- The latest audience snapshot only. Private to the Review tab: it names employers.
CREATE TABLE li_demographics (
  account   TEXT NOT NULL DEFAULT 'profile',
  category  TEXT NOT NULL,
  value     TEXT NOT NULL,
  pct       REAL,                         -- null when LinkedIn says "< 1%"
  as_of     TEXT NOT NULL,
  PRIMARY KEY (account, category, value)
);

-- Tier changes, promotions, demotions and removals, for the monthly review.
CREATE TABLE tier_changes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id  TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  from_tier  INTEGER,
  to_tier    INTEGER,
  change     TEXT NOT NULL CHECK (change IN ('tier', 'joined', 'removed')),
  by         TEXT,
  at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tier_changes_at ON tier_changes(at);

-- The monthly review: what she decided to change.
CREATE TABLE reviews (
  month       TEXT PRIMARY KEY,           -- YYYY-MM
  notes       TEXT,
  emailed_at  TEXT,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value_json) VALUES ('measure', json('{
  "startDate": "2026-11-16",
  "baselineWeeks": 2,
  "reminderHourNY": 13,
  "pilot": {
    "researched": [60, 60], "tier1": [10, 10], "tier2": [20, 20], "comments": [64, 96],
    "connections": [15, 25], "recurring": [3, 5], "ideas": [12, 20], "collaborations": [2, 3]
  }
}'));
INSERT INTO settings (key, value_json) VALUES ('measure_state', json('{"remindedWeek": null}'));
