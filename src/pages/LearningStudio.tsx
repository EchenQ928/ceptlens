import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { richTextToPlainText } from "../domain/schemas";
import { textForLocale } from "../domain/content";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";
import { useLocale, uiText } from "../i18n";
import { CeptCheckMark } from "../components/CeptCheckMark";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const progress = useProgress();
  const [step, setStep] = useState(0);
  const track = questions.filter(q => q.id.startsWith("KV-CACHE-"));
  const sequence = track.length ? track : questions;
  const completed = questions.filter(q => progress.completed.includes(q.id)).length;
  const next = questions.find(q => q.id === progress.lastQuestionId) || sequence.find(q => !progress.completed.includes(q.id)) || sequence[0];
  const steps = [uiText(locale,"理解概念","Understand"),uiText(locale,"检验理解","Test your thinking"),uiText(locale,"建立联系","Connect the ideas")];
  return <div className="page dashboard-page">
    <div className="dashboard-intro"><p className="eyebrow">CEPTLENS / LEARNING STUDIO</p><span>{uiText(locale,"把知识变成自己的理解。","Make the knowledge yours.")}</span></div>
    <section className="learning-hero">
      <div className="hero-copy"><span className="hero-label"><span />{track.length ? uiText(locale,"专题学习 · KV CACHE","IN FOCUS · KV CACHE") : uiText(locale,"从概念到实践","FROM CONCEPT TO PRACTICE")}</span><h1>{uiText(locale,"不止知道答案。","Go beyond the answer.")}<em>{uiText(locale,"真正理解原理。","Understand what makes it work.")}</em></h1><p>{uiText(locale,"从一个问题出发，拆解计算过程，连接关键概念。每一次思考，都让理解更进一步。","Start with a question. Unpack the computation. Connect the concepts. Build an understanding you can put to work.")}</p><div className="hero-actions"><Link className="primary-button" to={track.length ? "/learn?track=kv-cache" : "/learn"}>{uiText(locale,"探索学习路径","Explore the track")}<ArrowRight size={18}/></Link><Link className="hero-secondary" to="/terms">{uiText(locale,"浏览词条","Explore concepts")}<Network size={16}/></Link></div><div className="hero-footnote">{sequence.length} {uiText(locale,"道题目","questions")} <span> / </span> {uiText(locale,"英语 + 中文","English + 中文")}</div></div>
      <div className="learning-orbit"><div className="orbit-grid" aria-hidden="true"/><div className="orbit-caption">THE LEARNING LOOP</div><div className="orbit-stage" key={step}><span className="orbit-number">0{step+1}</span><div className="orbit-symbol">{step===0?<BookOpen size={42} strokeWidth={1.3}/>:step===1?<CeptCheckMark size={52}/>:<Network size={44} strokeWidth={1.3}/>}</div><h2>{steps[step]}</h2><p>{step===0?uiText(locale,"看清每一步计算背后的原因。","See why each step works."):step===1?uiText(locale,"换一个条件，你的解释还成立吗？","Change a condition. Does your explanation still hold?"):uiText(locale,"把分散的知识，连成完整的图景。","Turn separate facts into a connected picture.")}</p></div><div className="orbit-controls" role="group" aria-label={uiText(locale,"学习过程","Learning process")}>{steps.map((label,i)=><button key={i} aria-label={label} aria-pressed={step===i} onClick={()=>setStep(i)}><span>0{i+1}</span>{i===step&&<span>{label}</span>}</button>)}</div></div>
    </section>
    <div className="studio-stats"><span><b>{questions.length}</b>{uiText(locale,"道学习题","learning questions")}</span><span><b>{terms.length}</b>{uiText(locale,"个概念词条","concept lessons")}</span><span><b>{completed}</b>{uiText(locale,"道已学习","questions explored")}</span><Link to="/learn">{uiText(locale,"打开完整题库","View the full library")}<ArrowRight size={16}/></Link></div>
    <div className="dashboard-grid">
      <section className="panel continue-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR NEXT STEP</span><h2>{uiText(locale,"继续探索","Pick up an idea")}</h2></div><BookOpen size={22}/></div>{next&&<><div className="sequence-number">{uiText(locale,"题目","QUESTION")} {next.ordering.order}</div><h3>{textForLocale(next.taxonomy.primaryConcept,locale)}</h3><p className="continue-excerpt">{richTextToPlainText(next.stem,locale)}</p><Link className="primary-button" to={`/learn/questions/${next.id}?mode=${progress.studyMode}`}>{uiText(locale,"继续学习","Continue learning")}<ArrowRight size={16}/></Link></>}</section>
      <section className="panel curriculum-panel"><div className="panel-heading"><div><span className="eyebrow">{track.length?"THE KV CACHE TRACK":"LEARNING PATH"}</span><h2>{uiText(locale,"从基础出发","Start with the foundations")}</h2></div><Network size={22}/></div><ol className="backbone-list">{sequence.slice(0,5).map((q,i)=><li key={q.id} className={progress.completed.includes(q.id)?"done":""}><span>{progress.completed.includes(q.id)?<CheckCircle2 size={17}/>:String(i+1).padStart(2,'0')}</span><Link to={`/learn/questions/${q.id}`}>{textForLocale(q.taxonomy.primaryConcept,locale)}</Link><ArrowRight size={15}/></li>)}</ol><Link className="text-link" to={track.length?"/learn?track=kv-cache":"/learn"}>{uiText(locale,"查看全部题目","See every question")}<ArrowRight size={15}/></Link></section>
    </div>
    <Link className="assessment-strip" to="/exam"><ClipboardCheck size={26}/><div><h2>{uiText(locale,"准备好检验理解了吗？","Ready to test your understanding?")}</h2><p>{uiText(locale,"用一次限时考核，发现还需要深入的地方。","Take a timed assessment and discover where to go deeper.")}</p></div><ArrowRight size={23}/></Link>
  </div>;
}
