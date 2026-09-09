import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="projection" title="从同一输入得到三个角色">
        <Flow steps={[{"label":"输入 X","detail":"整段序列的向量表示，形状通常是序列长度乘隐藏维度。"},{"label":"三条线性分支","detail":"X 分别乘 W_Q、W_K、W_V；三组权重互不相同并在训练中学习。"},{"label":"得到 Q、K、V","detail":"三者保留相同的序列位置轴，但特征含义不同。"}]} />
        <Formula expression="Q=XW_Q,\\qquad K=XW_K,\\qquad V=XW_V" symbols={[{"symbol":"X","meaning":"输入序列表示"},{"symbol":"W_Q","meaning":"Query 投影权重"},{"symbol":"W_K","meaning":"Key 投影权重"},{"symbol":"W_V","meaning":"Value 投影权重"}]} />
      </TermSection>
      <TermSection id="cost" title="参数与算力来自哪里">
        <Paragraph>{"QKV 投影本质上是三个矩阵乘法，工程实现常把三组权重拼成一个大矩阵，只调用一次矩阵乘法再切分输出。这样不会改变数学关系，但能减少算子调度和访存开销。"}</Paragraph>
        <CodeBlock language="python" code={"qkv = x @ w_qkv          # [..., 3 * head_dim * num_heads]\nq, k, v = qkv.chunk(3, dim=-1)"} caption="融合投影的核心形态；实际代码还会重排 head 维度。" />
      </TermSection>
      <EngineeringBoundaries items={["多头注意力通常在投影后把特征维度重排成多个 head；head 只是视图和参数组织，不会新增序列位置。","部署时 QKV 融合、权重布局和量化策略会显著影响矩阵乘法效率。"]} />
    </div>;
}

export default defineTermView({ termId: "qkv-projection", Component: TermBody });
