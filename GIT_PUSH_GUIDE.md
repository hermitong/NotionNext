# Git 推送失败 - 解决方案

## 问题
推送代码到 GitHub 时出现 "Permission denied (publickey)" 错误，这是因为 SSH 密钥未配置。

## ✅ 推荐解决方案：设置 SSH 密钥

### 方法 1: 生成新的 SSH 密钥并添加到 GitHub

#### 步骤 1: 生成 SSH 密钥

在终端运行:
```bash
# 生成新的 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 按 Enter 接受默认文件位置
# 可以设置密码或直接按 Enter 跳过
```

#### 步骤 2: 启动 SSH agent 并添加密钥

```bash
# 启动 SSH agent
eval "$(ssh-agent -s)"

# 添加 SSH 密钥到 agent
ssh-add ~/.ssh/id_ed25519
```

#### 步骤 3: 复制 SSH 公钥

```bash
# 复制公钥到剪贴板
pbcopy < ~/.ssh/id_ed25519.pub

# 或者直接显示公钥内容（手动复制）
cat ~/.ssh/id_ed25519.pub
```

#### 步骤 4: 添加 SSH 密钥到 GitHub

1. 访问: https://github.com/settings/keys
2. 点击 "New SSH key"
3. Title: 填写一个描述性名称，例如 "MacBook Pro"
4. Key: 粘贴刚才复制的公钥
5. 点击 "Add SSH key"

#### 步骤 5: 验证连接

```bash
ssh -T git@github.com
```

如果看到 "Hi hermitong! You've successfully authenticated" 说明配置成功！

#### 步骤 6: 推送代码

```bash
cd ~/Desktop/AppDev/NotionNext-main
git push -u origin main
```

---

## 🔄 备选方案：使用 HTTPS 和 Personal Access Token

如果不想配置 SSH，可以使用 HTTPS 方式。

### 步骤 1: 修改远程仓库 URL 为 HTTPS

```bash
cd ~/Desktop/AppDev/NotionNext-main
git remote set-url origin https://github.com/hermitong/NotionNext.git
```

### 步骤 2: 创建 GitHub Personal Access Token

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置:
   - Note: "NotionNext Deploy"
   - Expiration: 选择合适的过期时间
   - Scopes: 勾选 **`repo`** (完整的仓库访问权限)
4. 点击 "Generate token"
5. **重要**: 复制生成的 token（只显示一次！）

### 步骤 3: 推送代码

```bash
cd ~/Desktop/AppDev/NotionNext-main
git push -u origin main
```

当提示输入用户名和密码时:
- Username: `hermitong`
- Password: **粘贴刚才生成的 Personal Access Token** (不是 GitHub 密码)

### 可选: 保存凭据（避免每次输入）

```bash
# macOS 使用 Keychain 保存凭据
git config --global credential.helper osxkeychain
```

---

## 🚀 推送完成后

### Vercel 自动部署

推送成功后，Vercel 会自动检测到新提交并开始部署：

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 进入 hermitong.com 项目
3. 查看 "Deployments" 标签
4. 等待部署完成（通常 1-3 分钟）

### 部署状态检查

**成功标志**:
- Deployment Status: ✅ Ready
- Build Logs: 显示 "Build Completed"
- 访问 https://hermitong.com 应该正常显示，没有 5xx 错误

**如果部署失败**:
- 查看 Build Logs 中的错误信息
- 可能需要检查 Vercel 环境变量配置

---

## 📊 验证修复效果

### 1. 立即测试

部署完成后，使用 Google Search Console 的 URL 检查工具:

1. 访问: https://search.google.com/search-console
2. 在顶部搜索框输入之前报错的 URL
3. 点击 "请求编入索引"
4. 查看是否还有 5xx 错误

### 2. 监控 Vercel 日志

```bash
# 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 登录
vercel login

# 链接项目
cd ~/Desktop/AppDev/NotionNext-main
vercel link

# 实时查看日志
vercel logs --follow
```

### 3. 等待 Google 重新抓取

- Google 通常在 1-2 周内重新抓取页面
- 可以在 Search Console 中手动请求重新抓取加速过程
- 在 "索引" → "页面" 中监控索引状态变化

---

## 🎯 下一步行动

完成推送和部署后:

1. ✅ 验证网站正常运行，没有 5xx 错误
2. ✅ 检查 Vercel 部署日志，确认没有错误
3. ✅ 使用 URL 检查工具测试之前报错的页面
4. 📝 记录修复时间，方便后续跟踪 Google 重新索引的进展
5. 🚀 继续进行阶段二：广告系统集成（建议等待 5xx 错误完全解决后）

---

## ❓ 常见问题

### Q: 推送报错 "error: src refspec master does not match any"
**A**: 默认分支可能是 `main` 而不是 `master`，使用:
```bash
git push -u origin main
```

### Q: HTTPS 推送时一直提示密码错误
**A**: 确保使用的是 Personal Access Token，而**不是** GitHub 登录密码。

### Q: SSH 密钥设置后仍然报错
**A**: 检查 SSH agent 是否运行，并重新添加密钥:
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Q: Vercel 没有自动部署
**A**: 检查 Vercel 项目设置中的 Git Integration，确保:
- 已连接到正确的 GitHub 仓库
- Production Branch 设置为 `main` (或你的主分支名称)

---

## 📞 需要帮助？

如果遇到问题，请提供:
1. 完整的错误信息
2. 运行的命令
3. 当前的操作步骤
