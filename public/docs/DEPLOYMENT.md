# CeptLens 部署说明

生产 beta 使用 Linux 云服务器、Nginx 和 systemd 运行 Node 服务。公开环境必须使用独立的数据目录、配置文件和模型密钥；公司内网内测环境不能共享数据库或身份令牌。

GitHub Actions 在 Pull Request 和 `main` 合并时运行 `npm ci`、`npm run validate`、`npm test` 和 `npm run build`。生产部署应将构建结果上传到服务器临时目录，启动检查成功后切换当前版本，并保留上一版本用于回滚。

Nginx 负责正式域名、HTTPS 和反向代理；Node 服务只监听本机端口。API Key、部署私钥和内容管理口令只存在于服务器或 GitHub Secrets。数据库按日备份到服务器之外的位置，不要把生产 SQLite 放在 iCloud 同步目录。

## GitHub Secrets

启用自动部署前，在 GitHub 的 `production` Environment 中设置 `CEPTLENS_DEPLOY_HOST`、`CEPTLENS_DEPLOY_USER` 和 `CEPTLENS_DEPLOY_KEY`。服务器需要提供 `/usr/local/bin/ceptlens-deploy`，负责解压到版本目录、运行健康检查、切换 `current` 符号链接、重启 systemd 服务，并在失败时恢复上一版本。私钥只放在 GitHub Secrets，不能写入仓库。
