import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="generation-step" title="逐 Token 生成时缓存怎样增长">
        <CuratedVisual name="kv-cache-visual" />
        <Callout tone="key" title="缓存里没有词表概率">{"KV Cache 保存的是每一层注意力的 Key 和 Value 张量，不是最终 token、词表 logit，也不是所有隐藏状态。"}</Callout>
      </TermSection>
      <TermSection id="prefill-decode" title="[[term:prefill-decode|Prefill]] 与 [[term:prefill-decode|Decode]] 的分工">
        <Comparison columns={["阶段","输入","主要计算","缓存变化"]} rows={[["Prefill","完整提示序列","并行处理提示的全部位置","一次建立各层提示 K/V"],["Decode","通常每步一个新 Token","新 Query 读取历史 K/V 并生成下一 Token","每层追加一个位置的新 K/V"]]} />
        <Paragraph>{"有缓存后，Decode 不再重复投影所有旧 Token，但当前新 Query 仍要与可见历史 Key 计算匹配并汇总历史 Value，因此单步注意力读取量仍随缓存长度增加。"}</Paragraph>
      </TermSection>
      <TermSection id="capacity" title="缓存容量由什么决定">
        <Formula expression="M_{KV}=L\\cdot B\\cdot T\\cdot 2\\cdot H_{KV}\\cdot d_{head}\\cdot s" caption="忽略对齐与运行时副本时，KV Cache 的逻辑载荷估算。" symbols={[{"symbol":"L","meaning":"Transformer 层数"},{"symbol":"B","meaning":"并发序列数或批次"},{"symbol":"T","meaning":"缓存的历史 Token 数"},{"symbol":"2","meaning":"同时保存 Key 和 Value 两份张量"},{"symbol":"H_{KV}","meaning":"KV 头数；不一定等于 Query 头数"},{"symbol":"d_{head}","meaning":"每个 KV 头的特征维度"},{"symbol":"s","meaning":"每个元素占用的字节数"}]} />
      </TermSection>
      <EngineeringBoundaries items={["Paged Attention、滑动窗口、KV 量化和分组查询注意力会改变缓存管理或容量，但必须分别验证精度、碎片、搬运和目标算子支持。","缓存位置编号、Mask、批次重排和 beam search 索引必须同步更新，否则可能形状正确却读取了错误历史。"]} />
    </div>;
}

export default defineTermView({ termId: "kv-cache", Component: TermBody });
