-- 075_canvas_boards.sql
-- NodyxCanvas : boards persistants, un board par canal (ou standalone).
-- Snapshot JSONB = tableau de CanvasElement (CRDT LWW, format défini dans canvas.ts frontend).
-- La sync temps réel passe par Socket.IO ; le snapshot est la source de vérité persistante.

CREATE TABLE IF NOT EXISTS canvas_boards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL DEFAULT 'Sans titre',
  channel_id  UUID        REFERENCES channels(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  snapshot    JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS canvas_boards_channel_id_idx ON canvas_boards(channel_id);
CREATE INDEX IF NOT EXISTS canvas_boards_created_by_idx ON canvas_boards(created_by);
