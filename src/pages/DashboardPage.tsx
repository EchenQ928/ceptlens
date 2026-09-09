import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Clock3, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { richTextToPlainText } from "../domain/schemas";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const progress = useProgress();
  const completed = questions.filter((question) => progress.completed.includes(question.id)).length;
  const percent = Math.round((completed / Math.max(questions.length, 1)) * 100);
  const next = questions.find((question) => question.id === progress.lastQuestionId) || questions.find((question) => !progress.completed.includes(question.id)) || questions[0];
  return (
    <div className="page dashboard-page">
      <div className="page-heading dashboard-heading">
        <div><p className="eyebrow">AI MODEL ENGINEERING · V1.0</p><h1>从一道题开始，建立模型设计能力</h1><p>当前共 {questions.length} 道题，其中 {questions.filter(q => q.taxonomy.priority === "P0").length} 道 P0 题，已按前置关系排列。</p></div>
        <div className="heading-metric"><strong>{percent}%</strong><span>主干完成度</span><div className="metric-bar"><i style={{ width: `${percent}%` }} /></div></div>
      </div>
      <div className="mode-grid">
        <Link className="mode-card learning" to="/learn">
          <div className="mode-icon"><BookOpen /></div><div className="mode-copy"><span className="mode-kicker">LEARN</span><h2>学习模式</h2><p>按模型族、层级和工程链路选择题库；支持做题后看解析或直接看题。</p><div className="mode-stats"><span><b>{completed}</b> 已完成</span><span><b>{questions.filter(q => progress.wrong.includes(q.id)).length}</b> 待复习</span><span><b>{terms.length}</b> 个共享词条</span></div></div><ArrowRight className="mode-arrow" />
        </Link>
        <Link className="mode-card exam" to="/exam">
          <div className="mode-icon"><ClipboardCheck /></div><div className="mode-copy"><span className="mode-kicker">ASSESS</span><h2>考核模式</h2><p>30 分钟随机组卷，自动保存答卷。客观题即时计分；题型未齐或主观题未评分时，不发布完整总成绩。</p><div className="mode-stats"><span><b>5</b> 单选</span><span><b>5</b> 多选</span><span><b>2</b> 主观{questions.filter(q => q.type === "subjective").length < 2 ? " · 待补" : ""}</span></div></div><ArrowRight className="mode-arrow" />
        </Link>
      </div>
      <div className="dashboard-grid">
        <section className="panel continue-panel"><div className="panel-heading"><div><span className="eyebrow">CONTINUE</span><h2>继续学习</h2></div><Clock3 size={19} /></div>{next && <><div className="sequence-number">第 {next.ordering.order} / {questions.length} 题</div><h3>{richTextToPlainText(next.stem)}</h3><div className="compact-tags"><span>{next.taxonomy.modelFamily}</span><span>{next.taxonomy.learningLevel}</span><span>{next.taxonomy.engineeringStage}</span></div><Link className="primary-button" to={`/learn/questions/${next.id}?mode=${progress.studyMode}`}>继续 <ArrowRight size={16} /></Link></>}</section>
        <section className="panel curriculum-panel"><div className="panel-heading"><div><span className="eyebrow">BACKBONE</span><h2>当前主干</h2></div><Network size={19} /></div><ol className="backbone-list">{questions.slice(0, 6).map((question) => <li key={question.id} className={progress.completed.includes(question.id) ? "done" : ""}><span>{progress.completed.includes(question.id) ? <CheckCircle2 size={17} /> : question.ordering.order}</span><Link to={`/learn/questions/${question.id}`}>{question.taxonomy.primaryConcept}</Link><small>{question.taxonomy.learningLevel.slice(0, 2)}</small></li>)}</ol><Link className="text-link" to="/learn">查看完整题库 <ArrowRight size={15} /></Link></section>
      </div>
    </div>
  );
}
