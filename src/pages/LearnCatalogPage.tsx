import { ArrowRight, BookOpenCheck, ChevronDown, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { richTextToPlainText } from "../domain/schemas";
import { ENGINEERING_STAGES, LEARNING_LEVELS, MODEL_FAMILIES, withoutCode } from "../domain/taxonomy";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";
import { updateProgress, type StudyMode } from "../infrastructure/progressRepository";

export function LearnCatalogPage() {
  const { questions } = useContent();
  const progress = useProgress();
  const [mode, setMode] = useState<StudyMode>(progress.studyMode);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [level, setLevel] = useState("all");
  const [engineering, setEngineering] = useState("all");
  const [status, setStatus] = useState("all");
  const [advanced, setAdvanced] = useState(false);
  const [priority, setPriority] = useState("all");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const extraFields = [{ key: "knowledgeTopics", label: "知识主题" }, { key: "taskScenarios", label: "任务场景" }, { key: "optimizationObjectives", label: "优化目标" }, { key: "runtimeEnvironments", label: "运行环境" }] as const;

  const filtered = useMemo(() => questions.filter((question) => {
    if (family !== "all" && question.taxonomy.modelFamily !== family) return false;
    if (level !== "all" && question.taxonomy.learningLevel !== level) return false;
    if (engineering !== "all" && question.taxonomy.engineeringStage !== engineering) return false;
    if (status === "unseen" && progress.completed.includes(question.id)) return false;
    if (status === "completed" && !progress.completed.includes(question.id)) return false;
    if (status === "review" && !progress.wrong.includes(question.id)) return false;
    if (status === "favorites" && !progress.favorites.includes(question.id)) return false;
    if (priority !== "all" && question.taxonomy.priority !== priority) return false;
    if (extraFields.some(field => extra[field.key] && !question.taxonomy[field.key]?.includes(extra[field.key]))) return false;
    const haystack = [richTextToPlainText(question.stem), question.taxonomy.primaryConcept, question.taxonomy.modelFamily, question.taxonomy.engineeringStage].join(" ").toLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLowerCase());
  }), [questions, family, level, engineering, status, query, progress, priority, extra]);

  function chooseMode(next: StudyMode) {
    setMode(next);
    updateProgress((current) => { current.studyMode = next; });
  }

  const first = filtered[0];
  return (
    <div className="page catalog-page">
      <div className="page-heading compact"><div><p className="eyebrow">LEARNING LIBRARY</p><h1>学习题库</h1><p>筛选后的题目仍按前置顺序展示。</p></div><div className="mode-segment" role="group" aria-label="学习方式"><button className={mode === "practice" ? "active" : ""} onClick={() => chooseMode("practice")}>做题</button><button className={mode === "quick" ? "active" : ""} onClick={() => chooseMode("quick")}>看题</button></div></div>
      <section className="filter-panel">
        <div className="search-row"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索题目、概念或标签" /></label>{first && <Link className="primary-button" to={`/learn/questions/${first.id}?mode=${mode}`}><BookOpenCheck size={17} /> 开始本题库</Link>}</div>
        <div className="facet-rows">
          <Facet label="模型族" value={family} onChange={setFamily} options={MODEL_FAMILIES.filter((value) => questions.some((question) => question.taxonomy.modelFamily === value)) as unknown as string[]} count={(value) => questions.filter((question) => question.taxonomy.modelFamily === value).length} />
          <Facet label="学习层级" value={level} onChange={setLevel} options={LEARNING_LEVELS.filter((value) => questions.some((question) => question.taxonomy.learningLevel === value)) as unknown as string[]} count={(value) => questions.filter((question) => question.taxonomy.learningLevel === value).length} />
          <Facet label="工程链路" value={engineering} onChange={setEngineering} options={ENGINEERING_STAGES.filter((value) => questions.some((question) => question.taxonomy.engineeringStage === value)) as unknown as string[]} count={(value) => questions.filter((question) => question.taxonomy.engineeringStage === value).length} />
          <Facet label="学习状态" value={status} onChange={setStatus} options={["unseen", "completed", "review", "favorites"]} labelFor={(value) => ({ unseen: "未学习", completed: "已完成", review: "待复习", favorites: "已收藏" }[value] || value)} />
        </div>
        <button className="advanced-trigger" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}><SlidersHorizontal size={15} /> 高级筛选 <ChevronDown size={14} className={advanced ? "rotated" : ""} /></button>
        {advanced && <div className="advanced-filters"><label>优先级<select value={priority} onChange={event => setPriority(event.target.value)}><option value="all">全部</option>{["P0", "P1", "P2", "P3"].map(value => <option key={value}>{value}</option>)}</select></label>{extraFields.map(field => { const options = [...new Set(questions.flatMap(q => q.taxonomy[field.key] ?? []))]; return <label key={field.key}>{field.label}<select value={extra[field.key] ?? ""} disabled={!options.length} onChange={event => setExtra(current => ({ ...current, [field.key]: event.target.value }))}><option value="">{options.length ? "全部" : "当前内容未设置"}</option>{options.map(value => <option key={value}>{value}</option>)}</select></label>; })}</div>}
        <button className="advanced-trigger" onClick={() => { setQuery(""); setFamily("all"); setLevel("all"); setEngineering("all"); setStatus("all"); setPriority("all"); setExtra({}); }}><Filter size={15} />重置筛选</button>
      </section>
      <div className="catalog-summary"><span>共 <b>{filtered.length}</b> 道</span><span>顺序：前置关系优先</span><span>方式：{mode === "practice" ? "选择后显示答案" : "直接显示答案"}</span></div>
      <section className="question-table" aria-label="题目列表">
        <div className="question-table-head"><span>顺序</span><span>题目与主知识点</span><span>模型族</span><span>层级</span><span>工程链路</span><span>状态</span><span /></div>
        {filtered.map((question) => {
          const complete = progress.completed.includes(question.id);
          const review = progress.wrong.includes(question.id);
          return <Link className="question-list-row" to={`/learn/questions/${question.id}?mode=${mode}`} key={question.id}><span className="order-cell">{String(question.ordering.order).padStart(2, "0")}</span><span className="question-title-cell"><b>{richTextToPlainText(question.stem)}</b><small>{question.taxonomy.primaryConcept}</small></span><span>{withoutCode(question.taxonomy.modelFamily)}</span><span><i className="level-badge">{question.taxonomy.learningLevel.slice(0, 2)}</i></span><span>{withoutCode(question.taxonomy.engineeringStage)}</span><span><i className={`status-dot ${review ? "review" : complete ? "done" : ""}`} />{review ? "待复习" : complete ? "已完成" : "未学习"}</span><span><ArrowRight size={16} /></span></Link>;
        })}
        {!filtered.length && <div className="empty-state"><Search /><h3>没有匹配的题目</h3><p>调整筛选条件后再试。</p></div>}
      </section>
    </div>
  );
}

function Facet({ label, value, onChange, options, count, labelFor = withoutCode }: { label: string; value: string; onChange: (value: string) => void; options: string[]; count?: (value: string) => number; labelFor?: (value: string) => string }) {
  return <div className="facet-row"><b>{label}</b><div className="facet-options"><button className={value === "all" ? "active" : ""} onClick={() => onChange("all")}>全部</button>{options.map((option) => <button key={option} className={value === option ? "active" : ""} onClick={() => onChange(option)}>{labelFor(option)}{count && <small>{count(option)}</small>}</button>)}</div></div>;
}
