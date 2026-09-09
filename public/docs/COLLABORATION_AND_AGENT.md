# beta6 · 共享讨论、学习助手与考核接口

## 使用方式

题目、词条正文选中文字后，右键选择“批注”或“问助手”。鼠标选区旁也会显示同样操作，不必记住右键菜单。右下角“讨论”查看本页所有讨论；“学习助手”可自由提问。屏幕较宽时侧栏展开会给正文让出空间；窄屏使用独立面板。

批注保存原文摘录、前后文和位置，正文用原生高亮标记。点击高亮或讨论里的“定位原文”可回到对应位置。文字移动时重新匹配；原文已删除、重复位置无法区分、答案尚未展开时，保留摘录与讨论，提示无法定位，不强行绑定错误位置。不支持原生高亮的浏览器仍可通过讨论列表定位选区。图像、画布内不可选的图形文字不属于 DOM 文本批注。

批注和回复共享，5 秒轮询同步；作者可以修改/撤回自己的文字，讨论发起人可以标记已解决或重新打开。失败时不显示保存成功，本机保留未提交草稿。讨论不会进入题目包或词条包。

助手对话按浏览器身份隔离，服务器保留最近 60 条消息。发送按钮会将问题与面板中明确展示的引用交给已配置模型，点击“移除引用”可不引用当前页。未配置时不发送外部模型请求，记录问题并明确提示不可用；没有模拟答案。

## 三套独立目录

| 目录 | 内容 | 升级要求 |
| --- | --- | --- |
| `content-libraries/questions`、`content-libraries/terms` | 题目、词条教学包 | 保留公司的内容资产 |
| `service-data/` | SQLite：身份、批注、回复、私人对话、答卷 | 停服后整体备份迁移，不覆盖已有库 |
| `agent-runtime/` | 模型配置、专用提示词、扩展代码 | 保留公司本地配置；密钥不进前端、不进 ZIP |

公司访问仍为 `http://100.100.40.76:8765/`；监听 `0.0.0.0:8765`，Node 22.18.0。使用 Node 自带 SQLite，不额外安装数据库或编译第三方本地插件。[Node 22.18 SQLite 文档](https://nodejs.org/download/release/v22.18.0/docs/api/sqlite.html)。该 Node 版本会打印 SQLite 实验性 API 提示，不是启动失败。

`MODELPATH_DATA_DIR` 可指定独立数据目录。不要让两台主机通过 iCloud 同时写同一数据库；生产服务使用主机本地磁盘，停服后再备份。

## 当前身份与边界

右上角设置显示名。浏览器持有随机令牌，服务器只保存它的 SHA-256；不能凭显示名修改他人批注或读取他人答卷。这个机制不是公司 SSO，同名也不代表同一人。清除浏览器站点数据、更换域名/IP或设备后，不能自动找回原身份。公司账号对接应替换 `store.identity` 的解析入口并增加原浏览器身份与公司账号的绑定迁移，不能只换显示名。

当前为可信内网 beta，不是严格防作弊的正式考试系统：学习资源本来就在网站上，考核期间的前端禁用和服务端接口拦截不等于阻止用户换浏览器、开其他资料。正式人事成绩使用前，需确认公司身份、HTTPS/访问边界和考试管理规范。无须人工介入主观题评分；未完成自动评分则保持待评分。

## HTTP 接口

所有以下请求携带 `X-ModelPath-Identity`（48 位随机十六进制令牌）。浏览器端封装在 `src/infrastructure/learningClient.ts`；跨站 Origin 拒绝，写入仅接受 `application/json`。不要把身份令牌放在 URL 或日志里。

| 方法与路径 | 功能 |
| --- | --- |
| `GET /api/session` | 当前身份、活动考试、模型配置状态 |
| `POST /api/session` | `{name}` 更新显示名 |
| `GET /api/discussions?resource=question:ID` | 当前题目全部讨论；词条使用 `term:ID` |
| `POST /api/discussions` | `{id, reference, body}` 创建批注；id 为客户端幂等标识 |
| `POST /api/discussions/:id` | `reply` / `edit` / `withdraw` / `resolve` / `reopen` |
| `GET /api/assistant/history` | 当前身份的私人对话 |
| `POST /api/assistant/ask` | `{id, content, reference?}` 引用/自由提问 |
| `GET /api/exams` | 组卷配置、题量与本人考核记录 |
| `POST /api/exams/start` | `{name}` 开始或恢复已有活动考试 |
| `GET /api/exams/:id` | 本人答卷；交卷前不返回答案和解释 |
| `POST /api/exams/:id/answers` | `{revision, answers}` 保存；版本不匹配返回 409 |
| `POST /api/exams/:id/submit` | 同上；重复交卷返回原结果，不重复计分 |
| `POST /api/exams/:id/grade` | `{}` 对待评分主观题重试；不重新抽卷 |

`reference`：`{resource, title, quote, prefix, suffix, start}`。助手还可携带 `pageText`（最多 24000 字的当前页文本，明确作为不可信参考内容），批注不保存整页副本。正文/回复最多 4000 字，引用最多 2400 字。服务端忽略客户端作者字段，以身份令牌确定作者。

回复示例：`{action:"reply", id:"unique-reply-id", body:"解释内容"}`；修改示例：`{action:"edit", messageId:"...", body:"修订内容"}`；解决示例：`{action:"resolve"}`。

## 接入真实模型

1. 将 `agent-runtime/config.example.json` 复制成同目录的 `config.json`。
2. 设置 `enabled: true`，填写公司批准的 `baseUrl` 和 `model`。`baseUrl` 不含 `/chat/completions`，例如公司的 `/v1` 地址。
3. 在启动服务的终端设置 `MODELPATH_AI_API_KEY`（或配置中的 `apiKeyEnv` 对应变量）。不要写入前端、题目包、词条包或提交到源码库。
4. 重启完整服务。右侧助手显示“已配置”表示配置齐备，不代表模型连通性已经实测。

Windows PowerShell 示例：

```powershell
$env:MODELPATH_AI_API_KEY = "公司提供的密钥"
.\start-lan.bat
```

适配器默认支持 Chat Completions 兼容 HTTP 接口。不同厂商协议只改 `server/agent-service.mjs` 的请求与响应适配，不改前端、题目或词条。可以设置 `MODELPATH_AI_DISABLED=1` 强制禁用外部模型请求。

### 专用 Agent 开发入口

`agent-runtime/extension.mjs` 有三个入口：

- `learningInstruction`：面向平台用户的专用教学要求。
- `prepareContext({reference, tools})`：补充只读上下文，适合接入经过批准的 MCP 数据源或 Skill 文本加载器。默认仅读取当前资源与用户提供的页面文本。
- `tools`：显式白名单工具数组，每项包含 `name`、`description`、JSON Schema `parameters` 和 `execute(args, {tools})`。

平台提供 `tools.readContent("term:id" / "question:id")` 和 `tools.search(query)`。自定义 `execute` 必须验证参数、只读、限定数据范围；不要执行模型输出的脚本/命令或接受任意 URL。最多 3 轮工具调用，每轮最多 4 个；未登记工具直接拒绝。

MCP 客户端和 Skill 执行引擎没有预装，也没有假装接入。开发者可在此引入经过审查的实现。扩展代码仅由主机开发者部署，禁止让普通用户上传执行。题干、引用、批注、工具输出都属于数据，不是替代系统指令的来源。

### 主观题评分

学习助手与评分器使用分离的提示和流程。评分只采用答卷快照内的题干、参考答案、rubric 与 gradingInstruction，不调用学习 Agent 的 MCP/Skill 工具。模型返回每个 rubric 要点的 `index`、`points`、`feedback`；服务端校验条目完整性、分值范围，再归一化到每题 25 分。记录模型名称、逐项反馈和评分时间。

未配置、超时、网络错误、JSON 错误、越界得分均保持待评分，不默认为 0 分，不发布总分。配置后通过答卷页“重试主观题评分”继续，已完成评分的题目不会重复评分。

## 考核规则与数据保留

默认 30 分钟，随机 5 单选、5 多选、2 主观；单选/多选各题 5 分，主观各题 25 分。多选严格全对得分。当前正式库无主观题，开放 10 道客观题的体验卷，完整总成绩为 `null`，不是 50 分折算成 100 分。

开始时保存原题和评分标准快照，后续导入内容不改变已有答卷。服务端保存开始、截止、交卷时间、提交人、答案、评分状态。计时以服务端为准，到时自动封卷；断线期间未抵达主机的答案不计入。浏览器本地仅保留未保存草稿，不能替代主机记录。

考试进行中，批注与助手在 UI 和 API 两层禁用，包括切到另一个学习页面；同一身份不能创建两个活动考试。主观题不足仍可体验，补齐题库后自动使用完整组卷。

## 验证

```sh
npm run check
npm run test:services
```

第二个命令使用真实内容服务和临时数据库，覆盖公司 Host/Origin、双用户批注/回复、隐私隔离、无 API 提示、考试、服务重启持久性。不会向真实模型发送请求，也不会修改正式内容库或已有用户数据库。
