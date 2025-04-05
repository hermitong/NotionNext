import BLOG from '@/blog.config'

export async function generateSitemapXml({ allPages }) {
  const baseUrl = 'https://hermitong.com' // 固定使用正确的域名
  
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

  // 生成文章页面 URLs，添加 URL 编码和验证
  const postUrls = allPages
    ?.filter(post => 
      post.status === BLOG.NOTION_PROPERTY_NAME.status_publish && 
      post.slug && 
      !post.slug.includes('https://') && // 过滤掉包含完整URL的slug
      post.slug !== '#' // 过滤掉无效的slug
    )
    ?.map(post => ({
      loc: `${baseUrl}/${encodeURI(post.slug)}`, // 对中文路径进行编码
      lastmod: new Date(post?.publishDay || new Date()).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.7'
    })) || []

  // 合并所有 URLs 并确保没有重复，同时验证 URL 格式
  const urls = [...defaultUrls, ...postUrls]
    .filter((url, index, self) => {
      // 确保 URL 是有效的且没有重复
      const isValid = url.loc.startsWith('https://hermitong.com/') && 
                     !url.loc.includes('undefined') && 
                     !url.loc.includes('null') &&
                     !url.loc.includes('https://hermitong.com/https://');
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