-- Migration 081 : DM reply / quote
-- Ajout d'une référence optionnelle vers le message auquel celui-ci répond.
-- ON DELETE SET NULL : si le message cité est supprimé, le reply reste mais
-- sans contexte (mieux que de tout cascader).

ALTER TABLE dm_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID
  REFERENCES dm_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dm_messages_reply_to
  ON dm_messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;
