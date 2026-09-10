import { useState } from 'react';
import { termText, uiText, useLocale } from '@term-sdk';
import { activations, formatNumber, type Activation } from './model';
import styles from './styles.module.css';

function FunctionPlot({ activation, input }: { activation: Activation; input: number }) {
  const { locale } = useLocale();
  const x = (z: number) => 38 + (z + 4) * 34.5;
  const y = (h: number) => 184 - (h - activation.yMin) / (activation.yMax - activation.yMin) * 160;
  const value = activation.evaluate(input);
  const path = Array.from({length:161},(_,i) => { const z=-4+i/20; return `${i?'L':'M'}${x(z)} ${y(activation.evaluate(z))}`; }).join(' ');
  return <svg viewBox="0 0 340 224" className={styles.graph} role="img" aria-label={uiText(locale, `${activation.name} 函数图像；输入 ${formatNumber(input)}，输出 ${formatNumber(value)}`, `${activation.name} function plot; input ${formatNumber(input)}, output ${formatNumber(value)}`)}>
    {activation.ticks.map(tick=><g key={tick}><line x1="38" x2="314" y1={y(tick)} y2={y(tick)} className={styles.gridLine} /><text x="29" y={y(tick)+4} textAnchor="end" className={styles.tick}>{formatNumber(tick)}</text></g>)}
    <line x1="38" x2="320" y1={y(0)} y2={y(0)} className={styles.axis} /><line x1={x(0)} x2={x(0)} y1="20" y2="188" className={styles.axis} />
    <text className={styles.axisLabel} x="38" y="14">{uiText(locale, "输出 h", "Output h")}</text><text className={styles.axisLabel} x="314" y="220" textAnchor="end">{uiText(locale, "输入 z", "Input z")}</text>
    {[-4,0,4].map(tick=><text key={tick} className={styles.tick} x={x(tick)} y="203" textAnchor="middle">{formatNumber(tick)}</text>)}
    <path className={styles.curve} d={path} />
    <path className={styles.guide} d={`M${x(input)} ${y(0)} V${y(value)} H${x(0)}`} />
    <circle data-function-point={activation.id} data-input={input} data-output={value} cx={x(input)} cy={y(value)} r="5" className={styles.point} />
  </svg>;
}

export function ActivationExplorer() {
  const { locale } = useLocale();
  const [input, setInput] = useState(-1);
  return <div className={styles.explorer}>
    <div className={styles.toolbar}>
      <div className={styles.controlLabel}><label htmlFor="activation-input">{uiText(locale, "共同输入 z", "Shared input z")}</label><output htmlFor="activation-input">{formatNumber(input)}</output></div>
      <div className={styles.slider}><input id="activation-input" aria-label={uiText(locale, "所有激活函数的共同输入 z", "Shared input z for all activation functions")} type="range" min="-4" max="4" step="0.1" value={input} onChange={e=>setInput(Number(e.target.value))} /><div><span>−4</span><span>0</span><span>4</span></div></div>
      <div className={styles.presets}>{[-1,0,2].map(value=><button key={value} aria-pressed={input===value} onClick={()=>setInput(value)}>{value<0?uiText(locale,'负数 ','Negative '):value>0?uiText(locale,'正数 ','Positive '):''}{formatNumber(value)}</button>)}</div>
    </div>
    <p className={styles.instruction}>{uiText(locale, "拖动同一个输入，看各函数如何响应。圆点表示当前输入、输出；横轴范围相同，纵轴刻度按各图标注。", "Move the shared input to compare the functions. The dot marks the current input and output; the x-axis is shared while each chart uses its own y-axis scale.")}</p>
    <div className={styles.functionGrid}>
      {activations.map(activation=><article className={styles.functionCard} key={activation.id} data-function={activation.id}>
        <h3>{activation.name}</h3><p className={styles.description}>{termText(activation.description, locale)}</p>
        <FunctionPlot activation={activation} input={input} />
        <div className={styles.readout}><span>{uiText(locale, "输入", "Input")} {formatNumber(input)}</span><span aria-hidden="true">→</span><strong data-function-output={activation.id}>{uiText(locale, "输出", "Output")} {formatNumber(activation.evaluate(input))}</strong></div>
        <p className={styles.range}>{termText(activation.range, locale)}</p>
      </article>)}
    </div>
    <p className={styles.footnote}>{uiText(locale, "初始输入为 −1。读数保留三位小数；Sigmoid、Tanh 的精确输出不取到范围端点。", "The initial input is −1. Readouts keep three decimal places; exact Sigmoid and Tanh outputs do not reach their range endpoints.")}</p>
  </div>;
}
