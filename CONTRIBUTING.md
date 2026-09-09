# 贡献指南

使用 Node.js 22.18.0 或更高版本，在仓库根目录运行 `npm ci`，再运行 `npm run check`。

题目放在 `content-libraries/questions/`，词条教学包放在 `content-libraries/terms/`。请遵循 `public/docs/DEVELOPER_GUIDE.md`，并在提交前完成内容校验。

从 `main` 创建短期分支。提交信息使用 `feat`、`fix`、`docs`、`content` 或 `refactor` 前缀。Pull Request 应说明行为变化、测试结果和可能的数据迁移影响。

不要提交 API Key、`.env`、真实用户数据、SQLite 数据库、公司内部资料、运行口令或 `node_modules/`。
