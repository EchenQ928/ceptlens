import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="one-token" title="它在[[term:tensor|张量]]的哪一维上工作">
        <CuratedVisual name="layer-normalization-visual" />
        <Paragraph>{"对形状 [B,T,D] 的序列表示，最常见 LayerNorm 对最后的 D 个特征做统计。B 个样本、T 个位置分别计算自己的均值和方差，因此每行互不影响。"}</Paragraph>
      </TermSection>
      <TermSection id="formula" title="标准化后为什么还要 γ 和 β">
        <Formula expression="\\mu=\\frac{1}{D}\\sum_{i=1}^{D}x_i,\\quad \\sigma^2=\\frac{1}{D}\\sum_{i=1}^{D}(x_i-\\mu)^2,\\quad y_i=\\gamma_i\\frac{x_i-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}}+\\beta_i" symbols={[{"symbol":"x_i","meaning":"当前 Token 的第 i 个特征"},{"symbol":"D","meaning":"被归一化的特征数量"},{"symbol":"\\mu,\\sigma^2","meaning":"当前 Token 特征的均值与方差"},{"symbol":"\\varepsilon","meaning":"避免分母过小的稳定常数"},{"symbol":"\\gamma_i,\\beta_i","meaning":"每个特征可学习的缩放与偏移"}]} />
        <Paragraph>{"标准化先消除整体平移和尺度差异；γ、β 再让模型学习哪些特征需要放大、缩小或平移，避免把表示能力固定死。"}</Paragraph>
      </TermSection>
      <TermSection id="compare" title="与 [[term:batch-normalization|BatchNorm]] 的关键区别">
        <Comparison columns={["比较项","LayerNorm","BatchNorm"]} rows={[["统计范围","单个样本/Token 的特征维","同一通道跨批次和空间位置"],["是否依赖批次","不依赖","训练统计依赖当前批次"],["训练与推理","使用当前输入自身统计，口径基本一致","推理使用累计运行均值与方差"],["常见模型","Transformer、序列模型","CNN 等视觉网络"]]} />
      </TermSection>
      <EngineeringBoundaries items={["LayerNorm 包含均值和方差归约、开方、除法与仿射，性能取决于最后一维长度、布局和融合内核支持。","低精度或量化部署常在归约中使用更高精度累加；epsilon 和 normalized_shape 必须与训练导出一致。"]} />
    </div>;
}

export default defineTermView({ termId: "layer-normalization", Component: TermBody });
