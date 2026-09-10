import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="role" title="训练数据如何改变模型">
        <Flow steps={[{"label":"取一批训练样本","detail":"输入和监督目标来自训练集，可能经过[[term:data-augmentation|随机增强]]。"},{"label":"前向并计算损失","detail":"比较模型预测与训练目标，得到本批次误差。"},{"label":"反向求梯度","detail":"计算每个可学习参数应怎样改变。"},{"label":"优化器更新参数","detail":"更新后的模型继续处理下一批训练样本。"}]} />
      </TermSection>
      <TermSection id="split" title="为什么不能把所有数据都用于训练">
        <Paragraph>{"模型会直接适应训练样本。若评估仍使用同一批数据，结果会混入记忆和调参效果，无法估计面对未见数据时的泛化能力，因此要保留独立的[[term:validation-set|验证集]]和[[term:test-set|测试数据]]。"}</Paragraph>
        <Callout tone="boundary" title="防止[[term:data-leakage|数据泄漏]]">{"同一用户、同一设备、同一时间片或由同一原始样本切出的高度相似片段，不能随意跨训练和验证划分，否则验证结果会虚高。"}</Callout>
      </TermSection>
      <EngineeringBoundaries items={["训练集应覆盖部署输入的关键场景、边界和噪声条件；简单增加重复样本不会等价增加有效信息。","归一化统计、词表构建和特征选择等数据驱动步骤也必须只使用允许参与训练的部分，避免泄漏验证信息。"]} />
    </div>;
}

export default defineTermView({ termId: "training-set", Component: TermBody });
