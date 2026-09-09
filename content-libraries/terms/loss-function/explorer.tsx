import { useState } from 'react';
import { classificationExample, fmt, regressionExample } from './model';
import styles from './styles.module.css';

export function RegressionExplorer() {
  const [prediction, setPrediction] = useState(1);
  const state=regressionExample(prediction);
  const px=(p:number)=>50+p*75, py=(loss:number)=>278-loss*25;
  const squarePath=Array.from({length:121},(_,i)=>{const p=i/20;return `${i?'L':'M'}${px(p)} ${py((p-3)**2)}`;}).join(' ');
  return <div className={styles.explorer}>
    <div className={styles.widgetHeading}>
      <h3>先看一个样本怎样计分</h3>
      <div className={styles.rules}>
        <div><strong><i className={styles.absoluteKey}/>绝对误差</strong><span>把偏差取绝对值</span><small>灰色虚线 · 菱形标记</small></div>
        <div><strong><i className={styles.squareKey}/>平方误差</strong><span>偏差 × 偏差</span><small>红色实线 · 圆点标记</small></div>
      </div>
      <div className={styles.readChart}><p><strong>横轴：样本 A 的预测值</strong>，目标固定为 3。</p><p><strong>纵轴：样本 A 的损失</strong>，曲线越高，按该规则计得的分数越大。</p></div>
      <p>调整右侧预测值，看同一个预测在两种规则下分别得到多少分。</p>
    </div>
    <div className={styles.plotGrid}>
      <svg className={styles.graph} viewBox="0 0 540 328" role="img" aria-label={`目标为3，预测为${prediction}；绝对误差${fmt(state.absolute[0])}，平方误差${fmt(state.squared[0],4)}`}>
        <text x="50" y="20" className={styles.axisLabel}>损失（样本 A）</text>
        {[0,3,6,9].map(v=><g key={v}><line className={styles.gridLine} x1="50" x2="500" y1={py(v)} y2={py(v)}/><text className={styles.tick} x="38" y={py(v)+5} textAnchor="end">{v}</text></g>)}
        <line className={styles.axis} x1="50" x2="500" y1="278" y2="278" /><line className={styles.guide} x1={px(3)} x2={px(3)} y1="35" y2="278" />
        {[0,1,2,3,4,5,6].map(v=><text className={styles.tick} key={v} x={px(v)} y="300" textAnchor="middle">{v}</text>)}
        <text className={styles.axisLabel} x="500" y="323" textAnchor="end">预测值（样本 A）</text><text className={styles.targetLabel} x={px(3)+8} y="43">目标 = 3</text>
        <path className={styles.absoluteCurve} d={`M50 ${py(3)} L275 278 L500 ${py(3)}`} /><path className={styles.curve} d={squarePath} />
        <line className={styles.guide} x1={px(prediction)} x2={px(prediction)} y1="278" y2={py(state.squared[0])} />
        <circle data-square-point cx={px(prediction)} cy={py(state.squared[0])} r="6" className={styles.point}/>
        <path data-absolute-point d={`M${px(prediction)} ${py(state.absolute[0])-6} l6 6 l-6 6 l-6 -6 Z`} fill="#555b63" stroke="white" strokeWidth="1.5" />
      </svg>
      <div className={styles.controls}>
        <label htmlFor="loss-prediction">样本 A 的预测 <output>{fmt(prediction)}</output></label>
        <input id="loss-prediction" aria-label="样本 A 的预测值" type="range" min="0" max="6" step="0.25" value={prediction} onChange={e=>setPrediction(Number(e.target.value))} />
        <div className={styles.presets}>{[1,3,5].map(v=><button key={v} onClick={()=>setPrediction(v)} aria-pressed={prediction===v}>{v===3?'刚好预测 3':`预测 ${v}`}</button>)}</div>
        <p className={styles.error}>偏差 = {fmt(prediction)} − 3 = <strong data-error>{fmt(state.errors[0])}</strong></p>
        <div className={styles.score}><span><i className={styles.absoluteKey}/>绝对误差</span><strong data-absolute>{fmt(state.absolute[0])}</strong><small>|{fmt(state.errors[0])}| = {fmt(state.absolute[0])}</small></div>
        <div className={styles.score}><span><i className={styles.squareKey}/>平方误差</span><strong data-squared>{fmt(state.squared[0],4)}</strong><small>({fmt(state.errors[0])}) × ({fmt(state.errors[0])}) = {fmt(state.squared[0],4)}</small></div>
      </div>
    </div>
    <p className={styles.curveReading}><strong>绝对误差</strong>随偏差大小匀速增加；<strong>平方误差</strong>越往两边越陡，对较大偏差的惩罚增长得更快。</p>
    <div className={styles.batch}>
      <h3>多个样本：先分别计分，再求平均</h3>
      <p>把 A 放回这批样本中：A 跟随上方控件变化，B、C 固定。分别算出损失，再把三个分数相加、除以 3。</p>
      <table className={styles.table}><thead><tr><th>样本</th><th>预测</th><th>目标</th><th>带正负的偏差</th><th>绝对误差</th><th>平方误差</th></tr></thead><tbody>{state.predictions.map((p,i)=><tr key={i} data-editable={i===0}><th>{['A（可调）','B','C'][i]}</th><td>{fmt(p)}</td><td>3</td><td>{fmt(state.errors[i])}</td><td>{fmt(state.absolute[i])}</td><td>{fmt(state.squared[i],4)}</td></tr>)}</tbody></table>
      <div className={styles.averages}><div><span>平均绝对误差 · MAE</span><strong data-mae>({state.absolute.map(v=>fmt(v)).join(' + ')}) ÷ 3 ≈ {fmt(state.mae)}</strong></div><div><span>均方误差 · MSE</span><strong data-mse>({state.squared.map(v=>fmt(v,4)).join(' + ')}) ÷ 3 ≈ {fmt(state.mse)}</strong></div></div>
    </div>
    <div className={styles.direction}>
      <h3>损失没有正负号，还能知道调整方向吗？</h3>
      <p>只看一个损失分数，确实无法判断预测偏高还是偏低。但训练时保留了<strong>预测如何算出损失的整个计算关系</strong>，可以求出曲线在当前位置的斜率，也就是<strong>损失对预测值的梯度</strong>。</p>
      <p>仍看上方的平方误差曲线：目标为 3，预测为 1 和 5 的两个位置高度相同，都是 4；沿曲线走向更低处的方向却相反。</p>
      <div className={styles.directionCases}>
        {[1,5].map(p=>{const example=regressionExample(p);return <div key={p} data-direction-case={p}>
          <strong>预测 {p}<span>单个样本的平方误差 = {fmt(example.squared[0])}</span></strong>
          <p>曲线斜率 = 2 × 偏差 = <b data-case-gradient>{fmt(example.squaredGradients[0])}</b></p>
          <div className={styles.directionAnswer}>{p<3?'向右走，预测应增大 →':'← 向左走，预测应减小'}</div>
        </div>;})}
      </div>
      <p><strong>损失衡量偏差大小，梯度提供局部调整方向。</strong>绝对误差在目标两侧也有相反的斜率；取绝对值同样不妨碍区分方向。</p>
      <p className={styles.directionNote}>这里展示的是“预测值往哪边变化能降低这个样本的损失”。对这三个样本取平均后，各预测的梯度也分别除以 3，方向不变。实际训练更新的是模型参数：反向传播会继续沿计算关系求出参数梯度，综合整批样本的影响。</p>
    </div>
  </div>;
}

export function ClassificationExplorer() {
  const [probability,setProbability]=useState(0.6);
  const state=classificationExample(probability);
  const px=(p:number)=>50+p*450, py=(loss:number)=>265-loss*45;
  const path=Array.from({length:199},(_,i)=>{const p=.01+i*.005;return `${i?'L':'M'}${px(p)} ${py(-Math.log(p))}`;}).join(' ');
  return <div className={styles.explorer}>
    <div className={styles.widgetHeading}><h3>交叉熵：为正确类别的概率计分</h3>
      <div className={styles.readChart}><p><strong>横轴：正确类别的预测概率</strong>，本例正确类别是“猫”。</p><p><strong>纵轴：这个样本的交叉熵损失</strong>，越低表示给正确类别的概率越高。</p></div>
      <p>调整右侧给“猫”的概率，观察损失。狗和鸟的概率随之调整，总和始终为 1。</p></div>
    <div className={styles.plotGrid}>
      <svg className={styles.graph} viewBox="0 0 540 325" role="img" aria-label={`交叉熵曲线，正确类别的概率为${fmt(probability)}，损失为${fmt(state.loss)}`}>
        <text className={styles.axisLabel} x="50" y="20">这个样本的交叉熵损失</text>
        {[0,1,2,3,4,5].map(v=><g key={v}><line className={styles.gridLine} x1="50" x2="500" y1={py(v)} y2={py(v)}/><text className={styles.tick} x="38" y={py(v)+5} textAnchor="end">{v}</text></g>)}
        <line className={styles.axis} x1="50" x2="500" y1="265" y2="265" />
        {[0,.5,1].map(v=><text className={styles.tick} key={v} x={px(v)} y="289" textAnchor="middle">{v}</text>)}
        <text className={styles.axisLabel} x="500" y="317" textAnchor="end">正确类别的预测概率</text>
        <path className={styles.curve} d={path}/><path className={styles.guide} d={`M${px(probability)} 265 V${py(state.loss)} H50`}/><circle data-ce-point cx={px(probability)} cy={py(state.loss)} r="6" className={styles.point}/>
      </svg>
      <div className={styles.controls}>
        <label htmlFor="loss-probability">给猫的概率 <output>{fmt(probability*100)}%</output></label>
        <input id="loss-probability" aria-label="正确类别猫的预测概率" type="range" min="0.01" max="0.99" step="0.01" value={probability} onChange={e=>setProbability(Number(e.target.value))}/>
        <div className={styles.presets}>{[.1,.6,.9].map(v=><button key={v} aria-pressed={probability===v} onClick={()=>setProbability(v)}>{v*100}%</button>)}</div>
        <div className={styles.probabilities}>{state.probabilities.map((p,i)=><div key={i} className={styles.probabilityRow}><span>{['猫 ✓','狗','鸟'][i]}</span><div><i style={{width:`${p*100}%`}} data-correct={i===0}/></div><b data-probability={i}>{fmt(p*100)}%</b></div>)}</div>
        <div className={styles.ceResult}><span>当前交叉熵损失</span><strong data-ce-loss>{fmt(state.loss)}</strong><p>{probability<.5?'正确类别获得的概率偏低，损失较大。':'正确类别获得更多概率，损失向 0 靠近。'}</p></div>
      </div>
    </div>
    <p className={styles.footnote}>曲线由负对数规则计算。概率趋近 0 时，损失持续增大；控件从 1% 开始，以避免无穷大的读数。示例分数保留三位小数。</p>
  </div>;
}
