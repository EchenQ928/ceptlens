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
