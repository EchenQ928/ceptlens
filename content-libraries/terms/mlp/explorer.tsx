import { useId, useState } from 'react';
import { uiText, useLocale } from '@term-sdk';
import { layers } from './model';
import styles from './styles.module.css';

const positions: Record<string, [number, number]> = { x1: [65, 135], x2: [65, 265], A: [300, 135], B: [300, 265], C: [580, 135], D: [580, 265], out: [860, 200] };
const edges = [['x1','A'],['x2','A'],['x1','B'],['x2','B'],['A','C'],['B','C'],['A','D'],['B','D'],['C','out'],['D','out']];
const nodes = layers.flat();
const number = (value: number) => value < 0 ? `(${String(value).replace('-', '−')})` : String(value);
function Symbol({ name }: { name: string }) {
  return <span className={styles.symbol}>{name === 'out' ? <>F<sub>out</sub></> : name.startsWith('h') ? <>h<sub>{name.slice(1)}</sub></> : name.startsWith('F') ? <>F<sub>{name.slice(1)}</sub></> : name}</span>;
}
export function LayerExplorer() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const [selected, setSelected] = useState('A');
  const marker = useId().replace(/:/g, '');
  const current = nodes.find(node => node.id === selected)!;
  return <div className={styles.explorer}>
    <div className={styles.explorerHeader}><strong>{t("一组数字，逐层变成另一组数字", "One set of numbers becomes another, layer by layer")}</strong><p>{t("点击 F 单元，查看它的输入来源与计算。实线强调当前单元接收的连接；查看位置改变，示例数值不变。", "Click an F unit to inspect its inputs and calculation. Solid lines highlight the connections received by the selected unit; changing the selection does not change the example values.")}</p></div>
    <div className={styles.diagram}>
      <svg viewBox="0 0 1040 345" role="img" aria-label={t("全连接 MLP：输入 x₁=1、x₂=2；第一隐藏层 A、B 输出 2、0；第二隐藏层 C、D 输出 1、4；输出单元得到 2.5。相邻层每个单元都相连，同层之间没有连接。", "Fully connected MLP: inputs x₁=1 and x₂=2; hidden layer 1 outputs 2 and 0; hidden layer 2 outputs 1 and 4; the output unit produces 2.5. Every unit connects to the adjacent layer, with no within-layer connections.")}>
        <defs><marker id={`${marker}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8" fill="context-stroke" /></marker></defs>
        {[{ x:65, title:t('输入层','Input layer'), detail:t('2 个输入数','2 inputs') },{ x:300, title:t('隐藏层 1','Hidden layer 1'), detail:t('2 个计算单元','2 units') },{ x:580, title:t('隐藏层 2','Hidden layer 2'), detail:t('2 个计算单元','2 units') },{ x:860, title:t('输出层','Output layer'), detail:t('1 个计算单元','1 unit') }].map(layer => <g key={layer.x}><text x={layer.x} y="29" className={styles.layerTitle}>{layer.title}</text><text x={layer.x} y="53" className={styles.layerSubtitle}>{layer.detail}</text></g>)}
        {edges.map(([from,to]) => { const [x1,y1]=positions[from]; const [x2,y2]=positions[to]; return <line key={`${from}-${to}`} data-edge={`${from}-${to}`} data-active={to===selected} className={to===selected ? styles.activeEdge : styles.edge} x1={x1+110} y1={y1} x2={x2-38} y2={y2} markerEnd={`url(#${marker}-arrow)`} />; })}
        {['x1','x2'].map((id,i) => <g key={id}><rect x="27" y={positions[id][1]-23} width="76" height="46" rx="4" className={styles.inputBox} /><text x="65" y={positions[id][1]+6} className={styles.inputText}>{i===0?'x₁ = 1':'x₂ = 2'}</text><line className={styles.signalLine} x1="103" x2="175" y1={positions[id][1]} y2={positions[id][1]} /></g>)}
        {nodes.map(node => { const [x,y]=positions[node.id]; return <g key={node.id} data-signal={node.id}><line className={styles.signalLine} x1={x+38} y1={y} x2={node.id==='out'?1010:x+110} y2={y} markerEnd={node.id==='out'?`url(#${marker}-arrow)`:undefined} /><text className={styles.signalValue} x={node.id==='out'?965:x+78} y={y-12}>{node.id==='out'? 'y' : <><tspan>h</tspan><tspan baselineShift="sub" fontSize="12">{node.id}</tspan></>} = {node.value}</text></g>; })}
        <text className={styles.diagramNote} x="65" y="323" textAnchor="start">{t("箭头传递数值；F 表示单元执行的计算，h 表示隐藏层传出的结果。", "Arrows carry values; F is the computation performed by a unit, and h is a result emitted by a hidden layer.")}</text>
      </svg>
      {nodes.map(node => <button type="button" key={node.id} aria-label={t(`查看单元 ${node.id === 'out' ? '输出' : node.id}`, `View unit ${node.id === 'out' ? 'output' : node.id}`)} aria-pressed={selected===node.id} className={`${styles.node} ${selected===node.id?styles.selected:''}`} style={{ left:`${positions[node.id][0]/10.4}%`,top:`${positions[node.id][1]/3.45}%` }} onClick={()=>setSelected(node.id)}><Symbol name={node.id==='out'?'out':`F${node.id}`} /></button>)}
    </div>
    <div className={styles.inspector} aria-live="polite" aria-atomic="true">
      <div className={styles.inspectorHeading}><h3><Symbol name={selected==='out'?'out':`F${selected}`} /> {t("怎样得到", "how it obtains")} <Symbol name={current.outputName} /> = {current.value}</h3><span>{current.layerIndex===0?t('隐藏层 1','Hidden layer 1'):current.layerIndex===1?t('隐藏层 2','Hidden layer 2'):t('输出层','Output layer')}</span></div>
      <p className={styles.origin}>{current.layerIndex===0?t('它接收原始输入 x₁、x₂。同层的另一个单元也接收这两个数，但使用自己的一组参数。','It receives the raw inputs x₁ and x₂. The other unit in the same layer receives them too, but uses its own parameters.'):current.layerIndex===1?t('它接收隐藏层 1 传出的 hA、hB。到这里，上一层的输出已经成为这一层的输入。','It receives hA and hB from hidden layer 1. At this point, the previous layer output has become this layer input.'):t('它接收隐藏层 2 传出的 hC、hD，把这两个中间结果组合为最终数值。','It receives hC and hD from hidden layer 2 and combines these intermediate results into the final value.')}</p>
      <div className={styles.calculation}>
        <div className={styles.calcRow}><b>{t("01 · 乘权重", "01 · Multiply by weights")}</b><div className={styles.products}>{current.inputs.map((value,i)=><div key={i} className={styles.product}><span><small>{t("输入", "Input")} <Symbol name={current.inputNames[i]} /></small><strong>{value}</strong></span><span>×</span><span className={styles.parameter}><small>{t("权重", "Weight")} {i+1}</small><strong>{number(current.weights[i])}</strong></span><span>=</span><strong>{current.products[i]}</strong></div>)}</div></div>
        <div className={styles.calcRow}><b>{t("02 · 相加，加偏置", "02 · Add, then add bias")}</b><div className={styles.sum}><span>{current.products.map(number).join(' + ')} + </span><span className={styles.parameter}><small>{t("偏置", "Bias")}</small><strong>{number(current.bias)}</strong></span><span>= <strong>{current.sum}</strong></span></div></div>
        <div className={styles.calcRow}><b>{t(`03 · ${current.relu?'经过 ReLU':'传出结果'}`, `03 · ${current.relu?'Apply ReLU':'Emit the result'}`)}</b><div className={styles.result}><strong>{current.sum}</strong><span>→ {current.relu?(current.sum<0?t('负数归零','Negative values become zero'):t('非负数保留','Non-negative values stay')):t('直接保留总和','Keep the sum directly')} →</span><strong><Symbol name={current.outputName} /> = {current.value}</strong></div></div>
      </div>
      <p className={styles.connectionNote}>{current.layerIndex<2?t('这个结果沿右侧连线，传给下一层的每个单元；每条连接各有自己的权重。','This result travels along the right-side connections to every unit in the next layer; each connection has its own weight.'):t('这里演示的是输出一个数值的网络，因此输出层不再做 ReLU。输出如何处理，要由任务决定。','This example outputs one value, so the output layer does not apply ReLU. The task determines how the output is handled.')}</p>
    </div>
    <p className={styles.footnote}>{t("固定输入为 [1, 2]；所有参数均为手工设置，用于解释结构和计算。最终的 2.5 是演示数值，不代表真实任务的预测能力。", "The fixed input is [1, 2]. All parameters are hand-set to explain the structure and calculation; the final 2.5 is a demonstration value, not a claim about real predictive ability.")}</p>
  </div>;
}
