import type { RequestHandler } from './$types'
import { allPages }           from '$lib/nav.js'

const BASE = 'https://nodyx.dev'

export const GET: RequestHandler = () => {
  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    // Landing page
    `<url><loc>${BASE}</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    // Doc pages
    ...allPages.map(p =>
      `<url><loc>${BASE}/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${today}</lastmod></url>`
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
