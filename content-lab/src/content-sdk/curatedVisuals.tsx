import { useMemo, useState, type ReactNode } from "react";
import { uiText, useLocale } from "../i18n";

export function VisualFrame({ title, instruction, children }: { title: string; instruction?: string; children: ReactNode }) {
  return <figure className="learning-visual"><figcaption><strong>{title}</strong>{instruction && <span>{instruction}</span>}</figcaption>{children}</figure>;
}

function SoftmaxExplorer() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const presets = [
    { label: t("接近", "Close"), values: [2, 1.7, 1.4] },
    { label: t("一般", "Moderate"), values: [2, 1, 0] },
    { label: t("悬殊", "Wide"), values: [4, 1, -1] }
  ];
  const [preset, setPreset] = useState(1);
  const logits = presets[preset].values;
  const probabilities = useMemo(() => {
    const maximum = Math.max(...logits);
    const exponentials = logits.map((value) => Math.exp(value - maximum));
    const denominator = exponentials.reduce((sum, value) => sum + value, 0);
    return exponentials.map((value) => value / denominator);
  }, [logits]);
  return <VisualFrame title={t("同一组分数，如何变成一组权重", "How one set of scores becomes a set of weights")} instruction={t("切换分数差距，观察概率是否更集中。", "Switch the score gaps and observe whether probability becomes more concentrated.")}><div className="visual-presets">{presets.map((item, index) => <button key={item.label} className={preset === index ? "active" : ""} onClick={() => setPreset(index)}>{item.label}</button>)}</div><div className="softmax-bars">{logits.map((value, index) => <div key={index}><span>{t("候选", "Candidate")} {index + 1}<small>{t("分数", "Score")} {value}</small></span><div className="probability-track"><i style={{ width: `${probabilities[index] * 100}%` }} /></div><b>{(probabilities[index] * 100).toFixed(1)}%</b></div>)}</div><p className="visual-conclusion">{t("三个概率始终非负且相加为 100%；分数差距越大，概率越集中到最高分候选。", "The three probabilities are always non-negative and sum to 100%; larger score gaps concentrate more probability on the highest-scoring candidate.")}</p></VisualFrame>;
}

function FittingRegimesVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const regimes = [
    { name: t("欠拟合", "Underfitting"), note: t("训练误差和验证误差都高", "Training and validation error are both high"), small: t("模型表达能力不足", "The model lacks expressive capacity"), path: "M8 58 C35 55,65 45,112 22" },
    { name: t("合理拟合", "Balanced fit"), note: t("两者都较低，差距可控", "Both are low with a controlled gap"), small: t("复杂度与数据匹配", "Complexity matches the data"), path: "M8 60 C28 58,31 20,52 37 S82 60,112 18" },
    { name: t("过拟合", "Overfitting"), note: t("训练误差低，验证误差明显变差", "Training error is low while validation error worsens"), small: t("模型记住训练细节与噪声", "The model memorizes training details and noise"), path: "M8 60 C18 8,28 70,39 17 S56 72,66 16 S87 68,112 13" }
  ];
  return <VisualFrame title={t("模型复杂度增加时，三种典型拟合状态", "Three typical fitting states as model complexity increases")}><div className="fitting-regimes">{regimes.map((item) => <article key={item.name}><svg viewBox="0 0 120 76" role="img" aria-label={t(`${item.name}的拟合线示意`, `Fit-line illustration for ${item.name}`)}><line x1="6" y1="68" x2="115" y2="68" /><line x1="6" y1="8" x2="6" y2="68" />{[18, 34, 50, 66, 82, 98].map((x, point) => <circle key={x} cx={x} cy={[56, 43, 48, 33, 29, 17][point]} r="2.8" />)}<path d={item.path} /></svg><b>{item.name}</b><p>{item.note}</p><small>{item.small}</small></article>)}</div><p className="visual-conclusion">{t("判断过拟合看训练集之外的数据：训练表现继续变好，而验证表现开始变差，才是关键现象。", "Diagnose overfitting with data outside training: the key signal is training performance continuing to improve while validation performance starts to worsen.")}</p></VisualFrame>;
}

function RegularizationStrengthVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const levels = [
    { lambda: "0", label: t("约束弱", "Weak constraint"), shape: t("过于弯曲，可能追随噪声", "Too curved, may follow noise"), className: "weak" },
    { lambda: "0.1", label: t("约束适中", "Balanced constraint"), shape: t("保留主要趋势，减少无效复杂度", "Keeps the main trend and reduces ineffective complexity"), className: "balanced" },
    { lambda: "1.0", label: t("约束过强", "Too strong"), shape: t("模型过于简单，可能欠拟合", "The model is too simple and may underfit"), className: "strong" }
  ];
  const [level, setLevel] = useState(1);
  const selected = levels[level];
  return <VisualFrame title={t("λ 控制‘拟合数据’与‘限制复杂度’之间的权衡", "λ controls the tradeoff between fitting data and limiting complexity")} instruction={t("切换正则化强度，只观察拟合形状如何变化。", "Switch the regularization strength and observe only how the fitted shape changes.")}><div className="visual-presets">{levels.map((item, index) => <button key={item.lambda} className={level === index ? "active" : ""} onClick={() => setLevel(index)}>λ = {item.lambda}</button>)}</div><div className="regularization-visual"><svg viewBox="0 0 300 150" role="img" aria-label={t(`${selected.label}时的拟合形状`, `Fitted shape with ${selected.label}`)}><line x1="20" y1="130" x2="285" y2="130" /><line x1="20" y1="15" x2="20" y2="130" />{[[42,112],[70,95],[96,100],[126,72],[154,80],[188,47],[220,52],[256,28]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="4" />)}<path className={selected.className} d={level === 0 ? "M28 118 C48 45,62 137,87 91 S118 36,140 85 S176 117,193 48 S229 88,271 21" : level === 1 ? "M28 119 C83 110,108 85,151 72 S223 44,271 25" : "M28 101 C92 88,174 67,271 45"} /></svg><div><span>{selected.label}</span><b>{selected.shape}</b><small>{t("总目标 = 数据损失 + λ × 复杂度惩罚", "Total objective = data loss + λ × complexity penalty")}</small></div></div><p className="visual-conclusion">{t("不能只比较“总损失”数值大小来判断正则化好坏，因为改变 λ 就改变了目标函数本身；最终要比较未参与训练的数据表现。", "Do not judge regularization only by total-loss magnitude, because changing λ changes the objective itself. Compare performance on data not used for training.")}</p></VisualFrame>;
}

function DropoutLayerVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const masks = [[false, true, false, false], [true, false, false, true], [false, false, true, false]];
  const [sample, setSample] = useState(0);
  const dropped = masks[sample];
  return <VisualFrame title={t("训练时，在一个全连接层中随机屏蔽部分神经元输出", "During training, randomly mask some neuron outputs in a fully connected layer")} instruction={t("点击重新采样，观察被屏蔽的神经元和连接一起改变。", "Resample and observe masked neurons and their connections change together.")}><button className="resample-button" onClick={() => setSample((value) => (value + 1) % masks.length)}>{t("重新采样屏蔽掩码", "Resample mask")}</button><div className="dropout-network"><div className="network-column"><small>{t("上一层的 3 个输出", "3 outputs from the previous layer")}</small>{[1,2,3].map((value) => <i key={value} />)}</div><svg viewBox="0 0 240 180" aria-hidden="true">{[35,90,145].flatMap((y1) => [25,68,112,155].map((y2,index) => <line key={`${y1}-${y2}`} x1="0" y1={y1} x2="240" y2={y2} className={dropped[index] ? "dropped" : ""} />))}</svg><div className="network-column hidden"><small>{t("当前全连接层的 4 个神经元", "4 neurons in the current fully connected layer")}</small>{dropped.map((isDropped, index) => <i key={index} className={isDropped ? "dropped" : ""}><span>{isDropped ? "×" : ""}</span></i>)}</div></div><div className="dropout-scale"><div><b>{t("训练", "Training")}</b><span>{t("保留的输出乘 1 / (1−p)", "Retained outputs are multiplied by 1 / (1−p)")}</span><small>{t("补偿平均幅值，p 是屏蔽概率", "Compensates average magnitude; p is the masking probability")}</small></div><div><b>{t("推理", "Inference")}</b><span>{t("全部神经元启用", "All neurons are enabled")}</span><small>{t("不再随机屏蔽，也不再额外缩放", "No random masking and no extra scaling")}</small></div></div><p className="visual-conclusion">{t("每次训练前向使用新的随机子网络；推理时恢复完整网络。Dropout 改的是激活路径，不会永久删除权重。", "Each training forward pass uses a new random subnetwork. Inference restores the full network. Dropout changes activation paths; it does not permanently delete weights.")}</p></VisualFrame>;
}

function ResidualPathVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("一份输入走两条路，再逐元素相加", "One input takes two paths, then is added element by element")}><div className="two-path-visual"><div className="visual-node source">{t("输入 x", "Input x")}</div><div className="path-stack"><div className="path-card main-path"><small>{t("主支路", "Main branch")}</small><b>F(x)</b><span>{t("卷积、注意力或 FFN 等变换", "Convolution, attention, FFN, or another transform")}</span></div><div className="path-card shortcut-path"><small>Shortcut</small><b>x</b><span>{t("保持原信息直接通过", "Original information passes through directly")}</span></div></div><div className="visual-merge">{t("逐元素相加", "Element-wise addition")}</div><div className="visual-node result">{t("输出 y = F(x) + x", "Output y = F(x) + x")}</div></div><p className="visual-conclusion">{t("残差连接不是把两路拼接起来；两路形状必须兼容，输出仍与输入保持同一主形状。", "A residual connection does not concatenate the two paths; their shapes must be compatible, and the output keeps the same main shape as the input.")}</p></VisualFrame>;
}

function SelfAttentionOneQuery() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("只跟踪一个位置：它怎样读取整段序列", "Track one position: how it reads the whole sequence")}><div className="attention-query-visual"><div className="query-token"><small>{t("当前位置", "Current position")}</small><b>{t("Query：位置 2", "Query: position 2")}</b></div><div className="key-scores">{[1, 2, 3].map((position, index) => <div key={position}><span>{t(`位置 ${position} 的 Key`, `Key at position ${position}`)}</span><b>{t("匹配分数", "Match score")} {([0.4, 1.2, 0.2][index]).toFixed(1)}</b><i style={{ width: `${[30, 65, 20][index]}%` }} /></div>)}</div><div className="attention-sum"><small>{t("Softmax 后的读取权重", "Read weights after Softmax")}</small><b>0.26 × V₁ + 0.57 × V₂ + 0.17 × V₃</b><span>{t("得到位置 2 的新表示", "New representation for position 2")}</span></div></div><p className="visual-conclusion">{t("Query 决定“我要找什么”，Key 用于匹配，最终真正被加权汇总的是 Value。", "Query says what to look for, Key is used for matching, and Value is what is actually aggregated with the weights.")}</p></VisualFrame>;
}

function MultiHeadAttentionVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const heads = [
    { name: t("头 1", "Head 1"), focus: t("更关注相邻位置", "Attends more to nearby positions"), weights: [65, 25, 10] },
    { name: t("头 2", "Head 2"), focus: t("更关注远处位置", "Attends more to distant positions"), weights: [15, 20, 65] },
    { name: t("头 3", "Head 3"), focus: t("更关注当前位置", "Attends more to the current position"), weights: [15, 70, 15] }
  ];
  return <VisualFrame title={t("同一输入并行投影成多组注意力", "The same input is projected in parallel into multiple attention heads")}><div className="multi-head-visual"><div className="visual-node source">{t("输入序列 X", "Input sequence X")}</div><div className="head-grid">{heads.map((head) => <div className="head-card" key={head.name}><b>{head.name}</b><small>{head.focus}</small><div>{head.weights.map((weight, index) => <i key={index} style={{ opacity: .25 + weight / 100 }} />)}</div></div>)}</div><div className="visual-merge">{t("拼接各头输出，再做一次输出投影", "Concatenate head outputs, then apply one output projection")}</div><div className="visual-node result">{t("融合后的序列表示", "Fused sequence representation")}</div></div><p className="visual-conclusion">{t("“多头”不是把同一结果复制多次，而是每个头有自己的 Q/K/V 投影参数，可以学习不同关系。", "Multi-head does not copy the same result several times; each head has its own Q/K/V projection parameters and can learn different relationships.")}</p></VisualFrame>;
}

function TransformerBlockVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("Transformer Block 的两次信息加工", "The two information-processing steps in a Transformer Block")}><div className="block-pipeline"><div><span>{t("输入序列", "Input sequence")}</span><small>{t("每行对应一个位置", "Each row corresponds to one position")}</small></div><b>→</b><div className="accent"><span>{t("多头自注意力", "Multi-head self-attention")}</span><small>{t("跨位置读取与混合", "Read and mix across positions")}</small></div><b>→</b><div><span>{t("残差 + LayerNorm", "Residual + LayerNorm")}</span><small>{t("保留主干并稳定数值", "Preserve the main path and stabilize values")}</small></div><b>→</b><div className="accent"><span>{t("逐位置 FFN", "Position-wise FFN")}</span><small>{t("每个位置独立加工特征", "Process features independently at each position")}</small></div><b>→</b><div><span>{t("残差 + LayerNorm", "Residual + LayerNorm")}</span><small>{t("输出形状通常保持不变", "Output shape usually stays unchanged")}</small></div></div><p className="visual-conclusion">{t("Attention 负责“位置之间交换信息”，FFN 负责“每个位置内部变换特征”。", "Attention exchanges information between positions; the FFN transforms features within each position.")}</p></VisualFrame>;
}

function PositionWiseFfnVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const rows = [[1, .2, -.1], [.1, .8, .4], [-.2, .3, 1]];
  return <VisualFrame title={t("同一个小网络，逐行处理每个位置", "The same small network processes each position row by row")}><div className="ffn-row-visual"><div><small>{t("输入矩阵：3 个位置", "Input matrix: 3 positions")}</small>{rows.map((row, index) => <span key={index}>{t("位置", "Position")} {index + 1}　[{row.join(", ")}]</span>)}</div><b>{t("同一组 FFN 参数", "The same FFN parameters")}<br />{t("分别应用到每一行", "are applied to each row")}</b><div><small>{t("输出仍是 3 个位置", "Output still has 3 positions")}</small>{rows.map((_, index) => <span key={index}>{t("位置", "Position")} {index + 1}　{t("新的特征向量", "new feature vector")}</span>)}</div></div><p className="visual-conclusion">{t("FFN 不读取其他行，所以它本身不做位置间的信息交换；三行共享同一套权重。", "The FFN does not read other rows, so it does not exchange information between positions by itself; all three rows share the same weights.")}</p></VisualFrame>;
}

function PositionalEncodingVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("内容相同的位置，加入不同的位置向量", "Same content, different positional vectors")}><div className="position-visual"><div><small>{t("Token 内容向量", "Token content vector")}</small><b>[1.0, 0.2, 0.5]</b></div><span>＋</span><div><small>{t("位置 3 的位置向量", "Position vector for position 3")}</small><b>[0.1, −0.2, 0.3]</b></div><span>＝</span><div className="result"><small>{t("带位置信息的输入", "Input with positional information")}</small><b>[1.1, 0.0, 0.8]</b></div></div><p className="visual-conclusion">{t("位置编码不是替换 Token 内容，而是让模型能区分“同一个内容出现在什么位置”。", "Positional encoding does not replace token content; it lets the model distinguish where the same content appears.")}</p></VisualFrame>;
}

function LayerNormalizationVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("LayerNorm 在一个 Token 的特征维内归一化", "LayerNorm normalizes within one token's feature dimension")}><div className="layernorm-visual"><div><small>{t("同一 Token 的 4 个特征", "4 features of one token")}</small><b>[2, 4, 6, 8]</b></div><span>{t("减去本行均值 5，", "Subtract this row's mean, 5,")}<br />{t("再除以本行标准差", "then divide by this row's standard deviation")}</span><div className="result"><small>{t("归一化后的 4 个特征", "4 normalized features")}</small><b>[−1.34, −0.45, 0.45, 1.34]</b></div></div><p className="visual-conclusion">{t("每个 Token 单独统计自己的特征，不依赖同一批次里的其他样本，因此训练与单样本推理口径一致。", "Each token computes statistics over its own features and does not depend on other samples in the batch, so training and single-sample inference use the same logic.")}</p></VisualFrame>;
}

function ConvBnFoldingVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("运行前把 BN 的固定缩放和偏移吸收到卷积参数", "Before runtime, fold BN's fixed scale and offset into convolution parameters")}><div className="folding-visual"><div className="graph-before"><span>{t("输入", "Input")}</span><b>→</b><span>Conv<br /><small>{t("权重 W，偏置 b", "weight W, bias b")}</small></span><b>→</b><span>BN<br /><small>{t("固定均值、方差、γ、β", "fixed mean, variance, γ, β")}</small></span><b>→</b><span>{t("输出", "Output")}</span></div><div className="fold-arrow">{t("离线代数改写", "Offline algebraic rewrite")}</div><div className="graph-after"><span>{t("输入", "Input")}</span><b>→</b><span className="result">{t("折叠后的 Conv", "Folded Conv")}<br /><small>{t("新权重 W′，新偏置 b′", "new weight W′, new bias b′")}</small></span><b>→</b><span>{t("同一输出", "Same output")}</span></div></div><p className="visual-conclusion">{t("推理图不再运行独立 BN；这要求 BN 使用已经固定的运行均值和方差，而不是训练态的批次统计。", "The inference graph no longer runs standalone BN. This requires BN to use fixed running mean and variance, not training-time batch statistics.")}</p></VisualFrame>;
}

function ForwardBackwardCostVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <VisualFrame title={t("一次训练步里，前向与反向分别在做什么", "What forward and backward do in one training step")}><div className="training-lifecycle"><div><b>{t("前向传播", "Forward pass")}</b><span>{t("输入 → 各层激活 → 预测 → 损失", "input → layer activations → prediction → loss")}</span><small>{t("计算一次模型；保存反向所需的中间激活", "Run the model once and save intermediate activations needed for backward")}</small></div><div className="memory-bridge"><span>{t("训练激活暂存区", "Training activation buffer")}</span><small>{t("反向经过对应层后才能释放，或用重计算换内存", "Can be released only after backward passes that layer, or traded for recomputation")}</small></div><div><b>{t("反向传播", "Backward pass")}</b><span>{t("从损失沿计算图反向求梯度", "Compute gradients backward from the loss through the graph")}</span><small>{t("通常还要计算激活梯度和参数梯度，因此工作量常不低于前向", "Often computes activation and parameter gradients, so its work is usually no less than forward")}</small></div></div><p className="visual-conclusion">{t("训练内存高不只是因为参数；为了反向求梯度而保留的中间激活，常随批次、序列长度和层数快速增长。", "High training memory is not only about parameters. Intermediate activations retained for backward often grow quickly with batch size, sequence length, and depth.")}</p></VisualFrame>;
}

function KvCacheVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const [step, setStep] = useState(3);
  return <VisualFrame title={t("生成新 Token 时，只追加新的 K/V", "When generating a new token, append only the new K/V")} instruction={t("切换生成步，观察历史缓存如何保留。", "Switch generation steps and observe how historical cache is retained.")}><div className="visual-presets">{[1, 2, 3, 4].map((value) => <button key={value} className={step === value ? "active" : ""} onClick={() => setStep(value)}>{locale === "en-US" ? `Step ${value}` : `第 ${value} 步`}</button>)}</div><div className="kv-cache-visual"><div><small>{t("本步输入", "Input this step")}</small><b>{t("新 Token", "New token")} {step}</b><span>{t("只为它计算新的 Q、K、V", "Compute new Q, K, and V only for it")}</span></div><div className="cache-bank"><small>{t("历史 KV Cache", "Historical KV Cache")}</small>{[1, 2, 3, 4].map((value) => <span key={value} className={value <= step ? (value === step ? "new" : "cached") : "empty"}>{t(`Token ${value} 的 K/V`, `K/V for token ${value}`)}</span>)}</div><div><small>{t("本步注意力", "Attention this step")}</small><b>{t(`新 Q 读取 Token 1…${step} 的 K/V`, `New Q reads K/V from token 1…${step}`)}</b><span>{t("旧 Token 的 K/V 不再重复投影", "Old tokens' K/V are not projected again")}</span></div></div><p className="visual-conclusion">{t("KV Cache 用更多显存/内存换更少的重复计算；缓存长度越长，容量和本步读取量仍会继续增加。", "KV Cache trades more memory for less repeated computation. As cache length grows, capacity and this step's read volume still increase.")}</p></VisualFrame>;
}

function RuntimePeakMemoryVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const stages = [
    { name: t("加载后", "After load"), values: [40, 4, 0, 2] },
    { name: t("执行中", "During execution"), values: [40, 18, 22, 8] },
    { name: t("执行后", "After execution"), values: [40, 3, 0, 4] }
  ];
  const [stage, setStage] = useState(1);
  const labels = [t("权重/常量", "Weights/constants"), t("存活激活", "Live activations"), t("算子工作区", "Operator workspace"), t("运行时缓冲", "Runtime buffers")];
  const total = stages[stage].values.reduce((sum, value) => sum + value, 0);
  return <VisualFrame title={t("峰值是某一时刻同时存活内存的总和", "Peak memory is the sum of live allocations at one moment")} instruction={t("切换执行时刻，观察哪一项把总量推到最高。", "Switch execution moments and see which part pushes the total highest.")}><div className="visual-presets">{stages.map((item, index) => <button key={item.name} className={stage === index ? "active" : ""} onClick={() => setStage(index)}>{item.name}</button>)}</div><div className="memory-stack">{stages[stage].values.map((value, index) => <div key={labels[index]} style={{ flex: value }}><span>{labels[index]}</span><b>{value} MB</b></div>)}</div><p className="memory-total">{t("此时合计", "Total at this moment")} <strong>{total} MB</strong></p><p className="visual-conclusion">{t("不能只把模型文件大小当作峰值内存；编译后的权重副本、并发激活和临时工作区都可能同时存在。", "Do not treat model file size as peak memory. Compiled weight copies, concurrent activations, and temporary workspaces may all exist at the same time.")}</p></VisualFrame>;
}

function QuantizationGridVisual() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const values = [-1.0, -0.47, 0.02, 0.51, 1.0];
  const scale = .25;
  return <VisualFrame title={t("连续浮点数映射到有限个整数格点", "Continuous floating-point values map to finite integer grid points")}><div className="quantization-visual"><div className="number-line">{[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((integer) => <span key={integer}><i />{integer}<small>{(integer * scale).toFixed(2)}</small></span>)}</div><div className="mapping-list">{values.map((value) => { const integer = Math.max(-4, Math.min(4, Math.round(value / scale))); const restored = integer * scale; return <div key={value}><span>{t("浮点", "Float")} {value.toFixed(2)}</span><b>→ {t("整数", "Integer")} {integer}</b><span>→ {t("近似恢复", "approx. restored")} {restored.toFixed(2)}</span><small>{t("误差", "error")} {(restored - value).toFixed(2)}</small></div>; })}</div></div><p className="visual-conclusion">{t("量化没有减少参数位置，而是用更窄的整数编号保存数值；scale 决定格点间距，也决定覆盖范围与舍入误差的权衡。", "Quantization does not reduce parameter positions. It stores values with narrower integer codes; scale determines grid spacing and the tradeoff between range and rounding error.")}</p></VisualFrame>;
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
