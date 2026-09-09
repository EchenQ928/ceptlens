import { Callout, CodeBlock, Formula, Paragraph, TermSection, defineTermView } from '@term-sdk';
import { LayerExplorer } from './explorer';
import { structureCode, reproduceCode } from './pytorch';
import styles from './styles.module.css';

function TermBody() {
  return <div className={styles.root}>
    <TermSection id="connections" title="全连接怎样计算">
      <Paragraph>{'MLP 是 Multilayer Perceptron 的缩写，属于[[term:neural-network|神经网络]]。它的结构特点是相邻层之间采用[[term:fully-connected-layer|全连接]]：每个计算单元都接收上一层的全部结果。'}</Paragraph>
      <Paragraph>{'看下图的第一隐藏层：A、B 都接收 x₁ 和 x₂，但各自使用不同的权重和偏置。A 把两个输入相加后减 1，B 则计算两个输入的差；随后各自经过 ReLU，负数归零，其余保留。同一组输入，就这样产生了两种不同的计算结果。'}</Paragraph>
      <LayerExplorer />
      <Paragraph>{'全连接发生在相邻层之间，同层单元之间没有连接。数值从左向右逐层传递，不绕回前面的层，因此 MLP 属于前馈神经网络。'}</Paragraph>
    </TermSection>
    <TermSection id="layer-composition" title="层与层怎样配合">
      <Paragraph>{'图中的 C、D 接收 A、B 算出的中间结果，继续加工后再交给输出层。整个过程可以连起来看：'}</Paragraph>
      <div className={styles.resultChain}><div><small>原始输入 x</small><strong>[1, 2]</strong></div><span>→</span><div><small>第一层结果 hA、hB</small><strong>[2, 0]</strong></div><span>→</span><div><small>第二层结果 hC、hD</small><strong>[1, 4]</strong></div><span>→</span><div><small>最终输出 y</small><strong>2.5</strong></div></div>
      <h3 className={styles.subheading}>每层都在前一层的基础上提取特征</h3>
      <Paragraph>{'可以把隐藏层的作用理解为提取特征：第一层从原始输入中提取信息，后面的层再把这些信息组合、加工，供输出层做预测。训练通过调整各层的权重和偏置，让提取出的特征更有助于完成任务。'}</Paragraph>
      <Paragraph>{'这些特征是网络学出来的，不需要我们预先给每个单元指定一种含义。它们往往由多个单元的结果共同表达，未必能逐一对应到“温度”“负载”等直观的物理量。'}</Paragraph>
      <h3 className={styles.subheading}>非线性让网络能够表达更复杂的关系</h3>
      <Paragraph>{'全连接可以对输入做缩放、求差、加权求和等组合。但如果各层都只做乘权重、相加和加偏置，叠加之后仍能合并成一次同类计算，无法表达超出这类计算范围的关系。'}</Paragraph>
      <Paragraph>{'加入 ReLU 这样的非线性[[term:activation-function|激活函数]]后，响应方式会随输入条件改变：总和为负时归零，为正时保留。不同单元可以在不同条件下发生这种转折，下一层再组合这些响应，整个网络就能表达更复杂的函数关系。'}</Paragraph>
      <Callout tone="key" title="全连接与非线性相互配合">{'全连接把上一层的特征组合起来，非线性激活扩展这些组合能够表达的关系。两者逐层配合，让网络能够学习更复杂的特征。'}</Callout>
    </TermSection>
    <TermSection id="width-depth" title="宽度与深度">
      <div className={styles.dimensions}><div><h3>宽度：一层有多少个单元</h3><p>图中两个隐藏层的宽度都是 2。增宽某一层，就能在这一层同时产生更多个中间结果；不同层的宽度可以不同。</p></div><div><h3>深度：经过多少层计算</h3><p>图中有 2 个隐藏层，再加 1 个输出层。若按带参数的计算层计数，就是 3 层；输入层只接收数据，不计入这个数。</p></div></div>
      <Paragraph>{'“多层感知机”不要求一定有很多隐藏层：只有一个隐藏层、再接输出层的结构，也可以是 MLP。交流具体结构时，直接说“几个隐藏层、各有几个单元”，比只说“几层网络”更清楚。'}</Paragraph>
      <Paragraph>{'更多单元或更多层提供了更大的建模空间，也通常增加参数与计算开销。它们不会自动带来更好的预测，仍需要合适的数据和训练，并在未参与训练的数据上检验效果。'}</Paragraph>
    </TermSection>
    <TermSection id="formula" title="把计算写成公式">
      <Paragraph>{'先把同一层的结果排成一列，就可以用一个向量表示整层输出；再把各个单元的权重排成一个矩阵。矩阵乘法在这里做的，正是图中各个单元的“逐路相乘，再相加”。下面按列向量来写，输入仍是 [1, 2]。'}</Paragraph>
      <Formula expression={String.raw`\begin{aligned}\mathbf{h}^{(1)}&=\operatorname{ReLU}\!\left(\underbrace{\begin{bmatrix}1&1\\1&-1\end{bmatrix}}_{W^{(1)}}\begin{bmatrix}1\\2\end{bmatrix}+\underbrace{\begin{bmatrix}-1\\0\end{bmatrix}}_{\mathbf b^{(1)}}\right)=\begin{bmatrix}2\\0\end{bmatrix}\\[8pt]\mathbf{h}^{(2)}&=\operatorname{ReLU}\!\left(\underbrace{\begin{bmatrix}1&2\\2&-1\end{bmatrix}}_{W^{(2)}}\begin{bmatrix}2\\0\end{bmatrix}+\underbrace{\begin{bmatrix}-1\\0\end{bmatrix}}_{\mathbf b^{(2)}}\right)=\begin{bmatrix}1\\4\end{bmatrix}\\[8pt]y&=\begin{bmatrix}0.5&0.5\end{bmatrix}\begin{bmatrix}1\\4\end{bmatrix}+0=2.5\end{aligned}`} symbols={[{symbol:String.raw`\mathbf h^{(1)},\mathbf h^{(2)}`,meaning:'第一、第二隐藏层的整组输出，分别由图中的 hA、hB 和 hC、hD 组成。括号里的数字是层号，不是乘方。'},{symbol:String.raw`W^{(1)},W^{(2)}`,meaning:'各层的权重矩阵。每一行属于一个单元，每一列对应这个单元接收的一路输入。'},{symbol:String.raw`\mathbf b^{(1)},\mathbf b^{(2)}`,meaning:'各层的偏置向量，每个单元各有一个偏置。'},{symbol:String.raw`\operatorname{ReLU}`,meaning:'分别处理向量中的每个数：负数变为 0，其余保持不变。'},{symbol:'y',meaning:'图中输出层的最终结果。这个示例的输出层直接保留加权求和结果。'}]} />
      <details className={styles.deeper}><summary>进一步：任意宽度的一层怎样表示？</summary>
        <Formula expression={String.raw`\mathbf h=\varphi(W\mathbf x+\mathbf b),\qquad W\in\mathbb R^{m\times n}`} symbols={[{symbol:String.raw`\mathbf x\in\mathbb R^n`,meaning:'本层收到的 n 个输入数，可以是原始输入，也可以是前一层的结果。'},{symbol:String.raw`\mathbf h\in\mathbb R^m`,meaning:'本层 m 个单元传出的 m 个结果。'},{symbol:'W',meaning:'m 行、n 列的权重矩阵：m 个单元，每个都接收 n 路输入。'},{symbol:String.raw`\mathbf b\in\mathbb R^m`,meaning:'每个单元的偏置，共 m 个。'},{symbol:String.raw`\varphi`,meaning:'本层采用的激活处理，如逐元素 ReLU。输出层的处理方式由任务决定。'}]} />
        <Paragraph>{'因此，一个带偏置的全连接层有 m×n 个权重和 m 个偏置。本页示例依次有 6、6、3 个参数，共 15 个。这里没有计算额外训练状态；参数量也不能直接等同于运行时延。'}</Paragraph>
      </details>
    </TermSection>
    <TermSection id="pytorch" title="PyTorch 实现">
      <Paragraph>{'用 nn.Sequential 按顺序连接 Linear 和 ReLU，就能搭出图中的 2 → 2 → 2 → 1 网络。两个隐藏层都接 ReLU；最后一层直接输出数值。'}</Paragraph>
      <CodeBlock language="python" code={structureCode} caption="在已安装 PyTorch 的 Python 环境中运行。注释中的单元名称与上方网络图对应。" />
      <Paragraph>{'Linear 的两个数字分别是输入和输出特征数，前一层的输出数要与后一层的输入数一致。ReLU 保持形状不变。代码中的三个 Linear 才是带参数的计算层，合计 15 个参数。'}</Paragraph>
      <details className={styles.deeper}><summary>复现图中的中间结果与输出 2.5</summary>
        <Paragraph>{'上面的模型默认随机初始化参数，所以预测数值未必是 2.5。继续运行下面的代码，设置为图中的固定参数，就能逐层核对结果。'}</Paragraph>
        <CodeBlock language="python" code={reproduceCode} caption="切片 model[:2] 表示前两个模块；参数与原模型共用。这里只复现前向过程，不做训练。" />
      </details>
      <p className={styles.source}>参考：<a href="https://docs.pytorch.org/docs/stable/generated/torch.nn.Sequential.html" target="_blank" rel="noreferrer">PyTorch · Sequential</a></p>
    </TermSection>
    <TermSection id="summary" title="训练与总结">
      <Paragraph>{'示例中，我们手工给每个单元设置了参数。真实任务通常先选好层数、宽度和激活函数，再通过训练调整权重和偏置：用[[term:loss-function|损失函数]]衡量输出与目标的差距，通过[[term:backpropagation|反向传播]]计算参数对这个差距的影响，再由优化算法更新参数。训练完成后，使用模型时通常固定参数，从左到右计算输出。'}</Paragraph>
      <Paragraph>{'MLP 可以根据一组特征预测数值，也可以做分类。输出层的大小和处理方式随任务变化：预测一个数值时可以只有一个输出；多类别分类时可以先输出各类别的分数，再用 softmax 等方式转换。输出不是天然就是概率。'}</Paragraph>
      <Callout tone="key" title="总结">{'多层感知机把全连接的计算层逐级接起来。每层用自己的参数组合上一层的结果，隐藏层再做非线性处理，最终得到任务需要的输出。读懂“接收哪组数、怎样组合、把哪组结果交给下一层”，就读懂了 MLP 的主要结构。'}</Callout>
      <p className={styles.source}>进一步阅读：<a href="https://d2l.ai/chapter_multilayer-perceptrons/mlp.html" target="_blank" rel="noreferrer">《动手学深度学习》· 多层感知机</a></p>
    </TermSection>
  </div>;
}
export default defineTermView({ termId:'mlp', Component:TermBody });
