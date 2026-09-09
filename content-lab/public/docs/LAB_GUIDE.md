# 独立内容实验室开发指南

## 两个独立网站，一种内容包

实验室只处理本机草稿。正式站处理共享内容、学习和考核。两者没有父子目录要求，不共用进程、口令或用户数据。

协作者的流程是：**实验室设计与预览 → 导出 ZIP → 自行打开正式站内容管理并输入获授权的口令 → 上传发布**。不需要把 ZIP 交给管理员代传；实验室也不会代存正式口令。

正式站地址：http://100.100.40.76:8765/#/developer 。管理口令是正式站的内容写入凭据，只向可信的内容开发同事提供。

## 导入、修改和导出

- 词条页上方“导入／替换词条 ZIP”：一次一个完整教学包。同 ID 会确认替换当前本机草稿，新 ID 新建。实验室不需要正式内容管理口令。
- “下载词条模板”：得到最小教学包。在文件编辑器或开发会话中修改，允许任意针对该概念的 React 组件、图、公式和交互，不限制统一正文模块。
- 编辑已导入内容：`content-libraries/terms/<id>/view.tsx` 是主入口，其余代码和资源也在该文件夹内。全部保存后点击“校验与刷新”；内容文件不再逐个热更新，避免读取半成品。ZIP 导入成功后当前页面自动刷新，其他已打开标签页可点击“校验与刷新”。实验室是预览和包管理工具，不是网页代码编辑器。
- 导入在临时副本完成格式检查、测试、类型检查与构建，通过后才保存到当前草稿库。失败提示不会覆盖现有草稿；校验期间若手工修改文件，本次操作会取消，以免覆盖并行修改。
- “导出当前词条”：校验后下载 `<id>.term.zip`，运行包中保留正文、可视化、样式和资源，自动去掉测试文件。导出的是刚刚通过检查的快照。导出后直接去正式站上传即可。
- “移除本机草稿”：二次确认后删除本机内容文件。需要恢复时重新导入此前导出的备份，不影响正式站。

不要在校验过程中编辑包文件。报错时先修正对应文件，再点击校验或重试导入。只有运行可信协作者制作的包：教学包是可执行源码，导入校验不是恶意代码沙箱。

## 词条包结构

```text
my-term/
  manifest.json
  view.tsx
  explorer.tsx          可选：专属交互
  styles.module.css    可选：局部样式
  assets/              可选：图、数据等
  teaching.test.tsx    可选：开发测试，导出时排除
```

```json
{
  "schemaVersion": "3.0",
  "sdkVersion": "1.x",
  "id": "my-term",
  "title": "词条名称",
  "summary": "先让初学者知道这个概念是什么。",
  "coreConclusion": "读者理解后应掌握的核心结论。"
}
```

`aliases`（搜索别名）和 `prerequisites`（前置词条 ID）可选。不要填写设计记录、审查记录、手工目录或手工依赖表。文件夹名、`manifest.id`、`view.tsx` 导出的 `termId` 一致。

```tsx
import { defineTermView, Paragraph, TermSection } from "@term-sdk";
import { useState } from "react";

function Body() {
  const [opened, setOpened] = useState(false);
  return <TermSection id="example" title="具体例子">
    <Paragraph>{"先说明当前对象和问题，再展示计算或交互。"}</Paragraph>
    <button onClick={() => setOpened(!opened)}>展开例子</button>
    {opened && <p>这里可以替换为专为本概念设计的可视化。</p>}
  </TermSection>;
export default defineTermView({ termId: "my-term", Component: Body });
```

词条能独立阅读，不依赖某一道题或上个页面的说明。`TermSection` 自动生成本页目录，但不是必填正文模板。

## 公式、代码和显式链接

公共组件从 `@term-sdk` 导入：`Paragraph`、`TermText`、`TermSection`、`Formula`、`CodeBlock`、`VisualFrame` 等。完整类型与实现位于 `src/content-sdk/index.tsx`；已有定制视图可以继续使用同版本 SDK 接口。

```tsx
<Formula expression={String.raw`y = wx + b`} symbols={[
  { symbol: "x", meaning: "输入" },
  { symbol: "w", meaning: "乘在输入上的权重" },
  { symbol: "b", meaning: "相加的偏置" },
  { symbol: "y", meaning: "计算结果" }
]} />
<Paragraph>{"需要进一步解释时，显式写 [[term:another-term|概念名称]]。"}</Paragraph>
```

链接只在 `Paragraph`、`TermText`、平台富文本字段等支持富文本的地方解析，不会把普通 JSX 文本中的所有名词自动链接。目标包未导入时显示待补，索引写入 `content-libraries/CONTENT_GAPS.md`。按需导入前置包即可检查继续探索与返回，不要求共享词条按某题重新组织。

包内相对导入使用 `./`，不能越出包目录。可导入 `react`、`lucide-react`、`@term-sdk`；不能随意引用实验室或正式站私有模块。图片、CSS Modules、JSON 数据等都放在包内。外部新依赖需要先扩展两站共同支持的 SDK，而不是把 `node_modules` 塞进教学 ZIP。

复杂交互可附带 `*.test.ts(x)`；测试额外允许 `vitest`、`react-dom/client` 和 `katex`。导入测试文件可以保留在本机源码中，但正式运行导出会自动排除它们。

## 题目

切换到“题目”后导入单题 JSON 或 `question-bundle`。题目保留 `schemaVersion`、`id`、`type`、`stem`、答案解释、`taxonomy` 和 `ordering`；字段格式与正式站完全一致。模板在 `content-libraries/templates/`。

单选、多选分别用 `single_choice`、`multiple_choice`，有 `options`、`correctAnswer`。问答用 `subjective` 与 `subjectiveAnswer.referenceAnswer/rubric`，每条 rubric 包含 `criterion` 和 `points`。预览可以试答和展开解释，但不产生考试成绩。

`ordering.order` 在同一库内唯一；有前置题时必须先导入该题且排列更早。正文中的词条链接仍使用 `[[term:id|显示名称]]`，不存在的词条不阻止导入。

## 迁移与兼容

作者只需备份自己的 `content-libraries/`。实验室升级用新目录解压，再按 ID 合并草稿；旧版本 `.modelpath-lab/content-libraries/` 也是内容来源，不是新实验室必须依赖的目录。

实验室与正式站通过 3.0 包格式、1.x 教学 SDK 兼容，运行依赖锁定且支持 Node 22.18.0。实验室 ZIP 不附正式站源码、题库、用户数据、口令和历史审查记录；无需连上公司平台也可以设计和预览。

现在的实验室已支持现有 beta6 正式站导入接口，不要求先升级公司站才能接收其教学包。平台可能存在额外内容依赖或同 ID 内容，最终发布仍以正式站自己的校验结果为准。
