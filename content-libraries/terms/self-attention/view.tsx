import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="one-position" title="先只看一个位置">
        <Paragraph>{"先只跟踪位置 2：它用自己的 Query 分别匹配位置 1、2、3 的 Key，[[term:softmax|Softmax]] 把三项分数变成读取权重，最后按权重汇总三个 Value。"}</Paragraph>
        <CuratedVisual name="self-attention-one-query" />
        <Flow steps={[{"label":"生成 Q、K、V","detail":"序列中的每个输入向量分别经过三组可学习线性投影。"},{"label":"计算匹配分数","detail":"当前 Query 与所有 Key 做点积，分数越高表示越值得读取。"},{"label":"归一化权重","detail":"Softmax 把分数变成一组总和为 1 的权重。"},{"label":"汇总 Value","detail":"按权重加权求和所有 Value，形成当前位置的新表示。"}]} />
      </TermSection>
      <TermSection id="formula" title="整条计算关系">
        <Formula expression="\\operatorname{Attention}(Q,K,V)=\\operatorname{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V" symbols={[{"symbol":"Q","meaning":"Query：每个位置要检索什么"},{"symbol":"K","meaning":"Key：每个位置可被怎样匹配"},{"symbol":"V","meaning":"Value：匹配后真正汇总的内容"},{"symbol":"d_k","meaning":"Key 的特征维度，用于缩放点积"}]} />
        <Paragraph>{"矩阵 QKᵀ 同时计算所有位置两两之间的匹配分数；Softmax 对每个 Query 的一整行分数归一化；最后与 V 相乘得到所有位置的上下文表示。"}</Paragraph>
      </TermSection>
      <EngineeringBoundaries items={["序列长度为 n 时，完整注意力分数矩阵包含 n×n 个元素，长序列的内存和访存压力很大。","自回归生成必须使用 [[term:causal-mask|Causal Mask]]，避免当前位置读取未来 token。"]} />
    </div>;
}

export default defineTermView({ termId: "self-attention", Component: TermBody });
