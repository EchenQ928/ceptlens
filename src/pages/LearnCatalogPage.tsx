import { FeaturedBadges, FeaturedContentFilter } from "../components/FeaturedContent";
import { ProductIcon } from "../components/ProductIcon";
import { LiquidSelection } from '../components/LiquidSelection';
import { matchesFeatured, type FeaturedFilter } from "../domain/featured";
import { ArrowRight, BookOpenCheck, ChevronDown, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { richTextToPlainText } from "../domain/schemas";
import { textForLocale } from "../domain/content";
import { ENGINEERING_STAGES, LEARNING_LEVELS, MODEL_FAMILIES, taxonomyText, withoutCode } from "../domain/taxonomy";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";
import { updateProgress, type StudyMode } from "../infrastructure/progressRepository";
import { useLocale, uiText } from "../i18n";
import { RichText } from "../components/RichText";

export function LearnCatalogPage() {
  const { questions } = useContent();
  const [params, setParams] = useSearchParams();
  const track = params.get("track") === "kv-cache";
  const { locale } = useLocale();
  const progress = useProgress();
  const [mode, setMode] = useState<StudyMode>(progress.studyMode);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [level, setLevel] = useState("all");
  const [engineering, setEngineering] = useState("all");
  const [status, setStatus] = useState("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
  const [advanced, setAdvanced] = useState(false);
  const [priority, setPriority] = useState("all");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const extraFields = [{ key: "knowledgeTopics", label: "知识主题" }, { key: "taskScenarios", label: "任务场景" }, { key: "optimizationObjectives", label: "优化目标" }, { key: "runtimeEnvironments", label: "运行环境" }] as const;

  const filtered = useMemo(() => questions.filter((question) => {
    if (track && !question.id.startsWith("KV-CACHE-")) return false;
    if (!matchesFeatured(question, featured)) return false;
    if (family !== "all" && textForLocale(question.taxonomy.modelFamily, "zh-CN") !== family) return false;
    if (level !== "all" && question.taxonomy.learningLevel !== level) return false;
    if (engineering !== "all" && question.taxonomy.engineeringStage !== engineering) return false;
    if (status === "unseen" && progress.completed.includes(question.id)) return false;
    if (status === "completed" && !progress.completed.includes(question.id)) return false;
    if (status === "review" && !progress.wrong.includes(question.id)) return false;
    if (status === "favorites" && !progress.favorites.includes(question.id)) return false;
    if (priority !== "all" && question.taxonomy.priority !== priority) return false;
    if (extraFields.some(field => extra[field.key] && !question.taxonomy[field.key]?.some(value => textForLocale(value, "zh-CN") === extra[field.key]))) return false;
    const haystack = [richTextToPlainText(question.stem, locale), textForLocale(question.taxonomy.primaryConcept, locale), textForLocale(question.taxonomy.modelFamily, locale), taxonomyText(question.taxonomy.learningLevel, locale), taxonomyText(question.taxonomy.engineeringStage, locale), ...extraFields.flatMap(field => question.taxonomy[field.key] ?? []).map(value => textForLocale(value, locale))].join(" ").toLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLowerCase());
  }), [questions, family, level, engineering, status, query, progress, priority, extra, locale, featured, track]);

  function chooseMode(next: StudyMode) {
    setMode(next);
    updateProgress((current) => { current.studyMode = next; });
  }

  const sequence = track ? questions.filter(q => q.id.startsWith("KV-CACHE-")) : questions;
  const first = filtered[0];
  const hasFilters = track || !!query || featured !== "all" || [family, level, engineering, status, priority].some(value => value !== "all") || Object.values(extra).some(Boolean);
  return (
    <div className="page catalog-page">
      <div className="page-heading compact"><div><span className="workspace-icon"><ProductIcon kind="learn"/></span><h1>{uiText(locale, "学习", "Learn")}</h1></div><LiquidSelection className="mode-segment" value={mode+locale} label={uiText(locale, "学习方式", "Learning mode")}><button className={mode === "practice" ? "active" : ""} onClick={() => chooseMode("practice")}>{uiText(locale, "做题", "Practice")}</button><button className={mode === "quick" ? "active" : ""} onClick={() => chooseMode("quick")}>{uiText(locale, "看题", "Read")}</button></LiquidSelection></div>
      {questions.some(q => q.id.startsWith("KV-CACHE-")) && <div className="track-switch" role="group" aria-label={uiText(locale,"学习路径","Learning track")}><button aria-pressed={!track} onClick={()=>setParams({})}>{uiText(locale,"全部题目","All questions")}</button><button aria-pressed={track} onClick={()=>setParams({track:"kv-cache"})}>KV Cache <span>{questions.filter(q=>q.id.startsWith("KV-CACHE-")).length}</span></button></div>}
      <section className="filter-panel">
        <div className="search-row"><label className="search-box"><Search size={17} /><input aria-label={uiText(locale, "搜索题目、概念或标签", "Search questions, concepts, or tags")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiText(locale, "搜索题目、概念或标签", "Search questions, concepts, or tags")} /></label>{first && <Link className="primary-button" to={`/learn/questions/${first.id}?mode=${mode}`}><BookOpenCheck size={17} /> {uiText(locale, "开始学习", "Start learning")}</Link>}</div>
        <FeaturedContentFilter questions={track ? questions.filter(q=>q.id.startsWith("KV-CACHE-")) : questions} value={featured} onChange={setFeatured} />
        <details className="library-filter-details"><summary><SlidersHorizontal size={15}/>{uiText(locale,"筛选","Filters")}{[family,level,engineering,status,priority].filter(value=>value!=="all").length+Object.values(extra).filter(Boolean).length > 0 && <span className="filter-count">{[family,level,engineering,status,priority].filter(value=>value!=="all").length+Object.values(extra).filter(Boolean).length}</span>}<ChevronDown size={15}/></summary>
        <div className="facet-rows">
          <Facet label={uiText(locale, "模型族", "Model family")} value={family} onChange={setFamily} options={MODEL_FAMILIES.filter((value) => questions.some((question) => textForLocale(question.taxonomy.modelFamily, "zh-CN") === value)) as unknown as string[]} count={(value) => questions.filter((question) => textForLocale(question.taxonomy.modelFamily, "zh-CN") === value).length} />
          <Facet label={uiText(locale, "学习层级", "Learning level")} value={level} onChange={setLevel} options={LEARNING_LEVELS.filter((value) => questions.some((question) => question.taxonomy.learningLevel === value)) as unknown as string[]} count={(value) => questions.filter((question) => question.taxonomy.learningLevel === value).length} />
          <Facet label={uiText(locale, "工程链路", "Engineering stage")} value={engineering} onChange={setEngineering} options={ENGINEERING_STAGES.filter((value) => questions.some((question) => question.taxonomy.engineeringStage === value)) as unknown as string[]} count={(value) => questions.filter((question) => question.taxonomy.engineeringStage === value).length} />
          <Facet label={uiText(locale, "学习状态", "Status")} value={status} onChange={setStatus} options={["unseen", "completed", "review", "favorites"]} labelFor={(value) => ({ unseen: uiText(locale, "未学习", "Unseen"), completed: uiText(locale, "已完成", "Completed"), review: uiText(locale, "待复习", "Review"), favorites: uiText(locale, "已收藏", "Saved") }[value] || value)} />
        </div>
        <button className="advanced-trigger" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}><SlidersHorizontal size={15} /> {uiText(locale, "高级筛选", "Advanced filters")} <ChevronDown size={14} className={advanced ? "rotated" : ""} /></button>
        {advanced && <div className="advanced-filters"><label>{uiText(locale, "优先级", "Priority")}<select value={priority} onChange={event => setPriority(event.target.value)}><option value="all">{uiText(locale, "全部", "All")}</option>{["P0", "P1", "P2", "P3"].map(value => <option key={value}>{value}</option>)}</select></label>{extraFields.map(field => { const values = questions.flatMap(q => q.taxonomy[field.key] ?? []); const options = [...new Set(values.map(value => textForLocale(value, "zh-CN")))]; return <label key={field.key}>{uiText(locale, field.label, ({ knowledgeTopics: "Knowledge topics", taskScenarios: "Task scenarios", optimizationObjectives: "Optimization objectives", runtimeEnvironments: "Runtime environments" }[field.key]))}<select value={extra[field.key] ?? ""} disabled={!options.length} onChange={event => setExtra(current => ({ ...current, [field.key]: event.target.value }))}><option value="">{options.length ? uiText(locale, "全部", "All") : uiText(locale, "当前内容未设置", "Not set")}</option>{options.map(value => <option key={value} value={value}>{textForLocale(values.find(item=>textForLocale(item,"zh-CN")===value) ?? value,locale)}</option>)}</select></label>; })}</div>}
        </details>
        {hasFilters && <button className="advanced-trigger reset-filters" onClick={() => { setParams({}); setQuery(""); setFamily("all"); setLevel("all"); setEngineering("all"); setStatus("all"); setFeatured("all"); setPriority("all"); setExtra({}); }}><Filter size={15} /> {uiText(locale, "重置筛选", "Reset filters")}</button>}
      </section>
      <div className="catalog-summary"><span>{uiText(locale, "共", "Total")} <b>{filtered.length}</b> {uiText(locale, "道", "questions")}</span></div>
      <section className="question-table" aria-label={uiText(locale,"题目列表","Question list")}>
        
        {filtered.map((question) => {
          const complete = progress.completed.includes(question.id);
          const review = progress.wrong.includes(question.id);
          return <Link className="question-list-row" to={`/learn/questions/${question.id}?mode=${mode}`} key={question.id}><span className="order-cell">{String(sequence.indexOf(question) + 1).padStart(2, "0")}</span><span className="question-title-cell"><FeaturedBadges question={question} /><b>{textForLocale(question.taxonomy.primaryConcept, locale)}</b><small><RichText text={question.stem} terms={[]} linkTerms={false}/></small></span><span className="catalog-level"><i className="level-badge">{question.taxonomy.learningLevel.slice(0, 2)}</i></span><span className="catalog-status"><i className={`status-dot ${review ? "review" : complete ? "done" : ""}`} />{review ? uiText(locale, "待复习", "Review") : complete ? uiText(locale, "已完成", "Completed") : uiText(locale, "未学习", "Unseen")}</span><span><ArrowRight size={16} /></span></Link>;
        })}
        {!filtered.length && <div className="empty-state"><Search /><h3>{uiText(locale, "没有匹配的题目", "No matching questions")}</h3><p>{uiText(locale, "调整筛选条件后再试。", "Adjust the filters and try again.")}</p></div>}
      </section>
    </div>
  );
}

function Facet({ label, value, onChange, options, count, labelFor = withoutCode }: { label: string; value: string; onChange: (value: string) => void; options: string[]; count?: (value: string) => number; labelFor?: (value: string) => string }) {
  const { locale } = useLocale();
  const displayLabel = labelFor === withoutCode ? (value: string) => withoutCode(taxonomyText(value, locale)) : labelFor;
  return <div className="facet-row"><b>{label}</b><div className="facet-options"><button aria-pressed={value === "all"} className={value === "all" ? "active" : ""} onClick={() => onChange("all")}>{uiText(locale, "全部", "All")}</button>{options.map((option) => <button key={option} aria-pressed={value === option} className={value === option ? "active" : ""} onClick={() => onChange(option)}>{displayLabel(option)}{count && <small>{count(option)}</small>}</button>)}</div></div>;
}
