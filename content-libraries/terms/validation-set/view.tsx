import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="separation" title="训练与验证的职责边界">
        <Comparison columns={["过程","[[term:training-set|训练集]]","验证集"]} rows={[["前向计算","需要","需要"],["反向传播与参数更新","需要","不允许"],["选择超参数","不能只按训练结果选择","主要依据之一"],["保存最佳检查点","训练指标用于诊断","通常按验证指标选择"]]} />
        <Paragraph>{"常见流程是每训练若干步或一个 Epoch 后，固定当前权重在验证集上前向评估；记录指标但不产生梯度，再回到训练集继续更新。"}</Paragraph>
      </TermSection>
      <TermSection id="reuse" title="反复调参也会‘用掉’验证集">
        <Paragraph>{"虽然验证样本不直接产生梯度，但开发者会根据验证结果选择结构、学习率和数据处理方式。尝试次数越多，决策越可能偶然适应这一个验证集，因此最终性能仍需独立[[term:test-set|测试数据]]确认。"}</Paragraph>
        <Callout tone="key" title="验证最优不等于真实平台最优">{"验证集必须与实际部署分布和工程指标一致；如果场景覆盖或评价口径错了，选择出的最佳检查点也可能无法满足真实需求。"}</Callout>
      </TermSection>
      <EngineeringBoundaries items={["验证过程应固定数据预处理、随机种子口径、指标计算和模型评估模式，避免把训练态 [[term:dropout|Dropout]] 或 [[term:batch-normalization|BatchNorm]] 波动当成模型差异。","小数据场景可使用交叉验证降低单次划分偶然性，但每一折仍必须严格隔离训练与验证样本。"]} />
    </div>;
}

export default defineTermView({ termId: "validation-set", Component: TermBody });
