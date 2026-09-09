import { Callout, CodeBlock, EngineeringBoundaries, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import { BackpropagationAnimation } from "./explorer";
import { trainingCode } from "./pytorch";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.root}>
    <TermSection id="problem" title="训练时，我们需要知道参数怎样改变">
      <Paragraph>{"训练[[term:neural-network|神经网络]]时，[[term:loss-function|损失函数]]把预测和目标之间的差距表示成一个数。训练的目标是让这个数逐渐变小。要做到这一点，程序需要知道网络中的每个[[term:model-parameter|参数]]往哪个方向调整，调整一步会让损失增加还是减少。"}</Paragraph>
      <Paragraph>{"对一次具体输入来说，损失由网络中的许多参数共同决定。把其中一个参数记作 θᵢ，我们关心的是：θᵢ 改变一点，最终的损失 L 会改变多少。这个变化率就是损失对该参数的偏导。"}</Paragraph>
      <Formula expression={String.raw`L=L(\theta_1,\theta_2,\ldots,\theta_n),\qquad \frac{\partial L}{\partial\theta_i}`} caption="损失可以看成所有参数的函数；每个偏导表示一个参数对当前损失的影响。" symbols={[{ symbol: String.raw`L`, meaning: "当前输入和目标产生的损失值。" }, { symbol: String.raw`\theta_i`, meaning: "网络中的第 i 个参数，例如某条连接上的权重或某个计算单元的偏置。" }, { symbol: String.raw`\frac{\partial L}{\partial\theta_i}`, meaning: "只改变 θᵢ 时，损失随它变化的方向和幅度。" }]} />
      <Callout tone="key" title="反向传播要解决的核心问题">{"网络参数很多。反向传播沿已经完成的计算路径，从损失开始高效算出所有参数的梯度，让后续的[[term:optimizer|优化器]]可以据此更新参数。"}</Callout>
    </TermSection>

    <TermSection id="forward-and-backward" title="先看一次前向，再看一次反向">
      <Paragraph>{"下面用一个很小的网络，把问题放到一张稳定的图上。输入特征是 x₁=2、x₂=1，目标 y=3；第一层参数为 w₁=1、w₂=0.5、b=0.5，输出层参数为 v=1、c=−1。图中的每个框都显示符号和当前数值，参数卡片还会保留已经得到的梯度。"}</Paragraph>
      <Paragraph>{"先沿蓝色箭头完成前向传播：x₁、x₂ 和对应参数在第一层汇合得到 a，再经过 ReLU 得到 h，随后生成预测 ŷ，最后和目标 y 一起得到 Loss。前向结束后，红色梯度从 Loss 沿同一条路径返回，逐步回答“这个变量的变化会怎样影响 Loss”。"}</Paragraph>
      <BackpropagationAnimation />
      <p className={styles.animationSummary}>动画中的一次完整结果是：预测 ŷ=2，损失 L=1；反向传播得到 ∂L/∂w₁=−4、∂L/∂w₂=−2、∂L/∂b=−2、∂L/∂v=−6、∂L/∂c=−2。</p>
    </TermSection>

    <TermSection id="chain-rule" title="把动画写成数学关系">
      <Paragraph>{"动画里反复出现的动作可以压缩成一个规则。假设先由 x 得到中间值 z，再由 z 得到损失 L。想知道 x 对 L 的影响，就把后半段的变化率乘上当前这一步的局部变化率。"}</Paragraph>
      <Formula expression={String.raw`z=f(x),\quad L=g(z)\quad\Longrightarrow\quad \frac{\partial L}{\partial x}=\underbrace{\frac{\partial L}{\partial z}}_{\text{后面传回的梯度}}\;\underbrace{\frac{\partial z}{\partial x}}_{\text{当前这一步的局部导数}}`} caption="这就是链式法则：已有的上游梯度乘以当前局部导数，得到继续向前的新梯度。" symbols={[{ symbol: String.raw`\frac{\partial L}{\partial z}`, meaning: "从损失一侧已经传回到 z 的影响。" }, { symbol: String.raw`\frac{\partial z}{\partial x}`, meaning: "当前计算 z=f(x) 对输入 x 的局部变化率。" }, { symbol: String.raw`\frac{\partial L}{\partial x}`, meaning: "继续向前追踪后得到的 x 对损失的总影响。" }]} />
      <Paragraph>{"如果一条路径包含多个中间变量，局部导数会沿路径连续相乘；如果同一个变量通过多条路径影响 Loss，各条路径的贡献会相加。动画中，∂L/∂ŷ 先被保存，再分别用于计算 v、c 和 h 的梯度，这就是“复用已经算出的影响”。"}</Paragraph>
      <Formula expression={String.raw`\frac{\partial L}{\partial x}=\frac{\partial L}{\partial z_2}\frac{\partial z_2}{\partial z_1}\frac{\partial z_1}{\partial x},\qquad \frac{\partial L}{\partial x}=\sum_j\frac{\partial L}{\partial z_j}\frac{\partial z_j}{\partial x}`} caption="乘法沿单条路径传播，求和汇总多条路径。" symbols={[]} />
    </TermSection>

    <TermSection id="pytorch" title="在代码里，一次反向传播怎样发生">
      <Paragraph>{"深度学习框架会在前向计算时记录运算关系。调用 loss.backward() 后，框架从 Loss 开始沿这张计算图反向遍历，并把每个参数的梯度保存到 parameter.grad。"}</Paragraph>
      <details className={styles.details} open>
        <summary>一个最小例子</summary>
        <CodeBlock language="python" code={trainingCode} caption="loss.backward() 计算梯度；optimizer.step() 使用梯度更新参数。两步各自承担一段清晰的训练流程。" />
      </details>
      <Paragraph>{"真实训练循环通常按这个顺序工作：先清空上一轮残留的梯度，再前向计算预测和损失，随后反向计算当前梯度，最后由优化器按照学习率更新参数。下一轮会用更新后的参数重新前向和反向。"}</Paragraph>
      <Formula expression={String.raw`\theta_{\mathrm{new}}=\theta_{\mathrm{old}}-\eta\nabla_{\theta}L`} caption="学习率 η 控制每次参数更新的步长；反向传播提供 ∇θL，更新动作由优化器执行。" symbols={[{ symbol: String.raw`\theta`, meaning: "全部待训练参数的集合。" }, { symbol: String.raw`\nabla_{\theta}L`, meaning: "按参数排列的一组梯度，也就是动画最后得到的各个偏导。" }, { symbol: String.raw`\eta`, meaning: "学习率，决定沿梯度方向走多大一步。" }]} />
    </TermSection>

    <TermSection id="autograd" title="框架为什么能自动完成反向传播">
      <Paragraph>{"以 PyTorch 为例，requires_grad=True 会让框架保留参数参与计算的关系。每个运算节点只需要知道自己的输入、输出和局部反向规则：乘法节点知道如何把上游梯度传给两个输入，ReLU 节点知道正数区域的局部导数为 1。"}</Paragraph>
      <div className={styles.autogradSteps}>
        <div><b>前向时记录</b><span>输入、运算和中间结果组成计算图。</span></div>
        <div><b>从 Loss 开始</b><span>初始关系是 ∂L/∂L=1。</span></div>
        <div><b>逐节点回传</b><span>上游梯度乘局部导数，并把结果交给更早的节点。</span></div>
        <div><b>遇到分支就累加</b><span>同一变量收到多条路径的梯度时，汇总所有贡献。</span></div>
      </div>
      <Paragraph>{"因此 parameter.grad 会保存本轮累计结果。每次开始新的训练步前清空它，才能让当前样本或当前批次的梯度单独参与更新。"}</Paragraph>
    </TermSection>

    <EngineeringBoundaries items={[
      "反向传播依赖前向时产生的中间激活；训练通常需要暂存这些值，模型层数、批次大小和序列长度增加时，训练内存也会随之增长。",
      "推理只需要从输入算到输出，训练所需的反向图和大部分中间激活不再承担同样的保存任务；两种运行阶段的内存组成应分别评估。",
      "在 NPU 或其他加速器上训练时，需要确认前向算子、梯度算子和自动微分支持是否完整，并关注激活保存、带宽和算子融合带来的实际开销。",
    ]} />

    <TermSection id="takeaway" title="回到核心结论">
      <Paragraph>{"反向传播把“参数怎样影响最终损失”拆成一段段局部关系，从 Loss 开始沿计算图向后传递。链式法则负责连接这些局部影响，梯度会在参数处留下结果，优化器再用这些结果调整网络。"}</Paragraph>
    </TermSection>
  </div>;
}

export default defineTermView({ termId: "backpropagation", Component: TermBody });
