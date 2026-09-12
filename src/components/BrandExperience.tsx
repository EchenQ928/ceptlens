import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState, type PointerEvent } from "react";
import { Pause, Play } from "lucide-react";
import { useLocale, uiText } from "../i18n";
import { ProductIcon } from "./ProductIcon";

/** A brand sequence, not a lesson: questions resolve into connected understanding. */
export function BrandExperience() {
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(true);
  const tiltX = useMotionValue(0), tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 65, damping: 22 });
  const rotateY = useSpring(tiltY, { stiffness: 65, damping: 22 });
  useEffect(() => {
    if (!running || reduced) return;
    const timer = setInterval(() => { if (!document.hidden) setPhase(value => (value + 1) % 3); }, 4600);
    return () => clearInterval(timer);
  }, [running, reduced]);
  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    tiltX.set((.5 - (event.clientY-box.top)/box.height)*8);
    tiltY.set(((event.clientX-box.left)/box.width-.5)*10);
  }
  const labels = [t("提问", "Question"), t("探索", "Explore"), t("掌握", "Understand")];
  return <div className={`brand-experience phase-${phase} ${running && !reduced ? "is-running" : ""}`} onPointerMove={trackPointer} onPointerLeave={() => { tiltX.set(0); tiltY.set(0); }}>
    <motion.div className="brand-scene" style={{ rotateX, rotateY }}>
      <div className="scene-aura"/>
      <svg className="scene-trajectories" viewBox="0 0 640 500" fill="none" aria-hidden="true">
        <defs><linearGradient id="scene-light" x1="70" y1="220" x2="580" y2="250" gradientUnits="userSpaceOnUse"><stop stopColor="#2ebdff" stopOpacity="0"/><stop offset=".35" stopColor="#4eb9ff"/><stop offset=".6" stopColor="#77d8ff"/><stop offset="1" stopColor="#748bff" stopOpacity="0"/></linearGradient></defs>
        <ellipse cx="335" cy="260" rx="257" ry="118" transform="rotate(-21 335 260)" stroke="#b1d7f8" strokeWidth="1"/>
        <ellipse cx="335" cy="260" rx="226" ry="150" transform="rotate(17 335 260)" stroke="#c8d9f8" strokeWidth="1" strokeDasharray="2 8"/>
        <path className="scene-stream" d="M44 310C120 361 213 129 336 232S496 340 606 172" stroke="url(#scene-light)" strokeWidth="3"/>
        <motion.path d="M78 153C197 116 231 197 314 232S467 338 569 303" stroke="url(#scene-light)" strokeWidth="1.5" initial={{ pathLength:0 }} animate={{ pathLength:phase===0?.28:1, opacity:phase===0?.35:.9 }} transition={{ duration:1.5, ease:[.22,1,.36,1] }}/>
        <motion.path d="M107 338L190 358L490 347L551 209" stroke="#599bef" strokeWidth="1.5" initial={{ pathLength:0 }} animate={{ pathLength:phase===2?1:0 }} transition={{ duration:1.3 }}/>
        {[[107,338],[190,358],[490,347],[551,209]].map(([x,y],i)=><motion.circle key={i} cx={x} cy={y} r={i%2?5:7} fill="#fff" stroke="#68b7f3" strokeWidth="2" animate={{ opacity:phase===2?1:.15, scale:phase===2?1:.6 }} transition={{ delay:i*.12,duration:.7 }}/>) }
      </svg>
      <motion.div className="scene-fragment fragment-left" animate={{ x:phase===0?-18:phase===1?25:5, y:phase===0?18:-12, rotate:phase===0?-14:-6, opacity:phase===0?.6:1 }} transition={{ duration:1.4,ease:[.22,1,.36,1] }}><span className="fragment-glyph">?</span><div className="fragment-lines"><i/><i/><i/></div></motion.div>
      <motion.div className="scene-fragment fragment-top" animate={{ x:phase===0?20:-8, y:phase===1?14:-8, rotate:phase===0?15:5 }} transition={{ duration:1.5,ease:[.22,1,.36,1] }}><ProductIcon kind="learn"/></motion.div>
      <motion.div className="hero-optic" animate={{ y:phase===1?-10:0, rotate:phase===0?-5:phase===1?2:-2, scale:phase===1?1.035:1 }} transition={{ duration:2.2,ease:[.22,1,.36,1] }}>
        <img src={`${import.meta.env.BASE_URL}brand/ceptlens-optic-hero.png`} alt="" width="1254" height="1254" fetchPriority="high"/>
        <div className="optic-caustic"/>
      </motion.div>
      <motion.div className="scene-fragment fragment-right" animate={{ x:phase===0?22:0, y:phase===0?8:-10, rotate:phase===0?12:4 }} transition={{ duration:1.4,ease:[.22,1,.36,1] }}><AnimatePresence mode="wait" initial={false}><motion.div key={phase===2?"resolved":"exploring"} initial={{ opacity:0,scale:.75 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:.8 }} transition={{ duration:.35 }}><ProductIcon kind={phase===2?"assess":"concepts"}/></motion.div></AnimatePresence></motion.div>
      <div className="scene-satellite satellite-one"/><div className="scene-satellite satellite-two"/>
    </motion.div>
    <div className="scene-controls"><div className="scene-chapters" role="group" aria-label={t("品牌动画章节", "Brand animation chapters")}>{labels.map((label,index)=><button key={index} aria-pressed={phase===index} onClick={()=>{setPhase(index);setRunning(false);}}>{phase===index&&<motion.span layoutId="scene-chapter" className="scene-chapter-active" transition={{type:"spring",stiffness:240,damping:28}}/>}<span>{label}</span></button>)}</div><button className="scene-play" aria-label={running&&!reduced?t("暂停动画","Pause animation"):t("播放动画","Play animation")} aria-pressed={running&&!reduced} disabled={!!reduced} onClick={()=>setRunning(value=>!value)}>{running&&!reduced?<Pause size={15}/>:<Play size={15}/>}</button></div>
  </div>;
}
