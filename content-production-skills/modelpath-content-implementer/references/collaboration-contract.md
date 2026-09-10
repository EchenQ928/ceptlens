# 实现—监督协作契约

## 权威状态

共享目录为 `<project>/workflow/content-review/`。跨会话消息只负责通知，不承载唯一结论。

```text
content-review/
  active/<job-id>/
    job.json
    baseline/
    handoff-r<N>.json
    review-r<N>.json
  review-history.jsonl
  session-map.local.json
```

`baseline/` 只在活动期保存原题或返修前快照，用于人工校准和独立复验。题目包与词条包内不得出现这些记录。

## job.json

```json
{
  "schemaVersion": "1.0",
  "jobId": "stable-job-id",
  "questionId": "question-id",
  "revision": 1,
  "status": "awaiting_human_review",
  "artifacts": [
    { "kind": "question", "id": "question-id", "path": "content-libraries/questions/file.json" }
  ],
  "currentHandoff": "handoff-r1.json"
}
```

`status` 只允许：`implementing`、`awaiting_human_review`、`awaiting_supervisor`、`revision_required`、`approved`。

## handoff-r<N>.json

实现者提交：

- 与 `job.json.revision` 相同的 revision；
- 本轮实际修改的 artifact 路径；
- 原题或来源路径；
- 已执行检查的命令、结果和证据边界；
- 已知不确定项，没有则为空数组。

不得写“终审通过”。提交后把状态改为对应的 `awaiting_*`，再向审查会话发送包含 job ID、revision 和目录路径的短消息。

## review-r<N>.json

审查方必须记录：

- 与当前任务相同的 revision；
- `verdict`：`pass` 或 `return`；
- 每个 artifact 的独立 verdict；
- 阻塞问题：artifact、观察证据、违反原则、影响、要求达到的结果、复验方法；
- 非阻塞建议；
- 形式学习链检查；
- 普适规范候选，不得直接修改 Skill。

revision 不匹配的审查无效。`return` 将状态设为 `revision_required`；实现者返修前把 revision 加一并创建新的 handoff。旧文件保留到当前任务最终关闭。

## 词条独立性与整体检查

整体检查只覆盖链接目标、缺口登记、进入与返回路径以及题目是否把词条当附属解析。每个词条的内容单独审查，监督者不得要求它围绕当前题目或相邻词条组织。

## 关闭与压缩

外部审查通过后，把任务压缩为 `review-history.jsonl` 一行：job ID、题目 ID、涉及词条、返修轮数、最终结论和正式采纳的普适规则。随后移除活动期完整记录。特定场景反馈不得进入 Skill。

人工试点期间由用户给出 verdict；监督会话接管后由 S 给出 verdict。用户始终拥有最高裁决权。
