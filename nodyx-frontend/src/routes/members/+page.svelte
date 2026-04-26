<script lang="ts">
  import { onMount, onDestroy }                from 'svelte'
  import { browser }                           from '$app/environment'
  import { t }                                  from '$lib/i18n'
  import { buildNameStyle, buildAnimClass, ensureFontLoaded } from '$lib/nameEffects'
  import type { PageData }                     from './$types'

  let { data }: { data: PageData } = $props()
  const tFn = $derived($t)

  // ── State ───────────────────────────────────────────────────────────────
  // svelte-ignore state_referenced_locally
  let pulse  = $state(data.pulse)
  let waved  = $state<Set<string>>(new Set())
  let waving = $state<Set<string>>(new Set())

  // Trail popover state
  let trailFor    = $state<string | null>(null)
  let trailData   = $state<Array<{ user_id: string; username: string; avatar: string | null; name_color: string | null; shared_threads: number }> | null>(null)
  let trailLoading = $state(false)
  let trailAnchor = $state<{ x: number; y: number } | null>(null)

  // ── Live refresh ────────────────────────────────────────────────────────
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      const r = await fetch('/api/v1/members/pulse')
      if (r.ok) pulse = await r.json()
    } catch { /* silent */ }
  }

  onMount(() => {
    if (!browser) return
    // Load custom fonts referenced by member cards
    for (const m of [...pulse.online, ...pulse.gravity, ...pulse.newcomers]) {
      ensureFontLoaded(m.name_font_family, m.name_font_url)
    }
    // Refresh every 60s — keeps the pulse alive without hammering the API
    refreshTimer = setInterval(refresh, 60_000)
  })

  onDestroy(() => {
    if (refreshTimer) clearInterval(refreshTimer)
  })

  // ── Wave action ─────────────────────────────────────────────────────────
  async function wave(userId: string, ev: MouseEvent) {
    ev.preventDefault()
    ev.stopPropagation()
    if (waved.has(userId) || waving.has(userId)) return
    if (!data.token) {
      window.location.href = '/auth/login?next=/members'
      return
    }
    waving = new Set([...waving, userId])
    try {
      const r = await fetch(`/api/v1/members/${userId}/wave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${data.token}` },
      })
      if (r.ok || r.status === 429) {
        waved = new Set([...waved, userId])
      }
    } catch { /* silent */ }
    finally {
      const next = new Set(waving); next.delete(userId); waving = next
    }
  }

  // ── Trail (co-presence) ─────────────────────────────────────────────────
  async function showTrail(userId: string, ev: MouseEvent) {
    ev.preventDefault()
    ev.stopPropagation()
    if (trailFor === userId) {
      // Toggle close
      trailFor = null; trailData = null; trailAnchor = null
      return
    }
    const target = ev.currentTarget as HTMLElement
    const rect   = target.getBoundingClientRect()
    trailAnchor  = { x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY + 8 }
    trailFor     = userId
    trailLoading = true
    trailData    = null
    try {
      const r = await fetch(`/api/v1/members/${userId}/trail`)
      if (r.ok) trailData = (await r.json()).trail ?? []
    } catch { /* silent */ }
    finally { trailLoading = false }
  }

  function closeTrail() { trailFor = null; trailData = null; trailAnchor = null }

  // ── Time formatting ─────────────────────────────────────────────────────
  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1)   return tFn('common.time.now') ?? 'now'
    if (m < 60)  return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24)  return `${h}h`
    const d = Math.floor(h / 24)
    return `${d}${tFn('common.time.d') ?? 'd'}`
  }

  function levelOf(points: number): number {
    return Math.floor(Math.sqrt(Math.max(0, points) / 10)) + 1
  }
</script>

<svelte:head>
  <title>{tFn('members.title')} — Nodyx</title>
  <meta name="description" content={tFn('members.meta_description')} />
</svelte:head>

<svelte:window on:click={closeTrail} />

<div class="members-page max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

  <!-- ─── Hero / Pulse counters ─────────────────────────────────────── -->
  <header class="mb-12">
    <div class="flex items-center gap-3 mb-2">
      <span class="pulse-dot"></span>
      <span class="text-xs uppercase tracking-widest text-purple-400 font-semibold">{tFn('members.live_label')}</span>
    </div>
    <h1 class="text-4xl sm:text-5xl font-bold text-white mb-2">{tFn('members.title')}</h1>
    <p class="text-gray-400 text-lg max-w-2xl">{tFn('members.subtitle')}</p>

    <div class="grid grid-cols-3 gap-3 sm:gap-6 mt-8 max-w-2xl">
      <div class="counter-card">
        <div class="counter-value">{pulse.counts.total}</div>
        <div class="counter-label">{tFn('members.counter_total')}</div>
      </div>
      <div class="counter-card">
        <div class="counter-value text-green-400">{pulse.counts.online}</div>
        <div class="counter-label">{tFn('members.counter_online')}</div>
      </div>
      <div class="counter-card">
        <div class="counter-value text-purple-400">{pulse.counts.active_7d}</div>
        <div class="counter-label">{tFn('members.counter_active_7d')}</div>
      </div>
    </div>
  </header>

  <!-- ─── Online now ────────────────────────────────────────────────── -->
  {#if pulse.online.length > 0}
    <section class="mb-12">
      <h2 class="section-title">
        <span class="title-dot bg-green-400"></span>
        {tFn('members.online_now')}
        <span class="text-gray-500 font-normal text-sm">— {pulse.online.length}</span>
      </h2>
      <div class="online-strip">
        {#each pulse.online as m (m.user_id)}
          <a href="/users/{m.username}"
             class="online-chip group"
             title={m.display_name ?? m.username}>
            <div class="online-avatar-wrap">
              {#if m.avatar}
                <img src={m.avatar} alt="" class="online-avatar" />
              {:else}
                <div class="online-avatar-fallback">{m.username[0].toUpperCase()}</div>
              {/if}
              <span class="online-pulse"></span>
            </div>
            <span class="online-name {buildAnimClass(m)}" style={buildNameStyle(m)}>
              {m.display_name ?? m.username}
            </span>
            {#if m.recent_activity}
              <span class="online-activity">
                {tFn('members.just_posted_in')} <em>{m.recent_activity.thread_title}</em>
              </span>
            {:else if m.status}
              <span class="online-status">{m.status}</span>
            {/if}
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- ─── Activity gravity ──────────────────────────────────────────── -->
  {#if pulse.gravity.length > 0}
    <section class="mb-12">
      <h2 class="section-title">
        <span class="title-dot bg-purple-400"></span>
        {tFn('members.gravity_title')}
        <span class="text-gray-500 font-normal text-sm">— {tFn('members.gravity_subtitle')}</span>
      </h2>
      <div class="gravity-grid">
        {#each pulse.gravity as m (m.user_id)}
          <div class="gravity-card" class:is-online={m.is_online}>
            <a href="/users/{m.username}" class="block">
              <div class="gravity-avatar-wrap">
                {#if m.avatar}
                  <img src={m.avatar} alt="" class="gravity-avatar" />
                {:else}
                  <div class="gravity-avatar-fallback">{m.username[0].toUpperCase()}</div>
                {/if}
                {#if m.is_online}<span class="gravity-online-dot"></span>{/if}
              </div>
              <div class="gravity-name {buildAnimClass(m)}" style={buildNameStyle(m)}>
                {m.display_name ?? m.username}
              </div>
              <div class="gravity-meta">
                <span class="gravity-level">Lv. {levelOf(m.points)}</span>
                <span class="gravity-score" title={tFn('members.gravity_score_tooltip')}>
                  ⚡ {m.activity_score}
                </span>
              </div>
            </a>
            <button class="trail-btn"
                    onclick={(e) => showTrail(m.user_id, e)}
                    aria-label={tFn('members.show_trail')}>
              {tFn('members.show_trail')}
            </button>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- ─── Newcomers wall ─────────────────────────────────────────────── -->
  {#if pulse.newcomers.length > 0}
    <section class="mb-12">
      <h2 class="section-title">
        <span class="title-dot bg-yellow-400"></span>
        {tFn('members.newcomers_title')}
        <span class="text-gray-500 font-normal text-sm">— {tFn('members.newcomers_subtitle')}</span>
      </h2>
      <div class="newcomers-row">
        {#each pulse.newcomers as m (m.user_id)}
          <div class="newcomer-card" class:is-online={m.is_online}>
            <a href="/users/{m.username}" class="block">
              <div class="newcomer-avatar-wrap">
                {#if m.avatar}
                  <img src={m.avatar} alt="" class="newcomer-avatar" />
                {:else}
                  <div class="newcomer-avatar-fallback">{m.username[0].toUpperCase()}</div>
                {/if}
                {#if m.is_online}<span class="newcomer-online-dot"></span>{/if}
              </div>
              <div class="newcomer-name {buildAnimClass(m)}" style={buildNameStyle(m)}>
                {m.display_name ?? m.username}
              </div>
              <div class="newcomer-joined">
                {tFn('members.joined_ago', { ago: timeAgo(m.created_at) })}
              </div>
            </a>
            {#if data.user && (data.user as any).id !== m.user_id}
              <button class="wave-btn"
                      class:is-waved={waved.has(m.user_id)}
                      class:is-waving={waving.has(m.user_id)}
                      disabled={waved.has(m.user_id) || waving.has(m.user_id)}
                      onclick={(e) => wave(m.user_id, e)}>
                {#if waved.has(m.user_id)}
                  ✓ {tFn('members.waved')}
                {:else if waving.has(m.user_id)}
                  …
                {:else}
                  👋 {tFn('members.wave')}
                {/if}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if pulse.gravity.length === 0 && pulse.newcomers.length === 0 && pulse.online.length === 0}
    <div class="empty-state">
      <div class="text-6xl mb-4">🌱</div>
      <p class="text-gray-400">{tFn('members.empty_state')}</p>
    </div>
  {/if}
</div>

<!-- ─── Trail popover ────────────────────────────────────────────────── -->
{#if trailFor && trailAnchor}
  <div class="trail-popover"
       style="left:{trailAnchor.x}px; top:{trailAnchor.y}px;"
       onclick={(e) => e.stopPropagation()}
       onkeydown={(e) => { if (e.key === 'Escape') closeTrail() }}
       role="dialog"
       tabindex="-1">
    <div class="trail-title">{tFn('members.trail_title')}</div>
    {#if trailLoading}
      <div class="trail-loading">…</div>
    {:else if trailData && trailData.length > 0}
      <ul class="trail-list">
        {#each trailData as t (t.user_id)}
          <li class="trail-item">
            <a href="/users/{t.username}" class="flex items-center gap-3">
              {#if t.avatar}
                <img src={t.avatar} alt="" class="trail-avatar" />
              {:else}
                <div class="trail-avatar-fallback">{t.username[0].toUpperCase()}</div>
              {/if}
              <span class="trail-name" style={buildNameStyle({ name_color: t.name_color })}>
                {t.username}
              </span>
              <span class="trail-shared">×{t.shared_threads}</span>
            </a>
          </li>
        {/each}
      </ul>
      <div class="trail-foot">{tFn('members.trail_foot')}</div>
    {:else}
      <div class="trail-empty">{tFn('members.trail_empty')}</div>
    {/if}
  </div>
{/if}

<style>
  .members-page { color: #e5e7eb; }

  /* ── Pulse / live indicator ─────────────────────────────────────────── */
  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: pulse-ring 2s cubic-bezier(0.66, 0, 0, 1) infinite;
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0    rgba(16, 185, 129, 0.7); }
    70%  { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);   }
    100% { box-shadow: 0 0 0 0    rgba(16, 185, 129, 0);   }
  }

  /* ── Counter cards ──────────────────────────────────────────────────── */
  .counter-card {
    background: linear-gradient(180deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.4));
    border: 1px solid rgba(75, 85, 99, 0.4);
    border-radius: 14px;
    padding: 1.25rem 1rem;
    backdrop-filter: blur(8px);
  }
  .counter-value {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    line-height: 1;
    margin-bottom: 0.4rem;
    letter-spacing: -0.02em;
  }
  .counter-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  /* ── Section titles ─────────────────────────────────────────────────── */
  .section-title {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 1.1rem; font-weight: 600; color: white;
    margin-bottom: 1rem;
  }
  .title-dot { width: 8px; height: 8px; border-radius: 50%; }

  /* ── Online strip ───────────────────────────────────────────────────── */
  .online-strip {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }
  .online-chip {
    display: flex; flex-direction: column; align-items: center;
    padding: 0.75rem 0.5rem;
    background: rgba(31, 41, 55, 0.4);
    border: 1px solid rgba(75, 85, 99, 0.3);
    border-radius: 12px;
    transition: all 200ms;
    text-align: center;
    min-height: 100px;
  }
  .online-chip:hover {
    border-color: rgba(16, 185, 129, 0.5);
    transform: translateY(-2px);
    background: rgba(31, 41, 55, 0.6);
  }
  .online-avatar-wrap {
    position: relative;
    margin-bottom: 0.5rem;
  }
  .online-avatar, .online-avatar-fallback {
    width: 48px; height: 48px; border-radius: 50%;
    border: 2px solid rgba(16, 185, 129, 0.6);
    object-fit: cover;
  }
  .online-avatar-fallback {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 600;
  }
  .online-pulse {
    position: absolute;
    bottom: 2px; right: 2px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #10b981;
    border: 2px solid #0a0a0a;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
  }
  .online-name {
    font-weight: 600;
    font-size: 0.85rem;
    line-height: 1.2;
    word-break: break-word;
    max-width: 100%;
  }
  .online-activity, .online-status {
    margin-top: 0.3rem;
    font-size: 0.7rem;
    color: #9ca3af;
    line-height: 1.3;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .online-activity em { color: #c4b5fd; font-style: normal; }

  /* ── Gravity grid ───────────────────────────────────────────────────── */
  .gravity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
  .gravity-card {
    position: relative;
    padding: 1.25rem 1rem;
    background: linear-gradient(180deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.3));
    border: 1px solid rgba(75, 85, 99, 0.3);
    border-radius: 14px;
    text-align: center;
    transition: all 200ms;
  }
  .gravity-card:hover {
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-2px);
  }
  .gravity-card.is-online { border-color: rgba(16, 185, 129, 0.4); }
  .gravity-avatar-wrap { position: relative; display: inline-block; margin-bottom: 0.6rem; }
  .gravity-avatar, .gravity-avatar-fallback {
    width: 64px; height: 64px; border-radius: 50%;
    object-fit: cover;
  }
  .gravity-avatar-fallback {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 600; font-size: 1.5rem;
  }
  .gravity-online-dot {
    position: absolute; bottom: 4px; right: 4px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #10b981; border: 2px solid #0a0a0a;
  }
  .gravity-name {
    font-weight: 600; font-size: 0.95rem;
    line-height: 1.2;
    margin-bottom: 0.4rem;
    word-break: break-word;
  }
  .gravity-meta {
    display: flex; gap: 0.5rem; justify-content: center;
    font-size: 0.75rem;
    color: #9ca3af;
  }
  .gravity-level { background: rgba(139, 92, 246, 0.15); padding: 0.15rem 0.5rem; border-radius: 8px; color: #c4b5fd; }
  .gravity-score { background: rgba(16, 185, 129, 0.15); padding: 0.15rem 0.5rem; border-radius: 8px; color: #6ee7b7; }
  .trail-btn {
    margin-top: 0.75rem;
    width: 100%;
    padding: 0.4rem;
    font-size: 0.7rem;
    color: #c4b5fd;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 150ms;
  }
  .trail-btn:hover { background: rgba(139, 92, 246, 0.2); color: white; }

  /* ── Newcomers ──────────────────────────────────────────────────────── */
  .newcomers-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  .newcomer-card {
    padding: 1.5rem 1rem;
    background: linear-gradient(180deg, rgba(251, 191, 36, 0.05), rgba(17, 24, 39, 0.3));
    border: 1px solid rgba(251, 191, 36, 0.2);
    border-radius: 14px;
    text-align: center;
    transition: all 200ms;
  }
  .newcomer-card:hover {
    border-color: rgba(251, 191, 36, 0.5);
    transform: translateY(-2px);
  }
  .newcomer-avatar-wrap { position: relative; display: inline-block; margin-bottom: 0.6rem; }
  .newcomer-avatar, .newcomer-avatar-fallback {
    width: 72px; height: 72px; border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
  }
  .newcomer-avatar-fallback {
    background: linear-gradient(135deg, #f59e0b, #ec4899);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 1.75rem;
  }
  .newcomer-online-dot {
    position: absolute; bottom: 4px; right: 4px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #10b981; border: 2px solid #0a0a0a;
  }
  .newcomer-name { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; word-break: break-word; }
  .newcomer-joined { font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.75rem; }
  .wave-btn {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem; font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #f59e0b, #ec4899);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 150ms;
  }
  .wave-btn:hover:not(:disabled) {
    transform: scale(1.03);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  }
  .wave-btn:disabled { cursor: default; }
  .wave-btn.is-waved {
    background: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }
  .wave-btn.is-waving { opacity: 0.6; }

  /* ── Trail popover ──────────────────────────────────────────────────── */
  .trail-popover {
    position: absolute;
    z-index: 50;
    transform: translateX(-50%);
    background: rgba(17, 24, 39, 0.97);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 12px;
    padding: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    min-width: 240px;
    max-width: 280px;
  }
  .trail-title {
    font-size: 0.7rem;
    color: #c4b5fd;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    margin-bottom: 0.6rem;
  }
  .trail-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .trail-item a { padding: 0.4rem; border-radius: 8px; transition: background 100ms; }
  .trail-item a:hover { background: rgba(139, 92, 246, 0.15); }
  .trail-avatar, .trail-avatar-fallback {
    width: 28px; height: 28px; border-radius: 50%;
  }
  .trail-avatar-fallback {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 0.75rem; font-weight: 600;
  }
  .trail-name { flex: 1; font-size: 0.85rem; color: white; }
  .trail-shared { font-size: 0.7rem; color: #9ca3af; }
  .trail-loading, .trail-empty { text-align: center; color: #9ca3af; font-size: 0.8rem; padding: 0.5rem; }
  .trail-foot { margin-top: 0.6rem; font-size: 0.65rem; color: #6b7280; text-align: center; line-height: 1.4; }

  /* ── Empty state ───────────────────────────────────────────────────── */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }
</style>
