import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from './config'

/**
 * 确保URL使用HTTPS协议
 * @param {string} url
 * @returns {string}
 */
function ensureHttps(url) {
  if (!url) return url
  // 如果URL不包含协议，添加https://
  if (!url.startsWith('http')) {
    return `https://${url}`
  }
  // 将http://替换为https://
  return url.replace(/^http:\/\//i, 'https://')
}

/**
 * 生成站点地图
 * @param {*} param0
 */
export async function generateSitemapXml({ allPages, NOTION_CONFIG }) {
  const link = ensureHttps(siteConfig('LINK', BLOG.LINK, NOTION_CONFIG))
  const urls = [
    {
      loc: `${link}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${link}/archive`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${link}/category`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily'
    },
    {
      loc: `${link}/tag`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily'
    }
  ]

  // 循环页面生成
  allPages?.forEach(post => {
    const slugWithoutLeadingSlash = post?.slug?.startsWith('/')
      ? post?.slug?.slice(1)
      : post.slug
    urls.push({
      loc: `${link}/${slugWithoutLeadingSlash}`,
      lastmod: new Date(post?.publishDay).toISOString().split('T')[0],
      changefreq: 'daily'
    })
  })

  const xml = createSitemapXml(urls)
  try {
    fs.writeFileSync('sitemap.xml', xml)
    fs.writeFileSync('./public/sitemap.xml', xml)
    console.log('站点地图生成成功')
  } catch (error) {
    console.warn('无法写入文件', error)
  }
}

/**
 * 生成站点地图
 * @param {*} urls
 * @returns
 */
function createSitemapXml(urls) {
  let urlsXml = ''
  urls.forEach(u => {
    urlsXml += `<url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    ${u.priority ? `<priority>${u.priority}</priority>` : ''}
    </url>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${urlsXml}
    </urlset>`
}