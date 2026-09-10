import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="parallel-heads" title="一份输入怎样分成多个头">
        <CuratedVisual name="multi-head-attention-visual" />
        <Flow steps={[{"label":"每头独立投影","detail":"每个头都有自己的 [[term:qkv-projection|Q/K/V]] 投影参数，得到不同子空间表示。"},{"label":"每头独立注意力","detail":"各头分别计算匹配、[[term:softmax|Softmax]] 和 Value 汇总。"},{"label":"拼接头输出","detail":"把每头最后一个特征维拼回较宽表示。"},{"label":"输出投影","detail":"用 W_O 混合不同头的结果并回到模型隐藏维度。"}]} />
      </TermSection>
      <TermSection id="shape" title="头数与维度是什么关系">
        <Formula expression="\\operatorname{MHA}(X)=\\operatorname{Concat}(head_1,\\ldots,head_h)W_O" symbols={[{"symbol":"X","meaning":"输入序列表示，常见形状为 [B,T,D]"},{"symbol":"h","meaning":"注意力头数"},{"symbol":"head_i","meaning":"第 i 头独立注意力的输出"},{"symbol":"W_O","meaning":"拼接后用于混合各头信息的输出投影权重"}]} />
        <Paragraph>{"常见实现令每头维度 d_head = D / h，并把张量从 [B,T,D] 重排为 [B,h,T,d_head]。这只是组织维度；序列位置数量 T 不会因为多头而增加。"}</Paragraph>
      </TermSection>
      <TermSection id="tradeoffs" title="多头的能力与边界">
        <Comparison columns={["设计变化","可能收益","同时带来的约束"]} rows={[["增加头数、保持 D 不变","提供更多独立关系子空间","每头维度变小，过多头可能限制单头表达"],["减少 KV 头数","降低自回归推理的 KV Cache 容量","多个 Query 头共享 K/V，需评估精度与算子支持"],["调整头维度","改变每头表示容量和内核形状","影响投影参数、缩放系数和硬件效率"]]} />
      </TermSection>
      <EngineeringBoundaries items={["实现中的 reshape、transpose 和 layout 会影响是否能命中融合注意力内核；数学参数量相同不代表时延相同。","自回归部署应分别核对 Query 头数与 KV 头数，因为多查询注意力和分组查询注意力的缓存容量不同。"]} />
    </div>;
}

export default defineTermView({ termId: "multi-head-attention", Component: TermBody });
