# beta6 · Node 22.18.0 兼容说明

公司现有 Node.js 22.18.0 可继续使用。beta6 沿用 beta1～4 的主要运行库版本，并保留新 PC 新增的功能。

| 依赖 | beta1～4 的交付锁文件 | beta6 | 原因 |
| --- | --- | --- | --- |
| React / React DOM | 19.2.8 | 19.2.8 | 沿用 |
| React Router | 7.18.3 | 7.18.3 | 沿用 |
| Vite | 8.2.2 | 8.2.2 | 沿用，支持 Node 22.18 |
| Vitest | 4.1.11 | 4.1.11 | 沿用 |
| TypeScript | 7.0.2 | 7.0.2 | 沿用 |
| jsdom | 30.0.1 | 26.1.0 | 新增浏览器交互测试需要在 Node 22.18 下实际运行 |
| @types/node | 26.4.0 | 22.18.0 | 对齐公司运行环境 |
| highlight.js | 未包含 | 11.12.0 | 保留新 PC 的代码高亮 |
| rolldown | 1.2.6，间接依赖 | 1.2.6，显式依赖 | 保留新 PC 的源码导入检查 |

旧版能在公司正常展示，与锁文件里的 jsdom 声明要求更高 Node 并不矛盾：beta1～2 使用 Python 服务预构建页面，beta3～4 的发布流程还没有运行新增加的 jsdom 浏览器测试。beta6 保留测试与发布验证，并为它们锁定兼容依赖。

`prepare-runtime.mjs` 接受 Node 22.18.0，检查全部直接依赖；缺失或版本不一致时执行 `npm ci --engine-strict --include=dev`。重新安装不会删除题库或词条库，测试/构建工具也是运行内容发布所需的依赖。

验证使用官方 Node v22.18.0 macOS ARM64 运行时与 npm 10.9.3。锁文件全部 Node 引擎声明接受 22.18.0；Windows 原生依赖记录保留。公司 Windows 的实际入站网络不能在本机代测，部署时按公司地址打开页面核验。

## beta6 数据库

共享服务采用 Node 22.18.0 自带的 `node:sqlite`，没有引入需另行编译的第三方数据库依赖。启动时的 ExperimentalWarning 是此 Node 版本的 API 状态提示，不是服务启动失败。真实主机启动和双用户持久化测试均在同版本 Node 下执行；Windows 现场仍需验证。
