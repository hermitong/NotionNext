import { generateSitemapXml } from '@/lib/sitemap'
import { getGlobalData } from '@/lib/db/getSiteData'
import BLOG from '@/blog.config'

export default async function handler(req, res) {
  try {
    const siteIds = BLOG.NOTION_PAGE_ID.split(',')
    let allPages = []
    
    for (const siteId of siteIds) {
      const siteData = await getGlobalData({
        pageId: siteId,
        from: 'sitemap-api'
      })
      if (siteData?.allPages) {
        allPages = allPages.concat(siteData.allPages)
      }
    }

    // 设置正确的响应头
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    
    // 生成站点地图
    const sitemap = await generateSitemapXml({ allPages })
    
    // 直接发送响应
    res.status(200).send(sitemap)
  } catch (error) {
    console.error('生成站点地图时发生错误:', error)
    res.status(500).json({ error: '生成站点地图失败' })
  }
} 