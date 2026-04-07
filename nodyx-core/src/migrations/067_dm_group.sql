-- Migration 067 : group DM support
-- dm_conversations gets optional name + is_group flag

ALTER TABLE dm_conversations
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS name     TEXT;

-- Index for group conversations
CREATE INDEX IF NOT EXISTS idx_dm_conversations_group ON dm_conversations(is_group) WHERE is_group = TRUE;
