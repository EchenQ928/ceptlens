import { useId, useState, type ReactNode } from "react";
import { uiText, useLocale } from "@term-sdk";
import styles from "./styles.module.css";

export const mlpExample = {
  input: [1, 2], hiddenWeights: [[1, 1], [1, -1]], hiddenBias: [-1, 0],
  outputWeights: [0.5, 0.5], outputBias: 0,
};
export function calculateMlpExample(input1 = mlpExample.input[0]) {
  const input = [input1, mlpExample.input[1]];
  const hiddenPreActivation = mlpExample.hiddenWeights.map((weights, i) =>
    weights.reduce((sum, weight, j) => sum + weight * input[j], mlpExample.hiddenBias[i]));
  const hidden = hiddenPreActivation.map(value => Math.max(0, value));
  const output = hidden.reduce((sum, value, i) => sum + value * mlpExample.outputWeights[i], mlpExample.outputBias);
  return { input, hiddenPreActivation, hidden, output };
}
type Target = "a" | "b" | "output";
const fmt = (value: number) => String(value).replace("-", "−");
function Symbol({ letter, sub }: { letter: string; sub?: string | number }) {
  return <span className={styles.symbol}>{letter}{sub !== undefined && <sub>{sub}</sub>}</span>;
}
function Amount({ label, value, tone = "plain" }: { label: ReactNode; value: number; tone?: "plain" | "weight" | "bias" | "result" }) {
  return <span className={`${styles.amount} ${styles[tone] ?? ""}`}><span>{label}</span><b>{fmt(value)}</b></span>;
}

export function MlpForwardExplorer() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const [target, setTarget] = useState<Target>("a");
  const id = useId().replaceAll(":", "");
  const values = calculateMlpExample();
  const index = target === "b" ? 1 : 0;
  const isOutput = target === "output";
  const suffix = isOutput ? "out" : target.toUpperCase();
  const sources = isOutput ? values.hidden : values.input;
  const weights = isOutput ? mlpExample.outputWeights : mlpExample.hiddenWeights[index];
  const bias = isOutput ? mlpExample.outputBias : mlpExample.hiddenBias[index];
  const products = sources.map((value, i) => value * weights[i]);
  const total = isOutput ? values.output : values.hiddenPreActivation[index];
  const result = isOutput ? values.output : values.hidden[index];
  const sourceSymbol = (i: number) => <Symbol letter={isOutput ? "h" : "x"} sub={isOutput ? ["A", "B"][i] : i + 1} />;
  const resultSymbol = <Symbol letter={isOutput ? "y" : "h"} sub={isOutput ? undefined : suffix} />;
  return <figure className={styles.explorer} aria-label={t("多层感知机前向计算：输入、计算函数与输出值", "MLP forward computation: inputs, computation functions, and output values")}>
    <figcaption><span className={styles.eyebrow}>{t("打开函数 · 前向计算", "Open a function · forward computation")}</span><strong>{t("函数框负责计算，箭头标出传出的结果", "Function boxes perform computation; arrows mark emitted results")}</strong></figcaption>
    <p className={styles.readHint}>{locale === "en-US" ? <> <Symbol letter="x" sub="1" /> and <Symbol letter="x" sub="2" /> are the two inputs. <Symbol letter="F" sub="A" /> and <Symbol letter="F" sub="B" /> are the two hidden-layer functions; their results are <Symbol letter="h" sub="A" /> and <Symbol letter="h" sub="B" />. <Symbol letter="F" sub="out" /> continues the computation and produces final output <Symbol letter="y" />.</> : <><Symbol letter="x" sub="1" />、<Symbol letter="x" sub="2" /> 是两个输入；<Symbol letter="F" sub="A" />、<Symbol letter="F" sub="B" /> 是隐藏层的两个计算函数，它们传出的结果记为 <Symbol letter="h" sub="A" />、<Symbol letter="h" sub="B" />。<Symbol letter="F" sub="out" /> 将这两个结果继续计算，得到最终输出 <Symbol letter="y" />。</>}</p>
    <div className={styles.diagramScroll}><div className={styles.diagram}>
      <svg viewBox="0 0 900 280" role="img" aria-label={t("输入 x1 等于 1、x2 等于 2，分别连接 FA 和 FB；FA 输出 hA 等于 2，FB 输出 hB 等于 0，二者连接 Fout，最终输出 y 等于 1。", "Inputs x1=1 and x2=2 connect to FA and FB; FA outputs hA=2, FB outputs hB=0, both connect to Fout, and the final output y=1.")}>
        <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="context-stroke" /></marker></defs>
        <g className={styles.diagramTitles}><text x="60" y="25">{t("输入", "Input")}</text><text x="330" y="25">{t("隐藏层", "Hidden layer")}</text><text x="670" y="25">{t("输出层", "Output layer")}</text><text x="810" y="25">{t("最终结果", "Final result")}</text></g>
        {[90, 210].flatMap((y, from) => [90, 210].map((end, to) => <line key={`${from}-${to}`} data-connection="input-hidden" x1="110" y1={y} x2="278" y2={end} className={(target === "a" && to === 0) || (target === "b" && to === 1) ? styles.activeEdge : styles.otherEdge} markerEnd={`url(#${id}-arrow)`} />))}
        {[90, 210].map((y, i) => <g key={i}>
          <path data-connection="hidden-output" d={`M380 ${y} H510 L618 150`} className={isOutput || target === ["a", "b"][i] ? styles.activeEdge : styles.otherEdge} markerEnd={`url(#${id}-arrow)`} />
          <text data-node={i === 0 ? "a" : "b"} className={styles.signalLabel} x="449" y={y - 13}>h<tspan baselineShift="sub" fontSize="13">{["A", "B"][i]}</tspan><tspan> = {fmt(values.hidden[i])}</tspan></text>
          <rect className={styles.inputRect} x="10" y={y - 34} width="100" height="68" rx="4" />
          <text className={styles.inputSymbol} x="60" y={y + 7}>x<tspan baselineShift="sub" fontSize="13">{i + 1}</tspan><tspan> = {values.input[i]}</tspan></text>
        </g>)}
        <line data-connection="final-output" x1="720" y1="150" x2="880" y2="150" className={isOutput ? styles.activeEdge : styles.otherEdge} markerEnd={`url(#${id}-arrow)`} />
        <text data-node="output" className={styles.signalLabel} x="803" y="133">y = {fmt(values.output)}</text>
      </svg>
      {(["a", "b", "output"] as const).map((key) => <button key={key} type="button" className={`${styles.functionNode} ${styles[key]} ${target === key ? styles.selected : ""}`} aria-pressed={target === key} aria-controls={`${id}-calculation`} aria-label={key === "output" ? t("查看输出函数的计算", "View the output function calculation") : t(`查看函数 F${key.toUpperCase()} 的计算`, `View function F${key.toUpperCase()} calculation`)} onClick={() => setTarget(key)}><Symbol letter="F" sub={key === "output" ? "out" : key.toUpperCase()} /><small>{target === key ? t("正在展开 ↓", "Expanded ↓") : t("点击展开", "Click to expand")}</small></button>)}
    </div></div>
    <p className={styles.clickHint}>{t("点击一个函数，在下方展开它的计算。", "Click a function to expand its calculation below.")}<span>{t("加粗实线标出当前函数接收与传出的路径。", "Bold solid lines mark the path received and emitted by the selected function.")}</span></p>
    <div className={styles.calculation} id={`${id}-calculation`} aria-live="polite" aria-atomic="true">
      <div className={styles.calculationHeading}><h3>{t("展开", "Expand")} <Symbol letter="F" sub={suffix} /> {t("的内部计算", "internals")}</h3><span className={styles.ioSummary}>{sourceSymbol(0)} = {sources[0]}{locale === "en-US" ? ", " : "，"}{sourceSymbol(1)} = {sources[1]}<span> → </span>{resultSymbol} = {fmt(result)}</span></div>
      <section className={styles.calcStep}>
        <div className={styles.stepHeading}><span className={styles.stepNumber}>01</span><h4>{t("每路输入乘以", "Multiply each input by its ")}<span className={styles.weightWord}>{t("权重", "weight")}</span></h4><p>{t("权重", "The weight")} <Symbol letter="w" /> {t("是每条连接自己的乘数，决定这一路怎样计入。", "is the multiplier for a connection and determines how this path contributes.")}</p></div>
        <div className={styles.branchRows}>{sources.map((value, i) => <div className={styles.equationRow} key={i}>
          <Amount label={<>{t("输入", "Input")} {sourceSymbol(i)}</>} value={value} /><span className={styles.operator}>×</span><Amount tone="weight" label={<>{t("权重", "Weight")} <Symbol letter="w" sub={`${suffix}${i + 1}`} /></>} value={weights[i]} /><span className={styles.operator}>=</span><Amount label={t("这一路的加权结果", "Weighted result for this path")} value={products[i]} />
        </div>)}</div>
      </section>
      <section className={styles.calcStep}>
        <div className={styles.stepHeading}><span className={styles.stepNumber}>02</span><h4>{t("加权结果相加，再加", "Add weighted results, then add the ")}<span className={styles.biasWord}>{t("偏置", "bias")}</span></h4><p>{t("偏置", "The bias")} <Symbol letter="b" /> {t("是这个单元额外加上的数，用于抬高或降低总和。", "is an extra value added by this unit to raise or lower the sum.")}</p></div>
        <div className={styles.equationRow}><Amount label={t("第一路的加权结果", "Weighted result for path 1")} value={products[0]} /><span className={styles.operator}>+</span><Amount label={t("第二路的加权结果", "Weighted result for path 2")} value={products[1]} /><span className={styles.operator}>+</span><Amount tone="bias" label={<>{t("偏置", "Bias")} <Symbol letter="b" sub={suffix} /></>} value={bias} /><span className={styles.operator}>=</span><Amount label={<>{t("总和", "Sum")} <Symbol letter="z" sub={suffix} /></>} value={total} /></div>
      </section>
      <section className={styles.calcStep}>
        <div className={styles.stepHeading}><span className={styles.stepNumber}>03</span><h4>{isOutput ? t("得到最终输出", "Produce the final output") : t("经过激活函数，传出结果", "Apply the activation function and emit the result")}</h4><p>{isOutput ? t("本例的输出函数直接使用总和。", "The output function in this example uses the sum directly.") : t("这里使用 ReLU：总和为负数就变成 0，其余保持不变。", "This uses ReLU: negative sums become 0, while other values stay unchanged.")}</p></div>
        <div className={styles.equationRow}><Amount label={<>{t("总和", "Sum")} <Symbol letter="z" sub={suffix} /></>} value={total} /><span className={styles.operator}>→</span><div className={styles.activationRule}><b>{isOutput ? t("直接输出", "Direct output") : "ReLU"}</b><span>{isOutput ? t("保留总和", "Keep the sum") : total < 0 ? t("负数归零", "Negative values become zero") : t("保持原值", "Keep the original value")}</span></div><span className={styles.operator}>→</span><Amount tone="result" label={<>{t("传出", "Emit")} {resultSymbol}</>} value={result} /></div>
      </section>
      <p className={styles.localConclusion}>{isOutput ? locale === "en-US" ? <>Finally, <Symbol letter="F" sub="out" /> multiplies <Symbol letter="h" sub="A" /> = 2 and <Symbol letter="h" sub="B" /> = 0 by 0.5, adds them with bias 0, and produces <Symbol letter="y" /> = 1.</> : <>最后，<Symbol letter="F" sub="out" /> 把 <Symbol letter="h" sub="A" /> = 2 和 <Symbol letter="h" sub="B" /> = 0 各乘权重 0.5，相加后加偏置 0，得到 <Symbol letter="y" /> = 1。</> : locale === "en-US" ? <>The right-side arrow's {resultSymbol} = {fmt(result)} is the result of these three steps. It continues into <Symbol letter="F" sub="out" /> as the next layer's input.</> : <>右侧箭头上的 {resultSymbol} = {fmt(result)}，就是这三步算出的结果。它继续传入 <Symbol letter="F" sub="out" />，成为下一层的输入。</>}</p>
    </div>
    <p className={styles.footnote}>{t("下标用于区分不同的输入、函数和参数。本例参数为手工选定，未经过训练；输出只是演算结果。", "Subscripts distinguish inputs, functions, and parameters. The parameters here are hand-selected and untrained; the output is only a worked calculation.")}</p>
  </figure>;
}
