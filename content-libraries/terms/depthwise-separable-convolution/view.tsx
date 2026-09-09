import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="two-stages" title="为什么要拆成两步">
        <Flow steps={[{"label":"输入张量","detail":"包含多个通道，例如图像的颜色通道或网络中的特征通道。"},{"label":"深度卷积","detail":"每个输入通道只与自己的卷积核计算，输出通道数通常不变。"},{"label":"逐点卷积","detail":"用 1×1 卷积在同一空间位置混合所有通道，产生新的通道组合。"},{"label":"输出张量","detail":"得到既包含局部空间特征，又完成通道融合的结果。"}]} />
        <Callout tone="key" title="两步分工">{"深度卷积负责“每个通道内部看邻域”，逐点卷积负责“同一位置跨通道交流”。只有深度卷积时，通道之间不会交换信息。"}</Callout>
      </TermSection>
      <TermSection id="explorer" title="逐通道卷积是怎样计算的">
        <Paragraph>{"下面先只看深度卷积。选择一个输入通道，再点击输出矩阵中的元素；输入里参与计算的 2×2 区域会被标出，页面同时给出完整乘加。切换通道后，输入与卷积核一起更换。"}</Paragraph>
        <DepthwiseConvolutionExplorer />
      </TermSection>
      <TermSection id="tradeoffs" title="优势与边界">
        <Comparison columns={["比较项","标准卷积","深度可分离卷积"]} rows={[["空间与通道处理","一次计算同时完成","拆成深度卷积与逐点卷积"],["参数量与 MACs","通常较高","通常显著更低"],["表达能力","空间和通道强耦合","分解后可能损失部分表达能力"],["常见场景","精度优先的通用骨干","移动端、端侧、小模型与实时网络"]]} />
      </TermSection>
      <EngineeringBoundaries items={["理论 MACs 降低不保证等比例降低时延；深度卷积的算术强度较低，可能更受内存访问限制。","某些 NPU 对深度卷积的通道倍率、核大小、步幅或布局支持有限，需要以目标[[term:compiler|编译器]]和实测性能为准。"]} />
    </div>;
}

export default defineTermView({ termId: "depthwise-separable-convolution", Component: TermBody });
