-- bd-agents 0003: KADE's view of each person's organization, refreshed every sync.
-- in_kade_scope = 1 while the organization is pursued or a hot/warm active prospect in KADE;
-- 0 once it cools off (the row stays, so its touch history stays).
ALTER TABLE people ADD COLUMN kade_tier TEXT;
ALTER TABLE people ADD COLUMN kade_heat REAL;
ALTER TABLE people ADD COLUMN pursued INTEGER NOT NULL DEFAULT 0;
ALTER TABLE people ADD COLUMN in_kade_scope INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_people_scope_tier ON people(in_kade_scope, kade_tier);
