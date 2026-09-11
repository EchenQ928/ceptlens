import { Activity, ArrowLeftRight, Binary, Boxes, Database, GitMerge, Grid2X2, Layers, Network, ScanEye, Shuffle, SlidersHorizontal, Target } from "lucide-react";

export function conceptTone(id: string) {
  if (/cache|memory|set|quantization/.test(id)) return "teal";
  if (/attention|qkv|transformer|encoding/.test(id)) return "violet";
  if (/loss|softmax|normal|regularization|overfitting|activation/.test(id)) return "amber";
  return "blue";
}

export function ConceptSymbol({ id }: { id: string }) {
  const icons: Record<string, typeof Network> = {
    "residual-connection": GitMerge, "mlp": Layers, "multi-head-attention": ScanEye,
    "backpropagation": ArrowLeftRight, "overfitting": Target, "activation-function": Activity,
    "convolution": Grid2X2, "quantization": Binary, "fully-connected-layer": Network,
    "depthwise-separable-convolution": Grid2X2, "neural-network": Network, "loss-function": Target,
    "positional-encoding": Binary, "training-set": Database, "validation-set": Database,
    "runtime-peak-memory": Database, "regularization": SlidersHorizontal, "position-wise-ffn": Layers,
    "self-attention": ScanEye, "conv-bn-folding": GitMerge, "dropout": Shuffle,
    "kv-cache": Database, "layer-normalization": SlidersHorizontal, "qkv-projection": GitMerge,
    "softmax": Activity, "transformer": Boxes, "transformer-block": Layers
  };
  const Icon = icons[id] ?? Network;
  return <span className="concept-symbol" aria-hidden="true"><Icon size={25}/></span>;
}
