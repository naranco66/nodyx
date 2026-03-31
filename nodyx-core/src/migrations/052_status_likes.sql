-- Migration 052: Status post likes

BEGIN;

CREATE TABLE IF NOT EXISTS status_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES status_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_status_likes_post ON status_likes(post_id);

COMMIT;
