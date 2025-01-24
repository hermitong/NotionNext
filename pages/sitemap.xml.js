// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

export const getServerSideProps = async ctx => {
  let fields = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')

  for (let index = 0; index < siteIds.length; index++) {
    const siteId = siteIds[index]
    const id = extractLangId(siteId)
    const locale = extractLangPrefix(siteId)
    // 第一个id站点默认语言
    const siteData = await getGlobalData({
      pageId: id,
      from: 'sitemap.xml'
    })
    const link = siteConfig(
      'LINK',
      siteData?.siteInfo?.link,
      siteData.NOTION_CONFIG
    )
    const localeFields = generateLocalesSitemap(link, siteData.allPages, locale)
    fields = fields.concat(localeFields)
  }

  fields = getUniqueFields(fields)

  // 缓存
  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=59'
  )
  return getServerSideSitemap(ctx, fields)
}

function generateLocalesSitemap(link, allPages, locale) {
  // 处理语言前缀
  locale = locale ? `/${locale.replace(/^\/+/, '')}` : ''
  
  const dateNow = new Date().toISOString().split('T')[0]
  
  // 基础路由配置
  const routes = [
    { path: '', priority: '1.0' },
    { path: 'archive', priority: '0.8' },
    { path: 'category', priority: '0.8' },
    { path: 'rss/feed.xml', priority: '0.4' },
    { path: 'search', priority: '0.6' },
    { path: 'tag', priority: '0.8' }
  ]

  // 确保链接使用 https
  link = ensureHttpsUrl(link)

  // 生成基础页面 URLs
  const defaultFields = routes.map(route => ({
    loc: normalizePath(`${link}${locale}${route.path ? '/' + route.path : ''}`),
    lastmod: dateNow,
    changefreq: route.path === '' ? 'daily' : 'weekly',
    priority: route.priority
  }))

  // 生成文章页面 URLs
  const postFields = allPages
    ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
    ?.map(post => {
      const slug = post?.slug?.replace(/^\/+/, '')
      return {
        loc: normalizePath(`${link}${locale}/${slug}`),
        lastmod: new Date(post?.publishDay).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      }
    }) ?? []

  return defaultFields.concat(postFields)
}

function getUniqueFields(fields) {
  const uniqueFieldsMap = new Map()

  fields.forEach(field => {
    // 规范化 URL
    const normalizedField = {
      ...field,
      loc: field.loc.toLowerCase().trim()
    }
    
    const existingField = uniqueFieldsMap.get(normalizedField.loc)
    if (!existingField || new Date(normalizedField.lastmod) > new Date(existingField.lastmod)) {
      uniqueFieldsMap.set(normalizedField.loc, normalizedField)
    }
  })

  return Array.from(uniqueFieldsMap.values())
    .filter(field => !field.loc.includes('undefined') && !field.loc.includes('null'))
}

// 确保 URL 使用 https 协议
function ensureHttpsUrl(url) {
  if (!url) return 'https://hermitong.com'
  url = url.trim().toLowerCase()
  if (url.startsWith('http://')) {
    url = 'https://' + url.slice(7)
  } else if (!url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url
}

// 规范化路径，去除多余的斜杠
function normalizePath(path) {
  return path.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '')
}

// 必须导出默认的 React 组件
export default function Sitemap() {
  return null
}