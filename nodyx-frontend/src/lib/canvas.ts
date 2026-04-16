// ── NodyxCanvas — Types & CRDT State ─────────────────────────────────────────
// Collaborative canvas synced via Socket.IO.
// CRDT strategy: Last-Write-Wins per element (UUID + timestamp).

export type CanvasTool = 'select' | 'pen' | 'text' | 'sticky' | 'rect' | 'circle' | 'arrow' | 'eraser'

export type PathData = {
  points: [number, number][]
  color:  string
  width:  number
}

export type StickyData = {
  x:     number
  y:     number
  w?:    number
  h?:    number
  text:  string
  color: string
}

export type ShapeData = {
  x:     number
  y:     number
  w:     number
  h:     number
  color: string
  fill:  boolean
}

export type TextData = {
  x:        number
  y:        number
  text:     string
  color:    string
  fontSize: number
  bold:     boolean
  italic:   boolean
}

export type ArrowData = {
  x1:    number
  y1:    number
  x2:    number
  y2:    number
  color: string
  width: number
}

export type CanvasElement = {
  id:      string
  ts:      number
  author:  string
  kind:    CanvasTool
  data:    PathData | StickyData | ShapeData | TextData | ArrowData
  deleted?: boolean
}

// Socket.IO message types
export type CanvasSocketOp = {
  boardId: string
  op:      CanvasElement
}

export type CanvasSocketClear = {
  boardId: string
  ts:      number
  by:      string
}

export type CanvasSocketCursor = {
  boardId:  string
  userId:   string
  username: string
  x:        number   // world coordinates
  y:        number
  speaking: boolean
}

// ── View transform (pan + zoom) ───────────────────────────────────────────────

export type ViewTransform = {
  x:     number   // pan offset X (screen pixels)
  y:     number   // pan offset Y (screen pixels)
  scale: number   // zoom factor (1 = 100%)
}

export const DEFAULT_TRANSFORM: ViewTransform = { x: 0, y: 0, scale: 1 }
export const MIN_SCALE = 0.1
export const MAX_SCALE = 8

/** Convert screen coordinates → world coordinates */
export function screenToWorld(sx: number, sy: number, t: ViewTransform): [number, number] {
  return [(sx - t.x) / t.scale, (sy - t.y) / t.scale]
}

/** Convert world coordinates → screen coordinates */
export function worldToScreen(wx: number, wy: number, t: ViewTransform): [number, number] {
  return [wx * t.scale + t.x, wy * t.scale + t.y]
}

/** Zoom toward a screen-space pivot point */
export function zoomAt(t: ViewTransform, delta: number, pivotX: number, pivotY: number): ViewTransform {
  const factor   = delta < 0 ? 1.12 : 1 / 1.12
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
  const ratio    = newScale / t.scale
  return {
    x:     pivotX - (pivotX - t.x) * ratio,
    y:     pivotY - (pivotY - t.y) * ratio,
    scale: newScale,
  }
}

// ── CanvasState ───────────────────────────────────────────────────────────────

export class CanvasState {
  elements = new Map<string, CanvasElement>()

  /**
   * Apply a remote or local operation (LWW).
   * Returns true if the state changed (caller should redraw).
   */
  apply(op: CanvasElement): boolean {
    const existing = this.elements.get(op.id)
    if (existing && existing.ts >= op.ts) return false
    this.elements.set(op.id, op)
    return true
  }

  /** Soft-delete all elements with ts ≤ clearTs */
  clear(clearTs: number): void {
    for (const [id, el] of this.elements) {
      if (el.ts <= clearTs) {
        this.elements.set(id, { ...el, deleted: true, ts: clearTs })
      }
    }
  }

  /** Load a full snapshot from the server */
  loadSnapshot(elements: CanvasElement[]): void {
    this.elements.clear()
    for (const el of elements) {
      if (el?.id) this.elements.set(el.id, el)
    }
  }

  /** All non-deleted elements sorted by timestamp */
  snapshot(): CanvasElement[] {
    return [...this.elements.values()]
      .filter(el => !el.deleted)
      .sort((a, b) => a.ts - b.ts)
  }

  isEmpty(): boolean { return this.snapshot().length === 0 }

  authorSet(): string[] {
    const s = new Set<string>()
    for (const el of this.elements.values()) {
      if (!el.deleted) s.add(el.author)
    }
    return [...s]
  }
}
