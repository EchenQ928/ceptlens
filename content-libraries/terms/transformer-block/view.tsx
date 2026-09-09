import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="information-flow" title="先看清两类信息流">
        <CuratedVisual name="transformer-block-visual" />
        <Callout tone="key" title="不要把 [[term:self-attention|Attention]] 和 FFN 的职责颠倒">{"Attention 会读取其他位置的 Value，所以能跨位置混合；逐位置 FFN 对每一行独立应用同一个小网络，本身不读取其他位置。"}</Callout>
      </TermSection>
      <TermSection id="pre-post-norm" title="LayerNorm 放在子层前还是后">
        <Comparison columns={["形式","简化写法","直观差异"]} rows={[["Pre-Norm","$y=x+F(\\operatorname{LN}(x))$","主 shortcut 从 x 直接到加法点，深层训练通常更稳定"],["Post-Norm","$y=\\operatorname{LN}(x+F(x))$","先相加再归一化，是原始 Transformer 的常见形式"]]} />
        <Paragraph>{"具体模型可能在整个 Block 前后增加额外归一化或门控。判断结构时应沿真实计算图看输入先经过什么，而不是只凭模块命名。"}</Paragraph>
      </TermSection>
      <TermSection id="shape" title="为什么输入输出形状通常相同">
        <Paragraph>{"Block 常接收和输出 [B,T,D]：批次 B、位置数 T、隐藏维 D 都保持不变，便于残差逐元素相加。中间注意力会暂时拆出头维，FFN 会把 D 扩张到更宽的中间维，再投影回 D。"}</Paragraph>
        <Flow steps={[{"label":"输入 [B,T,D]","detail":"每一行是一个位置的 D 维表示。"},{"label":"Attention 内部 [B,h,T,d_head]","detail":"拆出头维计算，最后重新拼接回 D。"},{"label":"FFN 内部 [B,T,D_ff]","detail":"只扩张特征维，不改变位置轴 T。"},{"label":"输出 [B,T,D]","detail":"与输入对齐，进入下一 Block。"}]} />
      </TermSection>
      <EngineeringBoundaries items={["端侧性能应分别分析 Attention 的序列长度相关开销和 FFN 的大矩阵乘开销，两者瓶颈可能不同。","量化与算子融合必须保持残差加法、归一化位置和激活函数语义一致，不能只对比模块名称。"]} />
    </div>;
}

export default defineTermView({ termId: "transformer-block", Component: TermBody });
