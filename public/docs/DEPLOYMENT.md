# CeptLens 部署说明

生产 beta 使用 Linux 云服务器、Nginx 和 systemd 运行 Node 服务。公开环境必须使用独立的数据目录、配置文件和模型密钥；公司内网内测环境不能共享数据库或身份令牌。

GitHub Actions 在 Pull Request 和 `main` 合并时运行 `npm ci`、`npm run validate`、`npm test` 和 `npm run build`。生产部署应将构建结果上传到服务器临时目录，启动检查成功后切换当前版本，并保留上一版本用于回滚。

Nginx 负责正式域名、HTTPS 和反向代理；Node 服务只监听本机端口。API Key、部署私钥和内容管理口令只存在于服务器或 GitHub Secrets。数据库按日备份到服务器之外的位置，不要把生产 SQLite 放在 iCloud 同步目录。
