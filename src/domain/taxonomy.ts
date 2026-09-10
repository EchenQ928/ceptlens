import type { Locale } from "./content";

export const MODEL_FAMILIES = [
  "G0 通用/跨模型",
  "G1 MLP与基础神经网络",
  "G2 CNN",
  "G3 RNN、LSTM、GRU与时序网络",
  "G4 Transformer与Attention",
  "G5 GNN",
  "G6 生成模型：AE、VAE、GAN、Diffusion",
  "G7 多模态模型",
  "G8 传统机器学习与表示学习",
  "G9 SSM等新型序列架构"
] as const;

export const LEARNING_LEVELS = ["L0 通用基础", "L1 技术栈基础", "L2 分支深入", "L3 深层专业"] as const;

export const ENGINEERING_STAGES = [
  "E0 基础机制与模型计算",
  "E1 问题定义与指标",
  "E2 数据与输入表示",
  "E3 架构选型与整体设计",
  "E4 模块与算子设计",
  "E5 训练目标与训练过程",
  "E6 训练稳定性与调优",
  "E7 评测、实验与问题诊断",
  "E8 压缩与轻量化",
  "E9 推理与运行时优化",
  "E10 编译、算子与内核",
  "E11 硬件部署与性能分析",
  "E12 应用系统"
] as const;

export function withoutCode(value: string) {
  return value.replace(/^[A-Z]\d+\s*/, "");
}

const ENGLISH_LABELS: Record<string, string> = {
  "G0 通用/跨模型": "G0 General / cross-model",
  "G1 MLP与基础神经网络": "G1 MLP and foundational neural networks",
  "G2 CNN": "G2 CNN",
  "G3 RNN、LSTM、GRU与时序网络": "G3 RNN, LSTM, GRU, and temporal networks",
  "G4 Transformer与Attention": "G4 Transformers and attention",
  "G5 GNN": "G5 GNN",
  "G6 生成模型：AE、VAE、GAN、Diffusion": "G6 Generative models: AE, VAE, GAN, and diffusion",
  "G7 多模态模型": "G7 Multimodal models",
  "G8 传统机器学习与表示学习": "G8 Classical machine learning and representation learning",
  "G9 SSM等新型序列架构": "G9 SSMs and other emerging sequence architectures",
  "L0 通用基础": "L0 General foundations",
  "L1 技术栈基础": "L1 Technical foundations",
  "L2 分支深入": "L2 Branch specialization",
  "L3 深层专业": "L3 Advanced specialization",
  "E0 基础机制与模型计算": "E0 Foundational mechanisms and model computation",
  "E1 问题定义与指标": "E1 Problem definition and metrics",
  "E2 数据与输入表示": "E2 Data and input representation",
  "E3 架构选型与整体设计": "E3 Architecture selection and system design",
  "E4 模块与算子设计": "E4 Module and operator design",
  "E5 训练目标与训练过程": "E5 Training objectives and process",
  "E6 训练稳定性与调优": "E6 Training stability and tuning",
  "E7 评测、实验与问题诊断": "E7 Evaluation, experiments, and diagnosis",
  "E8 压缩与轻量化": "E8 Compression and efficiency",
  "E9 推理与运行时优化": "E9 Inference and runtime optimization",
  "E10 编译、算子与内核": "E10 Compilation, operators, and kernels",
  "E11 硬件部署与性能分析": "E11 Hardware deployment and performance analysis",
  "E12 应用系统": "E12 Application systems",
  "数据评测": "Data evaluation",
  "架构模块": "Architecture modules",
  "序列建模": "Sequence modeling",
  "学习机制": "Learning mechanisms",
  "训练系统": "Training systems",
  "回归": "Regression",
  "分类": "Classification",
  "精度": "Accuracy",
  "稳定性": "Stability",
  "参数量": "Parameter count",
  "推理系统": "Inference systems",
  "高效模型": "Efficient models",
  "生成": "Generation",
  "编译硬件": "Compilation and hardware",
  "性能分析": "Performance analysis",
  "数学与数值": "Mathematics and numerics",
  "张量与模型计算": "Tensors and model computation",
  "峰值内存": "Peak memory",
  "带宽": "Bandwidth",
  "数值精度": "Numerical precision",
  "显存": "Device memory",
  "显存带宽": "Memory bandwidth",
  "泛化": "Generalization",
  "时延": "Latency",
  "吞吐": "Throughput",
  "MACs": "MACs",
  "端侧/嵌入式": "On-device / embedded",
  "自回归生成": "Autoregressive generation",
  "硬件无关": "Hardware-agnostic",
  "Decode": "Decode",
  "Prefill": "Prefill"
};

export function taxonomyText(value: string, locale: Locale): string {
  return locale === "en-US" ? ENGLISH_LABELS[value] ?? value : value;
}
