export const denseExample = {
  inputs: [1, 2, 3],
  units: [
    { id: 'A', weights: [0.7, -0.4, -0.2], bias: 0.1 },
    { id: 'B', weights: [-0.3, 0.8, 0.5], bias: -0.2 }
  ]
};

export const units = denseExample.units.map(unit => {
  const products = denseExample.inputs.map((input, i) => input * unit.weights[i]);
  return { ...unit, products, sum: products.reduce((sum, product) => sum + product, 0) + unit.bias };
});
