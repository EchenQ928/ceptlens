import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Cloud, LockKeyhole } from "lucide-react";
import { answeredCount, examTypeName, type ExamAnswers, type ExamAttempt, type ExamCatalog } from "../domain/exam";
import { RichText } from "./RichText";
import type { RichText as RichTextValue } from "../domain/content";
import { uiText, useLocale } from "../i18n";
const date = (v: number, locale: "zh-CN" | "en-US") => new Date(v).toLocaleString(locale);
const plain = (s?: RichTextValue) => <RichText text={s ?? ""} terms={[]} linkTerms={false} />;

export function ExamIntroduction({ catalog, name, setName, busy, connected, error, start, open }: { catalog: ExamCatalog | null; name: string; setName: (s: string) => void; busy: boolean; connected: boolean; error: string; start: () => void; open: (id: string) => void }) {
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const active = catalog?.exams.find(e => e.status === "active");
  return <div className="page assessment-page">
    <div className="assessment-heading"><div><span className="section-kicker">ASSESSMENT</span><h1>{t("模型工程考核", "Model Engineering Assessment")}</h1><p>{t("30 分钟，检验你对模型设计与工程基础的掌握。", "30 minutes to test your grasp of model design and engineering fundamentals.")}</p></div><ClipboardCheck size={38} /></div>
    <div className="assessment-start-grid"><section className="assessment-card"><h2>{t("开始前确认", "Before you start")}</h2>
      <div className="paper-spec">{catalog?.readiness.map(r => <div key={r.type}><strong>{r.required}<small>{t(" 道", " questions")}</small></strong><b>{examTypeName(r.type, locale)}</b><span className={r.available < r.required ? "warning-text" : ""}>{t(`题库 ${r.available} 道`, `Question bank: ${r.available} questions`)}{r.available < r.required ? t(` · 缺 ${r.required - r.available} 道`, ` · ${r.required - r.available} missing`) : ""}</span></div>)}</div>
      <ul className="assessment-rules"><li><Clock3 size={18} /> {t("点击开始后计时，到时自动交卷。", "The timer starts when you begin and submits automatically when time expires.")}</li><li><CheckCircle2 size={18} /> {t("单选、多选每题 5 分；多选全部正确才得分。", "Single- and multiple-choice questions are worth 5 points; multiple choice requires every option to be correct.")}</li><li><LockKeyhole size={18} /> {t("考核期间关闭学习助手与共享批注。", "The learning assistant and shared annotations are disabled during the assessment.")}</li><li><Cloud size={18} /> {t("作答自动保存到主机，同一浏览器刷新后可继续。", "Answers are saved to the host automatically; refresh in this browser to continue.")}</li></ul>
      <div className="assessment-notice"><b>{t("当前开放体验考核", "Trial assessment currently available")}</b><p>{t("题量不足时使用已有题型组卷，不补造题目。主观题计划每题 25 分，尚未接入 API 时保持待评分。题型未齐或评分未完成，不发布完整总成绩。", "When the bank is short, the assessment uses the available question types without inventing questions. Short-answer questions are planned at 25 points each and remain pending until the grading API is connected. A full score is not published until the paper and grading are complete.")}</p></div>
      <label className="candidate-name">{t("提交人", "Candidate name")}<input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder={t("填写你的显示名", "Enter your display name")} /></label><p className="status-note">{t("当前使用浏览器身份，尚未接入公司账号；请勿在共用浏览器提交个人考核。", "This uses a browser identity and is not connected to a company account; do not submit a personal assessment from a shared browser.")}</p>
      {error && <p role="alert" className="service-error">{error}</p>}
      {active ? <button className="primary-button exam-wide-button" onClick={() => open(active.id)}>{t("继续未完成的答卷", "Continue unfinished attempt")}</button> : <button className="primary-button exam-wide-button" disabled={busy || !name.trim() || !connected || !catalog?.readiness.some(r => r.available > 0)} onClick={start}>{busy ? t("准备答卷…", "Preparing assessment…") : t("开始考核", "Start assessment")}</button>}
    </section><aside className="assessment-card exam-history"><h2>{t("我的考核记录", "My assessment history")}</h2>
      {!catalog?.exams.length ? <div className="companion-empty"><ClipboardCheck size={28} /><p>{t("交卷后可以在这里查看答卷、错题和评分状态。", "After submission, you can review the attempt, missed questions, and grading status here.")}</p></div> : catalog.exams.map(e => <button key={e.id} onClick={() => open(e.id)}><span>{date(e.startedAt, locale)}</span><b>{e.status === "active" ? t("进行中 · 继续作答", "In progress · Continue") : e.total === null ? t(`已交卷 · 客观题 ${e.objectiveScore ?? 0} 分`, `Submitted · Objective score ${e.objectiveScore ?? 0}`) : `${e.total} / 100 ${t("分", "points")}`}</b><small>{e.status === "submitted" && e.total === null ? t("完整总成绩暂不发布", "Full score not yet published") : ""}</small></button>)}
    </aside></div>
  </div>;
}

export function ExamPaper({ attempt, answers, index, setIndex, remaining, busy, error, saveStatus, answer, save, submit, reload }: {
  attempt: ExamAttempt; answers: ExamAnswers; index: number; setIndex: (n: number) => void; remaining: number; busy: boolean; error: string; saveStatus: string;
  answer: (id: string, v: string | string[]) => void; save: () => void; submit: () => void; reload: () => void;
}) {
  const [confirm, setConfirm] = useState(false); const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (confirm) dialog.current?.showModal(); else dialog.current?.close(); }, [confirm]);
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const q = attempt.questions[index]; const selected = answers[q.id] ?? (q.type === "subjective" ? "" : []);
  return <div className="page assessment-page">
    <header className="active-paper-header"><div><span className="section-kicker">{t("正在考核", "ASSESSMENT IN PROGRESS")} · {attempt.name}</span><h1>{t(`第 ${index + 1} / ${attempt.questions.length} 题`, `Question ${index + 1} / ${attempt.questions.length}`)}</h1></div><div className={`exam-clock ${remaining < 300 ? "urgent" : ""}`} role="timer" aria-label={t("剩余时间", "Time remaining")}><Clock3 size={22} />{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</div></header>
    <div className="active-paper-grid"><article className="assessment-card exam-question"><div className="exam-question-meta">{examTypeName(q.type, locale)} · {q.type === "subjective" ? 25 : 5} {t("分", "points")}{q.type === "multiple_choice" ? t(" · 全部正确才得分", " · Every option must be correct") : ""}</div><h2>{plain(q.stem)}</h2>
      {q.type === "subjective" ? <textarea className="exam-subjective" aria-label={t("主观题作答", "Short-answer response")} disabled={busy || remaining === 0} rows={12} maxLength={12000} value={typeof selected === "string" ? selected : ""} placeholder={t("在这里组织你的回答…", "Write your answer here…")} onChange={e => answer(q.id, e.target.value)} /> : <div className="exam-options">{q.options.map(o => <label className={Array.isArray(selected) && selected.includes(o.key) ? "selected" : ""} key={o.key}><input type={q.type === "single_choice" ? "radio" : "checkbox"} name={q.id} checked={Array.isArray(selected) && selected.includes(o.key)} disabled={busy || remaining === 0} onChange={() => answer(q.id, q.type === "single_choice" ? [o.key] : Array.isArray(selected) && selected.includes(o.key) ? selected.filter(k => k !== o.key) : [...(Array.isArray(selected) ? selected : []), o.key])} /><b>{o.key}</b><span>{plain(o.text)}</span></label>)}</div>}
      <footer className="exam-question-footer"><button className="secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={17} /> {t("上一题", "Previous")}</button><button className="primary-button" disabled={index === attempt.questions.length - 1} onClick={() => setIndex(index + 1)}>{t("下一题", "Next")} <ChevronRight size={17} /></button></footer>
    </article><aside className="assessment-card answer-sheet"><h2>{t("答题卡", "Answer sheet")}</h2><p>{t(`已作答 ${answeredCount(answers)} / ${attempt.questions.length}`, `Answered ${answeredCount(answers)} / ${attempt.questions.length}`)}</p>
      <div className="answer-sheet-grid">{attempt.questions.map((item, i) => <button key={item.id} className={`${i === index ? "current" : ""} ${answers[item.id]?.length ? "answered" : ""}`} aria-label={`${t("第", "Question ")}${i + 1}${answers[item.id]?.length ? t("题，已作答", ", answered") : t("题，未作答", ", unanswered")}`} aria-current={i === index ? "step" : undefined} onClick={() => setIndex(i)}>{i + 1}</button>)}</div>
      <p className="save-status" role="status"><Cloud size={16} /> {saveStatus}</p>{error && <div role="alert" className="service-error"><p>{error}</p><button className="secondary-button" onClick={reload}>{t("重新载入主机答卷", "Reload host attempt")}</button></div>}
      <button className="secondary-button exam-wide-button" disabled={busy} onClick={save}>{t("立即保存", "Save now")}</button><button className="primary-button exam-wide-button" disabled={busy} onClick={() => setConfirm(true)}>{t("交卷", "Submit")}</button><p className="status-note">{t("计时不会因刷新或离开页面暂停。未保存的离线作答不计入到时交卷。", "The timer does not pause when you refresh or leave. Unsaved offline answers are not included in an automatic submission.")}</p>
    </aside></div>
    <dialog className="submit-dialog" ref={dialog} onCancel={() => setConfirm(false)}><h2>{t("确认交卷？", "Confirm submission?")}</h2><p>{t(`已作答 ${answeredCount(answers)} / ${attempt.questions.length} 题，交卷后不能修改。`, `You have answered ${answeredCount(answers)} / ${attempt.questions.length} questions. Submission cannot be edited.`)}</p><div className="inline-actions"><button className="secondary-button" disabled={busy} onClick={() => setConfirm(false)}>{t("继续作答", "Continue answering")}</button><button className="primary-button" disabled={busy} onClick={submit}>{busy ? t("保存答卷…", "Saving attempt…") : t("确认交卷", "Confirm submission")}</button></div>{error && <p role="alert" className="service-error">{error}</p>}</dialog>
  </div>;
}

export function ExamReview({ attempt, error, busy, back, grade }: { attempt: ExamAttempt; error: string; busy: boolean; back: () => void; grade: () => void }) {
  const [wrongOnly, setWrongOnly] = useState(false);
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const pending = attempt.results?.some(r => r.state === "pending");
  return <div className="page assessment-page">
    <div className="assessment-heading"><div><span className="section-kicker">SUBMITTED</span><h1>{t("答卷已保存", "Submission saved")}</h1><p>{attempt.name} · {date(attempt.startedAt, locale)} — {date(attempt.submittedAt!, locale)} </p></div><button className="secondary-button" onClick={back}>{t("返回考核首页", "Back to assessment")}</button></div>
    <div className="exam-score-strip"><div><small>{t("客观题得分", "Objective score")}</small><strong>{attempt.objectiveScore}<span> / {attempt.objectiveMax}</span></strong></div><div><small>{t("完整总成绩", "Full score")}</small><strong>{attempt.total === null ? t("暂不发布", "Not published") : `${attempt.total} / 100`}</strong><p>{!attempt.completePaper ? t("题型未齐，本卷为体验卷。", "This is a trial paper because not all question types are available.") : attempt.total === null ? t("主观题尚未完成评分。", "Short-answer grading is not complete.") : t("全部题目评分完成。", "All questions have been graded.")}</p></div><div><small>{t("主观题评分", "Short-answer grading")}</small><p>{attempt.questions.some(q => q.type === "subjective") ? pending ? t("暂未接入 API 或服务不可用，无法打分。", "The grading API is unavailable, so this answer cannot be graded yet.") : t("已按评分要点完成", "Graded against the rubric") : t("本卷无主观题", "No short-answer questions")}</p>{pending && <button className="secondary-button" disabled={busy} onClick={grade}>{busy ? t("评分中…", "Grading…") : t("重试主观题评分", "Retry short-answer grading")}</button>}</div></div>
    {error && <p role="alert" className="service-error">{error}</p>}<div className="review-toolbar"><h2>{t("答卷与错题", "Answers and missed questions")}</h2><button className="secondary-button" aria-pressed={wrongOnly} onClick={() => setWrongOnly(v => !v)}>{wrongOnly ? t("查看全部题目", "Show all questions") : t("只看错题与待评分", "Show missed and pending")}</button></div>
    {wrongOnly && attempt.results?.every(r => r.score === r.maxScore) && <p className="assessment-card">{t("本卷没有错题或待评分题。", "This paper has no missed or pending questions.")}</p>}
    {attempt.questions.map((q, i) => {
      const r = attempt.results?.find(r => r.id === q.id); if (wrongOnly && r?.score === r?.maxScore) return null;
      return <article className="exam-review-card" key={q.id}><header><span>{i + 1} · {examTypeName(q.type, locale)}</span><b className={r?.state === "correct" ? "positive-text" : "warning-text"}>{r?.score === null ? t("待评分", "Pending") : `${r?.score} / ${r?.maxScore} ${t("分", "points")}`}</b></header><h3>{plain(q.stem)}</h3>{q.options?.map(o => <p key={o.key}>{o.key}. {plain(o.text)}</p>)}
        <div className="review-answer"><b>{t("你的作答", "Your answer")}</b><p>{Array.isArray(attempt.answers[q.id]) ? (attempt.answers[q.id] as string[]).join("、") || t("未作答", "Not answered") : attempt.answers[q.id] || t("未作答", "Not answered")}</p><b>{t("参考答案", "Reference answer")}</b><p>{q.type === "subjective" ? plain(q.subjectiveAnswer?.referenceAnswer) : q.correctAnswer?.join("、")}</p><b>{t("解释", "Explanation")}</b><p>{plain(q.explanation)}</p>
          {q.subjectiveAnswer && <><b>{t("评分要点", "Rubric")}</b><ul>{q.subjectiveAnswer.rubric.map((item, j) => <li key={j}>{plain(item.criterion)}（{item.points} {t("分", "points")}）</li>)}</ul></>}
          {r?.reason && <p className="status-note">{r.reason}</p>}{r?.items?.map(item => <p key={item.index}>{t(`要点 ${item.index + 1}`, `Point ${item.index + 1}`)}：{item.points} {t("分", "points")} · {item.feedback}</p>)}
        </div></article>;
    })}
  </div>;
}
