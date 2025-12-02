// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

export const getServerSideProps = async ctx => {
  try {
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

    // 调整缓存时间
    ctx.res.setHeader(
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate=43200'
    ) // 缓存24小时，允许12小时的过期刷新

    return getServerSideSitemap(ctx, fields)
  } catch (error) {
    console.error('生成站点地图时发生错误:', error)
    return {
      notFound: true
    }
  }
}

function generateLocalesSitemap(link, allPages, locale) {
  // 处理语言前缀
  locale = locale ? `/${locale.replace(/^\/+/, '')}` : ''
  
  const dateNow = new Date().toISOString().split('T')[0]
  
  // 扩展基础路由配置
  const routes = [
    { path: '', priority: '1.0' },
    { path: 'archive', priority: '0.8' },
    { path: 'category', priority: '0.8' },
    { path: 'rss/feed.xml', priority: '0.4' },
    { path: 'search', priority: '0.6' },
    { path: 'tag', priority: '0.8' },
    { path: 'exploration', priority: '0.7' },
    { path: 'eureka', priority: '0.7' },
    { path: 'developlog', priority: '0.7' }
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

  // 生成文章页面 URLs，优化图片处理
  const postFields = allPages
    ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
    ?.map(post => {
      const slug = post?.slug?.replace(/^\/+/, '')
      const postUrl = {
        loc: normalizePath(`${link}${locale}/${slug}`),
        lastmod: new Date(post?.publishDay || dateNow).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      }

      // 处理文章图片
      if (post.page_cover) {
        postUrl['image:image'] = [{
          'image:loc': post.page_cover,
          'image:title': post.title || '',
          'image:caption': post.summary || ''
        }]
      }

      // 添加多语言引用
      if (locale) {
        postUrl.alternateRefs = BLOG.LANGS.map(lang => ({
          href: normalizePath(`${link}/${lang}/${slug}`),
          hreflang: lang
        })).filter(alt => alt.hreflang !== locale.replace('/', ''))
      }

      return postUrl
    }) ?? []

  return defaultFields.concat(postFields)
}

// 优化 URL 规范化
function normalizePath(path) {
  return path
    .replace(/([^:]\/)\/+/g, '$1') // 删除多余的斜杠
    .replace(/\/$/, '') // 删除末尾的斜杠
    .replace(/\?$/, '') // 删除末尾的问号
    .replace(/&$/, '') // 删除末尾的 &
    .trim()
}

// 优化 HTTPS URL 处理
function ensureHttpsUrl(url) {
  if (!url) return BLOG.LINK || 'https://hermitong.com'
  url = url.trim().toLowerCase()
  if (url.startsWith('http://')) {
    url = 'https://' + url.slice(7)
  } else if (!url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url.replace(/\/$/, '') // 删除末尾的斜杠
}

// 优化去重函数
function getUniqueFields(fields) {
  const uniqueFieldsMap = new Map()

  fields.forEach(field => {
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
    .filter(field => 
      !field.loc.includes('undefined') && 
      !field.loc.includes('null') &&
      field.loc.startsWith('http')
    )
}

// 添加多语言支持
function addAlternateLanguageLinks(fields, allLocales) {
  return fields.map(field => {
    const alternates = allLocales.map(loc => ({
      hreflang: loc,
      href: field.loc.replace(/\/[a-z]{2}-[A-Z]{2}\//, `/${loc}/`)
    }))
    
    return {
      ...field,
      alternateRefs: alternates
    }
  })
}

// 必须导出默认的 React 组件
export default function Sitemap() {
  return null
}