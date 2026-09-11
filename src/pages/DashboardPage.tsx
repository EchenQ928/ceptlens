import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BrandExperience } from "../components/BrandExperience";
import { ProductIcon, type ProductIconKind } from "../components/ProductIcon";
import { useContent } from "../hooks/useContent";
import { useLocale, uiText } from "../i18n";

export function DashboardPage() {
  const { questions, terms } = useContent();
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const modes: { to: string; kind: ProductIconKind; title: string; description: string; meta: string }[] = [
    { to: "/learn", kind: "learn", title: t("学习", "Learn"), description: t("从问题出发，看清原理。", "Good questions. Clear reasoning."), meta: `${questions.length} ${t("道题目", "questions")}` },
    { to: "/exam", kind: "assess", title: t("考核", "Assess"), description: t("独立作答，检验理解。", "Put your understanding to the test."), meta: t("限时挑战", "Timed assessment") },
    { to: "/terms", kind: "concepts", title: t("词条", "Concepts"), description: t("动手探索，让知识连起来。", "Interact with ideas. See the connections."), meta: `${terms.length} ${t("个词条", "concepts")}` }
  ];
  return <div className="product-home optical-home">
    <section className="brand-hero">
      <motion.div className="brand-hero-copy" initial={{ opacity:0, y:20 }} animate={{ opacity:1,y:0 }} transition={{duration:.8,ease:[.22,1,.36,1]}}>
        <span className="product-category"><i/>{t("AI 模型工程 · 交互式学习", "AI ENGINEERING · INTERACTIVE LEARNING")}</span>
        <h1>{t("看见原理，", "See the idea.")}<br/><em>{t("真正理解。", "Make it yours.")}</em></h1>
        <p>{t("把问题、交互与解释，连接成你的理解。", "Questions, interaction, and explanation. Connected.")}</p>
        <Link className="primary-button optical-cta" to="/learn">{t("开始探索", "Start exploring")}<span><ArrowRight size={19}/></span></Link>
      </motion.div>
      <BrandExperience/>
      <svg className="hero-ribbons" viewBox="0 0 1280 130" preserveAspectRatio="none" fill="none" aria-hidden="true"><defs><linearGradient id="ribbon-light"><stop stopColor="#b7dfff" stopOpacity="0"/><stop offset=".45" stopColor="#81d5f7" stopOpacity=".35"/><stop offset="1" stopColor="#bac8fc" stopOpacity=".1"/></linearGradient></defs><path d="M0 108C270 40 345 26 548 76S948 100 1280 20V130H0Z" fill="url(#ribbon-light)"/><path d="M0 90C235 125 420 2 686 84S1100 80 1280 40" stroke="white" strokeWidth="2"/><path d="M0 111C280 25 450 69 640 108S1040 39 1280 84" stroke="#acd8f6" strokeWidth="1" opacity=".6"/></svg>
    </section>
    <div className="product-modes">{modes.map(({to,kind,title,description,meta},i)=><motion.div key={to} initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.18+i*.09,ease:[.22,1,.36,1]}}><Link to={to} className={`product-mode mode-${kind}`}><div className="mode-illustration"><ProductIcon kind={kind}/><span className="mode-halo"/></div><div className="mode-copy"><h2>{title}</h2><p>{description}</p><span className="mode-meta">{meta}</span></div><span className="mode-enter"><ArrowRight size={20}/></span></Link></motion.div>)}</div>
  </div>;
}
