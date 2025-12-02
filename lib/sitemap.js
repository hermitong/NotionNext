import BLOG from '@/blog.config'

export async function generateSitemapXml({ allPages, baseUrl }) {
  // 确保使用正确的域名
  baseUrl = 'https://hermitong.com'
  
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
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: route.path === '' ? 'daily' : 'weekly',
    priority: route.priority
  }))

  // 生成文章页面 URLs
  const postUrls = allPages
    ?.filter(post => 
      post.status === BLOG.NOTION_PROPERTY_NAME.status_publish && 
      post.slug && 
      !post.slug.includes('https://') && 
      post.slug !== '#'
    )
    ?.map(post => ({
      loc: `${baseUrl}/${encodeURI(post.slug)}`,
      lastmod: new Date(post?.publishDay || new Date()).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.7'
    })) || []

  // 合并所有 URLs 并确保没有重复
  const urls = [...defaultUrls, ...postUrls]
    .filter((url, index, self) => {
      const isValid = url.loc.startsWith('https://hermitong.com/') && 
                     !url.loc.includes('undefined') && 
                     !url.loc.includes('null');
      return isValid && index === self.findIndex((t) => t.loc === url.loc);
    })

  // 生成 XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`
} 