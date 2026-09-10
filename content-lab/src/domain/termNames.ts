import type { Locale } from "./content";

const ENGLISH_TERM_NAMES: Record<string, string> = {
  "activation-function": "Activation function",
  "attention-mechanism": "Attention mechanism",
  "autoregressive-generation": "Autoregressive generation",
  "autoregressive-inference": "Autoregressive inference",
  "autoregressive-model": "Autoregressive model",
  backpropagation: "Backpropagation",
  "batch-gradient-descent": "Batch gradient descent",
  "batch-normalization": "Batch normalization",
  "calibration-set": "Calibration set",
  "causal-mask": "Causal mask",
  classification: "Classification",
  cnn: "CNN",
  compiler: "Compiler",
  "conv-bn-folding": "Conv + BN folding",
  convolution: "Convolution",
  "convolution-kernel": "Convolution kernel",
  "cross-entropy-loss": "Cross-entropy loss",
  "data-augmentation": "Data augmentation",
  "data-leakage": "Data leakage",
  "data-quality": "Data quality",
  decoder: "Decoder",
  "decoder-only": "Decoder-only architecture",
  "depthwise-convolution": "Depthwise convolution",
  "depthwise-separable-convolution": "Depthwise separable convolution",
  dropout: "Dropout",
  embedding: "Embedding",
  encoder: "Encoder",
  "forward-propagation": "Forward propagation",
  "fully-connected-layer": "Fully connected layer",
  generalization: "Generalization",
  gradient: "Gradient",
  "gradient-clipping": "Gradient clipping",
  "gradient-descent": "Gradient descent",
  "gradient-explosion": "Exploding gradients",
  "gradient-vanishing": "Vanishing gradients",
  "hidden-layer": "Hidden layer",
  "identity-mapping": "Identity mapping",
  inference: "Inference",
  "intermediate-activation": "Intermediate activation",
  "kv-cache": "KV Cache",
  "layer-normalization": "LayerNorm",
  "learning-rate": "Learning rate",
  "learning-rate-warmup": "Learning-rate warmup",
  "linear-model": "Linear model",
  logits: "Logits",
  "long-range-dependency": "Long-range dependency",
  "loss-function": "Loss function",
  "memory-bandwidth": "Memory bandwidth",
  "mini-batch": "Mini-batch",
  mlm: "Masked language modeling",
  mlp: "Multilayer perceptron (MLP)",
  mobilenet: "MobileNet",
  "model-parameter": "Model parameter",
  momentum: "Momentum",
  "multi-head-attention": "Multi-head attention",
  "neural-network": "Neural network",
  "numerical-precision": "Numerical precision",
  "operator-workspace": "Operator workspace",
  optimizer: "Optimizer",
  outlier: "Outlier",
  "output-layer": "Output layer",
  overfitting: "Overfitting",
  "parameter-sharing": "Parameter sharing",
  pooling: "Pooling",
  "pointwise-convolution": "Pointwise convolution",
  "position-wise-ffn": "Position-wise feed-forward network",
  "positional-encoding": "Positional encoding",
  "prefill-decode": "Prefill and Decode",
  pretraining: "Pretraining",
  "probability-distribution": "Probability distribution",
  "qkv-projection": "QKV projection",
  quantization: "Model quantization",
  "quantization-scale": "Quantization scale",
  "receptive-field": "Receptive field",
  regression: "Regression",
  regularization: "Regularization",
  "representation-learning": "Representation learning",
  "residual-connection": "Residual connection",
  resnet: "ResNet",
  rnn: "RNN",
  rope: "RoPE",
  runtime: "Runtime",
  "runtime-peak-memory": "Runtime peak memory",
  "self-attention": "Self-attention",
  "self-supervised-learning": "Self-supervised learning",
  sgd: "SGD",
  smoothquant: "SmoothQuant",
  softmax: "Softmax",
  "standard-convolution": "Standard convolution",
  tensor: "Tensor",
  "test-set": "Test set",
  token: "Token",
  "training-set": "Training set",
  transformer: "Transformer",
  "transformer-architecture-families": "Transformer architecture family",
  "transformer-block": "Transformer Block",
  "translation-equivariance": "Translation equivariance",
  underfitting: "Underfitting",
  "validation-set": "Validation set"
};

function containsChinese(value: string): boolean {
  return /[\u3400-\u9fff]/u.test(value);
}

function humanizeTermId(id: string): string {
  return id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function termDisplayName(id: string, fallback: string, locale: Locale): string {
  if (locale === "zh-CN") return fallback;
  if (fallback.trim() && !containsChinese(fallback)) return fallback;
  return ENGLISH_TERM_NAMES[id] ?? humanizeTermId(id);
}

export function dependencyReason(reason: string, locale: Locale): string {
  if (locale === "zh-CN") return reason;
  if (!containsChinese(reason)) return reason;
  if (reason.includes("显式引用")) return "Explicitly referenced by project content; add or reuse the corresponding teaching package.";
  if (reason.includes("阅读前置")) return "Declared as a reading prerequisite; add the complete teaching package before publishing.";
  return "Referenced by project content; add or reuse the corresponding teaching package.";
}
