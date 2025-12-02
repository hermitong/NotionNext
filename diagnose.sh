#!/bin/bash

# NotionNext 5xx 错误诊断脚本
# 用途: 自动收集诊断信息

echo "================================"
echo "NotionNext 5xx 错误诊断工具"
echo "================================"
echo ""

# 检查是否在 NotionNext 项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 NotionNext 项目根目录运行此脚本"
    exit 1
fi

echo "📋 收集项目信息..."
echo ""

# 1. 检查 Node.js 和 npm 版本
echo "1️⃣ Node.js 环境:"
echo "   Node 版本: $(node -v)"
echo "   npm 版本: $(npm -v)"
echo ""

# 2. 检查项目版本
echo "2️⃣ 项目信息:"
PROJECT_VERSION=$(grep '"version"' package.json | head -1 | awk -F '"' '{print $4}')
echo "   NotionNext 版本: $PROJECT_VERSION"
NEXT_VERSION=$(grep '"next"' package.json | grep -o '"[0-9.]*"' | head -1 | tr -d '"')
echo "   Next.js 版本: $NEXT_VERSION"
echo ""

# 3. 检查环境变量文件
echo "3️⃣ 环境配置:"
if [ -f ".env.local" ]; then
    echo "   ✅ 找到 .env.local"
    # 检查关键配置(不显示完整值)
    if grep -q "NOTION_PAGE_ID" .env.local; then
        echo "   ✅ NOTION_PAGE_ID 已配置"
    else
        echo "   ⚠️  NOTION_PAGE_ID 未配置"
    fi
elif [ -f ".env" ]; then
    echo "   ✅ 找到 .env"
    if grep -q "NOTION_PAGE_ID" .env; then
        echo "   ✅ NOTION_PAGE_ID 已配置"
    else
        echo "   ⚠️  NOTION_PAGE_ID 未配置"
    fi
else
    echo "   ⚠️  未找到环境变量文件 (.env 或 .env.local)"
    echo "   提示: Vercel 部署时使用的是 Vercel 环境变量，本地缺失不影响线上"
fi
echo ""

# 4. 检查 blog.config.js 配置
echo "4️⃣ 博客配置 (blog.config.js):"
if [ -f "blog.config.js" ]; then
    AUTHOR=$(grep "AUTHOR:" blog.config.js | head -1 | awk -F "'" '{print $2}')
    THEME=$(grep "THEME:" blog.config.js | head -1 | awk -F "'" '{print $2}')
    LANG=$(grep "LANG:" blog.config.js | head -1 | awk -F "'" '{print $2}')
    echo "   作者: $AUTHOR"
    echo "   主题: $THEME"
    echo "   语言: $LANG"
fi
echo ""

# 5. 检查依赖是否安装
echo "5️⃣ 依赖检查:"
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules 已存在"
    MODULE_COUNT=$(ls -1 node_modules | wc -l | xargs)
    echo "   已安装模块数: $MODULE_COUNT"
else
    echo "   ❌ node_modules 不存在"
    echo "   需要运行: npm install"
fi
echo ""

# 6. 尝试本地构建测试
echo "6️⃣ 本地构建测试:"
echo "   运行: npm run build (这可能需要几分钟...)"
echo ""

# 创建临时日志文件
BUILD_LOG="/tmp/notionnext-build-$(date +%s).log"

# 运行构建并捕获输出
if npm run build > "$BUILD_LOG" 2>&1; then
    echo "   ✅ 构建成功！"
    echo ""
    echo "   📊 构建统计:"
    grep "Route" "$BUILD_LOG" | tail -5
else
    echo "   ❌ 构建失败！"
    echo ""
    echo "   错误信息:"
    tail -50 "$BUILD_LOG"
    echo ""
    echo "   完整日志已保存至: $BUILD_LOG"
fi
echo ""

# 7. 检查 Vercel CLI
echo "7️⃣ Vercel CLI:"
if command -v vercel &> /dev/null; then
    echo "   ✅ Vercel CLI 已安装 ($(vercel --version))"
    echo ""
    echo "   可用命令:"
    echo "   - vercel login        # 登录 Vercel"
    echo "   - vercel link         # 链接到项目"
    echo "   - vercel env ls       # 查看环境变量"
    echo "   - vercel logs         # 查看部署日志"
else
    echo "   ⚠️  Vercel CLI 未安装"
    echo "   安装命令: npm install -g vercel"
fi
echo ""

# 8. 生成诊断报告
REPORT_FILE="diagnostic-report-$(date +%Y%m%d-%H%M%S).txt"
echo "================================" > "$REPORT_FILE"
echo "NotionNext 诊断报告" >> "$REPORT_FILE"
echo "生成时间: $(date)" >> "$REPORT_FILE"
echo "================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 将所有信息写入报告
{
    echo "Node 版本: $(node -v)"
    echo "npm 版本: $(npm -v)"
    echo "NotionNext 版本: $PROJECT_VERSION"
    echo "Next.js 版本: $NEXT_VERSION"
    echo ""
    echo "环境变量文件:"
    if [ -f ".env.local" ] || [ -f ".env" ]; then
        echo "  存在"
    else
        echo "  不存在"
    fi
    echo ""
    echo "最近的 git 提交:"
    git log --oneline -5 2>/dev/null || echo "  未使用 git"
    echo ""
    echo "package.json 依赖:"
    cat package.json
} >> "$REPORT_FILE"

echo "📄 诊断报告已生成: $REPORT_FILE"
echo ""

# 9. 提供下一步建议
echo "================================"
echo "🔍 下一步建议:"
echo "================================"
echo ""
echo "1. 检查 Google Search Console:"
echo "   → https://search.google.com/search-console"
echo "   → 索引 → 页面 → 服务器错误 (5xx)"
echo ""
echo "2. 检查 Vercel Dashboard:"
echo "   → https://vercel.com/dashboard"
echo "   → 选择项目 → Deployments → Logs"
echo ""
echo "3. 如果本地构建成功但线上报错，可能是:"
echo "   • Vercel 环境变量未配置"
echo "   • Notion API 连接问题"
echo "   • 函数执行超时"
echo ""
echo "4. 将诊断报告和错误日志发送给开发者以获得帮助"
echo ""
echo "================================"

echo "✅ 诊断完成！"
