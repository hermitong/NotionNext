import fs from 'fs'
import BLOG from '@/blog.config'

export async function generateRobotsTxt() {
  const content = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

# Host
Host: https://hermitong.com

# Sitemap
Sitemap: https://hermitong.com/sitemap.xml
`

  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('./public/robots.txt', content)
    console.log('robots.txt 生成成功')
  } catch (error) {
    console.warn('robots.txt 生成失败:', error)
  }
}
