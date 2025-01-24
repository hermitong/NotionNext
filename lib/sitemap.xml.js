import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from './config'

/**
 * 清理和规范化URL
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  // 移除开头的http://或https://
  url = url.replace(/^(https?:\/\/)?hemitong\.com\//, '')
  // 确保使用https
  return `https://hermitong.com/${url}`.replace(/\/+/g, '/').replace(/^https:\/\/hermitong\.com\/$/, 'https://hermitong.com')
}

/**
 * 生成站点地图
 * @param {*} param0
 */
export async function generateSitemapXml({ allPages, NOTION_CONFIG }) {
  const baseUrl = 'https://hermitong.com'
  
  // 基础页面URLs
  const baseUrls = [
    '',
    'archive',
    'category',
    'tag',
    'search',
    'rss/feed.xml',
    'exploration',
    'eureka',
    'developlog'
  ].map(path => ({
    loc: `${baseUrl}${path ? '/' + path : ''}`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: path === '' ? '1.0' : '0.7'
  }))

  // 文章页面URLs
  const pageUrls = allPages?.map(post => ({
    loc: normalizeUrl(`${baseUrl}/${post.slug}`),
    lastmod: new Date(post?.publishDay).toISOString().split('T')[0],
    changefreq: 'daily',
    priority: '0.7'
  })) || []

  // 合并所有URLs并去重
  const urls = [...baseUrls, ...pageUrls]
    .filter((url, index, self) => 
      index === self.findIndex((t) => t.loc === url.loc)
    )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`

  try {
    fs.writeFileSync('public/sitemap.xml', xml)
    console.log('站点地图生成成功')
  } catch (error) {
    console.warn('无法写入文件', error)
  }
}