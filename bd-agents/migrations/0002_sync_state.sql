-- bd-agents 0002: where each KADE sync left off (one cursor per feed and scope).
CREATE TABLE sync_state (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
