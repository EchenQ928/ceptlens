import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="why" title="为什么注意力还需要位置">
        <Paragraph>{"纯自注意力把输入看成一组向量：它能比较内容，却没有天然的左、右、先、后概念。位置方法通过给输入加位置向量，或直接修改 Q/K 的匹配关系，把顺序写入计算。"}</Paragraph>
        <CuratedVisual name="positional-encoding-visual" />
      </TermSection>
      <TermSection id="methods" title="常见位置方法放在哪里">
        <Comparison columns={["方法","位置如何进入模型","主要边界"]} rows={[["正弦余弦绝对位置","固定位置向量与 [[term:token|Token]] 表示相加","无学习参数，可外推但效果依任务而定"],["可学习绝对位置","查表得到位置向量并与 Token 表示相加","训练灵活，通常受最大位置表长度限制"],["相对位置偏置","在注意力分数中加入位置差相关偏置","直接表达相对距离，需要对应注意力实现"],["[[term:rope|RoPE]]","按位置旋转 Q 和 K 的特征对","把相对位置信息写入点积，长上下文需关注缩放策略"]]} />
      </TermSection>
      <TermSection id="sinusoidal" title="经典正弦余弦编码">
        <Formula expression="PE(pos,2i)=\\sin\\left(pos/10000^{2i/D}\\right),\\qquad PE(pos,2i+1)=\\cos\\left(pos/10000^{2i/D}\\right)" symbols={[{"symbol":"pos","meaning":"序列中的位置编号"},{"symbol":"i","meaning":"正弦余弦频率对的索引"},{"symbol":"D","meaning":"位置向量的特征维度"},{"symbol":"PE","meaning":"生成的位置向量；不同维度使用不同变化频率"}]} />
        <Paragraph>{"公式的重点不是背常数，而是理解：低频维度变化慢，能表示较长尺度；高频维度变化快，能区分相邻位置。多种频率共同组成位置特征。"}</Paragraph>
      </TermSection>
      <EngineeringBoundaries items={["最大上下文长度、位置外推和缓存位置编号必须与训练及部署实现一致，否则即使张量形状正确也可能产生语义错误。","RoPE 等方法常与融合注意力内核耦合，改变缩放或位置编号后需要同时验证精度、缓存更新和目标 NPU 支持。"]} />
    </div>;
}

export default defineTermView({ termId: "positional-encoding", Component: TermBody });
