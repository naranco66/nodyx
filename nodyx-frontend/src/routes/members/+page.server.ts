import type { PageServerLoad } from './$types'
import { apiFetch }            from '$lib/api'

export interface MemberCard {
  user_id:             string
  username:            string
  avatar:              string | null
  display_name:        string | null
  name_color:          string | null
  name_glow:           string | null
  name_glow_intensity: number | null
  name_animation:      string | null
  name_font_family:    string | null
  name_font_url:       string | null
  status:              string | null
  bio:                 string | null
  points:              number
  created_at:          string
  is_online:           boolean
  activity_score:      number
}

export interface RecentActivity {
  user_id:       string
  thread_id:     string
  thread_title:  string
  thread_slug:   string | null
  category_slug: string | null
  created_at:    string
}

export interface PulseData {
  online:    Array<MemberCard & { recent_activity: RecentActivity | null }>
  gravity:   MemberCard[]
  newcomers: MemberCard[]
  counts:    { total: number; online: number; active_7d: number }
}

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const res = await apiFetch(fetch, '/members/pulse')
    if (!res.ok) {
      return {
        pulse: {
          online: [], gravity: [], newcomers: [],
          counts: { total: 0, online: 0, active_7d: 0 },
        } as PulseData,
        error: `Backend returned ${res.status}`,
      }
    }
    const pulse = await res.json() as PulseData
    return { pulse, error: null }
  } catch (err) {
    return {
      pulse: {
        online: [], gravity: [], newcomers: [],
        counts: { total: 0, online: 0, active_7d: 0 },
      } as PulseData,
      error: err instanceof Error ? err.message : 'Failed to load',
    }
  }
}
