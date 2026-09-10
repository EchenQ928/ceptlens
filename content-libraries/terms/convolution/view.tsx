import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="single-output" title="一个输出元素怎样算出">
        <Flow steps={[{"label":"选择局部区域","detail":"输出位置决定输入中哪一块区域参与计算。"},{"label":"逐元素乘加","detail":"局部区域与卷积核对应位置相乘，再把所有乘积相加。"},{"label":"写入输出","detail":"相加结果写入当前输出元素，卷积核再滑到下一个位置。"}]} />
        <Formula expression="y_{o,i,j}=b_o+\\sum_c\\sum_u\\sum_v W_{o,c,u,v}x_{c,i+u,j+v}" caption="二维标准卷积中一个输出元素的计算" symbols={[{"symbol":"x","meaning":"[[term:tensor|输入张量]]"},{"symbol":"W","meaning":"卷积核权重"},{"symbol":"c","meaning":"输入通道索引"},{"symbol":"o","meaning":"输出通道索引"},{"symbol":"i,j","meaning":"输出的空间位置"}]} />
      </TermSection>
      <TermSection id="design-controls" title="核大小、步幅和填充">
        <Comparison columns={["设计量","改变什么","常见代价"]} rows={[["卷积核大小","一次看到的局部范围","更大的核通常增加参数和 MACs"],["步幅","卷积核每次移动的距离","步幅增大可下采样，但会损失空间细节"],["填充","边缘外补多少数值","可控制输出尺寸和边缘信息保留"],["空洞率","核元素之间的采样间隔","扩大感受野，但访问模式可能不利于硬件"]]} />
      </TermSection>
      <EngineeringBoundaries items={["标准卷积会同时混合空间邻域和输入通道，参数与计算量随输入、输出通道数共同增长。","NPU 上的实际性能取决于布局、分块、通道对齐和算子融合，MACs 少不一定等于时延更低。"]} />
    </div>;
}

export default defineTermView({ termId: "convolution", Component: TermBody });
