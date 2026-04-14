-- Migration 072 : Homepage Grid Builder v2
-- Stocke le layout libre (rows/columns/spans) + thème en JSONB
-- Remplace progressivement le système de positions fixes (069/070)

CREATE TABLE IF NOT EXISTS homepage_grid (
  id               SERIAL      PRIMARY KEY,
  -- Layout de travail (non publié)
  draft_layout     JSONB,
  -- Layout publié (visible aux visiteurs)
  published_layout JSONB,
  -- Thème visuel global (couleurs, typo, radius...)
  theme            JSONB       NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Une seule ligne — singleton
INSERT INTO homepage_grid (id, draft_layout, published_layout, theme)
VALUES (1, NULL, NULL, '{
  "primary":             "#a78bfa",
  "accent":              "#06b6d4",
  "bg":                  "#05050a",
  "card_bg":             "rgba(255,255,255,.03)",
  "border_color":        "rgba(255,255,255,.08)",
  "border_radius":       "10px",
  "font_family":         "Space Grotesk",
  "font_size_base":      "15px",
  "font_weight_heading": "700",
  "text_primary":        "#e2e8f0",
  "text_secondary":      "#6b7280",
  "shadow":              "0 4px 24px rgba(0,0,0,.4)"
}')
ON CONFLICT (id) DO NOTHING;
