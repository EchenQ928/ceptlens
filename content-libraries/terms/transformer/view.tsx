import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="block" title="一层 Transformer 的信息流">
        <Flow steps={[{"label":"序列表示","detail":"每个 [[term:token|token]] 对应一个向量，并加入[[term:positional-encoding|位置信息]]。"},{"label":"自注意力","detail":"每个位置根据内容选择并汇聚其他位置的信息。"},{"label":"残差与归一化","detail":"保留原信息并让深层训练更稳定。"},{"label":"前馈网络","detail":"对每个位置独立做同一组非线性变换。"}]} />
        <Callout tone="key" title="两类计算不要混在一起">{"Attention 跨位置混合信息；前馈网络不跨位置，只在特征维度上变换每个位置的向量。"}</Callout>
      </TermSection>
      <TermSection id="families" title="三种常见整体结构">
        <Comparison columns={["结构","主要信息流","常见任务"]} rows={[["Encoder-only","双向读取完整输入","理解、分类、表征"],["Decoder-only","只能读取当前位置及之前内容","自回归生成"],["Encoder–Decoder","Encoder 编码输入，Decoder 在生成时读取编码结果","翻译、条件生成"]]} />
      </TermSection>
      <EngineeringBoundaries items={["标准自注意力对序列长度的计算和内存开销通常呈平方增长，长序列需要专门优化。","端侧部署还要评估 KV Cache、矩阵乘法形状、量化敏感性和目标 NPU 支持。"]} />
    </div>;
}

export default defineTermView({ termId: "transformer", Component: TermBody });
