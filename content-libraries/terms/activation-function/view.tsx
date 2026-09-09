import { Callout, CodeBlock, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import { ActivationExplorer } from './explorer';
import { activations } from './model';
import { activationCode } from './pytorch';
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.root}>
      <TermSection id="role" title="激活函数在做什么">
        <Paragraph>{'在[[term:neural-network|神经网络]]中，计算单元先把输入乘权重、相加并加上偏置。激活函数接着处理这个结果，决定它如何向后传递：可以保留一部分、压缩到某个范围，也可以按平滑曲线调整。'}</Paragraph>
        <div className={styles.pipeline} aria-label="加权计算得到 z，激活函数 f 把 z 变成 h，h 交给后续计算"><div><strong>加权计算</strong><small>乘权重、求和、加偏置</small></div><span><i>z</i><b>→</b></span><div><strong>激活函数 f</strong><small>按函数规则改变响应</small></div><span><i>h</i><b>→</b></span><div><strong>后续计算</strong><small>使用激活后的结果</small></div></div>
        <Paragraph>{'加权计算已经可以组合多路信息。但如果每一层始终只做“乘权重、加偏置”，叠加后仍能合并成一次同类运算。激活函数引入非线性，让响应可以转折或弯曲，再由后面的层继续组合，从而表达更复杂的关系。'}</Paragraph>
      </TermSection>
      <TermSection id="functions" title="常见激活函数">
        <Paragraph>{'下面六种函数都接收一个数 z，给出一个结果 h。它们的差别在于响应曲线：负输入怎样处理，正输入怎样变化，以及输出有没有上下界。'}</Paragraph>
        <ActivationExplorer />
        <Paragraph>{'曲线在某一段越平，输入变化带来的输出变化就越小；越陡，变化就越明显。ReLU 和 Leaky ReLU 是分段直线，整体仍是非线性的；其余几种用平滑曲线改变响应。'}</Paragraph>
        <details className={styles.details}><summary>查看这些曲线对应的公式</summary>
          <p>下面的 z 都是激活前的数值，f(z) 是激活后的结果。e 是自然常数；Leaky ReLU 的负半轴比例在本例中设为 0.1。</p>
          {activations.map(activation=><div key={activation.id}><h3>{activation.name}</h3><Formula expression={activation.formula} symbols={[]} caption={activation.id==='gelu'?'GELU 的标准定义为 zΦ(z)，Φ 是标准正态分布的累积分布函数。这里写出与图像、代码一致的 tanh 近似。':undefined} /></div>)}
        </details>
      </TermSection>
      <TermSection id="use" title="放进网络里怎样用">
        <Paragraph>{'上面的函数对每个数独立处理。在[[term:fully-connected-layer|全连接层]]之后使用时，把这一层的每个输出分别送入函数即可；数的个数和排列方式保持不变。'}</Paragraph>
        <CodeBlock language="python" code={activationCode} caption="在已安装 PyTorch 的环境中运行。三个输入对应上方的快捷按钮，可逐项核对六种函数的输出。" />
        <Paragraph>{'隐藏层通常需要非线性；输出层则要看任务：预测一般数值时可以直接输出，门控可以用 Sigmoid 表示保留比例。具体用法还要与[[term:loss-function|损失函数]]配套。'}</Paragraph>
        <Paragraph>{'多类别分数常用[[term:softmax|Softmax]] 转成总和为 1 的一组权重。它会一起处理整组数，某一项的结果也取决于其他项；这与上面六种逐个处理数值的函数不同。'}</Paragraph>
        <Callout tone="key" title="总结">{'激活函数规定计算结果如何响应。理解一个激活函数，先看它的曲线怎样处理负值、零和正值，再看输出范围；最后把这个规则放回网络中的对应位置。'}</Callout>
        <p className={styles.source}>参考：{activations.map(activation=><a key={activation.id} href={`https://docs.pytorch.org/docs/stable/generated/torch.nn.${activation.id==='leaky-relu'?'LeakyReLU':activation.name}.html`} target="_blank" rel="noreferrer">{activation.name}</a>)}</p>
      </TermSection>
    </div>;
}

export default defineTermView({ termId: "activation-function", Component: TermBody });
