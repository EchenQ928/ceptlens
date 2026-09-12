import { ArrowUpRight, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuraScene, FlowLink, TypeLine } from "../components/AuraPrimitives";
import { ProductIcon, type ProductIconKind } from "../components/ProductIcon";
import { useContent } from "../hooks/useContent";
import { useLocale, uiText } from "../i18n";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const modes: { to: string; kind: ProductIconKind; title: string; description: string; meta: string }[] = [
    { to: "/learn", kind: "learn", title: t("学习", "Learn"), description: t("从问题出发，看清原理。", "Good questions. Clear reasoning."), meta: `${questions.length} ${t("道题目", "questions")}` },
    { to: "/exam", kind: "assess", title: t("考核", "Assess"), description: t("独立作答，检验你的理解。", "Put your understanding to the test."), meta: t("限时作答", "Timed assessment") },
    { to: "/terms", kind: "concepts", title: t("词条", "Concepts"), description: t("动手推演，建立知识联系。", "Interact with ideas. Connect the concepts."), meta: `${terms.length} ${t("个词条", "concepts")}` }
  ];
  return <div className="aura-home">
    <section className="aura-hero" aria-labelledby="aura-title">
      <AuraScene paused={paused}/>
      <div className="hero-grain" aria-hidden="true"/>
      <motion.div className="aura-hero-copy" initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: .85, ease: [.22, 1, .36, 1] }}>
        <span className="aura-eyebrow">AI MODEL ENGINEERING</span>
        <h1 id="aura-title">{t("看见原理。", "See the idea.")}<br/><span>{t("让理解发生。", "Make it yours.")}</span></h1>
        <p>{t("问题、交互、解释。让知识成为你的能力。", "Questions. Interaction. Explanation. Knowledge you can use.")}</p>
        <div className="hero-actions"><FlowLink to="/learn">{t("开始学习", "Start learning")}</FlowLink><Link to="/terms" className="hero-secondary">{t("探索词条", "Explore concepts")}<ArrowUpRight size={17}/></Link></div>
        <div className="hero-typing"><TypeLine key={locale} text={t("一个好问题，是理解的开始。", "Understanding begins with a good question.")}/></div>
      </motion.div>
      <div className="hero-bottomline"><span>CEPTLENS / {t("交互式学习", "INTERACTIVE LEARNING")}</span><button type="button" className="ambient-toggle" aria-label={paused ? t("播放背景动画", "Play background animation") : t("暂停背景动画", "Pause background animation")} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14}/> : <Pause size={14}/>}<span>{t("光的轨迹", "LIGHT IN MOTION")}</span></button></div>
    </section>
    <section className="aura-pathways" aria-label={t("学习方式", "Ways to learn")}>
      <div className="pathways-heading"><div><span className="aura-eyebrow">THE LEARNING EXPERIENCE</span><h2>{t("从知道，到理解。", "Beyond knowing.")}</h2></div><p>{t("选择你的方式，深入一点。", "Choose a way in. Go a little deeper.")}</p></div>
      <div className="aura-mode-grid">{modes.map(({ to, kind, title, description, meta }, i) => <motion.div key={to} initial={reduced ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .55, delay: i * .08 }}><Link className={`aura-mode-card aura-mode-${kind}`} to={to}>
        <div className="aura-mode-top"><span className="aura-icon-tile"><ProductIcon kind={kind}/></span><span className="mode-number">0{i + 1}</span></div>
        <h3>{title}</h3><p>{description}</p>
        <div className={`mode-art art-${kind}`} aria-hidden="true">{kind === "learn" ? <><i/><i/><i/><span>A</span><span>B</span><span>C</span></> : kind === "assess" ? <><b>30<span> MIN</span></b><i/><i/><i/><i/><i/></> : <><i/><i/><i/><i/><i/><svg viewBox="0 0 240 100"><path d="M30 68L94 26L160 64L215 25M94 26L120 87L160 64"/></svg></>}</div>
        <div className="aura-mode-footer"><span>{meta}</span><span className="mode-open"><ArrowUpRight size={19}/></span></div>
      </Link></motion.div>)}</div>
    </section>
    <footer className="aura-footer"><span>CeptLens</span><span>Seize understanding.</span></footer>
  </div>;
}
