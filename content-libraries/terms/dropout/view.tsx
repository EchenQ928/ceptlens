import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="network-mask" title="在[[term:fully-connected-layer|全连接层]]中，屏蔽发生在哪里">
        <Paragraph>{"全连接层的每个神经元原本都会接收上一层所有输出。Dropout 在该层输出之后乘一个随机 0/1 掩码；输出变成 0 的神经元，本次前向对下一层的所有连接都不再传值。"}</Paragraph>
        <CuratedVisual name="dropout-layer-visual" />
      </TermSection>
      <TermSection id="scaling" title="为什么训练时要缩放保留下来的输出">
        <Formula expression="\\tilde h_i=\\frac{m_i}{1-p}h_i,\\qquad m_i\\sim\\operatorname{Bernoulli}(1-p)" caption="常见 inverted dropout：训练时完成缩放，推理时直接使用完整激活。" symbols={[{"symbol":"h_i","meaning":"第 i 个神经元原本的输出"},{"symbol":"p","meaning":"屏蔽概率，例如 p=0.2 表示平均屏蔽 20%"},{"symbol":"m_i","meaning":"本次随机掩码；保留为 1，屏蔽为 0"},{"symbol":"\\tilde h_i","meaning":"送入下一层的训练时输出"}]} />
        <Paragraph>{"保留概率是 1−p。把保留输出除以 1−p，可以让训练时激活的期望与推理时完整激活大致一致；因此推理阶段不需要再做随机采样或额外乘比例。"}</Paragraph>
      </TermSection>
      <TermSection id="placement" title="它不适合随意放在任何位置">
        <Comparison columns={["用法","屏蔽对象","注意事项"]} rows={[["普通 Dropout","隐藏层激活元素","概率过大会破坏有效信号并导致欠拟合"],["Attention Dropout","注意力权重或注意力输出","具体落点和 Mask 语义由实现明确"],["DropPath / Stochastic Depth","整条残差分支","粒度比逐元素 Dropout 更粗，不是同一操作"],["卷积特征图 Dropout","元素、通道或空间块","普通逐元素屏蔽未必适合强空间相关特征"]]} />
      </TermSection>
      <EngineeringBoundaries items={["导出推理模型前必须切换评估模式，确保 Dropout 被关闭；否则同一输入会得到随机输出。","Dropout 主要是训练期正则化手段，不会自动减少推理参数量、MACs 或模型文件大小。"]} />
    </div>;
}

export default defineTermView({ termId: "dropout", Component: TermBody });
