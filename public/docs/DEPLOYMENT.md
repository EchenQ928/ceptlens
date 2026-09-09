# CeptLens 部署说明

生产 beta 使用 Linux 云服务器、Nginx 和 systemd 运行 Node 服务。公开环境必须使用独立的数据目录、配置文件和模型密钥；公司内网内测环境不能共享数据库或身份令牌。

GitHub Actions 在 Pull Request 和 `main` 合并时运行 `npm ci`、`npm run validate`、`npm test` 和 `npm run build`。生产部署应将构建结果上传到服务器临时目录，启动检查成功后切换当前版本，并保留上一版本用于回滚。

服务验收还运行 `npm run test:services`，覆盖 HTTPS 代理后的同源请求、跨站请求拒绝、内容管理鉴权、讨论与考核持久化。部署包通过 `git archive` 生成，只包含当前提交中的文件，输出在工作目录以外。

Nginx 负责正式域名、HTTPS 和反向代理；Node 服务只监听本机端口。API Key、部署私钥和内容管理口令只存在于服务器或 GitHub Secrets。数据库按日备份到服务器之外的位置，不要把生产 SQLite 放在 iCloud 同步目录。

## GitHub Secrets

启用自动部署前，在 GitHub 的 `production` Environment 中设置 `CEPTLENS_DEPLOY_HOST`、`CEPTLENS_DEPLOY_USER` 和 `CEPTLENS_DEPLOY_KEY`。服务器需要提供 `/usr/local/bin/ceptlens-deploy`，负责解压到版本目录、运行健康检查、切换 `current` 符号链接、重启 systemd 服务，并在失败时恢复上一版本。私钥只放在 GitHub Secrets，不能写入仓库。

| Environment secret | 值 |
| --- | --- |
| `CEPTLENS_DEPLOY_HOST` | ECS 公网地址 |
| `CEPTLENS_DEPLOY_USER` | 服务器部署用户 |
| `CEPTLENS_DEPLOY_KEY` | 部署专用 SSH 私钥的完整多行内容，含首尾标记 |

私钥对应的公钥加入部署用户的 `~/.ssh/authorized_keys`。这不是 GitHub PAT，也不是阿里云 AccessKey。

## 服务器配置

1. 安装 Node.js 22.18 或更高版本，并确认 `sudo node -v` 也是受支持的版本。
2. 创建 `ceptlens` 系统服务用户；数据目录 `/var/lib/ceptlens` 归该用户所有。创建 `/srv/ceptlens/releases`，允许部署用户上传压缩包。
3. 将 `deploy/ceptlens-deploy.sh` 安装为 root 所有、权限 755 的 `/usr/local/bin/ceptlens-deploy`。部署用户需要执行该脚本的 sudo 权限。
4. 将 `deploy/ceptlens.service.example` 安装为 `/etc/systemd/system/ceptlens.service`，执行 `systemctl daemon-reload`、`systemctl enable ceptlens`。
5. 创建权限为 600 的 `/etc/ceptlens/ceptlens.env`，写入以下配置，并用随机值设置 `CEPTLENS_CONTENT_TOKEN`：

```ini
NODE_ENV=production
CEPTLENS_DATA_DIR=/var/lib/ceptlens
CEPTLENS_PUBLIC_ORIGIN=https://ceptlens.com
CEPTLENS_AI_DISABLED=1
```

6. 初次发布成功、`http://127.0.0.1:8765/api/content/status` 返回 JSON 后，安装 `deploy/nginx.conf.example`。它要求现有证书覆盖主域名和 www；替换成自己的域名和证书路径后，执行 `nginx -t` 和 `systemctl reload nginx`。

Nginx 把页面和 API 都代理到本机 Node 服务，www 跳转到主域名。`CEPTLENS_PUBLIC_ORIGIN` 必须与 HTTPS 域名完全一致，不能带末尾斜杠。它用于同源验证，不能通过删除请求的 Origin 来绕过验证。

## 发布与回滚

推送 `main` 后，Deploy 工作流会检查、上传、构建并启动新的版本。脚本保存前一版本，启动或健康检查失败时切回前一版本。首次发布没有旧版本时会停止失败的服务。发布之间使用锁避免并发切换。

用户数据库固定放在 `/var/lib/ceptlens`，不会随源码版本切换。源码以 GitHub 为准，线上内容编辑也应同步回仓库后再发布。版本目录暂不自动删除，以保留回滚依据；可在确认新版本稳定并备份数据后清理不用的历史目录。

验收检查 `/` 的 HTML、`/api/content/status` 的 JSON 和 `/api/session` 的 HTTPS 同源请求。`systemctl is-active ceptlens` 必须显示 active。AI 默认关闭，需要单独配置模型与密钥后才可使用。
