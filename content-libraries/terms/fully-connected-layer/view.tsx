import { CodeBlock, Formula, Paragraph, TermSection, defineTermView } from '@term-sdk';
import { ConnectionExplorer } from './explorer';
import { structureCode, reproduceCode } from './pytorch';
import styles from './styles.module.css';

function TermBody() {
  return <div className={styles.root}>
    <TermSection id="connections" title="全连接结构">
      <Paragraph>{'下面这层接收 3 个输入，产生 2 个输出。A、B 都连接全部输入，但各自使用不同的权重和偏置，因此可以从同一组输入中得到不同的结果。'}</Paragraph>
      <ConnectionExplorer />
    </TermSection>
    <TermSection id="matrix" title="矩阵与参数">
      <Paragraph>{'整层计算可以写成 z = Wx + b。这里把输入写成列向量，权重矩阵的两行分别对应 A、B，三列分别对应三个输入。'}</Paragraph>
      <Formula expression={String.raw`\underbrace{\begin{bmatrix}z_A\\z_B\end{bmatrix}}_{\mathbf z}=\underbrace{\begin{bmatrix}0.7&-0.4&-0.2\\-0.3&0.8&0.5\end{bmatrix}}_W\underbrace{\begin{bmatrix}1\\2\\3\end{bmatrix}}_{\mathbf x}+\underbrace{\begin{bmatrix}0.1\\-0.2\end{bmatrix}}_{\mathbf b}=\begin{bmatrix}-0.6\\2.6\end{bmatrix}`} symbols={[{symbol:'W',meaning:'权重矩阵，本例有 2×3 个权重。'},{symbol:String.raw`\mathbf x`,meaning:'输入向量，按 x₁、x₂、x₃ 排列。'},{symbol:String.raw`\mathbf b`,meaning:'偏置向量，每个输出单元一个偏置。'},{symbol:String.raw`\mathbf z`,meaning:'全连接输出，尚未经过激活函数。'}]} />
      <Paragraph>{'n 个输入、m 个输出需要 n×m 个权重；使用偏置时再加 m 个参数。本例共 3×2 + 2 = 8 个。输入维度由收到的特征决定，输出维度由这一层要产生的特征数决定，两者不必相同。'}</Paragraph>
    </TermSection>
    <TermSection id="pytorch" title="PyTorch 实现">
      <Paragraph>{'nn.Linear(3, 2) 就是图中的全连接层。再接 nn.ReLU()，便会把输出中的负数变成 0。这是[[term:mlp|多层感知机（MLP）]]隐藏层常用的“全连接 + [[term:activation-function|激活函数]]”组合。'}</Paragraph>
      <div className={styles.activationFlow} aria-label="全连接得到负零点六和二点六，经过 ReLU 后得到零和二点六"><div><small>Linear 的结果 z</small><strong>[−0.6, 2.6]</strong></div><span>→</span><div><small>ReLU</small><strong>负数归零，其余保留</strong></div><span>→</span><div><small>激活后的结果 h</small><strong>[0, 2.6]</strong></div></div>
      <CodeBlock language="python" code={structureCode} caption="在已安装 PyTorch 的 Python 环境中运行。Linear 默认随机初始化参数，下面可展开设置为图中数值。" />
      <Paragraph>{'代码里每一行是一个样本，所以 x 的形状是 [1, 3]，输出是 [1, 2]。对应的批量计算写作 x @ linear.weight.T + linear.bias；它与上方的列向量公式表示同一组运算。'}</Paragraph>
      <details className={styles.details}><summary>复现图中的 −0.6 和 2.6</summary><CodeBlock language="python" code={reproduceCode} caption="参数赋值仅用于复现演示；实际训练由优化器更新参数。" /></details>
      <p className={styles.source}>参考：<a href="https://docs.pytorch.org/docs/stable/generated/torch.nn.Linear.html" target="_blank" rel="noreferrer">PyTorch · Linear</a></p>
    </TermSection>
  </div>;
}
export default defineTermView({ termId:'fully-connected-layer', Component:TermBody });
