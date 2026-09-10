import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="mapping" title="浮点数怎样映射到整数">
        <Paragraph>{"先用一个小范围例子看映射：[[term:quantization-scale|scale]] 决定相邻整数格点在浮点域的间距，每个浮点值被舍入到最近格点，再用同一个 scale 近似恢复。"}</Paragraph>
        <CuratedVisual name="quantization-grid-visual" />
        <Flow steps={[{"label":"观察数值范围","detail":"统计权重或[[term:calibration-set|校准数据]]中激活的典型最小值和最大值。"},{"label":"确定量化网格","detail":"用 scale 决定相邻整数格点在浮点域相差多少。"},{"label":"舍入并截断","detail":"浮点值除以 scale 后舍入到整数；超出可表示范围的值被截断。"},{"label":"推理与反量化","detail":"硬件执行整数计算，并按 scale 恢复输出尺度。"}]} />
        <Formula expression="q=\\operatorname{clip}\\left(\\operatorname{round}\\left(\\frac{x}{s}\\right)+z, q_{\\min},q_{\\max}\\right)" symbols={[{"symbol":"x","meaning":"原始浮点值"},{"symbol":"q","meaning":"存储或计算使用的整数"},{"symbol":"s","meaning":"缩放因子 scale"},{"symbol":"z","meaning":"零点 zero point"},{"symbol":"q_{\\min},q_{\\max}","meaning":"整数类型可表示的边界"}]} />
      </TermSection>
      <TermSection id="methods" title="常见落地方式">
        <Comparison columns={["方式","何时处理量化误差","特点"]} rows={[["PTQ 训练后量化","模型训练完成后","改造快，需要校准数据；精度敏感层可能保留更高精度"],["QAT 量化感知训练","训练过程中模拟量化","精度通常更稳，但训练成本和流程复杂度更高"],["权重量化","只降低权重精度","易于降低模型体积和权重带宽"],["权重+激活量化","同时量化两者","整数算力利用更充分，对校准和硬件要求更高"]]} />
      </TermSection>
      <EngineeringBoundaries items={["量化后的真实性能收益取决于 NPU 是否有对应整数算子、是否发生反量化回退，以及算子间能否保持整数数据流。","离群值、分布漂移、逐张量或逐通道粒度都会影响量化误差，必须用真实校准数据和目标任务指标验证。"]} />
    </div>;
}

export default defineTermView({ termId: "quantization", Component: TermBody });
