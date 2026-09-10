import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="worked-example" title="先看一组具体分数">
        <Paragraph>{"下面固定三个候选，只改变原始分数之间的差距。注意两个现象：最高分候选始终得到最高[[term:probability-distribution|概率]]；差距变大时，概率会更集中。"}</Paragraph>
        <CuratedVisual name="softmax-explorer" />
      </TermSection>
      <TermSection id="calculation" title="它怎样完成归一化">
        <Flow steps={[{"label":"每个分数取指数","detail":"指数结果一定为正，因此最终权重不会为负。"},{"label":"求指数之和","detail":"所有候选共同组成同一个分母。"},{"label":"各自除以总和","detail":"每项落在 0 到 1 之间，全部结果相加正好为 1。"}]} />
        <Formula expression="p_i=\\frac{e^{z_i-m}}{\\sum_{j=1}^{n}e^{z_j-m}},\\qquad m=\\max_j z_j" caption="减去最大分数不会改变结果，只是避免指数计算溢出。" symbols={[{"symbol":"z_i","meaning":"第 i 个候选的原始分数，也常叫 [[term:logits|logit]]"},{"symbol":"p_i","meaning":"第 i 个候选转换后的权重或概率"},{"symbol":"n","meaning":"参与同一次归一化的候选数量"},{"symbol":"m","meaning":"这组分数中的最大值，用于数值稳定"}]} />
      </TermSection>
      <TermSection id="axes-and-uses" title="归一化哪一组数">
        <Comparison columns={["场景","同一个分母中的候选","结果含义"]} rows={[["多分类输出","同一样本的全部类别分数","每个类别的预测概率"],["自注意力","一个 Query 对允许读取的全部 Key 分数","该 Query 读取各 Value 的权重"],["批量张量","由 dim/axis 指定的那一条轴","其他轴上的每组数据分别归一化"]]} />
        <Callout tone="boundary" title="先确定轴，再谈 Softmax">{"同一张量沿不同轴做 Softmax，会得到完全不同的结果。工程实现必须明确哪一维表示互相竞争的候选。"}</Callout>
      </TermSection>
      <EngineeringBoundaries items={["实现通常先减去每组分数的最大值，再计算指数与归一化；这一步是防止溢出的标准数值稳定做法。","注意力中的 Mask 必须在 Softmax 之前施加，使不允许读取的位置得到接近负无穷的分数和零权重。"]} />
    </div>;
}

export default defineTermView({ termId: "softmax", Component: TermBody });
