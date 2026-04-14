// ── Ancien système (positions fixes) ──────────────────────────────────────────
export interface HomepageWidget {
	id:           string;
	position_id:  string;
	widget_type:  string;
	title:        string | null;
	config:       Record<string, unknown>;
	sort_order:   number;
	enabled:      boolean;
	visibility:   { audience?: 'all' | 'guests' | 'members'; roles?: string[]; start_date?: string; end_date?: string };
	width:        string;
	mobile_height: string | null;
	hide_mobile:  boolean;
	hide_tablet:  boolean;
}

export interface HomepagePosition {
	id:          string;
	label:       string;
	layout:      string;
	max_widgets: number | null;
	sort_order:  number;
	widgets:     HomepageWidget[];
}

export interface HomepageData {
	positions: HomepagePosition[];
}

// ── Grid Builder v2 ───────────────────────────────────────────────────────────

export interface GridTheme {
	primary:             string;   // ex: "#a78bfa"
	accent:              string;   // ex: "#06b6d4"
	bg:                  string;   // ex: "#05050a"
	card_bg:             string;   // ex: "rgba(255,255,255,.03)"
	border_color:        string;   // ex: "rgba(255,255,255,.08)"
	border_radius:       string;   // ex: "10px"
	font_family:         string;   // ex: "Space Grotesk"
	font_size_base:      string;   // ex: "15px"
	font_weight_heading: string;   // ex: "700"
	text_primary:        string;   // ex: "#e2e8f0"
	text_secondary:      string;   // ex: "#6b7280"
	shadow:              string;   // ex: "0 4px 24px rgba(0,0,0,.4)"
}

export const DEFAULT_THEME: GridTheme = {
	primary:             '#a78bfa',
	accent:              '#06b6d4',
	bg:                  '#05050a',
	card_bg:             'rgba(255,255,255,.03)',
	border_color:        'rgba(255,255,255,.08)',
	border_radius:       '10px',
	font_family:         'Space Grotesk',
	font_size_base:      '15px',
	font_weight_heading: '700',
	text_primary:        '#e2e8f0',
	text_secondary:      '#6b7280',
	shadow:              '0 4px 24px rgba(0,0,0,.4)',
}

export interface GridColumn {
	id:           string;
	span:         number;          // 1–12 (desktop lg ≥ 1024px)
	span_md?:     number;          // 640–1023px (auto si absent)
	span_sm?:     number;          // < 640px (défaut: 12)
	widget:       string | null;   // ID du widget ou null si vide
	config:       Record<string, unknown>;
	title?:       string | null;
	hide_mobile?: boolean;
	hide_tablet?: boolean;
}

export interface GridRow {
	id:           string;
	gap:          string;          // '0' | '0.5rem' | '1rem' | '2rem'
	padding_y:    string;          // '0' | '1rem' | '2rem' | '3rem'
	bg_override?: string | null;   // couleur de fond spécifique à cette ligne
	columns:      GridColumn[];
}

export interface GridLayout {
	rows:  GridRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Génère un id unique (court) pour rows et columns */
export function genId(): string {
	return Math.random().toString(36).slice(2, 9)
}

/** Retourne le span_md automatique selon le span desktop */
export function autoSpanMd(span: number): number {
	if (span >= 8) return 12
	if (span >= 6) return 12
	if (span >= 4) return 6
	if (span >= 3) return 6
	if (span >= 2) return 4
	return 6
}

/** Retourne le span_sm automatique */
export function autoSpanSm(span: number): number {
	if (span >= 4) return 12
	if (span >= 2) return 6
	return 12
}

/** Vérifie que la somme des spans d'une ligne = 12 */
export function validateRow(row: GridRow): boolean {
	return row.columns.reduce((sum, c) => sum + c.span, 0) === 12
}

/** Crée une ligne vide avec N colonnes égales */
export function makeRow(cols: number): GridRow {
	const span = Math.floor(12 / cols)
	const remainder = 12 - span * cols
	return {
		id:        genId(),
		gap:       '1rem',
		padding_y: '0',
		columns:   Array.from({ length: cols }, (_, i) => ({
			id:     genId(),
			span:   i === cols - 1 ? span + remainder : span,
			widget: null,
			config: {},
		}))
	}
}

/** Crée une ligne depuis une config spans explicite ex: [8,4] */
export function makeRowFromSpans(spans: number[]): GridRow {
	return {
		id:        genId(),
		gap:       '1rem',
		padding_y: '0',
		columns:   spans.map(span => ({
			id:     genId(),
			span,
			widget: null,
			config: {},
		}))
	}
}
