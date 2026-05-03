CREATE TABLE IF NOT EXISTS capability_memory (
  action TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_used_at TEXT,
  PRIMARY KEY (action, capability_id)
);