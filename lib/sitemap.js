import BLOG from '@/blog.config'

export async function generateSitemapXml(allPages) {
  const baseUrl = BLOG.LINK || 'https://hermitong.com'
  
  // 基础路由
  const routes = [
    { path: '', priority: '1.0' },
    { path: 'archive', priority: '0.8' },
    { path: 'category', priority: '0.8' },
    { path: 'tag', priority: '0.8' },
    { path: 'search', priority: '0.6' },
    { path: 'exploration', priority: '0.7' },
    { path: 'eureka', priority: '0.7' },
    { path: 'developlog', priority: '0.7' }
  ]

  // 生成基础页面 URLs
  const defaultUrls = routes.map(route => ({
    loc: `${baseUrl}${route.path ? '/' + route.path : ''}`,
    lastmod: new Date().toISOString(),
    changefreq: route.path === '' ? 'daily' : 'weekly',
    priority: route.priority
  }))

  // 生成文章页面 URLs
  const postUrls = allPages
    ?.filter(post => post.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
    ?.map(post => ({
      loc: `${baseUrl}/${post.slug}`,
      lastmod: new Date(post?.publishDay || new Date()).toISOString(),
      changefreq: 'weekly',
      priority: '0.7',
      image: post.page_cover ? {
        loc: post.page_cover,
        title: post.title || '',
        caption: post.summary || ''
      } : null
    })) || []

  // 合并所有 URLs
  const urls = [...defaultUrls, ...postUrls]

  // 生成 XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    ${url.image ? `
    <image:image>
      <image:loc>${url.image.loc}</image:loc>
      <image:title>${url.image.title}</image:title>
      <image:caption>${url.image.caption}</image:caption>
    </image:image>` : ''}
  </url>`).join('')}
</urlset>`
} 