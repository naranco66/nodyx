import type { RequestHandler }     from './$types'
import { buildSearchIndex }        from '$lib/docs.server.js'
import { allPages }                from '$lib/nav.js'

// Search ranking strategy:
//  - Title hits weigh most (factor 6), heading hits next (4), body hits lowest (1).
//  - Phrase match (full query as substring) gets an extra bonus on top of term hits.
//  - Section entries (H2/H3) are surfaced ahead of the parent page when their
//    heading matches, so users land on the exact subsection.

interface ScoredEntry {
  slug:          string
  title:         string
  excerpt:       string
  headingText?:  string
  headingId?:    string
  headingLevel?: number
  score:         number
}

export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get('q')?.trim().toLowerCase()
  if (!q || q.length < 2) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } })
  }

  const index = await buildSearchIndex(allPages)
  const terms = q.split(/\s+/).filter(t => t.length >= 2)
  if (terms.length === 0) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } })
  }

  const scored: ScoredEntry[] = []

  for (const entry of index) {
    const titleLow   = entry.title.toLowerCase()
    const headingLow = entry.headingText?.toLowerCase() ?? ''
    const bodyLow    = entry.excerpt.toLowerCase()

    let score = 0

    for (const t of terms) {
      if (titleLow.includes(t))        score += 6
      else if (headingLow.includes(t)) score += 4
      else if (bodyLow.includes(t))    score += 1
    }
    if (terms.length > 1) {
      if (titleLow.includes(q))        score += 8
      else if (headingLow.includes(q)) score += 5
      else if (bodyLow.includes(q))    score += 2
    }
    if (terms.every(t => titleLow.includes(t) || headingLow.includes(t) || bodyLow.includes(t))) {
      score += 3
    }
    if (entry.headingText && terms.some(t => headingLow.includes(t))) {
      score += 2
    }

    if (score === 0) continue

    const firstHit = (() => {
      for (const t of terms) {
        const i = bodyLow.indexOf(t)
        if (i >= 0) return i
      }
      return -1
    })()
    const start   = firstHit >= 0 ? Math.max(0, firstHit - 40) : 0
    const slice   = entry.excerpt.slice(start, start + 160)
    const snippet = (start > 0 ? '…' : '') + slice + (start + 160 < entry.excerpt.length ? '…' : '')

    scored.push({
      slug:         entry.slug,
      title:        entry.title,
      excerpt:      snippet,
      headingText:  entry.headingText,
      headingId:    entry.headingId,
      headingLevel: entry.headingLevel,
      score,
    })
  }

  // Dedupe: prefer highest-scored entry per (slug + headingId)
  const seen = new Map<string, ScoredEntry>()
  for (const r of scored) {
    const key  = `${r.slug}#${r.headingId ?? ''}`
    const prev = seen.get(key)
    if (!prev || r.score > prev.score) seen.set(key, r)
  }

  const results = [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => ({
      slug:         r.slug,
      title:        r.title,
      excerpt:      r.excerpt,
      headingText:  r.headingText,
      headingId:    r.headingId,
      headingLevel: r.headingLevel,
    }))

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
