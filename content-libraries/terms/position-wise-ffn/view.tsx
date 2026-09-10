import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="row-wise" title="“逐位置”到底是什么意思">
        <CuratedVisual name="position-wise-ffn-visual" />
        <Paragraph>{"在张量 [B,T,D] 中，T 行对应 T 个位置。FFN 可以把前两维临时展平为 B×T 个样本，对每一行调用同一个 [[term:mlp|MLP]]，再恢复原形状。不同位置之间没有求和或矩阵乘。"}</Paragraph>
      </TermSection>
      <TermSection id="formula" title="两次线性投影与一次非线性">
        <Formula expression="\\operatorname{FFN}(x_t)=W_2\\,\\phi(W_1x_t+b_1)+b_2" symbols={[{"symbol":"x_t","meaning":"序列中第 t 个位置的 D 维输入向量"},{"symbol":"W_1,b_1","meaning":"把隐藏维 D 投影到较宽中间维 D_ff 的第一层参数"},{"symbol":"\\phi","meaning":"ReLU、GELU、SiLU 等非线性[[term:activation-function|激活函数]]"},{"symbol":"W_2,b_2","meaning":"把中间维重新投影回隐藏维 D 的第二层参数"}]} />
        <Callout tone="note" title="为什么先扩张再压回">{"更宽的中间维提供较大的特征变换容量；最后回到 D，才能与[[term:residual-connection|残差]]输入保持同形并继续堆叠 Block。"}</Callout>
      </TermSection>
      <TermSection id="variants" title="常见变体与工程影响">
        <Comparison columns={["变体","结构变化","工程关注"]} rows={[["ReLU/GELU FFN","单一路径激活后投影","结构简单，激活选择影响精度与算子支持"],["GLU/SwiGLU","两条上投影分支相乘后再下投影","参数和计算形态变化，门控常提升表示能力"],["MoE FFN","不同 Token 路由到不同专家 FFN","容量增大，但引入路由、负载均衡与通信问题"]]} />
      </TermSection>
      <EngineeringBoundaries items={["许多 Transformer 中 FFN 参数量和 MACs 高于 Attention 投影，端侧分析不能只盯住注意力矩阵。","D、D_ff、激活函数、门控方式和 NPU 矩阵乘对齐共同决定真实时延与峰值激活。"]} />
    </div>;
}

export default defineTermView({ termId: "position-wise-ffn", Component: TermBody });
