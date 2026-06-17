CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS governance_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  document_reference_id TEXT,
  owner TEXT NOT NULL,
  due_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open',
  priority TEXT NOT NULL DEFAULT 'Medium',
  linked_decision TEXT,
  linked_meeting_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_actions_status ON governance_actions (status);
CREATE INDEX IF NOT EXISTS idx_governance_actions_owner ON governance_actions (owner);
CREATE INDEX IF NOT EXISTS idx_governance_actions_due_date ON governance_actions (due_date);
