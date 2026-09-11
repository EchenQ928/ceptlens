import { ArrowRight, BookOpen, Check, ClipboardCheck, CornerDownRight, Network, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { RichText } from "../components/RichText";
import { textForLocale } from "../domain/content";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";
import { useLocale, uiText } from "../i18n";
import { BrandIcon } from "../components/Brand";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const progress = useProgress();
  const completed = questions.filter(q => progress.completed.includes(q.id)).length;
  const percent = Math.round(completed / Math.max(questions.length, 1) * 100);
  const next = questions.find(q => q.id === progress.lastQuestionId) || questions.find(q => !progress.completed.includes(q.id)) || questions[0];
  const kvQuestions = questions.filter(q => q.id.startsWith("KV-CACHE-"));
  const hasHistory = !!progress.lastQuestionId || completed > 0;
  return <div className="page lens-dashboard">
    <section className="lens-hero">
      <div className="hero-copy"><p className="eyebrow"><span className="live-dot" />{t("为理解而设计", "BUILT FOR UNDERSTANDING")}</p>
        <h1>{t("从知道，", "Don’t just know.")}<br /><em>{t("走向真正理解。", "Understand.")}</em></h1>
        <p className="hero-description">{t("从一个好问题出发，拆解原理，探索交互，建立模型工程的直觉。", "Start with a good question. Unpack the idea. Build your intuition for model engineering.")}</p>
      </div>
      <div className="lens-hero-art" aria-hidden="true"><div className="lens-orbit orbit-one" /><div className="lens-orbit orbit-two" /><div className="lens-orbit orbit-three" /><BrandIcon /><span className="orbit-label label-question">{t("提问", "QUESTION")}</span><span className="orbit-label label-insight">{t("理解", "INSIGHT")}</span><span className="orbit-point point-one" /><span className="orbit-point point-two" /></div>
    </section>
    <div className="dashboard-section-label"><span>{t("你的下一步", "YOUR NEXT STEP")}</span><span>{t("保持好奇，一题一步。", "Stay curious. One question at a time.")}</span></div>
    <div className="lens-start-grid">
      <section className="resume-card">
        <div className="resume-top"><span className="resume-label"><BookOpen size={16} />{hasHistory ? t("继续探索", "PICK UP WHERE YOU LEFT OFF") : t("从这里开始", "A PLACE TO BEGIN")}</span><span className="resume-position">{next ? String(questions.indexOf(next) + 1).padStart(2, "0") : "00"}<span> / {questions.length}</span></span></div>
        {next ? <><h2><RichText text={next.stem} terms={terms} linkTerms={false}/></h2><p className="resume-concept"><CornerDownRight size={15} />{textForLocale(next.taxonomy.primaryConcept, locale)}</p><div className="resume-bottom"><Link className="primary-button" to={`/learn/questions/${next.id}?mode=${progress.studyMode}`}>{hasHistory ? t("继续学习", "Continue learning") : t("开始学习", "Start learning")}<ArrowRight size={17} /></Link><span>{t("按自己的节奏，深入理解", "Your pace. A deeper understanding.")}</span></div></> : <><h2>{t("你的探索即将开始", "Your exploration starts here")}</h2><p>{t("题目发布后，会在这里展示。", "Published questions will appear here.")}</p></>}
        <div className="resume-progress"><div className="progress-caption"><span>{t("学习进度", "Learning progress")}</span><span><b>{completed}</b> / {questions.length} · {percent}%</span></div><div className="metric-bar" role="progressbar" aria-label={t("学习进度", "Learning progress")} aria-valuenow={completed} aria-valuemin={0} aria-valuemax={Math.max(questions.length,1)}><i style={{ width: `${percent}%` }} /></div></div>
      </section>
      <section className="learning-loop"><span className="eyebrow">{t("让知识连起来", "MAKE THE CONNECTION")}</span><h2>{t("不止于答对。", "Go beyond the answer.")}</h2><ol>{[
        [t("先想一想", "Think it through"), t("用问题发现理解中的空白。", "Let a question reveal what you know.")],
        [t("看懂为什么", "Find the why"), t("拆解答案，理解背后的原理。", "Unpack the reasoning, step by step.")],
        [t("把概念连起来", "Connect the concepts"), t("进入词条，在交互中继续探索。", "Follow a concept into an interactive lesson.")]
      ].map(([title,copy],i)=><li key={title}><span className="loop-number">0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol><Link className="text-link" to="/terms">{t("探索词条库", "Explore the concepts")}<ArrowRight size={15}/></Link></section>
    </div>
    <div className="dashboard-section-label"><span>{t("选择探索的方向", "ROOM TO EXPLORE")}</span><Link to="/learn">{t("查看全部", "View all")}<ArrowRight size={14}/></Link></div>
    <div className="explore-grid">
      <Link to={kvQuestions.length ? "/learn?track=kv-cache" : "/learn"} className="explore-card explore-featured"><span className="explore-icon"><Sparkles size={20}/></span><div><small>{kvQuestions.length ? t("专题学习", "TOPIC IN FOCUS") : t("学习题库", "QUESTION LIBRARY")}</small><h2>{kvQuestions.length ? "KV Cache" : t("模型工程基础", "Model engineering")}</h2><p>{kvQuestions.length ? t("理解缓存，走近高效推理。", "Understand the cache. Explore efficient inference.") : t("从基础出发，逐步建立工程直觉。", "Build your engineering intuition from the foundations.")}</p><span className="explore-meta">{kvQuestions.length || questions.length} {t("道题目", "questions")}<ArrowRight size={17}/></span></div></Link>
      <Link to="/terms" className="explore-card"><span className="explore-icon"><Network size={20}/></span><div><small>{t("交互式理解", "INTERACTIVE EXPLORATION")}</small><h2>{t("概念之间，建立连接", "Ideas, connected.")}</h2><p>{t("从一个概念，探索更完整的知识。", "Open a concept. See how the pieces fit together.")}</p><span className="explore-meta">{terms.length} {t("个教学词条", "concept lessons")}<ArrowRight size={17}/></span></div></Link>
      <Link to="/exam" className="explore-card"><span className="explore-icon"><ClipboardCheck size={20}/></span><div><small>{t("检验你的理解", "CHECK YOUR UNDERSTANDING")}</small><h2>{t("给理解一次检验", "Put it to the test.")}</h2><p>{t("独立作答，发现下一步值得深入的地方。", "Practice independently and discover what to revisit.")}</p><span className="explore-meta">{t("进入考核", "Open assessment")}<ArrowRight size={17}/></span></div></Link>
    </div>
    <section className="sequence-section"><div className="dashboard-section-label"><span>{t("从基础开始", "BUILD YOUR FOUNDATION")}</span><Link to="/learn">{t("完整学习题库", "Full learning library")}<ArrowRight size={14}/></Link></div><ol className="foundation-list">{questions.slice(0,4).map((q,i)=><li key={q.id}><Link to={`/learn/questions/${q.id}?mode=${progress.studyMode}`}><span className={`foundation-number ${progress.completed.includes(q.id)?"done":""}`}>{progress.completed.includes(q.id)?<Check size={16}/>:String(i+1).padStart(2,"0")}</span><span>{textForLocale(q.taxonomy.primaryConcept,locale)}</span><ArrowRight size={15}/></Link></li>)}</ol></section>
    <footer className="dashboard-footer"><span>CeptLens</span><p>{t("让每一次好奇，都更接近理解。", "Every question, a little more clarity.")}</p><span>SEIZE UNDERSTANDING</span></footer>
  </div>;
}
