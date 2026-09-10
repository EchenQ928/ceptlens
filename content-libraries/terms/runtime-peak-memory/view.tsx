import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="timeline" title="先把峰值看成时间问题">
        <CuratedVisual name="runtime-peak-memory-visual" />
        <Paragraph>{"同一个缓冲在某层用完后可能被释放或复用，所以整图激活总量不等于峰值。相反，某个大工作区如果恰好与权重、输入和多个分支激活同时存在，会把短暂峰值推高。"}</Paragraph>
      </TermSection>
      <TermSection id="components" title="推理时常见的内存组成">
        <Comparison columns={["组成","何时存在","典型影响因素"]} rows={[["权重与常量","模型加载到卸载","参数量、数据类型、打包格式、常量副本"],["输入输出与中间激活","对应张量产生到最后一次使用","Batch、Shape、分支并发、张量生命周期"],["算子工作区","某个内核执行期间","算法选择、卷积/矩阵乘实现、编译器规划"],["状态缓存","跨步骤或跨请求保留","[[term:kv-cache|KV Cache]]、流式状态、并发数、最大长度"],["运行时与对齐","设备上下文或内存池生命周期","分配器、对齐、碎片、预留策略"]]} />
      </TermSection>
      <TermSection id="measurement" title="怎样得到可比较的峰值数据">
        <Flow steps={[{"label":"固定输入合同","detail":"记录 Batch、所有动态轴上限、数据类型和并发。"},{"label":"区分加载与执行","detail":"分别观察加载后基线、单次执行增量和稳态并发。"},{"label":"使用设备侧 Profile","detail":"同时查看物理分配、张量生命周期、工作区和搬运。"},{"label":"报告统一口径","detail":"说明是否包含运行时预留、缓存、主机内存和首次编译开销。"}]} />
        <Callout tone="boundary" title="逻辑载荷不等于物理占用">{"numel × element_size 只能得到一个张量的数值载荷；对齐、内存池预留、格式副本和工作区会让设备实际分配不同。"}</Callout>
      </TermSection>
      <EngineeringBoundaries items={["比较方案时必须保持模型、Shape、并发、精度、编译版本和测量阶段一致，否则峰值数字没有可比性。","降低参数位宽可能减少权重载荷，却不一定降低由激活或工作区主导的峰值；优化前先确认真实峰值组成。"]} />
    </div>;
}

export default defineTermView({ termId: "runtime-peak-memory", Component: TermBody });
