export type Parameters = { w1: number; w2: number; b: number; v: number; c: number };
export type Gradients = { w1: number; w2: number; b: number; v: number; c: number };

export const initial: Parameters = { w1: 1, w2: 0.5, b: 0.5, v: 1, c: -1 };
export const inputs = { x1: 2, x2: 1 } as const;
export const target = 3;

export function evaluate(params: Parameters, x = inputs, y = target) {
  const a = params.w1 * x.x1 + params.w2 * x.x2 + params.b;
  const h = Math.max(0, a);
  const prediction = params.v * h + params.c;
  const loss = (prediction - y) ** 2;
  const dPrediction = 2 * (prediction - y);
  const dH = dPrediction * params.v;
  const dA = dH * (a > 0 ? 1 : 0);
  const gradients: Gradients = {
    w1: dA * x.x1,
    w2: dA * x.x2,
    b: dA,
    v: dPrediction * h,
    c: dPrediction,
  };
  return { a, h, prediction, loss, dPrediction, dH, dA, gradients };
}

export const example = evaluate(initial);
export const parameterKeys = ["w1", "w2", "b", "v", "c"] as const;
export const formatValue = (value: number, digits = 3) => String(Number(value.toFixed(digits))).replace("-", "−");

export function parameterUpdate(params: Parameters, learningRate: number): Parameters {
  const gradients = evaluate(params).gradients;
  return {
    w1: params.w1 - learningRate * gradients.w1,
    w2: params.w2 - learningRate * gradients.w2,
    b: params.b - learningRate * gradients.b,
    v: params.v - learningRate * gradients.v,
    c: params.c - learningRate * gradients.c,
  };
}
