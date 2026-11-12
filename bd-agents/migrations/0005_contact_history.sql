-- bd-agents 0005: KADE keeps the one contact history per person (KADE docs/contact-history.md).
-- touches becomes the outbox: each touch or outcome is written here first, then sent to KADE
-- (kade_sent_at), so nothing is lost when KADE is unreachable. contact_state mirrors KADE's.
ALTER TABLE people ADD COLUMN contact_state TEXT NOT NULL DEFAULT 'open'; -- open | in_conversation | paused | stopped
ALTER TABLE people ADD COLUMN paused_until TEXT;
ALTER TABLE touches ADD COLUMN kade_kind TEXT;
ALTER TABLE touches ADD COLUMN note TEXT;
ALTER TABLE touches ADD COLUMN kade_sent_at TEXT;
ALTER TABLE touches ADD COLUMN kade_error TEXT;
CREATE INDEX idx_touches_unsent ON touches(occurred_at) WHERE kade_sent_at IS NULL;
-- Touches recorded before this migration go to KADE too.
UPDATE touches SET kade_kind = CASE touch_type WHEN 'connection_request' THEN 'connect_sent' WHEN 'dm' THEN 'message_sent' ELSE touch_type END
  WHERE kade_kind IS NULL;
