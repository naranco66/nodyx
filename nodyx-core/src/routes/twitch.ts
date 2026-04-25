// ─── Twitch Helix API wrapper ────────────────────────────────────────────────
// Endpoint public pour le widget Twitch homepage.
// - Si TWITCH_CLIENT_ID/SECRET absents → renvoie { configured: false } → widget
//   tombe en mode embed pur sans détection live/fallback.
// - App access token caché 55j dans Redis (valide 60j côté Twitch).
// - Réponse widget cachée 60s par combo (channel, category, language).

import type { FastifyInstance } from 'fastify'
import { redis } from '../config/database'
import { rateLimit } from '../middleware/rateLimit'

const TOKEN_CACHE_KEY    = 'twitch:app_token'
const TOKEN_CACHE_TTL    = 55 * 24 * 3600  // 55 jours
const GAME_CACHE_PREFIX  = 'twitch:game:'
const GAME_CACHE_TTL     = 7 * 24 * 3600   // 7 jours
const WIDGET_CACHE_TTL   = 60              // 60 secondes

interface TwitchStream {
  user_login:    string
  user_name:     string
  game_id:       string
  game_name:     string
  type:          string  // "live" ou ""
  title:         string
  viewer_count:  number
  started_at:    string
  language:      string
  thumbnail_url: string
}

interface TwitchGame {
  id:   string
  name: string
}

// ─── Parsing de la catégorie ─────────────────────────────────────────────────
function parseCategoryName(raw: string): string {
  const urlMatch = raw.match(/twitch\.tv\/directory\/category\/([^/?#]+)/i)
  if (urlMatch) {
    // Convertit le slug en nom lisible (heuristique) : software-and-game-development → Software and Game Development
    const stopWords = new Set(['and', 'a', 'the', 'of', 'in', 'on', 'for', 'vs'])
    return urlMatch[1]
      .split('-')
      .map((w, i) => {
        if (i > 0 && stopWords.has(w.toLowerCase())) return w.toLowerCase()
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      })
      .join(' ')
  }
  return raw.trim()
}

function parseChannel(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.trim().replace(/^@/, '')
  const match = cleaned.match(/twitch\.tv\/([^/?#]+)/i)
  if (match) return match[1].toLowerCase()
  return cleaned.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

// ─── App Access Token (client_credentials flow) ──────────────────────────────
async function getAppToken(clientId: string, clientSecret: string): Promise<string | null> {
  const cached = await redis.get(TOKEN_CACHE_KEY)
  if (cached) return cached

  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    'client_credentials',
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; expires_in: number }
    if (!data.access_token) return null

    await redis.set(TOKEN_CACHE_KEY, data.access_token, 'EX', TOKEN_CACHE_TTL)
    return data.access_token
  } catch {
    return null
  }
}

// ─── Resolve game name → game_id (cached 7j) ─────────────────────────────────
async function getGameId(name: string, clientId: string, token: string): Promise<{ id: string; name: string } | null> {
  const cacheKey = `${GAME_CACHE_PREFIX}${name.toLowerCase()}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  try {
    const res = await fetch(`https://api.twitch.tv/helix/games?name=${encodeURIComponent(name)}`, {
      headers: {
        'Client-ID':     clientId,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    const data = await res.json() as { data: TwitchGame[] }
    if (!data.data || data.data.length === 0) return null

    const game = { id: data.data[0].id, name: data.data[0].name }
    await redis.set(cacheKey, JSON.stringify(game), 'EX', GAME_CACHE_TTL)
    return game
  } catch {
    return null
  }
}

// ─── Stream status pour une chaîne (live/offline + meta) ─────────────────────
async function getStreamForChannel(channel: string, clientId: string, token: string): Promise<TwitchStream | null> {
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(channel)}`, {
      headers: {
        'Client-ID':     clientId,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    const data = await res.json() as { data: TwitchStream[] }
    return data.data?.[0] ?? null
  } catch {
    return null
  }
}

// ─── Top stream dans une catégorie (par langue, excluant une chaîne) ─────────
async function getTopStreamInCategory(
  gameId:         string,
  language:       string,
  excludeChannel: string,
  clientId:       string,
  token:          string,
): Promise<TwitchStream | null> {
  try {
    const params = new URLSearchParams({ game_id: gameId, first: '5' })
    if (language && language !== 'any') params.append('language', language)

    const res = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
      headers: {
        'Client-ID':     clientId,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    const data = await res.json() as { data: TwitchStream[] }
    if (!data.data || data.data.length === 0) return null

    // Exclure la chaîne principale si elle apparaît par hasard dans le top
    const exclude = excludeChannel.toLowerCase()
    const filtered = data.data.filter(s => s.user_login.toLowerCase() !== exclude)
    return filtered[0] ?? null
  } catch {
    return null
  }
}

// ─── Shape public (on n'expose pas tout le payload Twitch) ──────────────────
interface StreamPublic {
  channel:      string
  title:        string
  viewers:      number
  game_name:    string
  language:     string
  thumbnail:    string
  started_at:   string
}

function publicShape(s: TwitchStream): StreamPublic {
  return {
    channel:    s.user_login,
    title:      s.title,
    viewers:    s.viewer_count,
    game_name:  s.game_name,
    language:   s.language,
    thumbnail:  s.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
    started_at: s.started_at,
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export default async function twitchRoutes(app: FastifyInstance) {

  // GET /api/v1/twitch/widget?channel=X&category=Y&language=fr
  app.get('/widget', { preHandler: [rateLimit] }, async (request, reply) => {
    const query = request.query as {
      channel?:  string
      category?: string
      language?: string
    }

    const channel  = parseChannel(query.channel ?? '')
    const rawCat   = (query.category ?? '').trim()
    const language = (query.language ?? 'any').trim().toLowerCase()

    const clientId     = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET

    // ── Dégradation : pas de creds Twitch configurées ──
    if (!clientId || !clientSecret) {
      return reply.send({
        configured:   false,
        live_channel: channel || null,
        status:       'unconfigured',
        main:         null,
        fallback:     null,
      })
    }

    if (!channel && !rawCat) {
      return reply.code(400).send({ error: 'channel or category required', code: 'BAD_REQUEST' })
    }

    // ── Cache réponse ──
    const cacheKey = `twitch:widget:${channel}:${rawCat}:${language}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      reply.header('x-cache', 'HIT')
      return reply.send(JSON.parse(cached))
    }

    const token = await getAppToken(clientId, clientSecret)
    if (!token) {
      return reply.code(502).send({ error: 'Twitch auth failed', code: 'UPSTREAM_ERROR' })
    }

    // ── Main channel status ──
    let mainStream: TwitchStream | null = null
    if (channel) {
      mainStream = await getStreamForChannel(channel, clientId, token)
    }

    // ── Fallback : top stream dans la catégorie si main offline ──
    let fallbackStream: TwitchStream | null = null
    if (!mainStream && rawCat) {
      const categoryName = parseCategoryName(rawCat)
      const game = await getGameId(categoryName, clientId, token)
      if (game) {
        fallbackStream = await getTopStreamInCategory(game.id, language, channel, clientId, token)
      }
    }

    const response = {
      configured:   true,
      live_channel: mainStream
        ? mainStream.user_login
        : (fallbackStream ? fallbackStream.user_login : (channel || null)),
      status: mainStream
        ? 'main-live'
        : (fallbackStream ? 'fallback-live' : 'offline'),
      main:     mainStream     ? publicShape(mainStream)     : null,
      fallback: fallbackStream ? publicShape(fallbackStream) : null,
    }

    await redis.set(cacheKey, JSON.stringify(response), 'EX', WIDGET_CACHE_TTL)
    reply.header('x-cache', 'MISS')
    return reply.send(response)
  })
}
