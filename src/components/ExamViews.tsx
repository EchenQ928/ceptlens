import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Cloud, LockKeyhole } from "lucide-react";
import { answeredCount, examTypeName, type ExamAnswers, type ExamAttempt, type ExamCatalog } from "../domain/exam";
import { RichText } from "./RichText";
const date = (v: number) => new Date(v).toLocaleString("zh-CN");
const plain = (s?: string) => <RichText text={s ?? ""} terms={[]} linkTerms={false} />;

export function ExamIntroduction({ catalog, name, setName, busy, connected, error, start, open }: { catalog: ExamCatalog | null; name: string; setName: (s: string) => void; busy: boolean; connected: boolean; error: string; start: () => void; open: (id: string) => void }) {
  const active = catalog?.exams.find(e => e.status === "active");
  return <div className="page assessment-page">
    <div className="assessment-heading"><div><span className="section-kicker">ASSESSMENT</span><h1>模型工程考核</h1><p>30 分钟，检验你对模型设计与工程基础的掌握。</p></div><ClipboardCheck size={38} /></div>
    <div className="assessment-start-grid"><section className="assessment-card"><h2>开始前确认</h2>
      <div className="paper-spec">{catalog?.readiness.map(r => <div key={r.type}><strong>{r.required}<small> 道</small></strong><b>{examTypeName(r.type)}</b><span className={r.available < r.required ? "warning-text" : ""}>题库 {r.available} 道{r.available < r.required ? ` · 缺 ${r.required - r.available} 道` : ""}</span></div>)}</div>
      <ul className="assessment-rules"><li><Clock3 size={18} /> 点击开始后计时，到时自动交卷。</li><li><CheckCircle2 size={18} /> 单选、多选每题 5 分；多选全部正确才得分。</li><li><LockKeyhole size={18} /> 考核期间关闭学习助手与共享批注。</li><li><Cloud size={18} /> 作答自动保存到主机，同一浏览器刷新后可继续。</li></ul>
      <div className="assessment-notice"><b>当前开放体验考核</b><p>题量不足时使用已有题型组卷，不补造题目。主观题计划每题 25 分，尚未接入 API 时保持待评分。题型未齐或评分未完成，不发布完整总成绩。</p></div>
      <label className="candidate-name">提交人<input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="填写你的显示名" /></label><p className="status-note">当前使用浏览器身份，尚未接入公司账号；请勿在共用浏览器提交个人考核。</p>
      {error && <p role="alert" className="service-error">{error}</p>}
      {active ? <button className="primary-button exam-wide-button" onClick={() => open(active.id)}>继续未完成的答卷</button> : <button className="primary-button exam-wide-button" disabled={busy || !name.trim() || !connected || !catalog?.readiness.some(r => r.available > 0)} onClick={start}>{busy ? "准备答卷…" : "开始考核"}</button>}
    </section><aside className="assessment-card exam-history"><h2>我的考核记录</h2>
      {!catalog?.exams.length ? <div className="companion-empty"><ClipboardCheck size={28} /><p>交卷后可以在这里查看答卷、错题和评分状态。</p></div> : catalog.exams.map(e => <button key={e.id} onClick={() => open(e.id)}><span>{date(e.startedAt)}</span><b>{e.status === "active" ? "进行中 · 继续作答" : e.total === null ? `已交卷 · 客观题 ${e.objectiveScore ?? 0} 分` : `${e.total} / 100 分`}</b><small>{e.status === "submitted" && e.total === null ? "完整总成绩暂不发布" : ""}</small></button>)}
    </aside></div>
  </div>;
}

export function ExamPaper({ attempt, answers, index, setIndex, remaining, busy, error, saveStatus, answer, save, submit, reload }: {
  attempt: ExamAttempt; answers: ExamAnswers; index: number; setIndex: (n: number) => void; remaining: number; busy: boolean; error: string; saveStatus: string;
  answer: (id: string, v: string | string[]) => void; save: () => void; submit: () => void; reload: () => void;
}) {
  const [confirm, setConfirm] = useState(false); const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (confirm) dialog.current?.showModal(); else dialog.current?.close(); }, [confirm]);
  const q = attempt.questions[index]; const selected = answers[q.id] ?? (q.type === "subjective" ? "" : []);
  return <div className="page assessment-page">
    <header className="active-paper-header"><div><span className="section-kicker">正在考核 · {attempt.name}</span><h1>第 {index + 1} / {attempt.questions.length} 题</h1></div><div className={`exam-clock ${remaining < 300 ? "urgent" : ""}`} role="timer" aria-label="剩余时间"><Clock3 size={22} />{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</div></header>
    <div className="active-paper-grid"><article className="assessment-card exam-question"><div className="exam-question-meta">{examTypeName(q.type)} · {q.type === "subjective" ? 25 : 5} 分{q.type === "multiple_choice" ? " · 全部正确才得分" : ""}</div><h2>{plain(q.stem)}</h2>
      {q.type === "subjective" ? <textarea className="exam-subjective" aria-label="主观题作答" disabled={busy || remaining === 0} rows={12} maxLength={12000} value={typeof selected === "string" ? selected : ""} placeholder="在这里组织你的回答…" onChange={e => answer(q.id, e.target.value)} /> : <div className="exam-options">{q.options.map(o => <label className={Array.isArray(selected) && selected.includes(o.key) ? "selected" : ""} key={o.key}><input type={q.type === "single_choice" ? "radio" : "checkbox"} name={q.id} checked={Array.isArray(selected) && selected.includes(o.key)} disabled={busy || remaining === 0} onChange={() => answer(q.id, q.type === "single_choice" ? [o.key] : Array.isArray(selected) && selected.includes(o.key) ? selected.filter(k => k !== o.key) : [...(Array.isArray(selected) ? selected : []), o.key])} /><b>{o.key}</b><span>{plain(o.text)}</span></label>)}</div>}
      <footer className="exam-question-footer"><button className="secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={17} /> 上一题</button><button className="primary-button" disabled={index === attempt.questions.length - 1} onClick={() => setIndex(index + 1)}>下一题 <ChevronRight size={17} /></button></footer>
    </article><aside className="assessment-card answer-sheet"><h2>答题卡</h2><p>已作答 {answeredCount(answers)} / {attempt.questions.length}</p>
      <div className="answer-sheet-grid">{attempt.questions.map((item, i) => <button key={item.id} className={`${i === index ? "current" : ""} ${answers[item.id]?.length ? "answered" : ""}`} aria-label={`第 ${i + 1} 题${answers[item.id]?.length ? "，已作答" : "，未作答"}`} aria-current={i === index ? "step" : undefined} onClick={() => setIndex(i)}>{i + 1}</button>)}</div>
      <p className="save-status" role="status"><Cloud size={16} /> {saveStatus}</p>{error && <div role="alert" className="service-error"><p>{error}</p><button className="secondary-button" onClick={reload}>重新载入主机答卷</button></div>}
      <button className="secondary-button exam-wide-button" disabled={busy} onClick={save}>立即保存</button><button className="primary-button exam-wide-button" disabled={busy} onClick={() => setConfirm(true)}>交卷</button><p className="status-note">计时不会因刷新或离开页面暂停。未保存的离线作答不计入到时交卷。</p>
    </aside></div>
    <dialog className="submit-dialog" ref={dialog} onCancel={() => setConfirm(false)}><h2>确认交卷？</h2><p>已作答 {answeredCount(answers)} / {attempt.questions.length} 题，交卷后不能修改。</p><div className="inline-actions"><button className="secondary-button" disabled={busy} onClick={() => setConfirm(false)}>继续作答</button><button className="primary-button" disabled={busy} onClick={submit}>{busy ? "保存答卷…" : "确认交卷"}</button></div>{error && <p role="alert" className="service-error">{error}</p>}</dialog>
  </div>;
}

export function ExamReview({ attempt, error, busy, back, grade }: { attempt: ExamAttempt; error: string; busy: boolean; back: () => void; grade: () => void }) {
  const [wrongOnly, setWrongOnly] = useState(false);
  const pending = attempt.results?.some(r => r.state === "pending");
  return <div className="page assessment-page">
    <div className="assessment-heading"><div><span className="section-kicker">SUBMITTED</span><h1>答卷已保存</h1><p>{attempt.name} · {date(attempt.startedAt)} — {date(attempt.submittedAt!)} </p></div><button className="secondary-button" onClick={back}>返回考核首页</button></div>
    <div className="exam-score-strip"><div><small>客观题得分</small><strong>{attempt.objectiveScore}<span> / {attempt.objectiveMax}</span></strong></div><div><small>完整总成绩</small><strong>{attempt.total === null ? "暂不发布" : `${attempt.total} / 100`}</strong><p>{!attempt.completePaper ? "题型未齐，本卷为体验卷。" : attempt.total === null ? "主观题尚未完成评分。" : "全部题目评分完成。"}</p></div><div><small>主观题评分</small><p>{attempt.questions.some(q => q.type === "subjective") ? pending ? "暂未接入 API 或服务不可用，无法打分。" : "已按评分要点完成" : "本卷无主观题"}</p>{pending && <button className="secondary-button" disabled={busy} onClick={grade}>{busy ? "评分中…" : "重试主观题评分"}</button>}</div></div>
    {error && <p role="alert" className="service-error">{error}</p>}<div className="review-toolbar"><h2>答卷与错题</h2><button className="secondary-button" aria-pressed={wrongOnly} onClick={() => setWrongOnly(v => !v)}>{wrongOnly ? "查看全部题目" : "只看错题与待评分"}</button></div>
    {wrongOnly && attempt.results?.every(r => r.score === r.maxScore) && <p className="assessment-card">本卷没有错题或待评分题。</p>}
    {attempt.questions.map((q, i) => {
      const r = attempt.results?.find(r => r.id === q.id); if (wrongOnly && r?.score === r?.maxScore) return null;
      return <article className="exam-review-card" key={q.id}><header><span>{i + 1} · {examTypeName(q.type)}</span><b className={r?.state === "correct" ? "positive-text" : "warning-text"}>{r?.score === null ? "待评分" : `${r?.score} / ${r?.maxScore} 分`}</b></header><h3>{plain(q.stem)}</h3>{q.options?.map(o => <p key={o.key}>{o.key}. {plain(o.text)}</p>)}
        <div className="review-answer"><b>你的作答</b><p>{Array.isArray(attempt.answers[q.id]) ? (attempt.answers[q.id] as string[]).join("、") || "未作答" : attempt.answers[q.id] || "未作答"}</p><b>参考答案</b><p>{q.type === "subjective" ? plain(q.subjectiveAnswer?.referenceAnswer) : q.correctAnswer?.join("、")}</p><b>解释</b><p>{plain(q.explanation)}</p>
          {q.subjectiveAnswer && <><b>评分要点</b><ul>{q.subjectiveAnswer.rubric.map((item, j) => <li key={j}>{plain(item.criterion)}（{item.points} 分）</li>)}</ul></>}
          {r?.reason && <p className="status-note">{r.reason}</p>}{r?.items?.map(item => <p key={item.index}>要点 {item.index + 1}：{item.points} 分 · {item.feedback}</p>)}
        </div></article>;
    })}
  </div>;
}
