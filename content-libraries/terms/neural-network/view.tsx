import { Callout, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import { MlpForwardExplorer } from "./explorer";
import styles from "./styles.module.css";

function ReluGraph() {
  return <figure className={styles.reluFigure} aria-label="ReLU 函数图像">
    <figcaption><strong>ReLU：负数归零，正数保留</strong><span>横轴是单元加权求和后的总和 z，纵轴是传出的结果 h。</span></figcaption>
    <svg className={styles.reluGraph} viewBox="0 0 640 310" role="img" aria-label="ReLU 在 z 小于等于 0 时输出 0，在 z 大于 0 时输出 z。示例 B 的总和 −1 对应输出 0，示例 A 的总和 2 对应输出 2。">
      <g className={styles.plotGrid}>{[1,2,3].map(n => <line key={n} x1="150" y1={235-n*55} x2="505" y2={235-n*55} />)}</g>
      <g className={styles.plotAxis}><line x1="140" y1="235" x2="550" y2="235" /><path d="M544 231 L550 235 L544 239" /><line x1="320" y1="252" x2="320" y2="38" /><path d="M316 44 L320 38 L324 44" /></g>
      <g className={styles.plotTicks}>{[-3,-2,-1,0,1,2,3].map(n => <g key={n}><line x1={320+n*55} y1="235" x2={320+n*55} y2="240" /><text x={320+n*55} y="258">{n < 0 ? `−${-n}` : n}</text></g>)}{[1,2,3].map(n => <text key={n} x="307" y={240-n*55}>{n}</text>)}</g>
      <text className={styles.plotLabel} x="320" y="22" textAnchor="middle">输出 h = ReLU(z)</text><text className={styles.plotLabel} x="561" y="240">总和 z</text>
      <path className={styles.reluLine} d="M155 235 H320 L485 70" />
      <g className={styles.plotGuide}><line x1="430" y1="125" x2="430" y2="235" /><line x1="320" y1="125" x2="430" y2="125" /></g>
      <circle className={styles.plotPoint} cx="265" cy="235" r="5" /><circle className={styles.plotPoint} cx="430" cy="125" r="5" />
      <text className={styles.plotAnnotation} x="185" y="185">负数区间：h = 0</text><text className={styles.plotAnnotation} x="462" y="162">正数区间：h = z</text>
      <text className={styles.exampleLabel} x="265" y="288" textAnchor="middle">B：−1 → 0</text><text className={styles.exampleLabel} x="455" y="114">A：2 → 2</text>
    </svg>
    <p>原点处输出也是 0。图中的折点把两种响应接在一起：左边是一条水平线，右边随输入等量上升。</p>
  </figure>;
}

function TermBody() {
  return <div className={styles.packageRoot}>
    <TermSection id="function-view" title="从外部看：一个函数">
      <Paragraph>{"如果你写过函数，就熟悉“给它输入，它返回结果”。神经网络也可以这样理解：比如输入一张图片，返回它属于哪一类；或者输入一组设备读数，预测一个数值。图片、声音和文字进入网络前，也会先表示成数字。"}</Paragraph>
      <div className={styles.functionBridge} aria-label="输入数字，经过神经网络内部的小计算单元，得到任务所需的结果">
        <div><small>输入</small><b>表示数据的数字</b></div><span aria-hidden="true">→</span><div className={styles.functionBox}><small>神经网络</small><b>许多相连的小计算单元</b><em>把计算结果继续传下去</em></div><span aria-hidden="true">→</span><div><small>输出</small><b>任务需要的结果</b></div>
      </div>
      <Paragraph>{"特别之处在函数内部：每个小单元用一些可以调整的数参与计算。训练时，程序根据大量例子反复调整这些数，让网络的输出逐渐接近希望得到的结果。我们先看这个函数怎样计算，再看这些数怎样学出来。"}</Paragraph>
    </TermSection>
    <TermSection id="inside-network" title="打开函数，跟着数字走">
      <Paragraph>{"下面把网络缩到可以手算的大小：两个输入数，先交给中间的 A、B 两个计算单元，再把它们的结果交给一个输出单元。同一阶段的单元排成一层；夹在输入和输出之间、负责产生中间结果的部分叫隐藏层。图中的 A、B 就在这个隐藏层里。"}</Paragraph>
      <Paragraph>{"这样的分层网络是一种[[term:mlp|多层感知机（MLP）]]。本例中，每个计算单元都接收上一层的全部结果，这种连接方式叫[[term:fully-connected-layer|全连接]]。箭头表示数值传递的方向。先看清这条路线，再看下方已经展开的单元 A。"}</Paragraph>
      <MlpForwardExplorer />
      <Paragraph>{"这些小计算单元也叫神经元。名字来自对生物神经元连接方式的借鉴，这里的单元做的是明确的数学运算。把输入沿连接一直算到输出，叫[[term:forward-propagation|前向传播]]。图中的函数负责执行计算，箭头上的数则是它们传给下一步的结果。"}</Paragraph>
    </TermSection>
    <TermSection id="nonlinearity" title="为什么能表达复杂关系">
      <h3 className={styles.reasoningTitle}>先把多个输入组合起来</h3>
      <Paragraph>{"先看每个单元的前两步：输入乘权重，再相加并加上偏置。它们已经能做很多事情：放大或缩小某个输入，让不同输入相加或相减，再整体抬高或降低结果。图中的 A 把两个输入相加后，再加上偏置 −1；B 则计算两个输入的差。这就是两种不同的信息组合。"}</Paragraph>
      <Paragraph>{"当输入和单元很多时，一层可以同时计算许多不同的组合，后一层再组合这些中间结果。这些线性组合能处理很高维的数据，也能完成复杂的数值变换；它们本身就是神经网络的重要基础。"}</Paragraph>
      <h3 className={styles.reasoningTitle}>但固定比例的组合，也有表达边界</h3>
      <Paragraph>{"如果始终只做乘常数、相加和加偏置，多层计算最终仍能合并成一次同类计算。固定其他输入，只改变其中一个输入时，结果始终按固定比例变化。比如“输入乘 2，再加 1”：无论输入原来是多少，每增加 1，输出都增加 2。加偏置能移动这条关系，却不会改变这个比例。"}</Paragraph>
      <Paragraph>{"有些关系需要不同的响应：比如低于某个阈值时没有输出，超过阈值后才逐渐增加；还有些关系需要弯曲地变化。一条始终保持固定比例的关系，无法完整表达这些情况。于是，我们需要在组合之后加入另一种处理。"}</Paragraph>
      <h3 className={styles.reasoningTitle}>再用 ReLU 引入不同区间的响应</h3>
      <Paragraph>{"ReLU 就是一个很简单的例子：总和小于 0 时输出 0，大于 0 时原样输出，等于 0 时仍输出 0。它属于[[term:activation-function|激活函数]]，负责对加权求和的结果再做一次变换。"}</Paragraph>
      <ReluGraph />
      <Paragraph>{"回到刚才的网络：B 先通过权重和偏置算出总和 −1，经过 ReLU 后传出 0；A 的总和是 2，经过 ReLU 后仍传出 2。前面的组合决定送进 ReLU 的是什么数，ReLU 再按这个数所在的区间，采用“归零”或“保留”的响应方式。"}</Paragraph>
      <Paragraph>{"这种响应比例会随区间改变的关系，就是这里的非线性。不同单元可以用不同的权重和偏置，让转折发生在不同的输入条件下；下一层再把这些响应组合起来，就能形成更多分段、逼近更复杂的关系。"}</Paragraph>
      <Callout tone="key" title="线性组合与非线性变换相互配合">{"权重和偏置负责组合信息，激活函数让响应方式可以随输入条件改变。许多这样的计算逐层连接，扩展了整个网络能够表达的关系。能否学好一个真实任务，还要看数据和训练。"}</Callout>
    </TermSection>
    <TermSection id="learning" title="参数是怎样学出来的">
      <Paragraph>{"刚才每条连接上的乘数叫权重，每个单元额外加的数叫偏置。它们合起来属于网络的[[term:model-parameter|参数]]：在常规训练中，结构和计算规则先选好，训练主要调整这些参数。"}</Paragraph>
      <div className={styles.trainingStory}><h3>以“根据设备读数预测耗电量”为例</h3><ol><li><b>先算一次预测。</b>把一组读数送入网络，用当前参数算出预测耗电量。</li><li><b>和已知结果比较。</b>如果真实耗电量是 5 度，网络预测为 3 度，就还有差距。</li><li><b>调整参数，再尝试。</b>训练算法依据误差计算怎样小幅修改参数，再用许多这样的样本反复练习。</li></ol></div>
      <Paragraph>{"更具体地说，[[term:loss-function|损失函数]]把预测与已知结果之间的差距表示成一个数。[[term:backpropagation|反向传播]]计算参数的小变化会怎样影响这个差距，优化算法再据此调整参数。一次调整未必让每个样本都更好，训练是在许多样本上逐步改善整体表现。"}</Paragraph>
      <Paragraph>{"训练好以后，用网络处理新的输入，通常只需固定参数，像刚才的小网络一样从输入算到输出；这就是使用模型做推理。它能否在新数据上表现好，还需要用没参与训练的数据检验。"}</Paragraph>
    </TermSection>
    <TermSection id="formula" title="把计算写成公式">
      <Paragraph>{"下面把同一个小网络写成公式：输入 x₁ 为 1，输入 x₂ 为 2。公式只是把前面的乘、加和负数归零写得更紧凑。F 表示执行计算的函数，h 表示它传出的中间结果；下面的符号与图中保持一致。"}</Paragraph>
      <Formula expression={String.raw`\begin{aligned} h_A = F_A(x_1,x_2) &= \max(0,\;1\times x_1+1\times x_2-1)\\ h_B = F_B(x_1,x_2) &= \max(0,\;1\times x_1-1\times x_2+0)\\ y = F_{\mathrm{out}}(h_A,h_B) &= 0.5h_A+0.5h_B+0 \end{aligned}`} caption="代入本例输入后，两个隐藏函数分别传出 2 和 0，输出函数再得到最终结果 1。" symbols={[{symbol:"x_1,x_2",meaning:"图中的输入 1 和输入 2。下标只用于区分两个输入。"},{symbol:"F_A,F_B",meaning:"图中隐藏层的两个计算函数。"},{symbol:"h_A,h_B",meaning:"这两个函数经过 ReLU 后传出的结果，标在它们右侧的箭头上。"},{symbol:String.raw`F_{\mathrm{out}}`,meaning:"图中的输出函数，接收两个隐藏层结果并继续计算。"},{symbol:String.raw`\max(0,t)`,meaning:"取 0 与 t 中较大的数：负数归零，其余保留，也就是本例的 ReLU。"},{symbol:"y",meaning:"图中输出单元给出的最终数值。"}]} />
      <details className={styles.deeper}><summary>进一步：同样的计算怎样写成通用形式？</summary>
        <Paragraph>{"把单元 A 的两条输入连接上的权重写成两个 w，把偏置写成 b，把激活处理写成一个函数 φ，就得到下面的形式。它描述的仍是同一个小单元。"}</Paragraph>
        <Formula expression={String.raw`h=\varphi(w_1x_1+w_2x_2+b)`} symbols={[{symbol:"x_1,x_2",meaning:"这个单元接收到的两路输入；在后续层，它们也可以是上一层的计算结果。"},{symbol:"w_1,w_2",meaning:"两条输入连接各自的权重。本例单元 A 都为 1，单元 B 分别为 1 和 −1。"},{symbol:"b",meaning:"这个单元的偏置。本例 A 为 −1，B 为 0。"},{symbol:String.raw`\varphi`,meaning:"激活函数。本例隐藏层使用 ReLU；输出层直接保留总和。"},{symbol:"h",meaning:"这个单元传给下一层的结果。"}]} />
        <Paragraph>{"把许多这样的单元连接起来，整个网络可以记作一个带参数的函数。θ 是全部参数的统称：对本例来说，包括 6 个连接权重和 3 个偏置。输入数据会变，训练也可以改变 θ，从而改变这个函数的行为。"}</Paragraph>
        <Formula expression={String.raw`y=F_{\theta}(x)`} symbols={[{symbol:"x",meaning:"网络收到的整组输入。"},{symbol:String.raw`\theta`,meaning:"整个网络的参数集合，不是一个单独的数。"},{symbol:String.raw`F_{\theta}`,meaning:"使用当前这组参数的神经网络函数。"},{symbol:"y",meaning:"整个网络的输出。"}]} />
      </details>
    </TermSection>
    <TermSection id="takeaway" title="总结">
      <Paragraph>{"神经网络用许多相连的小计算单元组成一个函数。连接结构规定数值怎样流动，权重和偏置决定每一步怎样组合数值，激活函数引入非线性。训练通过调整参数，让这整个函数逐渐适合要解决的任务。"}</Paragraph>
      <Paragraph>{"在图片、语音等难以逐条写清规则的任务中，这种从数据中学习的方式很有用。但更大的网络并不自动带来更可靠的预测：数据是否有代表性、训练是否有效，以及新数据上的测试结果，都需要一起考虑。"}</Paragraph>
      <p className={styles.source}>进一步阅读：<a href="https://developers.google.com/machine-learning/crash-course/neural-networks/nodes-hidden-layers" target="_blank" rel="noreferrer">Google · 节点与隐藏层</a>、<a href="https://developers.google.com/machine-learning/crash-course/neural-networks/activation-functions" target="_blank" rel="noreferrer">激活函数</a></p>
    </TermSection>
  </div>;
}
export default defineTermView({ termId: "neural-network", Component: TermBody });
