import { expect, it } from 'vitest';
import { calculateExample, example } from './model';

it('passes the previous layer outputs to every unit in the next layer', () => {
  const layers = calculateExample();
  expect(layers.map(layer => layer.map(node => node.value))).toEqual([[2, 0], [1, 4], [2.5]]);
  expect(layers[0].map(node => node.sum)).toEqual([2, -1]);
  expect(layers[1].map(node => node.inputs)).toEqual([[2, 0], [2, 0]]);
  expect(layers[2][0].inputs).toEqual([1, 4]);
  expect(example.layers.reduce((total, layer) => total + layer.weights.flat().length + layer.biases.length, 0)).toBe(15);
});
