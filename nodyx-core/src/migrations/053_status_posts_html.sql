-- Migration 053: Allow HTML content in status_posts (remove 2000-char upper bound)
-- TipTap produces HTML which is longer than raw text

ALTER TABLE status_posts DROP CONSTRAINT IF EXISTS status_posts_content_check;
ALTER TABLE status_posts ADD CONSTRAINT status_posts_content_check CHECK (char_length(content) >= 1);
