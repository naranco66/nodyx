-- DM Reactions
CREATE TABLE IF NOT EXISTS dm_reactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID        NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      TEXT        NOT NULL CHECK (char_length(emoji) <= 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON dm_reactions(message_id);
