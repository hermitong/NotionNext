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
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200')

    // 生成站点地图
    const sitemap = await generateSitemapXml(allPages)
    
    // 确保没有前置空白字符
    res.status(200).send(sitemap.trim())
  } catch (error) {
    console.error('生成站点地图时发生错误:', error)
    res.status(500).json({ error: '生成站点地图失败' })
  }
} 