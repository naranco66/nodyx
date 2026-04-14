import type { PageServerLoad } from './$types';
import { apiFetch } from '$lib/api';

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const { token } = await parent();

	const res = await apiFetch(fetch, '/admin/homepage/grid', {
		headers: { Authorization: `Bearer ${token}` },
	});

	const json = res.ok ? await res.json() : { draft: null, published: null, theme: {} };

	return {
		draft:     json.draft     ?? null,
		published: json.published ?? null,
		theme:     json.theme     ?? {},
	};
};
