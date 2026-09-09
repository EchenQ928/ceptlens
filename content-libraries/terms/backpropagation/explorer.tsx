import { useEffect, useMemo, useRef, useState } from "react";
import { Formula } from "@term-sdk";
import { evaluate, formatValue, initial, inputs, target, type Parameters } from "./model";
import styles from "./styles.module.css";

type Phase = "overview" | "forward" | "backward" | "complete";
type NodeKey = "x1" | "x2" | "a" | "h" | "prediction" | "loss" | "target";
type GradientKey = "prediction" | "h" | "a" | keyof Parameters;
type EdgeKey = "x1-a" | "x2-a" | "w1-a" | "w2-a" | "b-a" | "a-h" | "h-prediction" | "v-prediction" | "c-prediction" | "prediction-loss" | "target-loss";

export type AnimationFrame = {
  phase: Phase;
  title: string;
  note: string;
  formula: string;
  substitution: string;
  values: Partial<Record<NodeKey, number>>;
  gradients: Partial<Record<GradientKey, number>>;
  activeNodes: string[];
  activeEdges: EdgeKey[];
  activeDirection?: "forward" | "backward";
};

const result = evaluate(initial);

export const frames: AnimationFrame[] = [
  {
    phase: "overview",
    title: "先看完整的计算图",
    note: "蓝色表示前向计算得到的值，红色表示从 Loss 反向传回的梯度。每个框同时保留变量名和当前数值，参数卡片会保留已经算出的梯度。",
    formula: String.raw`a=w_1x_1+w_2x_2+b,\quad h=\operatorname{ReLU}(a),\quad \hat y=vh+c,\quad L=(\hat y-y)^2`,
    substitution: String.raw`x_1=2,\ x_2=1,\ y=3,\ w_1=1,\ w_2=0.5,\ b=0.5,\ v=1,\ c=-1`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target },
    gradients: {}, activeNodes: [], activeEdges: [],
  },
  {
    phase: "forward",
    title: "1 / 6　输入与参数汇合",
    note: "两个输入特征 x₁、x₂ 分别沿自己的路径进入第一层；w₁、w₂ 对它们加权，偏置 b 也在这一层参与计算。",
    formula: String.raw`a=w_1x_1+w_2x_2+b`,
    substitution: String.raw`1\times2+0.5\times1+0.5`,
    values: { x1: inputs.x1, x2: inputs.x2, target }, gradients: {},
    activeNodes: ["x1", "x2", "w1", "w2", "b", "a"],
    activeEdges: ["x1-a", "x2-a", "w1-a", "w2-a", "b-a"], activeDirection: "forward",
  },
  {
    phase: "forward",
    title: "2 / 6　第一层生成中间值 a",
    note: "第一层把两条加权结果和偏置相加，生成 a=3。这个中间值会交给激活函数。",
    formula: String.raw`a=w_1x_1+w_2x_2+b`,
    substitution: String.raw`a=1\times2+0.5\times1+0.5=3`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, target }, gradients: {},
    activeNodes: ["a"], activeEdges: ["x1-a", "x2-a", "w1-a", "w2-a", "b-a"], activeDirection: "forward",
  },
  {
    phase: "forward",
    title: "3 / 6　经过激活函数生成 h",
    note: "本例 a=3 大于 0，ReLU 保留它，因此 h=3。h 会继续流向输出层。",
    formula: String.raw`h=\operatorname{ReLU}(a)=\max(0,a)`,
    substitution: String.raw`h=\max(0,3)=3`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, target }, gradients: {},
    activeNodes: ["a", "h"], activeEdges: ["a-h"], activeDirection: "forward",
  },
  {
    phase: "forward",
    title: "4 / 6　输出层汇合 h、v 和 c",
    note: "输出层把 h=3 乘上 v=1，再加入偏置 c=-1，得到预测值。",
    formula: String.raw`\hat y=vh+c`,
    substitution: String.raw`\hat y=1\times3+(-1)=2`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, target }, gradients: {},
    activeNodes: ["h", "v", "c", "prediction"], activeEdges: ["h-prediction", "v-prediction", "c-prediction"], activeDirection: "forward",
  },
  {
    phase: "forward",
    title: "5 / 6　预测值 ŷ 已生成",
    note: "网络已经把输入变成预测 ŷ=2。目标值 y=3 从另一条支路进入损失计算。",
    formula: String.raw`\hat y=vh+c`,
    substitution: String.raw`\hat y=2`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, target }, gradients: {},
    activeNodes: ["prediction", "target"], activeEdges: ["prediction-loss", "target-loss"], activeDirection: "forward",
  },
  {
    phase: "forward",
    title: "6 / 6　预测与目标形成 Loss",
    note: "L=(ŷ-y)²=(2-3)²=1。训练接下来要回答：每个参数怎样影响了这个差距？",
    formula: String.raw`L=(\hat y-y)^2`,
    substitution: String.raw`L=(2-3)^2=1`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target }, gradients: {},
    activeNodes: ["prediction", "target", "loss"], activeEdges: ["prediction-loss", "target-loss"], activeDirection: "forward",
  },
  {
    phase: "backward",
    title: "反向 1 / 4　先求预测值对 Loss 的影响",
    note: "从 Loss 出发，先问：预测值 ŷ 改变一点，Loss 会改变多少？这个影响是 ∂L/∂ŷ=-2。",
    formula: String.raw`\frac{\partial L}{\partial\hat y}=2(\hat y-y)`,
    substitution: String.raw`\frac{\partial L}{\partial\hat y}=2(2-3)=-2`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target },
    gradients: { prediction: result.dPrediction }, activeNodes: ["loss", "prediction"], activeEdges: ["prediction-loss"], activeDirection: "backward",
  },
  {
    phase: "backward",
    title: "反向 2 / 4　影响沿输出层分开",
    note: "ŷ=vh+c，所以 v、c 和 h 都会影响 Loss。已有的 ∂L/∂ŷ 被复用，再乘上各自这一小段的局部导数。",
    formula: String.raw`\frac{\partial L}{\partial v}=\frac{\partial L}{\partial\hat y}h,\quad \frac{\partial L}{\partial c}=\frac{\partial L}{\partial\hat y},\quad \frac{\partial L}{\partial h}=\frac{\partial L}{\partial\hat y}v`,
    substitution: String.raw`-2\times3=-6,\quad -2,\quad -2\times1=-2`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target },
    gradients: { prediction: result.dPrediction, v: result.gradients.v, c: result.gradients.c, h: result.dH },
    activeNodes: ["prediction", "h", "v", "c"], activeEdges: ["h-prediction", "v-prediction", "c-prediction"], activeDirection: "backward",
  },
  {
    phase: "backward",
    title: "反向 3 / 4　穿过 ReLU 回到 a",
    note: "本例 a=3 位于 ReLU 的正半轴，局部导数为 1。因此 ∂L/∂a=-2×1=-2。",
    formula: String.raw`\frac{\partial L}{\partial a}=\frac{\partial L}{\partial h}\frac{\partial h}{\partial a}`,
    substitution: String.raw`\frac{\partial L}{\partial a}=-2\times1=-2`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target },
    gradients: { prediction: result.dPrediction, v: result.gradients.v, c: result.gradients.c, h: result.dH, a: result.dA },
    activeNodes: ["h", "a"], activeEdges: ["a-h"], activeDirection: "backward",
  },
  {
    phase: "backward",
    title: "反向 4 / 4　第一层的三个参数得到梯度",
    note: "a=w₁x₁+w₂x₂+b。梯度沿三条局部路径分别传回 w₁、w₂ 和 b；参数卡片会保留最终结果。",
    formula: String.raw`\frac{\partial L}{\partial w_1}=\frac{\partial L}{\partial a}x_1,\quad \frac{\partial L}{\partial w_2}=\frac{\partial L}{\partial a}x_2,\quad \frac{\partial L}{\partial b}=\frac{\partial L}{\partial a}`,
    substitution: String.raw`-2\times2=-4,\quad -2\times1=-2,\quad -2`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target },
    gradients: { prediction: result.dPrediction, v: result.gradients.v, c: result.gradients.c, h: result.dH, a: result.dA, w1: result.gradients.w1, w2: result.gradients.w2, b: result.gradients.b },
    activeNodes: ["a", "x1", "x2", "w1", "w2", "b"], activeEdges: ["x1-a", "x2-a", "w1-a", "w2-a", "b-a"], activeDirection: "backward",
  },
  {
    phase: "complete",
    title: "反向传播完成，所有参数的梯度到齐",
    note: "一次反向传播把每个参数对当前 Loss 的影响全部算出。优化器随后使用这些梯度更新参数。",
    formula: String.raw`\nabla_{\theta}L=\left(\frac{\partial L}{\partial w_1},\frac{\partial L}{\partial w_2},\frac{\partial L}{\partial b},\frac{\partial L}{\partial v},\frac{\partial L}{\partial c}\right)`,
    substitution: String.raw`(-4,-2,-2,-6,-2)`,
    values: { x1: inputs.x1, x2: inputs.x2, a: result.a, h: result.h, prediction: result.prediction, loss: result.loss, target },
    gradients: { prediction: result.dPrediction, v: result.gradients.v, c: result.gradients.c, h: result.dH, a: result.dA, w1: result.gradients.w1, w2: result.gradients.w2, b: result.gradients.b },
    activeNodes: ["w1", "w2", "b", "v", "c"], activeEdges: [],
  },
];

const nodeLayout: Record<NodeKey, { x: number; y: number; width: number; height: number; label: string; symbol: string; gradientKey?: GradientKey }> = {
  x1: { x: 22, y: 134, width: 86, height: 64, label: "输入特征", symbol: "x₁" },
  x2: { x: 22, y: 252, width: 86, height: 64, label: "输入特征", symbol: "x₂" },
  a: { x: 300, y: 172, width: 176, height: 84, label: "线性组合", symbol: "a", gradientKey: "a" },
  h: { x: 566, y: 182, width: 112, height: 64, label: "激活函数", symbol: "h", gradientKey: "h" },
  prediction: { x: 798, y: 172, width: 142, height: 84, label: "输出层", symbol: "ŷ", gradientKey: "prediction" },
  loss: { x: 1042, y: 172, width: 88, height: 84, label: "损失", symbol: "L" },
  target: { x: 842, y: 328, width: 88, height: 58, label: "目标", symbol: "y" },
};

const parameterLayout: Record<keyof Parameters, { x: number; y: number; width: number; height: number; label: string }> = {
  w1: { x: 142, y: 30, width: 104, height: 68, label: "x₁ 的权重" },
  w2: { x: 142, y: 330, width: 104, height: 68, label: "x₂ 的权重" },
  b: { x: 330, y: 30, width: 104, height: 68, label: "第一层偏置" },
  v: { x: 612, y: 30, width: 104, height: 68, label: "输出层权重" },
  c: { x: 612, y: 330, width: 104, height: 68, label: "输出层偏置" },
};

type Edge = { key: EdgeKey; from: { x: number; y: number }; to: { x: number; y: number } };
const edges: Edge[] = [
  { key: "x1-a", from: { x: 108, y: 166 }, to: { x: 300, y: 201 } },
  { key: "x2-a", from: { x: 108, y: 284 }, to: { x: 300, y: 228 } },
  { key: "w1-a", from: { x: 246, y: 64 }, to: { x: 350, y: 172 } },
  { key: "w2-a", from: { x: 246, y: 364 }, to: { x: 350, y: 256 } },
  { key: "b-a", from: { x: 434, y: 64 }, to: { x: 426, y: 172 } },
  { key: "a-h", from: { x: 476, y: 214 }, to: { x: 566, y: 214 } },
  { key: "h-prediction", from: { x: 678, y: 214 }, to: { x: 798, y: 214 } },
  { key: "v-prediction", from: { x: 716, y: 64 }, to: { x: 840, y: 172 } },
  { key: "c-prediction", from: { x: 716, y: 364 }, to: { x: 840, y: 256 } },
  { key: "prediction-loss", from: { x: 940, y: 214 }, to: { x: 1042, y: 214 } },
  { key: "target-loss", from: { x: 930, y: 357 }, to: { x: 1084, y: 256 } },
];

const forwardLabels: Partial<Record<EdgeKey, string>> = { "x1-a": "x₁", "x2-a": "x₂", "w1-a": "w₁", "w2-a": "w₂", "b-a": "b", "a-h": "a", "h-prediction": "h", "v-prediction": "v", "c-prediction": "c", "prediction-loss": "ŷ", "target-loss": "y" };

function Bubble({ x, y, width, height, symbol, value, kind, gradient, active }: { x: number; y: number; width: number; height: number; symbol: string; value: number | undefined; kind: "node" | "parameter"; gradient?: number; active?: boolean }) {
  return <g className={`${styles.bubble} ${kind === "parameter" ? styles.parameterBubble : styles.nodeBubble} ${active ? styles.activeBubble : ""}`} transform={`translate(${x} ${y})`}>
    <rect width={width} height={height} rx="12" />
    <text className={styles.bubbleSymbol} x={width / 2} y="25" textAnchor="middle">{symbol}</text>
    <text className={styles.bubbleValue} x={width / 2} y={height - 16} textAnchor="middle">{value === undefined ? "—" : formatValue(value)}</text>
    {gradient !== undefined && <text className={styles.bubbleGradient} x={width / 2} y={height + 18} textAnchor="middle">∂L/∂{symbol} = {formatValue(gradient)}</text>}
  </g>;
}

function GraphNode({ node, frame }: { node: NodeKey; frame: AnimationFrame }) {
  const layout = nodeLayout[node];
  const value = frame.values[node];
  const gradient = layout.gradientKey ? frame.gradients[layout.gradientKey] : undefined;
  const rule = node === "a" ? "w₁x₁+w₂x₂+b" : node === "h" ? "ReLU(a)" : node === "prediction" ? "vh+c" : node === "loss" ? "(ŷ−y)²" : "";
  return <g className={`${styles.graphNode} ${frame.activeNodes.includes(node) ? styles.graphNodeActive : ""}`} data-node={node}>
    <rect x={layout.x} y={layout.y} width={layout.width} height={layout.height} rx="14" />
    <text className={styles.nodeLabel} x={layout.x + layout.width / 2} y={layout.y + 19} textAnchor="middle">{layout.label}</text>
    <text className={styles.nodeRule} x={layout.x + layout.width / 2} y={layout.y + 40} textAnchor="middle">{rule}</text>
    <text className={styles.nodeValueSymbol} x={layout.x + layout.width / 2 - (value === undefined ? 0 : 15)} y={layout.y + layout.height - 14} textAnchor="middle">{layout.symbol}</text>
    <text className={styles.nodeValue} x={layout.x + layout.width / 2 + (value === undefined ? 0 : 15)} y={layout.y + layout.height - 14} textAnchor="middle">{value === undefined ? "—" : `= ${formatValue(value)}`}</text>
    {gradient !== undefined && <text className={styles.nodeGradient} x={layout.x + layout.width / 2} y={layout.y + layout.height + 18} textAnchor="middle">∂L/∂{layout.symbol} = {formatValue(gradient)}</text>}
  </g>;
}

function MovingBubble({ edge, direction, label, id }: { edge: Edge; direction: "forward" | "backward"; label: string; id: string }) {
  const start = direction === "forward" ? edge.from : edge.to;
  const end = direction === "forward" ? edge.to : edge.from;
  return <g className={`${styles.movingBubble} ${direction === "backward" ? styles.movingGradient : styles.movingValue}`} transform={`translate(${start.x} ${start.y})`} aria-hidden="true">
    <rect x="-28" y="-14" width="56" height="28" rx="14" />
    <text x="0" y="5" textAnchor="middle">{label}</text>
    <animateMotion key={id} dur="850ms" fill="freeze" path={`M 0 0 L ${end.x - start.x} ${end.y - start.y}`} />
  </g>;
}

function NetworkGraph({ frame, frameIndex }: { frame: AnimationFrame; frameIndex: number }) {
  const activeEdges = useMemo(() => new Set(frame.activeEdges), [frame.activeEdges]);
  const activeEdgeItems = edges.filter((edge) => activeEdges.has(edge.key));
  return <figure className={styles.graphFigure} aria-label="反向传播计算图：前向值从输入流向损失，反向梯度从损失返回各个参数">
    <div className={styles.graphLegend}><span><i className={styles.blueDot} />前向值：从输入到 Loss</span><span><i className={styles.redDot} />反向梯度：从 Loss 回到参数</span></div>
    <svg className={styles.network} viewBox="0 0 1160 430" role="img" aria-label="两个输入经过线性组合、激活和输出层得到损失，再沿同一计算图反向得到五个参数梯度">
      <defs>
        <marker id="neutral-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#a7b0bb" /></marker>
        <marker id="forward-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#1473e6" /></marker>
        <marker id="backward-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#c7000b" /></marker>
      </defs>
      <g className={styles.baseEdges}>{edges.map((edge) => <line key={edge.key} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} markerEnd="url(#neutral-arrow)" />)}</g>
      {activeEdgeItems.map((edge) => { const direction = frame.activeDirection ?? "forward"; const from = direction === "forward" ? edge.from : edge.to; const to = direction === "forward" ? edge.to : edge.from; return <line key={`${frameIndex}-${edge.key}-${direction}`} className={direction === "forward" ? styles.activeForwardEdge : styles.activeBackwardEdge} x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd={direction === "forward" ? "url(#forward-arrow)" : "url(#backward-arrow)"} />; })}
      {activeEdgeItems.map((edge) => <MovingBubble key={`${frameIndex}-${edge.key}`} edge={edge} direction={frame.activeDirection ?? "forward"} label={frame.activeDirection === "backward" ? "∂L" : forwardLabels[edge.key] ?? "值"} id={`${frameIndex}-${edge.key}`} />)}
      {(Object.keys(nodeLayout) as NodeKey[]).map((node) => <GraphNode key={node} node={node} frame={frame} />)}
      {(Object.keys(parameterLayout) as Array<keyof Parameters>).map((key) => { const layout = parameterLayout[key]; const gradient = frame.gradients[key]; const active = frame.activeNodes.includes(key); return <g key={key} className={`${styles.parameterNode} ${active ? styles.parameterNodeActive : ""}`} data-parameter={key}><Bubble x={layout.x} y={layout.y} width={layout.width} height={layout.height} symbol={key} value={initial[key]} kind="parameter" gradient={gradient} active={active} /><text className={styles.parameterLabel} x={layout.x + layout.width / 2} y={layout.y - 9} textAnchor="middle">{layout.label}</text></g>; })}
    </svg>
  </figure>;
}

export const FRAME_DELAY = 2400;

export function BackpropagationAnimation() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = frames[index];
  const last = index === frames.length - 1;
  useEffect(() => { if (!playing || last) return; const timer = window.setTimeout(() => setIndex((value) => Math.min(value + 1, frames.length - 1)), FRAME_DELAY); return () => window.clearTimeout(timer); }, [index, last, playing]);
  useEffect(() => { if (last) setPlaying(false); }, [last]);
  function seek(next: number) { setPlaying(false); setIndex(Math.max(0, Math.min(next, frames.length - 1))); }
  function play() { if (playing) { setPlaying(false); return; } if (last) setIndex(0); setPlaying(true); stageRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" }); }
  return <div ref={stageRef} className={styles.animation} data-frame={index} data-phase={frame.phase}>
    <div className={styles.animationToolbar}><div className={styles.animationButtons}><button className={styles.primaryButton} onClick={play}>{playing ? "暂停" : last ? "重新播放" : "播放演示"}</button><button onClick={() => seek(index - 1)} disabled={index === 0}>上一步</button><button onClick={() => seek(index + 1)} disabled={last}>下一步</button><button className={styles.resetButton} onClick={() => seek(0)}>回到完整图</button></div><span className={styles.progressLabel}>{index === 0 ? "完整结构" : `${index} / ${frames.length - 1}`}</span></div>
    <div className={styles.progressTrack}><span style={{ width: `${(index / (frames.length - 1)) * 100}%` }} /></div>
    <NetworkGraph frame={frame} frameIndex={index} />
    <div className={styles.animationExplanation} aria-live="polite"><span className={`${styles.phaseBadge} ${frame.phase === "backward" || frame.phase === "complete" ? styles.backwardBadge : ""}`}>{frame.phase === "overview" ? "结构" : frame.phase === "forward" ? "前向传播" : frame.phase === "backward" ? "反向传播" : "完成"}</span><h3>{frame.title}</h3><p>{frame.note}</p><div className={styles.formulaRow}><Formula expression={frame.formula} symbols={[]} /><Formula expression={frame.substitution} symbols={[]} /></div></div>
    <p className={styles.animationHint}>同一张图贯穿全过程。蓝色值沿依赖关系向前，红色梯度沿相反方向返回；梯度到达参数后会停留在参数卡片上。</p>
  </div>;
}
