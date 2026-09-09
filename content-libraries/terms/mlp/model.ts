export const example = {
  input: [1, 2],
  layers: [
    { ids: ['A', 'B'], weights: [[1, 1], [1, -1]], biases: [-1, 0], relu: true },
    { ids: ['C', 'D'], weights: [[1, 2], [2, -1]], biases: [-1, 0], relu: true },
    { ids: ['out'], weights: [[0.5, 0.5]], biases: [0], relu: false }
  ]
};
export function calculateExample() {
  let values = example.input;
  let names = ['x₁', 'x₂'];
  return example.layers.map((layer, layerIndex) => {
    const nodes = layer.ids.map((id, i) => {
      const products = values.map((value, j) => value * layer.weights[i][j]);
      const sum = products.reduce((a, b) => a + b, 0) + layer.biases[i];
      return { id, layerIndex, inputs: [...values], inputNames: [...names], weights: layer.weights[i], bias: layer.biases[i], products, sum, value: layer.relu ? Math.max(0, sum) : sum, relu: layer.relu, outputName: id === 'out' ? 'y' : `h${id}` };
    });
    values = nodes.map(node => node.value);
    names = nodes.map(node => node.outputName);
    return nodes;
  });
}
export const layers = calculateExample();
