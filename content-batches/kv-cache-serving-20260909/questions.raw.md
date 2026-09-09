# KV Cache 与推理系统题库（原始题目）

## 第一部分：基础认知与自回归计算本质

1. 什么是 KV Cache？在 Transformer 自回归生成中，它解决的最本质痛点是什么？

2. Transformer 的自回归生成被严格划分为 Prefill 和 Decode 两个阶段，这两个阶段在计算特征（Compute-bound 与 Memory-bound）以及对 KV Cache 的读写行为上有何本质区别？

3. 在 Decode 阶段，为什么只有 Key 和 Value 需要缓存，而 Query 向量不需要进行跨步缓存？

4. 自注意力机制中为什么不能只缓存历史的激活输出（Output Tensor），而必须同时缓存 Key 和 Value 两个矩阵？

5. 在 Self-Attention 的单步 Decode 中，当前 Token 的 q_t 为什么必须与自己当步生成的 k_t, v_t 同样进行注意力计算？

6. 矩阵投影（Projection）与注意力点积（Attention Computation）在数学语义与参数属性上有何本质不同？

7. 在编码器-解码器架构（如 Cross-Attention）中，KV Cache 的缓存行为与 Decoder-Only 的 Self-Attention 相比有何区别？

8. 在 Encoder-Decoder 结构中，Self-Attention 的 KV Cache 与 Cross-Attention 的 KV Cache 生命周期有何不同？

9. Causal Mask（因果掩码）在 Prefill 和 Decode 阶段的实现机制有何差异？为什么引入 KV Cache 后 Decode 阶段通常不再需要构造显式的下三角掩码矩阵？

10. 为什么自回归生成无法像 Prefill 一样进行完全的并行矩阵乘法计算？是什么强依赖关系强制了这一串行过程？

11. 在包含残差连接（Residual Connection）和 LayerNorm/RMSNorm 的 Transformer Block 中，写入 KV Cache 的特征是 Norm 之前还是 Norm 之后的数据？为什么？

## 第二部分：数学原理、复杂度推导与显存量化

13. 如果一个模型完全不使用 KV Cache，自回归解码生成 N 个 Token 时，其累积时间复杂度是多少？引入 KV Cache 之后又是多少？请说明复杂度变化的数学原因。

14. 为什么在推导无 Cache 累积计算量时，总复杂度呈现二次方效应 O(N²·d)？其数学本质是单步内的加法还是跨步的累加？请写出等差数列求和推导过程。

15. 自回归生成如果不做 Cache，累积计算量是按等差数列求和得到 O(N²) 的；那么为什么说引入 KV Cache 后单步的矩阵投影开销降为了 O(1)？

16. 请写出带有 KV Cache 的单步 Self-Attention 详细数学递推公式（包括线性投影、矩阵拼接、缩放点积注意力与加权输出）。

17. 请严格计算标准 MHA 在单步 Decode 时的真实 FLOPs，包含 Q,K,V 投影、Attention Score 点积、Softmax 加权以及最后的 W_O 输出投影。

18. 请严格推导单请求、单层、单 Token 的全量 KV Cache 显存占用量公式（以字节 Byte 为单位），涉及参数：层数 L、头数 H、单头维度 d_h、精度字节数 P。

19. 以一个 70B 参数的 LLaMA 模型（80 层，KV 维度 8192，FP16 存储）为例，若批大小（Batch Size）为 16，上下文序列长度为 8192，请精确计算仅 KV Cache 所需的显存总量（以 GB 为单位）。

20. 在标准多头注意力（MHA）中，将单头注意力拆分为 H 个头后，总的矩阵投影计算量（FLOPs）是否放大了 H 倍？请给出详细的数学推导。

21. 为什么说在相同的隐藏层维度 d 下，单头注意力（Single-Head）与多头注意力（MHA）的线性投影计算量（FLOPs）严格相等？请给出矩阵乘法维度的数学等价性证明。

22. 从 Roofline Model（算力-带宽模型）角度分析，为什么 Decode 阶段通常处于 Memory Bandwidth Bound（显存带宽受限），而 Prefill 阶段通常处于 Compute Bound（算力受限）？

23. 算术强度（Operational Intensity, FLOPs/Byte）在 Decode 阶段是如何随着 Batch Size 和序列长度 S 变化的？

24. 假设显卡显存带宽为 1.5 TB/s，算力为 300 TFLOPS，在 Batch Size=1、序列长度 S=2048 的 Decode 阶段，计算该步的算术强度（FLOPs/Byte），并结合 Roofline 模型判断此时 GPU 算力利用率（MFU）大约是多少？

25. 设模型参数量为 P，全量 KV Cache 占用为 M_kv。在 Decode 单步中，读取权重参数与读取 KV Cache 对带宽的消耗比例是如何随 Batch Size 发生变化的？

26. 如果将 KV Cache 的存储精度从 FP16（2 Bytes）降低到 FP8（1 Byte）或 INT4（0.5 Byte），在算力不变的前提下，理论上 Decode 阶段的单步时延能提升多少倍？受什么非线性因素制约？

## 第三部分：注意力架构演进与结构级压缩

27. 简述 Multi-Query Attention (MQA) 的核心设计，并说明为何在相同隐藏维度 d 下，MHA 的 KV 存储开销恰好是 MQA 的 H 倍？

28. Grouped-Query Attention (GQA) 是如何在模型表达能力（Accuracy）与 KV Cache 压缩比之间做折中的？它的显存占用公式与 MHA 的比值是多少？

## 第四部分：显存管理与系统级调度（工程）

29. 传统深度学习框架（如原生 PyTorch Tensor）在管理动态增长的 KV Cache 时，会遇到哪些严重的显存碎片化问题（内碎片与外碎片）？

30. 详述 PagedAttention（vLLM）的核心设计思想，它是如何借鉴操作系统虚拟内存分页机制来消除显存碎片的？

31. 什么是预填与解码解耦架构（Disaggregated Prefill/Decode，如 Mooncake / Splitwise）？为什么要在物理节点上将 Prefill 和 Decode 拆开？中间的 KV Cache 是如何传输的？

## 第五部分：服务性能指标、稳定性与优化落地

32. 在评估大模型服务（Serving）性能时，KV Cache 的管理效率直接影响哪三个核心指标（TTFT、TPOT/ITL、Throughput）？请说明内在关联。

33. 当推理集群遭遇超大并发导致 GPU 显存完全耗尽（KV Cache OOM）时，工业界推理引擎常见的主动防御 / 降级调度策略有哪些（如抢占 Preemption、重新计算 Recompute）？

34. 对 KV Cache 进行 INT8/INT4/FP8 低比特量化时，Key Cache 和 Value Cache 在数值分布特性（如 Outliers/通道异常值）上有何差异？通常采用哪种量化粒度（Per-token / Per-channel / Group-wise）？

35. 在通信信号或时间序列模型（如基于 Cross-Attention 的信道估计 / 波束预测变体模型）中，输入序列较短，为什么使用 KV Cache 的首要目的不是“省显存”？
