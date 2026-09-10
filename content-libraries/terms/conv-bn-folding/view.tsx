import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="graph-change" title="融合前后，运行图发生了什么">
        <CuratedVisual name="conv-bn-folding-visual" />
        <Paragraph>{"推理态 BN 的均值、方差、缩放 γ 和偏移 β 都已经固定，因此它对每个输出通道只是固定的一次缩放和偏移。固定线性变换可以提前并入前面的卷积参数。"}</Paragraph>
      </TermSection>
      <TermSection id="formula" title="新权重和新偏置怎样得到">
        <Formula expression="a_c=\\frac{\\gamma_c}{\\sqrt{\\sigma_c^2+\\varepsilon}},\\qquad W'_c=a_cW_c,\\qquad b'_c=a_c(b_c-\\mu_c)+\\beta_c" caption="对每个输出通道 c 分别计算缩放，并吸收到该通道卷积核与偏置中。" symbols={[{"symbol":"W_c,b_c","meaning":"卷积第 c 个输出通道原来的权重与偏置"},{"symbol":"\\mu_c,\\sigma_c^2","meaning":"BN 推理时使用的运行均值与运行方差"},{"symbol":"\\gamma_c,\\beta_c","meaning":"BN 学习得到的缩放和偏移"},{"symbol":"\\varepsilon","meaning":"防止方差开方分母过小的稳定常数"},{"symbol":"W'_c,b'_c","meaning":"折叠后卷积直接使用的新参数"}]} />
        <Callout tone="boundary" title="只能使用推理态统计量">{"训练态 BN 使用当前批次的均值和方差，数值会随输入批次变化，不能预先固定到卷积参数里。"}</Callout>
      </TermSection>
      <TermSection id="verification" title="部署时怎样确认真的融合成功">
        <Flow steps={[{"label":"导出前切换评估态","detail":"确认 BN 使用运行统计量，并冻结参数。"},{"label":"检查编译后执行图","detail":"确认独立 BN 节点消失，而不是只在源码层看见融合选项。"},{"label":"对比融合前后输出","detail":"在目标数据类型与编译配置下检查数值误差和任务指标。"},{"label":"测端到端性能","detail":"核对是否减少一次算子调度、中间张量写回和读入。"}]} />
      </TermSection>
      <EngineeringBoundaries items={["FP16、BF16 或量化部署会引入舍入和尺度变化，实数公式等价不代表最终编译图逐位相同。","如果卷积没有偏置，折叠过程通常需要为其生成新偏置；部署算子必须支持该参数形式。"]} />
    </div>;
}

export default defineTermView({ termId: "conv-bn-folding", Component: TermBody });
