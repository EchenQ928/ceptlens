import { Callout, CodeBlock, Formula, Paragraph, TermSection, defineTermView } from '@term-sdk';
import { ClassificationExplorer, RegressionExplorer } from './explorer';
import { classificationCode, regressionCode } from './pytorch';
import styles from './styles.module.css';

function TermBody() {
  return <div className={styles.root}>
    <TermSection id="meaning" title="把预测与目标放在一起计分">
      <Paragraph>{'模型给出预测之后，还需要一种规则判断它做得怎样。损失函数同时接收预测和目标，算出一个分数。训练的目标就是让所选的损失尽量小。'}</Paragraph>
      <svg className={styles.overview} viewBox="0 0 880 166" role="img" aria-label="模型预测与真实目标同时进入损失函数，按计分规则得到损失值 L">
        <rect x="25" y="12" width="205" height="54" rx="3"/><text x="127" y="46">模型预测 ŷ</text>
        <rect x="25" y="100" width="205" height="54" rx="3"/><text x="127" y="134">真实目标 y</text>
        <path d="M230 39 H278 V83 H337 M230 127 H278 V83 M330 78 L337 83 L330 88"/>
        <rect x="340" y="50" width="210" height="68" rx="3"/><text x="445" y="78">损失函数</text><text className={styles.note} x="445" y="102">按任务规定怎样计分</text>
        <path d="M550 83 H645 M638 78 L645 83 L638 88"/><text x="746" y="78">损失值 L</text><text className={styles.note} x="746" y="105">一个可用于训练的数</text>
      </svg>
      <p>任务不同，计分规则也会不同。下面看<strong>两类常见预测任务</strong>：</p>
      <div className={styles.taskTypes}>
        <div><strong>数值预测</strong><p>预测的数值，偏离目标多少？</p></div>
        <div><strong>类别预测</strong><p>模型给正确类别多少概率？</p></div>
      </div>
    </TermSection>
    <TermSection id="regression" title="数值预测：偏差怎样计分">
      <p>一次训练通常同时处理<strong>一批样本（batch）</strong>，每个样本都有自己的预测和目标。本例手工设置了 A、B、C 三个样本，目标恰好都是 3，初始预测分别为 1、3、5。</p>
      <p>用“预测 − 目标”计算，三个样本的偏差分别是 −2、0、+2。直接求平均会得到 0，可 A 和 C 明明都预测错了。因此，衡量这批样本的整体误差时，要<strong>先给每个样本计分，再汇总分数</strong>。常见的两种计分方式如下。</p>
      <RegressionExplorer />
      <details className={styles.details}><summary>把两种平均损失写成公式</summary><Formula expression={String.raw`L_{\mathrm{MAE}}=\frac{1}{N}\sum_{i=1}^N|\hat y_i-y_i|,\qquad L_{\mathrm{MSE}}=\frac{1}{N}\sum_{i=1}^N(\hat y_i-y_i)^2`} symbols={[{symbol:String.raw`\hat y_i`,meaning:'第 i 个样本的预测。'},{symbol:'y_i',meaning:'这个样本的目标。'},{symbol:'N',meaning:'样本数。图中为 3，每个样本只预测一个数。'}]} /></details>
    </TermSection>
    <TermSection id="classification" title="类别预测：给正确答案多少概率">
      <Paragraph>{'假设一个样本的正确类别是猫，模型给猫、狗、鸟分别分配概率。给猫 90% 的概率，比只给 10% 更符合目标。交叉熵把这种差别变成损失：正确类别的概率越低，受到的惩罚越大。'}</Paragraph>
      <ClassificationExplorer />
      <Paragraph>{'这里计算的是“负的自然对数”：概率从 1 降到 0 时，损失从 0 不断增大。它保留了置信程度的差别，能够区分“比较确信正确”和“勉强把正确类别排在第一”。'}</Paragraph>
      <details className={styles.details}><summary>这个分类示例的公式</summary><Formula expression={String.raw`L=-\ln p_y,\qquad -\ln(0.6)\approx0.511`} symbols={[{symbol:'p_y',meaning:'模型分给正确类别的概率。这里 y 是“猫”的类别下标。'},{symbol:'L',meaning:'单个样本的交叉熵损失。本例每个样本只有一个正确类别。'}]} /></details>
    </TermSection>
    <TermSection id="training" title="代码与训练中的位置">
      <h3>数值预测</h3><CodeBlock language="python" code={regressionCode} caption="对应数值交互的初始状态；两个函数默认取平均。" />
      <h3>类别预测</h3><CodeBlock language="python" code={classificationCode} caption="对应概率为 60%、24%、16% 的初始状态；类别下标从 0 开始。" />
      <Paragraph>{'损失算出来后，[[term:backpropagation|反向传播]]计算各参数对损失的影响，[[term:optimizer|优化器]]再据此调整参数。选择损失函数，也是在规定训练会重点改善什么。'}</Paragraph>
      <Paragraph>{'损失变小，只表示所选计分规则下表现变好。还要在未用于训练的[[term:validation-set|验证集]]上检查任务效果，例如分类准确率；不同公式、数据尺度下的损失数值也不宜直接比大小。'}</Paragraph>
      <Callout tone="key" title="总结">{'损失函数把预测与目标的差别变成训练分数。先选符合任务的计分规则，再分别计算每个样本的损失，按需要汇总；反向传播和参数更新以这个目标为依据。'}</Callout>
      <p className={styles.source}>参考：{['L1Loss','MSELoss','CrossEntropyLoss'].map(name=><a key={name} href={`https://docs.pytorch.org/docs/stable/generated/torch.nn.${name}.html`} target="_blank" rel="noreferrer">PyTorch · {name}</a>)}</p>
    </TermSection>
  </div>;
}
export default defineTermView({termId:'loss-function',Component:TermBody});
