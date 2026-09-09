import { useId, useState } from 'react';
import { denseExample, units } from './model';
import styles from './styles.module.css';

function Symbol({ base, sub }: { base: string; sub: string | number }) {
  return <span className={styles.symbol}>{base}<sub>{sub}</sub></span>;
}
const display = (value: number) => String(Number(value.toFixed(6))).replace('-', '−');
const operand = (value: number) => value < 0 ? `(${display(value)})` : display(value);
const inputY = [90, 180, 270];
const unitY = [130, 240];

export function ConnectionExplorer() {
  const [selection, setSelection] = useState({ row: 0, column: 0 });
  const marker = useId().replace(/:/g, '');
  const unit = units[selection.row];
  const selectedId = `${unit.id}${selection.column + 1}`;
  return <div className={styles.explorer}>
    <div className={styles.explorerHeading}><strong>3 路输入 → 2 路输出</strong><p>点击一个权重，查看对应连线和乘法项；示例数值保持不变。</p></div>
    <div className={styles.mapping}>
      <figure className={styles.network}>
        <svg viewBox="0 0 560 340" role="img" aria-label={`三个输入 x₁=1、x₂=2、x₃=3 各自连接 A、B 两个计算单元，共六条连接。A 输出 zA=${display(units[0].sum)}，B 输出 zB=${display(units[1].sum)}。`}>
          <defs><marker id={`${marker}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8" fill="context-stroke" /></marker></defs>
          <text className={styles.graphHeading} x="75" y="29">3 路输入</text><text className={styles.graphHeading} x="357" y="29">2 个计算单元</text>
          {units.flatMap((u,r) => denseExample.inputs.map((_,c) => <line key={`${u.id}${c+1}`} data-edge={`${u.id}${c+1}`} data-selected={selection.row===r && selection.column===c} className={selection.row===r && selection.column===c ? styles.selectedEdge : styles.edge} x1="119" y1={inputY[c]} x2="319" y2={unitY[r]} markerEnd={`url(#${marker}-arrow)`} />))}
          {denseExample.inputs.map((value,i) => <g key={i}><rect className={selection.column===i ? styles.focusBox : styles.inputBox} x="29" y={inputY[i]-23} width="90" height="46" rx="4" /><text className={styles.nodeText} x="74" y={inputY[i]+6}>x<tspan baselineShift="sub" fontSize="13">{i+1}</tspan> = {value}</text></g>)}
          {units.map((u,r) => <g key={u.id}><rect className={selection.row===r ? styles.focusBox : styles.inputBox} x="319" y={unitY[r]-24} width="76" height="48" rx="4" /><text className={styles.nodeText} x="357" y={unitY[r]+7}>F<tspan baselineShift="sub" fontSize="14">{u.id}</tspan></text><line className={styles.outputLine} x1="395" x2="535" y1={unitY[r]} y2={unitY[r]} markerEnd={`url(#${marker}-arrow)`} /><text className={styles.outputValue} data-output={u.id} x="465" y={unitY[r]-13}>z<tspan baselineShift="sub" fontSize="13">{u.id}</tspan> = {display(u.sum)}</text></g>)}
          <text className={styles.graphNote} x="29" y="320">F 表示加权求和并加偏置，z 是传出的结果。</text>
        </svg>
      </figure>
      <div className={styles.weightPanel}>
        <h3>权重矩阵</h3>
        <table className={styles.weightTable} aria-label="权重矩阵">
          <thead><tr><th scope="col">单元</th>{denseExample.inputs.map((_,c)=><th scope="col" key={c}><Symbol base="x" sub={c+1} /></th>)}</tr></thead>
          <tbody>{units.map((u,r)=><tr key={u.id}><th scope="row"><Symbol base="F" sub={u.id} /></th>{u.weights.map((weight,c)=><td key={c}><button type="button" aria-label={`查看权重 w${u.id}${c+1}`} aria-pressed={selection.row===r && selection.column===c} onClick={()=>setSelection({row:r,column:c})}>{display(weight)}</button></td>)}</tr>)}</tbody>
        </table>
        <div className={styles.selection} aria-live="polite"><span>当前连接</span><strong><Symbol base="x" sub={selection.column+1} /> → <Symbol base="F" sub={unit.id} /></strong><span>权重 <Symbol base="w" sub={selectedId} /> = <b>{display(unit.weights[selection.column])}</b></span></div>
      </div>
    </div>
    <div className={styles.calculation} aria-live="polite" aria-atomic="true">
      <h3>单元 {unit.id} 的计算</h3>
      <div className={styles.products}>{unit.products.map((product,c)=><div key={c} data-product={`${unit.id}${c+1}`} data-selected={selection.column===c} className={`${styles.product} ${selection.column===c?styles.selectedProduct:''}`}><span><small>输入 <Symbol base="x" sub={c+1} /></small><strong>{denseExample.inputs[c]}</strong></span><span>×</span><span className={styles.parameter}><small>权重 <Symbol base="w" sub={`${unit.id}${c+1}`} /></small><strong>{operand(unit.weights[c])}</strong></span><span>=</span><strong>{display(product)}</strong></div>)}</div>
      <div className={styles.total}><b>相加，再加偏置</b><span>{unit.products.map(operand).join(' + ')} +</span><span className={styles.parameter}><small>偏置 <Symbol base="b" sub={unit.id} /></small><strong>{operand(unit.bias)}</strong></span><span>= <strong data-total={unit.id}><Symbol base="z" sub={unit.id} /> = {display(unit.sum)}</strong></span></div>
    </div>
    <p className={styles.footnote}>参数为固定演示值，未经训练；此处只计算全连接，尚未加入激活。</p>
  </div>;
}
