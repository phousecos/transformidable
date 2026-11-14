-- bd-agents 0007: partners (KADE docs/partners.md, owner, November 13, 2026). Fractional CFOs and CHROs, deal advisors,
-- ERP consultancies and recruiters who serve the same buyers. KADE owns them (found through AI Ark or added by URL);
-- the morning sync copies them here with segment 'warm' and their kind, stage and next check-in, all as KADE has them.
-- They are never in KADE's hot scope (in_kade_scope = 0), so no prospect list picks them up.
ALTER TABLE people ADD COLUMN partner_type TEXT;
ALTER TABLE people ADD COLUMN partner_stage TEXT;
ALTER TABLE people ADD COLUMN partner_check_in_on TEXT;
CREATE INDEX idx_people_partner ON people(partner_type) WHERE partner_type IS NOT NULL;
