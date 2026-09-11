import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Clock3, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { richTextToPlainText } from "../domain/schemas";
import { textForLocale } from "../domain/content";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";
import { useLocale, uiText } from "../i18n";
import { taxonomyText } from "../domain/taxonomy";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const progress = useProgress();
  const completed = questions.filter((question) => progress.completed.includes(question.id)).length;
  const percent = Math.round((completed / Math.max(questions.length, 1)) * 100);
  const next = questions.find((question) => question.id === progress.lastQuestionId) || questions.find((question) => !progress.completed.includes(question.id)) || questions[0];
  return (
    <div className="page dashboard-page">
      <div className="page-heading dashboard-heading">
        <div><p className="eyebrow">AI MODEL ENGINEERING · V1.0</p><h1>{uiText(locale, "从一道题开始，建立模型设计能力", "Build model design skills one question at a time")}</h1><p>{uiText(locale, "当前共", "There are")} {questions.length} {uiText(locale, "道题，其中", "questions, including")} {questions.filter(q => q.taxonomy.priority === "P0").length} P0 {uiText(locale, "题，已按前置关系排列。", "questions ordered by prerequisites.")}</p></div>
        <div className="heading-metric"><strong>{percent}%</strong><span>{uiText(locale, "主干完成度", "Core completion")}</span><div className="metric-bar"><i style={{ width: `${percent}%` }} /></div></div>
      </div>
      <div className="mode-grid">
        <Link className="mode-card learning" to="/learn">
          <div className="mode-icon"><BookOpen /></div><div className="mode-copy"><span className="mode-kicker">LEARN</span><h2>{uiText(locale, "学习模式", "Learn")}</h2><p>{uiText(locale, "按模型族、层级和工程链路选择题库；支持做题后看解析或直接看题。", "Filter the library by model family, level, and engineering stage. Practice first or read the answer directly.")}</p><div className="mode-stats"><span><b>{completed}</b> {uiText(locale, "已完成", "completed")}</span><span><b>{questions.filter(q => progress.wrong.includes(q.id)).length}</b> {uiText(locale, "待复习", "to review")}</span><span><b>{terms.length}</b> {uiText(locale, "个共享词条", "shared terms")}</span></div></div><ArrowRight className="mode-arrow" />
        </Link>
        <Link className="mode-card exam" to="/exam">
          <div className="mode-icon"><ClipboardCheck /></div><div className="mode-copy"><span className="mode-kicker">ASSESS</span><h2>{uiText(locale, "考核模式", "Assessment")}</h2><p>{uiText(locale, "30 分钟随机组卷，自动保存答卷。客观题即时计分；题型未齐或主观题未评分时，不发布完整总成绩。", "A 30-minute paper with autosaved answers. Objective items are scored immediately; incomplete papers remain provisional.")}</p><div className="mode-stats"><span><b>5</b> {uiText(locale, "单选", "single choice")}</span><span><b>5</b> {uiText(locale, "多选", "multiple choice")}</span><span><b>2</b> {uiText(locale, "主观", "short answer")}{questions.filter(q => q.type === "subjective").length < 2 ? " · pending" : ""}</span></div></div><ArrowRight className="mode-arrow" />
        </Link>
      </div>
      <div className="dashboard-grid">
        <section className="panel continue-panel"><div className="panel-heading"><div><span className="eyebrow">CONTINUE</span><h2>{uiText(locale, "继续学习", "Continue learning")}</h2></div><Clock3 size={19} /></div>{next && <><div className="sequence-number">{uiText(locale, "第", "Question")} {next.ordering.order} / {questions.length}</div><h3>{richTextToPlainText(next.stem, locale)}</h3><div className="compact-tags"><span>{textForLocale(next.taxonomy.modelFamily, locale)}</span><span>{taxonomyText(next.taxonomy.learningLevel, locale)}</span><span>{taxonomyText(next.taxonomy.engineeringStage, locale)}</span></div><Link className="primary-button" to={`/learn/questions/${next.id}?mode=${progress.studyMode}`}>{uiText(locale, "继续", "Continue")} <ArrowRight size={16} /></Link></>}</section>
        <section className="panel curriculum-panel"><div className="panel-heading"><div><span className="eyebrow">BACKBONE</span><h2>{uiText(locale, "当前主干", "Current sequence")}</h2></div><Network size={19} /></div><ol className="backbone-list">{questions.slice(0, 6).map((question) => <li key={question.id} className={progress.completed.includes(question.id) ? "done" : ""}><span>{progress.completed.includes(question.id) ? <CheckCircle2 size={17} /> : question.ordering.order}</span><Link to={`/learn/questions/${question.id}`}>{textForLocale(question.taxonomy.primaryConcept, locale)}</Link><small>{question.taxonomy.learningLevel.slice(0, 2)}</small></li>)}</ol><Link className="text-link" to="/learn">{uiText(locale, "查看完整题库", "View full library")} <ArrowRight size={15} /></Link></section>
      </div>
    </div>
  );
}
