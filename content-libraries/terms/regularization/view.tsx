import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="objective" title="正则化改变了训练目标">
        <Paragraph>{"原本的训练目标只衡量预测与标签之间的误差。加入正则化后，优化器同时考虑数据损失和模型复杂度惩罚；强度因子 λ 决定惩罚项在总目标里有多大影响。"}</Paragraph>
        <Formula expression="L_{total}=L_{data}+\\lambda R(\\theta)" symbols={[{"symbol":"L_{total}","meaning":"优化器实际最小化的总目标"},{"symbol":"L_{data}","meaning":"模型预测与训练目标之间的数据损失"},{"symbol":"R(\\theta)","meaning":"根据模型参数 θ 计算的复杂度惩罚"},{"symbol":"\\lambda","meaning":"正则化强度；越大越强调限制复杂度"}]} />
        <CuratedVisual name="regularization-strength-visual" />
      </TermSection>
      <TermSection id="l1-l2" title="L1 与 L2 分别约束什么">
        <Comparison columns={["方式","惩罚项","直观作用"]} rows={[["L1","$R(\\theta)=\\sum_i |\\theta_i|$","鼓励更多参数精确接近 0，常产生稀疏性"],["L2","$R(\\theta)=\\sum_i \\theta_i^2$","持续惩罚较大的权重，让参数整体更平滑、不过度放大"],["[[term:dropout|Dropout]]","训练时随机屏蔽部分神经元输出","让网络不要依赖某一条固定共适应路径"],["早停","验证表现不再提升时结束训练","避免后续 Epoch 继续拟合训练噪声"]]} />
        <Callout tone="note" title="先理解方法，再选择实现">{"L1、L2、Dropout 和早停作用位置不同。它们都可能改善泛化，但不能在没有验证数据的情况下仅凭训练总损失判断效果。"}</Callout>
      </TermSection>
      <TermSection id="selection" title="怎样选择正则化强度">
        <Flow steps={[{"label":"固定数据划分与指标","detail":"保证不同 λ 的实验在同一验证口径下比较。"},{"label":"从弱到强做少量候选","detail":"同时记录训练表现、验证表现和两者差距。"},{"label":"选择验证最优区域","detail":"目标不是最小训练损失，而是满足工程约束的最佳泛化表现。"}]} />
      </TermSection>
      <EngineeringBoundaries items={["不同优化器对 L2 惩罚与权重衰减的实现可能不同，配置时必须核对框架和优化器语义。","归一化层的偏置、尺度参数等通常不与普通权重使用完全相同的衰减策略，工程实现常分参数组配置。"]} />
    </div>;
}

export default defineTermView({ termId: "regularization", Component: TermBody });
