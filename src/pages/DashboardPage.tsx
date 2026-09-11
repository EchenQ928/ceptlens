import { ArrowRight, BookOpen, ClipboardCheck, Network, Pause, Play, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { textForLocale } from "../domain/content";
import { useContent } from "../hooks/useContent";
import { useProgress } from "../hooks/useProgress";
import { useLocale, uiText } from "../i18n";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const progress = useProgress();
  const next = questions.find(q => q.id === progress.lastQuestionId);
  return <div className="product-home">
    <section className="product-intro">
      <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>{t("让知识", "Make knowledge")}<br className="phone-break"/><em>{t("变成直觉。", " click.")}</em></motion.h1>
      <p>{t("在交互中，理解 AI。", "Understand AI through interaction.")}</p>
      <div className="home-mode-links">
        {[{ to: "/learn", name: t("学习", "Learn"), icon: BookOpen }, { to: "/exam", name: t("考核", "Assess"), icon: ClipboardCheck }, { to: "/terms", name: t("词条", "Concepts"), icon: Network }].map(({ to, name, icon: Icon }) => <Link key={to} to={to}><Icon size={21}/><span>{name}</span><ArrowRight size={17}/></Link>)}
      </div>
    </section>
    <CachePreview hasLesson={terms.some(term => term.id === "kv-cache")} />
    {next && <Link className="home-resume" to={`/learn/questions/${next.id}?mode=${progress.studyMode}`}><BookOpen size={18}/><span>{t("继续学习", "Continue")}</span><strong>{textForLocale(next.taxonomy.primaryConcept, locale)}</strong><ArrowRight size={18}/></Link>}
  </div>;
}

/** Previous keys/values persist as one new token is processed. */
function CachePreview({ hasLesson }: { hasLesson: boolean }) {
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setPlaying(reduced === false); }, [reduced]);
  useEffect(() => { if (step === 6) setPlaying(false); }, [step]);
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setInterval(() => { if (!document.hidden) setStep(value => value < 6 ? value + 1 : 1); }, 2200);
    return () => clearInterval(timer);
  }, [playing, reduced]);
  function advance() { setPlaying(false); setStep(value => value < 6 ? value + 1 : 1); }
  return <section className="cache-preview" aria-label={t("KV Cache 交互预览", "Interactive KV Cache preview")}>
    <div className="preview-heading"><div><span className="preview-topic">KV Cache</span><h2>{t("算过的，就留住。", "Compute once. Keep it.")}</h2></div>{hasLesson && <Link to="/terms/kv-cache" aria-label={t("探索 KV Cache", "Explore KV Cache")}><ArrowRight size={22}/></Link>}</div>
    <div className="cache-stage">
      <div className="token-source"><span>{t("新 token", "New token")}</span><AnimatePresence mode="popLayout" initial={false}><motion.div className="token-cube" key={step} initial={{ opacity: 0, y: -24, rotate: -10 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, x: 40, scale: .8 }} transition={{ duration: .4 }}>x<sub>{step}</sub></motion.div></AnimatePresence></div>
      <div className="flow-line" aria-hidden="true"><motion.i key={step} initial={{ left: "0%", opacity: 0 }} animate={{ left: "100%", opacity: [0, 1, 0] }} transition={{ duration: .65 }}/></div>
      <div className="attention-core"><Network size={32}/><strong>Attention</strong><span>{t("新 Q，读取已有 K / V", "New Q reads stored K / V")}</span></div>
      <div className="cache-bridge" aria-hidden="true"><motion.i key={step} initial={{ opacity: 0, y: 32 }} animate={{ opacity: [0, 1, 0], y: -12 }} transition={{ delay: .3, duration: .65 }}/></div>
      <div className="cache-memory"><div className="cache-label"><b>KV Cache</b><span>{t("复用历史，只添新值", "Reuse the past. Add the new.")}</span></div><div className="cache-slots">{Array.from({ length: 6 }, (_, i) => <div key={i} className={`cache-slot ${i < step - 1 ? "retained" : i === step - 1 ? "incoming" : "empty"}`}><AnimatePresence>{i < step && <motion.span key={`entry-${i}`} initial={{ opacity: 0, y: -20, scale: .75 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .7 }} transition={{ type: "spring", stiffness: 220, damping: 20, delay: .1 }}><b>K<sub>{i + 1}</sub></b><b>V<sub>{i + 1}</sub></b></motion.span>}</AnimatePresence>{i >= step && <span className="slot-placeholder" aria-hidden="true">·</span>}</div>)}</div></div>
    </div>
    <div className="preview-controls"><span className="preview-step" aria-live="polite">{t("第", "Step")} {step}{t(" 步", " / 6")}</span><div><button className="preview-play" aria-label={playing ? t("暂停演示", "Pause demo") : t("播放演示", "Play demo")} aria-pressed={playing} disabled={!!reduced} onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button><button className="preview-next" onClick={advance}>{step < 6 ? t("下一步", "Next step") : t("再试一次", "Replay")}{step < 6 ? <ArrowRight size={17}/> : <RotateCcw size={17}/>}</button></div></div>
  </section>;
}
