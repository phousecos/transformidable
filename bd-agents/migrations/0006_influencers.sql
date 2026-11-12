-- bd-agents 0006: the influencer list (owner, November 12, 2026). People Jerri adds by LinkedIn URL
-- (industry voices, partners, associations): they join the comment rotation and up to 2 connection
-- requests a day. Kept here, not in KADE: they are not accounts KADE researches. Removing one
-- archives it (its history stays).
ALTER TABLE people ADD COLUMN archived_at TEXT;
ALTER TABLE people ADD COLUMN note TEXT;
CREATE UNIQUE INDEX idx_people_linkedin ON people(linkedin_url) WHERE linkedin_url IS NOT NULL AND segment = 'influencer';
