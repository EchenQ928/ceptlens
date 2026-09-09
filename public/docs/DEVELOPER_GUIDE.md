# 内容开发与接入指南 · beta6

共享批注、主机数据库、助手与主观题评分的配置和接口见 [协作与 Agent 开发指南](COLLABORATION_AND_AGENT.md)。题目包和词条包格式仍为 3.0，不需要为新功能增加任何作者字段。

## 先看结论

新增一道题，只需提交一个 JSON。新增一个词条，只需提交一个至少包含 `manifest.json` 和 `view.tsx` 的 ZIP。作者不填写教学定位、依赖清单、导航清单、设计记录、审查记录或版本状态。

在网站“内容开发”页面可下载模板、编辑或导入题目、导入词条包、导出和删除内容。所有写操作最终保存到广播主机的 `content-libraries/`。

## 题目包

### 必填结构

```json
{
  "schemaVersion": "3.0",
  "id": "stable-question-id",
  "type": "single_choice",
  "stem": "题干中的 [[term:self-attention|自注意力]] 可由作者显式链接。",
  "options": [
    { "key": "A", "text": "选项 A" },
    { "key": "B", "text": "选项 B" }
  ],
  "correctAnswer": ["A"],
  "explanation": "直接解释为什么 A 成立。",
  "taxonomy": {
    "primaryConcept": "自注意力基本机制",
    "modelFamily": "G4 Transformer与Attention",
    "learningLevel": "L1 技术栈基础",
    "engineeringStage": "E0 基础机制与模型计算",
    "priority": "P0"
  },
  "ordering": {
    "order": 10,
    "prerequisites": ["earlier-question-id"]
  }
}
```

真正需要作者判断的内容只有四组：

1. `stem`、`options`、`correctAnswer`、`explanation`：题目正文；
2. `[[term:id|显示文字]]`：哪些文本值得进入独立词条，由作者逐处决定；
3. `taxonomy`：主知识点、模型族、学习层级、工程链路和优先级；
4. `ordering`：全局顺序，以及确有依赖时才填写的前置题目 ID。

`secondaryModelFamilies`、`secondaryEngineeringStages`、`knowledgeTopics`、`taskScenarios`、`optimizationObjectives`、`runtimeEnvironments` 都是可选高级筛选；没有直接依据就不填。

`prerequisites` 也是可选项。它表示“当前题必须在这些题之后出现”，不是相似题或推荐题清单。平台会校验前置题存在且顺序更早。

### 问答题

问答题把 `type` 写成 `subjective`，不需要 `options` 和 `correctAnswer`：

```json
{
  "schemaVersion": "3.0",
  "id": "subjective-question-id",
  "type": "subjective",
  "stem": "请解释该机制。",
  "explanation": "交卷后展示的学习解释。",
  "subjectiveAnswer": {
    "referenceAnswer": "参考答案。",
    "rubric": [
      { "criterion": "说明输入、处理和输出。", "points": 6 },
      { "criterion": "指出工程边界。", "points": 4 }
    ],
    "gradingInstruction": "只有确有特殊评分边界时才填写。"
  },
  "taxonomy": {
    "primaryConcept": "一个主知识点",
    "modelFamily": "G0 通用/跨模型",
    "learningLevel": "L1 技术栈基础",
    "engineeringStage": "E0 基础机制与模型计算",
    "priority": "P1"
  },
  "ordering": { "order": 999 }
}
```

总分由 rubric 自动相加，不填写 `maxScore`。`gradingInstruction` 不需要时直接删掉。

### 显式词条链接

链接可以写在题干、选项、解释、参考答案和评分项中：

```text
[[term:depthwise-convolution|深度卷积]]
```

平台只链接作者明确标记的这段文字，不会扫描普通名词后自动套链接。目标教学包尚不存在时，题目仍可发布，该 ID 会自动出现在词条库的“待补”和 `CONTENT_GAPS.md` 中。

不再填写 `termDependencies`：链接本身就是依赖声明。

## 词条教学包

### 最小包只有两个文件

```text
term-id/
  manifest.json
  view.tsx
```

`manifest.json`：

```json
{
  "schemaVersion": "3.0",
  "sdkVersion": "1.x",
  "id": "term-id",
  "title": "词条名称",
  "summary": "不操作页面也能读懂的一句话定义。",
  "coreConclusion": "读完后必须留下的核心结论。",
  "prerequisites": ["real-prerequisite-id"]
}
```

`aliases` 和 `prerequisites` 都是可选项。前者只用于搜索，后者只在读者确实需要先理解另一个概念时填写。没有就删除。

`view.tsx` 是完全定制的教学页面：

```tsx
import { Paragraph, TermSection, VisualFrame, defineTermView } from "@term-sdk";

function TermBody() {
  return <TermSection id="mechanism" title="输入如何变成输出">
    <Paragraph>{"先用自然语言讲清楚，再放真正有帮助的图或交互。"}</Paragraph>
    <VisualFrame title="这个交互只回答一个问题">
      <p>可替换为本词条专属组件。</p>
    </VisualFrame>
  </TermSection>;
}

export default defineTermView({ termId: "term-id", Component: TermBody });
```

章节目录由 `TermSection` 自动生成。正文中的 `[[term:id|文字]]` 自动变为词条链接并进入缺口检查。

### 按需增加，不要为完整而增加

```text
term-id/
  manifest.json          必需
  view.tsx               必需
  explorer.tsx           可选：专属交互组件
  styles.module.css      可选：本包样式
  assets/                可选：图、数据等资源
  view.test.tsx          可选：复杂交互的源码测试，不放入手工制作的导入 ZIP
```

词条可以只有通俗正文，也可以包含任意数量的专属交互、动画、公式、代码和资源。自由度不来自填写更多元数据，而来自 `view.tsx` 及其包内文件。包内相对导入必须使用 `./`；公共教学组件从 `@term-sdk` 导入。

测试文件属于开发源码，不是页面运行所需内容。复杂交互完成后应在源码中保留测试并执行 `npm run check`；手工制作供网站导入的 ZIP 时，只打包页面运行需要的文件。网站的“导出当前包”会自动排除 `*.test.*` 和 `*.spec.*`。

不再要求 `design.md`、`review.md`、手写 navigation、termDependencies、版本号或发布状态。全局词条设计规范仍是质量准则，但不复制进每个包。

## 导入、更新与删除

1. 启动广播主机，进入“内容开发”。
2. 输入启动终端显示的内容管理口令。
3. 题目可在页面编辑 JSON 或导入 JSON；词条导入 ZIP。
4. 同 ID 自动更新；新 ID 自动新增。
5. 平台内容校验、自动测试和暂存构建全部通过后发布，所有访问者刷新即可看到新内容。失败会恢复原内容与构建；另一项发布正在执行时，稍后重试。

词条删除后，引用它的文字仍保留，但显示为待补教学包。题目可自由删除；若仍被其他题目列为前置，先修改引用方的 `ordering.prerequisites`，避免破坏学习顺序。

## 提交前最小检查

- 题干、答案和解释准确；
- 只给真正需要展开的概念写显式链接；
- 层级按知识树位置，不按题目难度；
- 顺序符合前置关系；
- 词条页面先讲清概念，再使用图或交互；
- 每个交互都只解决一个明确理解障碍；
- 公式使用平台组件正确排版，符号就地解释。
- 实际导入 ZIP 不含测试文件，并用同版本平台完成一次导入校验。

本地执行：

```bash
npm run check
```

题目总数、P0 数量、词条数量和待补数量都允许随内容库变化，不是验收门禁。

## 独立实验室与内容协作

实验室现在单独交付，正式站不包含实验室源码、启动器或副本。把实验室 ZIP 发给协作者即可；他在任意 PC 运行该包的 `start-lab.bat` 或 `bash start-lab.sh`，访问本机 8766 端口。

两个项目分别拥有自己的 `content-libraries/`，不会同步源码或自动互相覆盖。协作者在实验室导入／更新、预览、校验后导出教学 ZIP，**自行打开公司正式站的“内容管理”，使用管理员提供的口令上传**。沿用现有正式导入接口，不增设代收或审批环节。完整说明见 [独立实验室与内容协作](INDEPENDENT_LAB.md)。

词条交互测试应放在该词条包目录内，例如 `teaching.test.tsx`，使用包内 `./` 相对导入。测试文件额外允许从 `vitest`、`react-dom/client` 和 `katex` 导入测试所需函数；这些例外不适用于运行源码。导出运行教学包时仍自动排除测试文件。测试随词条移动或删除，避免公共测试依赖某个固定词条。

`content-production-skills/` 保存两套内容规范，`workflow/content-review/` 保留新 PC 带回的审查记录。历史记录中的旧 Windows 路径仅作为证据。旧 `.modelpath-lab/` 已从正式源码目录移入项目备份目录 `backups/legacy-embedded-lab-20260907/`，草稿可按需恢复到独立实验室。

SDK 的 `CodeBlock` 支持 Python、JavaScript、TypeScript、JSON、Bash 语法高亮；未知语言按普通文本显示。优先填写明确的 `language`，例如 `<CodeBlock language="python" code={source} />`。
