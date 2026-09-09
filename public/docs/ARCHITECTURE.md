# ModelPath beta6 架构

内容实验室已拆为独立的 `content-lab` 项目，正式平台不再包含实验室入口、启动器或内容副本。实验室只携带兼容的教学 SDK、内容展示与包工具；协作者自行从正式平台已有的内容管理界面上传导出的 ZIP。运行中的两个站点不互相依赖源码或目录。

## 服务状态与模型接口

`server/learning-api.mjs` 提供批注、私人对话和考核 HTTP 接口；`community-store.mjs` 负责主机 SQLite；`exam-engine.mjs` 负责抽卷、快照、计分；`agent-service.mjs` 隔离学习生成与主观题评分。UI 对应独立的讨论面板、助手面板和考核视图。

`service-data/` 与 `agent-runtime/` 独立于下面的内容资产。共享批注不会改写教学包，内容发布也不替换服务数据库。原文字段的定位由通用组件完成，不要求词条作者改造交互实现。完整接口见 [协作与 Agent 指南](COLLABORATION_AND_AGENT.md)。

## 三个独立部分

```text
网站程序
  ├─ 读取题库 questions/
  ├─ 读取词条库 terms/
  └─ 提供学习、考核和内容管理

题库 questions/
  └─ 统一 JSON：题目正文 + 显式词条链接 + 分类 + 排序

词条库 terms/
  └─ 定制教学包：最小清单 + 自由 React 教学页面
```

网站升级不能覆盖 `content-libraries/questions/` 与 `content-libraries/terms/`。同事导入内容后，文件保存在广播主机的这两个目录中；换版本时迁移整个 `content-libraries/` 即可。

## 题目为什么统一、词条为什么不统一

题目的稳定交互就是题干、选项或作答区、答案和解释，因此用统一 JSON 能降低协作成本。词条需要针对概念选择静态图、动画、计算过程或自定义实验，不能压成同质化 JSON，所以每个词条都可以提供自己的 React 组件、CSS 和资源。

## 作者只声明一次

- `[[term:id|文字]]` 是唯一的正文链接来源；依赖索引和待补清单自动生成。
- 问答题总分由 rubric 各项分值相加，不重复填写。
- 词条页目录由 `TermSection` 自动登记，不维护 navigation 清单。
- 题目没有“教学定位”字段；主知识点、层级、工程链路和优先级已经承担该信息。

## 发布事务

导入、更新或删除内容时，广播主机会先暂存变更，然后依次执行内容校验、自动测试和生产构建。只有全部通过才替换线上构建；失败会回滚内容文件与构建。与 beta3～4 一样使用 Node 内容服务，以支持主机持久化导入；不能换成只有静态文件服务的 Python 启动方式。

公司脚本监听 `0.0.0.0:8765`，公布地址为 `http://100.100.40.76:8765/`。浏览器界面、日志及内容状态接口的版本均来自 `package.json`，避免手写版本号不一致。

删除词条包后，原显式链接会自动变为“待补词条”。删除题目不受题量、优先级或固定编号限制；只有当其他题目仍把它声明为排序前置时，系统才拒绝并指出断链。

## 内容接口

- `POST /api/content/questions/import`：导入单题或题库 JSON；同 ID 为更新。
- `DELETE /api/content/questions/:id`：删除题目。
- `GET /api/content/questions/export`：导出完整题库。
- `POST /api/content/terms/import`：导入词条教学包 ZIP；同 ID 为更新。
- `DELETE /api/content/terms/:id`：删除词条教学包。
- `GET /api/content/terms/:id/export`：导出单个教学包。
- `GET /api/content/terms/export`：导出完整词条库。
- `GET /api/content/templates/term`：下载最小词条包模板。

写操作需要启动终端显示的内容管理口令。
