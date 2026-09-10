import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { learningRequest } from "../infrastructure/learningClient";
import { useLearningSession } from "../components/LearningSession";
import type { ExamAnswers, ExamAttempt, ExamCatalog } from "../domain/exam";
import { ExamIntroduction, ExamPaper, ExamReview } from "../components/ExamViews";
import { uiText, useLocale } from "../i18n";

export function ExamPage() {
  const [params, setParams] = useSearchParams(); const id = params.get("attempt");
  const { session, error: sessionError, refresh, rename } = useLearningSession();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const [catalog, setCatalog] = useState<ExamCatalog | null>(null); const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<ExamAnswers>({}); const [index, setIndex] = useState(0); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [saveStatus, setSaveStatus] = useState(() => t("已保存到主机", "Saved to host")); const [now, setNow] = useState(Date.now());
  const answersRef = useRef<ExamAnswers>({}); const revision = useRef(0); const offset = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve()); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedId = useRef(id); mountedId.current = id; const autoSubmitted = useRef(false);
  useEffect(() => { if (session?.user.name) setName(session.user.name); }, [session?.user.name]);
  const load = useCallback(async () => {
    setError("");
    try {
      if (id) {
        const { attempt: a } = await learningRequest<{ attempt: ExamAttempt }>(`exams/${id}`);
        if (mountedId.current !== id) return;
        setAttempt(a); setIndex(0); revision.current = a.revision; offset.current = a.serverNow - Date.now(); autoSubmitted.current = false;
        let restored = a.answers;
        try {
          const draft = JSON.parse(localStorage.getItem(`ceptlens.exam-draft:${id}`) ?? "null");
          if (a.status === "active" && draft?.revision === a.revision) { restored = draft.answers; setSaveStatus(t("已恢复本机草稿，请保存到主机", "Restored local draft; save it to the host")); }
          else { setSaveStatus(t("已保存到主机", "Saved to host")); if (draft && a.status === "active") setError(t("主机答卷已有更新，已载入主机版本。本机旧草稿未覆盖主机，请核对作答。", "The host attempt was updated and has been loaded. The older local draft was not applied; review your answers.")); }
        } catch { /* Malformed device-local drafts never override the host paper. */ }
        answersRef.current = restored; setAnswers(restored);
      } else { setAttempt(null); setCatalog(await learningRequest<ExamCatalog>("exams")); }
    } catch (e) { setError(e instanceof Error ? e.message : t("无法加载答卷", "Unable to load the attempt")); }
  }, [id, locale]);
  useEffect(() => { void load(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  function persist(action: "answers" | "submit") {
    if (!id) return Promise.resolve();
    const target = id;
    const task = async () => {
      if (mountedId.current !== target) return;
      const snapshot = structuredClone(answersRef.current); setSaveStatus(action === "submit" ? t("交卷中…", "Submitting…") : t("正在保存…", "Saving…"));
      const { attempt: a } = await learningRequest<{ attempt: ExamAttempt }>(`exams/${target}/${action}`, { revision: revision.current, answers: snapshot });
      if (mountedId.current !== target) return;
      revision.current = a.revision; offset.current = a.serverNow - Date.now(); setAttempt(a); setError("");
      if (a.status === "submitted") { setAnswers(a.answers); answersRef.current = a.answers; localStorage.removeItem(`ceptlens.exam-draft:${target}`); await refresh(); }
      else if (JSON.stringify(snapshot) === JSON.stringify(answersRef.current)) localStorage.removeItem(`ceptlens.exam-draft:${target}`);
      else localStorage.setItem(`ceptlens.exam-draft:${target}`, JSON.stringify({ revision: a.revision, answers: answersRef.current }));
      setSaveStatus(t("已保存到主机", "Saved to host"));
    };
    const next = queue.current.catch(() => {}).then(task); queue.current = next;
    return next.catch(e => { setSaveStatus(t("未保存 · 本机草稿已保留", "Not saved · local draft retained")); setError(e instanceof Error ? e.message : t("保存失败", "Save failed")); throw e; });
  }
  const remaining = attempt ? Math.max(0, Math.ceil((attempt.deadline - now - offset.current) / 1000)) : 0;
  useEffect(() => {
    if (attempt?.status !== "active" || remaining > 0 || autoSubmitted.current) return;
    autoSubmitted.current = true; if (timer.current) clearTimeout(timer.current);
    void persist("submit").catch(() => {});
  }, [remaining, attempt?.status]);
  // Recover a completed server paper even if a timeout submission lost its response.
  useEffect(() => {
    if (!id || attempt?.status !== "active") return;
    const t = setInterval(() => {
      if (autoSubmitted.current) void learningRequest<{ attempt: ExamAttempt }>(`exams/${id}`).then(r => {
        if (r.attempt.status === "submitted") { setAttempt(r.attempt); setAnswers(r.attempt.answers); void refresh(); }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [id, attempt?.status]);
  useEffect(() => {
    if (!id || attempt?.status !== "submitted" || !attempt.results?.some(r => r.state === "pending") || !session?.agent.enabled) return;
    const t = setInterval(() => { void learningRequest<{ attempt: ExamAttempt }>(`exams/${id}`).then(r => setAttempt(r.attempt)).catch(() => {}); }, 5000);
    return () => clearInterval(t);
  }, [id, attempt?.status, attempt?.results?.some(r => r.state === "pending"), session?.agent.enabled]);
  function answer(questionId: string, value: string | string[]) {
    if (busy || remaining === 0) return;
    const next = { ...answersRef.current, [questionId]: value }; answersRef.current = next; setAnswers(next); setSaveStatus(t("有未保存更改", "Unsaved changes"));
    localStorage.setItem(`ceptlens.exam-draft:${id}`, JSON.stringify({ revision: revision.current, answers: next }));
    if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { void persist("answers").catch(() => {}); }, 500);
  }
  async function start() {
    setBusy(true); setError("");
    try { await rename(name); const r = await learningRequest<{ attempt: ExamAttempt }>("exams/start", { name }); await refresh(); setParams({ attempt: r.attempt.id }); }
    catch (e) { setError(e instanceof Error ? e.message : t("无法开始考核", "Unable to start the assessment")); } finally { setBusy(false); }
  }
  async function submit() { if (timer.current) clearTimeout(timer.current); setBusy(true); try { await persist("submit"); } catch { /* Preserve local draft. */ } finally { setBusy(false); } }
  async function grade() {
    if (!id) return; setBusy(true);
    try { const r = await learningRequest<{ attempt: ExamAttempt }>(`exams/${id}/grade`, {}); setAttempt(r.attempt); setError(r.attempt.results?.some(r => r.state === "pending") ? t("主观题仍待评分，请查看各题状态。", "Short-answer questions are still pending; review the status of each question.") : ""); }
    catch (e) { setError(e instanceof Error ? e.message : t("评分失败", "Grading failed")); } finally { setBusy(false); }
  }
  const feedback = error || sessionError;
  if (!id) return <ExamIntroduction catalog={catalog} name={name} setName={setName} busy={busy} connected={!!session} error={feedback} start={() => void start()} open={id => setParams({ attempt: id })} />;
  if (!attempt || attempt.id !== id) return <div className="page"><div className="assessment-card"><h1>{t("加载答卷", "Load attempt")}</h1><p role="status">{feedback || t("正在从主机读取…", "Reading from host…")}</p><div className="inline-actions"><button className="secondary-button" onClick={() => setParams({})}>{t("返回考核首页", "Back to assessment")}</button><button className="primary-button" onClick={() => void load()}>{t("重试", "Retry")}</button></div></div></div>;
  if (attempt.status === "submitted") return <ExamReview attempt={attempt} error={feedback} busy={busy} back={() => setParams({})} grade={() => void grade()} />;
  return <ExamPaper attempt={attempt} answers={answers} index={index} setIndex={setIndex} remaining={remaining} busy={busy} error={feedback} saveStatus={saveStatus} answer={answer} save={() => void persist("answers").catch(() => {})} submit={() => void submit()} reload={() => { if (window.confirm(t("重新载入主机答卷？当前未保存的作答会继续留在本机草稿中。", "Reload the host attempt? Any unsaved answers will remain in the local draft."))) void load(); }} />;
}
