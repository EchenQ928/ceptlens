import { ProductIcon, type ProductIconKind } from "./ProductIcon";

export function conceptTone(id: string) {
  if (/cache|memory|set|quantization/.test(id)) return "teal";
  if (/attention|qkv|transformer|encoding/.test(id)) return "violet";
  if (/loss|softmax|normal|regularization|overfitting|activation/.test(id)) return "amber";
  return "blue";
}

export function ConceptSymbol({ id }: { id: string }) {
  let kind: ProductIconKind = "concepts";
  if (/cache|memory|set/.test(id)) kind = "cache";
  else if (/convolution|quantization|encoding/.test(id)) kind = "matrix";
  else if (/mlp|layer|transformer|ffn/.test(id)) kind = "layers";
  else if (/residual|backpropagation|folding|qkv/.test(id)) kind = "branch";
  else if (/loss|overfitting/.test(id)) kind = "target";
  else if (/softmax|activation|regularization|dropout/.test(id)) kind = "wave";
  return <span className="concept-symbol"><ProductIcon kind={kind}/></span>;
}
