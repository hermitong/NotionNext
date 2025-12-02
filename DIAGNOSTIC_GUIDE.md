# Google Search Console 诊断指南

## 步骤 1: 检查 5xx 错误页面

1. **登录 Google Search Console**
   - 访问: https://search.google.com/search-console
   - 选择 hermitong.com 网站

2. **查看索引问题**
   - 点击左侧菜单: **索引** → **页面**
   - 在"为什么网页不在 Google上"部分找到 **"服务器错误 (5xx)"**
   - 点击该项查看详细信息

3. **导出错误 URL 列表**
   - 点击"服务器错误 (5xx)"
   - 点击右上角的"导出"按钮
   - 下载 CSV 文件保存到: `~/Desktop/AppDev/NotionNext-main/google-console-5xx-errors.csv`

4. **记录以下信息**
   ```
   受影响页面数量: _______
   首次检测时间: _______
   最近检测时间: _______
   错误类型模式: (例如: 所有文章页面、特定分类、首页等)
   ```

---

## 步骤 2: 检查 Vercel 部署日志

### 方法A: 通过 Vercel Dashboard

1. 访问: https://vercel.com/dashboard
2. 找到 hermitong.com 项目
3. 点击进入项目详情
4. 查看以下部分:
   - **Deployments** - 查看最近的部署状态
   - **Logs** (在 Deployments 详情中) - 查看运行时日志
   - **Analytics** → **Errors** - 查看错误统计

5. 寻找以下错误类型:
   ```
   - FUNCTION_INVOCATION_TIMEOUT
   - FUNCTION_INVOCATION_FAILED
   - Internal Server Error (500)
   - Bad Gateway (502)
   - Service Unavailable (503)
   - Gateway Timeout (504)
   ```

6. 截图或复制错误堆栈跟踪

### 方法B: 使用 Vercel CLI (更详细)

在终端运行:

```bash
cd ~/Desktop/AppDev/NotionNext-main

# 安装 Vercel CLI (如果还没安装)
npm install -g vercel

# 登录 Vercel
vercel login

# 链接到项目
vercel link

# 查看最近的日志
vercel logs --follow

# 查看特定部署的日志
vercel logs https://hermitong.com
```

---

## 步骤 3: 检查 Notion API 连接

在 Vercel Dashboard 中:

1. 进入项目 → **Settings** → **Environment Variables**
2. 确认以下变量已正确设置:
   - ✅ `NOTION_PAGE_ID` - 您的 Notion 页面 ID
   - ✅ `NOTION_ACCESS_TOKEN` (如果使用私有页面)

3. 检查 Notion 页面:
   - 确认页面 ID 正确
   - 确认页面为"公开"或已授权给集成
   - 尝试直接访问: `https://notion.so/[您的PAGE_ID]`

---

## 步骤 4: 将收集的信息提供给我

完成以上步骤后，请告诉我:

1. **Google Search Console 信息**
   - 受影响的页面数量
   - 错误 URL 列表 (前 10 个即可，或上传 CSV 文件)
   - 错误页面的共同特征

2. **Vercel 日志信息**
   - 是否看到明确的错误信息？
   - 错误类型 (超时/500/502/503/504)
   - 错误堆栈跟踪 (如果有)

3. **Notion 配置**
   - Notion 页面是否可访问？
   - 环境变量是否已设置？

---

## 常见场景快速诊断

### 场景 1: 所有页面都报错
**可能原因**: 
- ❌ NOTION_PAGE_ID 未设置或错误
- ❌ Notion 页面不可访问

**快速检查**:
```bash
# 检查环境变量是否设置
vercel env ls
```

### 场景 2: 部分文章页面报错
**可能原因**:
- ❌ Notion API 超时 (页面内容过大)
- ❌ 特定页面数据格式问题

**快速检查**:
在 Vercel 日志中搜索报错页面的 slug

### 场景 3: 间歇性报错
**可能原因**:
- ❌ Notion API 速率限制
- ❌ Vercel 函数超时 (免费版5秒限制)

**解决方案**: 增加缓存时间、优化数据获取

### 场景 4: 新部署后开始报错
**可能原因**:
- ❌ 代码变更引入bug
- ❌ 依赖版本冲突

**快速检查**: 回滚到上一个正常的部署

---

## 临时解决方案

如果急需恢复网站，可以:

1. **回滚 Vercel 部署**
   - 在 Vercel Dashboard → Deployments
   - 找到最后一个正常的部署
   - 点击 "..." → "Promote to Production"

2. **使用 URL 检查工具请求重新抓取**
   - 在 Google Search Console 中
   - 使用 URL 检查工具
   - 对报错页面逐个请求"请求编入索引"

---

## 下一步

将以上信息收集完整后，我将:
1. 分析具体错误原因
2. 提供针对性的修复代码
3. 帮助您部署和验证修复效果
