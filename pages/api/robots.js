import BLOG from '@/blog.config'

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300')

  const content = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

# Sitemap
Sitemap: https://hermitong.com/sitemap.xml`

  res.status(200).send(content)
} 