-- Migration 051: Status posts (micro-posts / social feed)
-- Short-form content tied to users, supports replies and likes

BEGIN;

CREATE TABLE IF NOT EXISTS status_posts (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        TEXT      NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  media_url      VARCHAR(500),
  reply_to_id    UUID      REFERENCES status_posts(id) ON DELETE SET NULL,
  likes_count    INTEGER   NOT NULL DEFAULT 0,
  replies_count  INTEGER   NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_posts_author   ON status_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_posts_reply_to ON status_posts(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_status_posts_created  ON status_posts(created_at DESC);

COMMIT;
