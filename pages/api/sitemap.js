import { generateSitemapXml } from '@/lib/sitemap'
import { getGlobalData } from '@/lib/db/getSiteData'
import BLOG from '@/blog.config'

export default async function handler(req, res) {
  try {
    const siteIds = BLOG.NOTION_PAGE_ID.split(',')
    let allPages = []
    
    // 获取所有页面数据
    for (const siteId of siteIds) {
      const siteData = await getGlobalData({
        pageId: siteId,
        from: 'sitemap-api'
      })
      allPages = allPages.concat(siteData.allPages || [])
    }

    // 设置正确的 Content-Type
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200')

    // 生成站点地图
    const sitemap = await generateSitemapXml({ allPages })
    
    // 确保输出前没有任何空白字符
    res.write(sitemap.trim())
    res.end()
  } catch (error) {
    console.error('生成站点地图时发生错误:', error)
    res.status(500).json({ error: '生成站点地图失败' })
  }
} 