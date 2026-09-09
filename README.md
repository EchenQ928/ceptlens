# CeptLens

CeptLens 是一个通过可视化、交互式词条和练习题帮助人理解复杂技术概念的开源学习平台。当前版本从 CeptLens beta6 原型整理而来，处于早期 beta 阶段，首个重点方向是 AI 模型工程知识。

## 本地运行

需要 Node.js 22.18.0 或更高版本：

```bash
npm ci
npm run check
npm run dev
```

浏览器访问 http://127.0.0.1:8765/。生产环境请参阅 `public/docs/DEPLOYMENT.md`。

## 项目结构

- `src/`：前端应用和学习界面
- `server/`：内容服务、讨论、助手和考核接口
- `content-libraries/`：公开题目与词条教学包
- `public/docs/`：架构、内容开发和部署说明
- `agent-runtime/`：模型配置模板；真实配置不提交

## 当前限制

这是早期 beta，不是正式考试系统。模型助手默认关闭；用户数据库、API 密钥和内测数据不属于公开仓库。公司内网内测环境与公开站点使用独立的数据目录和配置。

## 参与贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
