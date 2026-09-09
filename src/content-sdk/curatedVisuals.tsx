import { useMemo, useState, type ReactNode } from "react";

export function VisualFrame({ title, instruction, children }: { title: string; instruction?: string; children: ReactNode }) {
  return <figure className="learning-visual"><figcaption><strong>{title}</strong>{instruction && <span>{instruction}</span>}</figcaption>{children}</figure>;
}

function SoftmaxExplorer() {
  const presets = [{ label: "接近", values: [2, 1.7, 1.4] }, { label: "一般", values: [2, 1, 0] }, { label: "悬殊", values: [4, 1, -1] }];
  const [preset, setPreset] = useState(1);
  const logits = presets[preset].values;
  const probabilities = useMemo(() => {
    const maximum = Math.max(...logits);
    const exponentials = logits.map((value) => Math.exp(value - maximum));
    const denominator = exponentials.reduce((sum, value) => sum + value, 0);
    return exponentials.map((value) => value / denominator);
  }, [logits]);
  return <VisualFrame title="同一组分数，如何变成一组权重" instruction="切换分数差距，观察概率是否更集中。"><div className="visual-presets">{presets.map((item, index) => <button key={item.label} className={preset === index ? "active" : ""} onClick={() => setPreset(index)}>{item.label}</button>)}</div><div className="softmax-bars">{logits.map((value, index) => <div key={index}><span>候选 {index + 1}<small>分数 {value}</small></span><div className="probability-track"><i style={{ width: `${probabilities[index] * 100}%` }} /></div><b>{(probabilities[index] * 100).toFixed(1)}%</b></div>)}</div><p className="visual-conclusion">三个概率始终非负且相加为 100%；分数差距越大，概率越集中到最高分候选。</p></VisualFrame>;
}

function FittingRegimesVisual() {
  const regimes = [
    { name: "欠拟合", note: "训练误差和验证误差都高", path: "M8 58 C35 55,65 45,112 22" },
    { name: "合理拟合", note: "两者都较低，差距可控", path: "M8 60 C28 58,31 20,52 37 S82 60,112 18" },
    { name: "过拟合", note: "训练误差低，验证误差明显变差", path: "M8 60 C18 8,28 70,39 17 S56 72,66 16 S87 68,112 13" }
  ];
  return <VisualFrame title="模型复杂度增加时，三种典型拟合状态"><div className="fitting-regimes">{regimes.map((item, index) => <article key={item.name}><svg viewBox="0 0 120 76" role="img" aria-label={`${item.name}的拟合线示意`}><line x1="6" y1="68" x2="115" y2="68" /><line x1="6" y1="8" x2="6" y2="68" />{[18, 34, 50, 66, 82, 98].map((x, point) => <circle key={x} cx={x} cy={[56, 43, 48, 33, 29, 17][point]} r="2.8" />)}<path d={item.path} /></svg><b>{item.name}</b><p>{item.note}</p><small>{index === 0 ? "模型表达能力不足" : index === 1 ? "复杂度与数据匹配" : "模型记住训练细节与噪声"}</small></article>)}</div><p className="visual-conclusion">判断过拟合看训练集之外的数据：训练表现继续变好，而验证表现开始变差，才是关键现象。</p></VisualFrame>;
}

function RegularizationStrengthVisual() {
  const levels = [{ lambda: "0", label: "约束弱", shape: "过于弯曲，可能追随噪声", className: "weak" }, { lambda: "0.1", label: "约束适中", shape: "保留主要趋势，减少无效复杂度", className: "balanced" }, { lambda: "1.0", label: "约束过强", shape: "模型过于简单，可能欠拟合", className: "strong" }];
  const [level, setLevel] = useState(1);
  const selected = levels[level];
  return <VisualFrame title="λ 控制‘拟合数据’与‘限制复杂度’之间的权衡" instruction="切换正则化强度，只观察拟合形状如何变化。"><div className="visual-presets">{levels.map((item, index) => <button key={item.lambda} className={level === index ? "active" : ""} onClick={() => setLevel(index)}>λ = {item.lambda}</button>)}</div><div className="regularization-visual"><svg viewBox="0 0 300 150" role="img" aria-label={`${selected.label}时的拟合形状`}><line x1="20" y1="130" x2="285" y2="130" /><line x1="20" y1="15" x2="20" y2="130" />{[[42,112],[70,95],[96,100],[126,72],[154,80],[188,47],[220,52],[256,28]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="4" />)}<path className={selected.className} d={level === 0 ? "M28 118 C48 45,62 137,87 91 S118 36,140 85 S176 117,193 48 S229 88,271 21" : level === 1 ? "M28 119 C83 110,108 85,151 72 S223 44,271 25" : "M28 101 C92 88,174 67,271 45"} /></svg><div><span>{selected.label}</span><b>{selected.shape}</b><small>总目标 = 数据损失 + λ × 复杂度惩罚</small></div></div><p className="visual-conclusion">不能只比较“总损失”数值大小来判断正则化好坏，因为改变 λ 就改变了目标函数本身；最终要比较未参与训练的数据表现。</p></VisualFrame>;
}

function DropoutLayerVisual() {
  const masks = [[false, true, false, false], [true, false, false, true], [false, false, true, false]];
  const [sample, setSample] = useState(0);
  const dropped = masks[sample];
  return <VisualFrame title="训练时，在一个全连接层中随机屏蔽部分神经元输出" instruction="点击重新采样，观察被屏蔽的神经元和连接一起改变。"><button className="resample-button" onClick={() => setSample((value) => (value + 1) % masks.length)}>重新采样屏蔽掩码</button><div className="dropout-network"><div className="network-column"><small>上一层的 3 个输出</small>{[1,2,3].map((value) => <i key={value} />)}</div><svg viewBox="0 0 240 180" aria-hidden="true">{[35,90,145].flatMap((y1) => [25,68,112,155].map((y2,index) => <line key={`${y1}-${y2}`} x1="0" y1={y1} x2="240" y2={y2} className={dropped[index] ? "dropped" : ""} />))}</svg><div className="network-column hidden"><small>当前全连接层的 4 个神经元</small>{dropped.map((isDropped, index) => <i key={index} className={isDropped ? "dropped" : ""}><span>{isDropped ? "×" : ""}</span></i>)}</div></div><div className="dropout-scale"><div><b>训练</b><span>保留的输出乘 1 / (1−p)</span><small>补偿平均幅值，p 是屏蔽概率</small></div><div><b>推理</b><span>全部神经元启用</span><small>不再随机屏蔽，也不再额外缩放</small></div></div><p className="visual-conclusion">每次训练前向使用新的随机子网络；推理时恢复完整网络。Dropout 改的是激活路径，不会永久删除权重。</p></VisualFrame>;
}

function ResidualPathVisual() {
  return <VisualFrame title="一份输入走两条路，再逐元素相加"><div className="two-path-visual"><div className="visual-node source">输入 x</div><div className="path-stack"><div className="path-card main-path"><small>主支路</small><b>F(x)</b><span>卷积、注意力或 FFN 等变换</span></div><div className="path-card shortcut-path"><small>Shortcut</small><b>x</b><span>保持原信息直接通过</span></div></div><div className="visual-merge">逐元素相加</div><div className="visual-node result">输出 y = F(x) + x</div></div><p className="visual-conclusion">残差连接不是把两路拼接起来；两路形状必须兼容，输出仍与输入保持同一主形状。</p></VisualFrame>;
}

function SelfAttentionOneQuery() {
  return <VisualFrame title="只跟踪一个位置：它怎样读取整段序列"><div className="attention-query-visual"><div className="query-token"><small>当前位置</small><b>Query：位置 2</b></div><div className="key-scores">{["位置 1", "位置 2", "位置 3"].map((label, index) => <div key={label}><span>{label} 的 Key</span><b>匹配分数 {([0.4, 1.2, 0.2][index]).toFixed(1)}</b><i style={{ width: `${[30, 65, 20][index]}%` }} /></div>)}</div><div className="attention-sum"><small>Softmax 后的读取权重</small><b>0.26 × V₁ + 0.57 × V₂ + 0.17 × V₃</b><span>得到位置 2 的新表示</span></div></div><p className="visual-conclusion">Query 决定“我要找什么”，Key 用于匹配，最终真正被加权汇总的是 Value。</p></VisualFrame>;
}

function MultiHeadAttentionVisual() {
  const heads = [{ name: "头 1", focus: "更关注相邻位置", weights: [65, 25, 10] }, { name: "头 2", focus: "更关注远处位置", weights: [15, 20, 65] }, { name: "头 3", focus: "更关注当前位置", weights: [15, 70, 15] }];
  return <VisualFrame title="同一输入并行投影成多组注意力"><div className="multi-head-visual"><div className="visual-node source">输入序列 X</div><div className="head-grid">{heads.map((head) => <div className="head-card" key={head.name}><b>{head.name}</b><small>{head.focus}</small><div>{head.weights.map((weight, index) => <i key={index} style={{ opacity: .25 + weight / 100 }} />)}</div></div>)}</div><div className="visual-merge">拼接各头输出，再做一次输出投影</div><div className="visual-node result">融合后的序列表示</div></div><p className="visual-conclusion">“多头”不是把同一结果复制多次，而是每个头有自己的 Q/K/V 投影参数，可以学习不同关系。</p></VisualFrame>;
}

function TransformerBlockVisual() {
  return <VisualFrame title="Transformer Block 的两次信息加工"><div className="block-pipeline"><div><span>输入序列</span><small>每行对应一个位置</small></div><b>→</b><div className="accent"><span>多头自注意力</span><small>跨位置读取与混合</small></div><b>→</b><div><span>残差 + LayerNorm</span><small>保留主干并稳定数值</small></div><b>→</b><div className="accent"><span>逐位置 FFN</span><small>每个位置独立加工特征</small></div><b>→</b><div><span>残差 + LayerNorm</span><small>输出形状通常保持不变</small></div></div><p className="visual-conclusion">Attention 负责“位置之间交换信息”，FFN 负责“每个位置内部变换特征”。</p></VisualFrame>;
}

function PositionWiseFfnVisual() {
  const rows = [[1, .2, -.1], [.1, .8, .4], [-.2, .3, 1]];
  return <VisualFrame title="同一个小网络，逐行处理每个位置"><div className="ffn-row-visual"><div><small>输入矩阵：3 个位置</small>{rows.map((row, index) => <span key={index}>位置 {index + 1}　[{row.join(", ")}]</span>)}</div><b>同一组 FFN 参数<br />分别应用到每一行</b><div><small>输出仍是 3 个位置</small>{rows.map((_, index) => <span key={index}>位置 {index + 1}　新的特征向量</span>)}</div></div><p className="visual-conclusion">FFN 不读取其他行，所以它本身不做位置间的信息交换；三行共享同一套权重。</p></VisualFrame>;
}

function PositionalEncodingVisual() {
  return <VisualFrame title="内容相同的位置，加入不同的位置向量"><div className="position-visual"><div><small>Token 内容向量</small><b>[1.0, 0.2, 0.5]</b></div><span>＋</span><div><small>位置 3 的位置向量</small><b>[0.1, −0.2, 0.3]</b></div><span>＝</span><div className="result"><small>带位置信息的输入</small><b>[1.1, 0.0, 0.8]</b></div></div><p className="visual-conclusion">位置编码不是替换 Token 内容，而是让模型能区分“同一个内容出现在什么位置”。</p></VisualFrame>;
}

function LayerNormalizationVisual() {
  return <VisualFrame title="LayerNorm 在一个 Token 的特征维内归一化"><div className="layernorm-visual"><div><small>同一 Token 的 4 个特征</small><b>[2, 4, 6, 8]</b></div><span>减去本行均值 5，<br />再除以本行标准差</span><div className="result"><small>归一化后的 4 个特征</small><b>[−1.34, −0.45, 0.45, 1.34]</b></div></div><p className="visual-conclusion">每个 Token 单独统计自己的特征，不依赖同一批次里的其他样本，因此训练与单样本推理口径一致。</p></VisualFrame>;
}

function ConvBnFoldingVisual() {
  return <VisualFrame title="运行前把 BN 的固定缩放和偏移吸收到卷积参数"><div className="folding-visual"><div className="graph-before"><span>输入</span><b>→</b><span>Conv<br /><small>权重 W，偏置 b</small></span><b>→</b><span>BN<br /><small>固定均值、方差、γ、β</small></span><b>→</b><span>输出</span></div><div className="fold-arrow">离线代数改写</div><div className="graph-after"><span>输入</span><b>→</b><span className="result">折叠后的 Conv<br /><small>新权重 W′，新偏置 b′</small></span><b>→</b><span>同一输出</span></div></div><p className="visual-conclusion">推理图不再运行独立 BN；这要求 BN 使用已经固定的运行均值和方差，而不是训练态的批次统计。</p></VisualFrame>;
}

function ForwardBackwardCostVisual() {
  return <VisualFrame title="一次训练步里，前向与反向分别在做什么"><div className="training-lifecycle"><div><b>前向传播</b><span>输入 → 各层激活 → 预测 → 损失</span><small>计算一次模型；保存反向所需的中间激活</small></div><div className="memory-bridge"><span>训练激活暂存区</span><small>反向经过对应层后才能释放，或用重计算换内存</small></div><div><b>反向传播</b><span>从损失沿计算图反向求梯度</span><small>通常还要计算激活梯度和参数梯度，因此工作量常不低于前向</small></div></div><p className="visual-conclusion">训练内存高不只是因为参数；为了反向求梯度而保留的中间激活，常随批次、序列长度和层数快速增长。</p></VisualFrame>;
}

function KvCacheVisual() {
  const [step, setStep] = useState(3);
  return <VisualFrame title="生成新 Token 时，只追加新的 K/V" instruction="切换生成步，观察历史缓存如何保留。"><div className="visual-presets">{[1, 2, 3, 4].map((value) => <button key={value} className={step === value ? "active" : ""} onClick={() => setStep(value)}>第 {value} 步</button>)}</div><div className="kv-cache-visual"><div><small>本步输入</small><b>新 Token {step}</b><span>只为它计算新的 Q、K、V</span></div><div className="cache-bank"><small>历史 KV Cache</small>{[1, 2, 3, 4].map((value) => <span key={value} className={value <= step ? (value === step ? "new" : "cached") : "empty"}>Token {value} 的 K/V</span>)}</div><div><small>本步注意力</small><b>新 Q 读取 Token 1…{step} 的 K/V</b><span>旧 Token 的 K/V 不再重复投影</span></div></div><p className="visual-conclusion">KV Cache 用更多显存/内存换更少的重复计算；缓存长度越长，容量和本步读取量仍会继续增加。</p></VisualFrame>;
}

function RuntimePeakMemoryVisual() {
  const stages = [{ name: "加载后", values: [40, 4, 0, 2] }, { name: "执行中", values: [40, 18, 22, 8] }, { name: "执行后", values: [40, 3, 0, 4] }];
  const [stage, setStage] = useState(1);
  const labels = ["权重/常量", "存活激活", "算子工作区", "运行时缓冲"];
  return <VisualFrame title="峰值是某一时刻同时存活内存的总和" instruction="切换执行时刻，观察哪一项把总量推到最高。"><div className="visual-presets">{stages.map((item, index) => <button key={item.name} className={stage === index ? "active" : ""} onClick={() => setStage(index)}>{item.name}</button>)}</div><div className="memory-stack">{stages[stage].values.map((value, index) => <div key={labels[index]} style={{ flex: value }}><span>{labels[index]}</span><b>{value} MB</b></div>)}</div><p className="memory-total">此时合计 <strong>{stages[stage].values.reduce((sum, value) => sum + value, 0)} MB</strong></p><p className="visual-conclusion">不能只把模型文件大小当作峰值内存；编译后的权重副本、并发激活和临时工作区都可能同时存在。</p></VisualFrame>;
}

function QuantizationGridVisual() {
  const values = [-1.0, -0.47, 0.02, 0.51, 1.0];
  const scale = .25;
  return <VisualFrame title="连续浮点数映射到有限个整数格点"><div className="quantization-visual"><div className="number-line">{[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((integer) => <span key={integer}><i />{integer}<small>{(integer * scale).toFixed(2)}</small></span>)}</div><div className="mapping-list">{values.map((value) => { const integer = Math.max(-4, Math.min(4, Math.round(value / scale))); const restored = integer * scale; return <div key={value}><span>浮点 {value.toFixed(2)}</span><b>→ 整数 {integer}</b><span>→ 近似恢复 {restored.toFixed(2)}</span><small>误差 {(restored - value).toFixed(2)}</small></div>; })}</div></div><p className="visual-conclusion">量化没有减少参数位置，而是用更窄的整数编号保存数值；scale 决定格点间距，也决定覆盖范围与舍入误差的权衡。</p></VisualFrame>;
}

const visuals = {
  "softmax-explorer": SoftmaxExplorer,
  "fitting-regimes-visual": FittingRegimesVisual,
  "regularization-strength-visual": RegularizationStrengthVisual,
  "dropout-layer-visual": DropoutLayerVisual,
  "residual-path-visual": ResidualPathVisual,
  "self-attention-one-query": SelfAttentionOneQuery,
  "multi-head-attention-visual": MultiHeadAttentionVisual,
  "transformer-block-visual": TransformerBlockVisual,
  "position-wise-ffn-visual": PositionWiseFfnVisual,
  "positional-encoding-visual": PositionalEncodingVisual,
  "layer-normalization-visual": LayerNormalizationVisual,
  "conv-bn-folding-visual": ConvBnFoldingVisual,
  "forward-backward-cost-visual": ForwardBackwardCostVisual,
  "kv-cache-visual": KvCacheVisual,
  "runtime-peak-memory-visual": RuntimePeakMemoryVisual,
  "quantization-grid-visual": QuantizationGridVisual
} as const;

export type CuratedVisualName = keyof typeof visuals;

export function CuratedVisual({ name }: { name: CuratedVisualName }) {
  const Component = visuals[name];
  return Component ? <Component /> : null;
}
