import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => {
  const body = `User-agent: *
Allow: /

Sitemap: https://nodyx.dev/sitemap.xml
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
