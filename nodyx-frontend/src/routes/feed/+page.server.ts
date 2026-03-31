import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { apiFetch } from '$lib/api'

export const load: PageServerLoad = async ({ parent, fetch }) => {
	const { user, token } = await parent()
	if (!user) throw redirect(302, '/login')

	const headers = { Authorization: `Bearer ${token}` }

	const feedRes = await apiFetch(fetch, '/social/feed?limit=20', { headers })
	const posts   = feedRes.ok ? (await feedRes.json()).posts ?? [] : []

	return { posts }
}
