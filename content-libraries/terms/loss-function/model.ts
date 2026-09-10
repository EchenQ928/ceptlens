export const fmt = (value: number, digits = 3) => String(Number(value.toFixed(digits))).replace('-', '−');
export function regressionExample(prediction: number) {
  const predictions = [prediction, 3, 5];
  const errors = predictions.map(p => p - 3);
  const absolute = errors.map(Math.abs);
  const squared = errors.map(e => e * e);
  const squaredGradients = errors.map(e => 2 * e);
  return { predictions, errors, absolute, squared, squaredGradients, mae: absolute.reduce((a,b)=>a+b,0)/3, mse: squared.reduce((a,b)=>a+b,0)/3 };
}
export function classificationExample(probability: number) {
  return { probabilities: [probability, (1-probability)*0.6, (1-probability)*0.4], loss: -Math.log(probability) };
}
