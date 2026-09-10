import { useState } from 'react';
import { uiText, useLocale } from '@term-sdk';
import { classificationExample, fmt, regressionExample } from './model';
import styles from './styles.module.css';

export function RegressionExplorer() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const [prediction, setPrediction] = useState(1);
  const state=regressionExample(prediction);
  const px=(p:number)=>50+p*75, py=(loss:number)=>278-loss*25;
  const squarePath=Array.from({length:121},(_,i)=>{const p=i/20;return `${i?'L':'M'}${px(p)} ${py((p-3)**2)}`;}).join(' ');
  return <div className={styles.explorer}>
    <div className={styles.widgetHeading}>
      <h3>{t("先看一个样本怎样计分", "First see how one sample is scored")}</h3>
      <div className={styles.rules}>
        <div><strong><i className={styles.absoluteKey}/>{t("绝对误差", "Absolute error")}</strong><span>{t("把偏差取绝对值", "Take the absolute value of the error")}</span><small>{t("灰色虚线 · 菱形标记", "Gray dashed line · diamond marker")}</small></div>
        <div><strong><i className={styles.squareKey}/>{t("平方误差", "Squared error")}</strong><span>{t("偏差 × 偏差", "Error × error")}</span><small>{t("红色实线 · 圆点标记", "Red solid line · dot marker")}</small></div>
      </div>
      <div className={styles.readChart}><p><strong>{t("横轴：样本 A 的预测值", "X-axis: prediction for sample A")}</strong>{t("，目标固定为 3。", ", with target fixed at 3.")}</p><p><strong>{t("纵轴：样本 A 的损失", "Y-axis: loss for sample A")}</strong>{t("，曲线越高，按该规则计得的分数越大。", "; a higher curve means a larger score under that rule.")}</p></div>
      <p>{t("调整右侧预测值，看同一个预测在两种规则下分别得到多少分。", "Adjust the prediction on the right to compare the two scores for the same prediction.")}</p>
    </div>
    <div className={styles.plotGrid}>
      <svg className={styles.graph} viewBox="0 0 540 328" role="img" aria-label={`目标为3，预测为${prediction}；绝对误差${fmt(state.absolute[0])}，平方误差${fmt(state.squared[0],4)}`}>
        <text x="50" y="20" className={styles.axisLabel}>{t("损失（样本 A）", "Loss (sample A)")}</text>
        {[0,3,6,9].map(v=><g key={v}><line className={styles.gridLine} x1="50" x2="500" y1={py(v)} y2={py(v)}/><text className={styles.tick} x="38" y={py(v)+5} textAnchor="end">{v}</text></g>)}
        <line className={styles.axis} x1="50" x2="500" y1="278" y2="278" /><line className={styles.guide} x1={px(3)} x2={px(3)} y1="35" y2="278" />
        {[0,1,2,3,4,5,6].map(v=><text className={styles.tick} key={v} x={px(v)} y="300" textAnchor="middle">{v}</text>)}
        <text className={styles.axisLabel} x="500" y="323" textAnchor="end">{t("预测值（样本 A）", "Prediction (sample A)")}</text><text className={styles.targetLabel} x={px(3)+8} y="43">{t("目标 = 3", "Target = 3")}</text>
        <path className={styles.absoluteCurve} d={`M50 ${py(3)} L275 278 L500 ${py(3)}`} /><path className={styles.curve} d={squarePath} />
        <line className={styles.guide} x1={px(prediction)} x2={px(prediction)} y1="278" y2={py(state.squared[0])} />
        <circle data-square-point cx={px(prediction)} cy={py(state.squared[0])} r="6" className={styles.point}/>
        <path data-absolute-point d={`M${px(prediction)} ${py(state.absolute[0])-6} l6 6 l-6 6 l-6 -6 Z`} fill="#555b63" stroke="white" strokeWidth="1.5" />
      </svg>
      <div className={styles.controls}>
        <label htmlFor="loss-prediction">{t("样本 A 的预测", "Prediction for sample A")} <output>{fmt(prediction)}</output></label>
        <input id="loss-prediction" aria-label={t("样本 A 的预测值", "Prediction value for sample A")} type="range" min="0" max="6" step="0.25" value={prediction} onChange={e=>setPrediction(Number(e.target.value))} />
        <div className={styles.presets}>{[1,3,5].map(v=><button key={v} onClick={()=>setPrediction(v)} aria-pressed={prediction===v}>{v===3?t('刚好预测 3','Exact prediction 3'):t(`预测 ${v}`, `Prediction ${v}`)}</button>)}</div>
        <p className={styles.error}>{t("偏差", "Error")} = {fmt(prediction)} − 3 = <strong data-error>{fmt(state.errors[0])}</strong></p>
        <div className={styles.score}><span><i className={styles.absoluteKey}/>{t("绝对误差", "Absolute error")}</span><strong data-absolute>{fmt(state.absolute[0])}</strong><small>|{fmt(state.errors[0])}| = {fmt(state.absolute[0])}</small></div>
        <div className={styles.score}><span><i className={styles.squareKey}/>{t("平方误差", "Squared error")}</span><strong data-squared>{fmt(state.squared[0],4)}</strong><small>({fmt(state.errors[0])}) × ({fmt(state.errors[0])}) = {fmt(state.squared[0],4)}</small></div>
      </div>
    </div>
    <p className={styles.curveReading}><strong>{t("绝对误差", "Absolute error")}</strong>{t("随偏差大小匀速增加；", " grows linearly with error magnitude; ")}<strong>{t("平方误差", "squared error")}</strong>{t("越往两边越陡，对较大偏差的惩罚增长得更快。", " becomes steeper toward both sides and penalizes large errors more quickly.")}</p>
    <div className={styles.batch}>
      <h3>{t("多个样本：先分别计分，再求平均", "Multiple samples: score separately, then average")}</h3>
      <p>{t("把 A 放回这批样本中：A 跟随上方控件变化，B、C 固定。分别算出损失，再把三个分数相加、除以 3。", "Put A back into the batch: A follows the control above while B and C stay fixed. Compute each loss, then add the three scores and divide by 3.")}</p>
      <table className={styles.table}><thead><tr><th>{t("样本", "Sample")}</th><th>{t("预测", "Prediction")}</th><th>{t("目标", "Target")}</th><th>{t("带正负的偏差", "Signed error")}</th><th>{t("绝对误差", "Absolute error")}</th><th>{t("平方误差", "Squared error")}</th></tr></thead><tbody>{state.predictions.map((p,i)=><tr key={i} data-editable={i===0}><th>{[t('A（可调）','A (adjustable)'),'B','C'][i]}</th><td>{fmt(p)}</td><td>3</td><td>{fmt(state.errors[i])}</td><td>{fmt(state.absolute[i])}</td><td>{fmt(state.squared[i],4)}</td></tr>)}</tbody></table>
      <div className={styles.averages}><div><span>{t("平均绝对误差 · MAE", "Mean absolute error · MAE")}</span><strong data-mae>({state.absolute.map(v=>fmt(v)).join(' + ')}) ÷ 3 ≈ {fmt(state.mae)}</strong></div><div><span>{t("均方误差 · MSE", "Mean squared error · MSE")}</span><strong data-mse>({state.squared.map(v=>fmt(v,4)).join(' + ')}) ÷ 3 ≈ {fmt(state.mse)}</strong></div></div>
    </div>
    <div className={styles.direction}>
      <h3>{t("损失没有正负号，还能知道调整方向吗？", "Can loss show the adjustment direction without a sign?")}</h3>
      <p>{t("只看一个损失分数，确实无法判断预测偏高还是偏低。但训练时保留了", "A single loss score cannot tell whether the prediction is too high or too low. During training, the model retains the ")}<strong>{t("预测如何算出损失的整个计算关系", "full computation from prediction to loss")}</strong>{t("，可以求出曲线在当前位置的斜率，也就是", ", so it can compute the slope at the current position, the ")}<strong>{t("损失对预测值的梯度", "gradient of loss with respect to prediction")}</strong>{t("。", ".")}</p>
      <p>{t("仍看上方的平方误差曲线：目标为 3，预测为 1 和 5 的两个位置高度相同，都是 4；沿曲线走向更低处的方向却相反。", "Look again at the squared-error curve: with target 3, predictions 1 and 5 both have height 4, but the directions toward lower loss are opposite.")}</p>
      <div className={styles.directionCases}>
        {[1,5].map(p=>{const example=regressionExample(p);return <div key={p} data-direction-case={p}>
          <strong>{t(`预测 ${p}`, `Prediction ${p}`)}<span>{t("单个样本的平方误差", "Single-sample squared error")} = {fmt(example.squared[0])}</span></strong>
          <p>{t("曲线斜率 = 2 × 偏差 = ", "Curve slope = 2 × error = ")}<b data-case-gradient>{fmt(example.squaredGradients[0])}</b></p>
          <div className={styles.directionAnswer}>{p<3?t('向右走，预测应增大 →','Move right; increase the prediction →'):t('← 向左走，预测应减小','← Move left; decrease the prediction')}</div>
        </div>;})}
      </div>
      <p><strong>{t("损失衡量偏差大小，梯度提供局部调整方向。", "Loss measures error magnitude; gradients provide a local adjustment direction.")}</strong>{t("绝对误差在目标两侧也有相反的斜率；取绝对值同样不妨碍区分方向。", " Absolute error also has opposite slopes on the two sides of the target; taking an absolute value does not prevent the direction from being distinguished.")}</p>
      <p className={styles.directionNote}>{t("这里展示的是“预测值往哪边变化能降低这个样本的损失”。对这三个样本取平均后，各预测的梯度也分别除以 3，方向不变。实际训练更新的是模型参数：反向传播会继续沿计算关系求出参数梯度，综合整批样本的影响。", "This shows which way the prediction must move to lower this sample's loss. After averaging the three samples, each prediction's gradient is also divided by 3, so its direction is unchanged. Actual training updates model parameters: backpropagation continues through the computation to obtain parameter gradients that combine the whole batch.")}</p>
    </div>
  </div>;
}

export function ClassificationExplorer() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  const [probability,setProbability]=useState(0.6);
  const state=classificationExample(probability);
  const px=(p:number)=>50+p*450, py=(loss:number)=>265-loss*45;
  const path=Array.from({length:199},(_,i)=>{const p=.01+i*.005;return `${i?'L':'M'}${px(p)} ${py(-Math.log(p))}`;}).join(' ');
  return <div className={styles.explorer}>
    <div className={styles.widgetHeading}><h3>{t("交叉熵：为正确类别的概率计分", "Cross-entropy: score the probability of the correct class")}</h3>
      <div className={styles.readChart}><p><strong>{t("横轴：正确类别的预测概率", "X-axis: predicted probability of the correct class")}</strong>{t("，本例正确类别是“猫”。", ', the correct class here is "cat".')}</p><p><strong>{t("纵轴：这个样本的交叉熵损失", "Y-axis: cross-entropy loss for this sample")}</strong>{t("，越低表示给正确类别的概率越高。", "; lower means a higher probability for the correct class.")}</p></div>
      <p>{t("调整右侧给“猫”的概率，观察损失。狗和鸟的概率随之调整，总和始终为 1。", 'Adjust the probability assigned to "cat" and observe the loss. Dog and bird probabilities adjust with it, and the total stays at 1.')}</p></div>
    <div className={styles.plotGrid}>
      <svg className={styles.graph} viewBox="0 0 540 325" role="img" aria-label={`交叉熵曲线，正确类别的概率为${fmt(probability)}，损失为${fmt(state.loss)}`}>
        <text className={styles.axisLabel} x="50" y="20">{t("这个样本的交叉熵损失", "Cross-entropy loss for this sample")}</text>
        {[0,1,2,3,4,5].map(v=><g key={v}><line className={styles.gridLine} x1="50" x2="500" y1={py(v)} y2={py(v)}/><text className={styles.tick} x="38" y={py(v)+5} textAnchor="end">{v}</text></g>)}
        <line className={styles.axis} x1="50" x2="500" y1="265" y2="265" />
        {[0,.5,1].map(v=><text className={styles.tick} key={v} x={px(v)} y="289" textAnchor="middle">{v}</text>)}
        <text className={styles.axisLabel} x="500" y="317" textAnchor="end">{t("正确类别的预测概率", "Predicted probability of the correct class")}</text>
        <path className={styles.curve} d={path}/><path className={styles.guide} d={`M${px(probability)} 265 V${py(state.loss)} H50`}/><circle data-ce-point cx={px(probability)} cy={py(state.loss)} r="6" className={styles.point}/>
      </svg>
      <div className={styles.controls}>
        <label htmlFor="loss-probability">{t("给猫的概率", 'Probability assigned to "cat"')} <output>{fmt(probability*100)}%</output></label>
        <input id="loss-probability" aria-label={t("正确类别猫的预测概率", 'Predicted probability of "cat" as the correct class')} type="range" min="0.01" max="0.99" step="0.01" value={probability} onChange={e=>setProbability(Number(e.target.value))}/>
        <div className={styles.presets}>{[.1,.6,.9].map(v=><button key={v} aria-pressed={probability===v} onClick={()=>setProbability(v)}>{v*100}%</button>)}</div>
        <div className={styles.probabilities}>{state.probabilities.map((p,i)=><div key={i} className={styles.probabilityRow}><span>{[t('猫 ✓','Cat ✓'),t('狗','Dog'),t('鸟','Bird')][i]}</span><div><i style={{width:`${p*100}%`}} data-correct={i===0}/></div><b data-probability={i}>{fmt(p*100)}%</b></div>)}</div>
        <div className={styles.ceResult}><span>{t("当前交叉熵损失", "Current cross-entropy loss")}</span><strong data-ce-loss>{fmt(state.loss)}</strong><p>{probability<.5?t('正确类别获得的概率偏低，损失较大。','The correct class has low probability, so the loss is high.'):t('正确类别获得更多概率，损失向 0 靠近。','The correct class receives more probability, so the loss moves toward 0.')}</p></div>
      </div>
    </div>
    <p className={styles.footnote}>{t("曲线由负对数规则计算。概率趋近 0 时，损失持续增大；控件从 1% 开始，以避免无穷大的读数。示例分数保留三位小数。", "The curve uses the negative-log rule. As probability approaches 0, loss keeps increasing; the control starts at 1% to avoid an infinite readout. Example scores keep three decimal places.")}</p>
  </div>;
}
