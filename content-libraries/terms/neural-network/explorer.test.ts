import { describe, expect, it } from "vitest";
import { calculateMlpExample } from "./explorer";

describe("small MLP forward calculation", () => {
  it("matches a hand calculation including a negative value clipped to zero", () => {
    expect(calculateMlpExample()).toEqual({input: [1, 2], hiddenPreActivation: [2, -1], hidden: [2, 0], output: 1});
  });
  it("propagates a changed input through both hidden units", () => {
    expect(calculateMlpExample(3)).toEqual({input: [3, 2], hiddenPreActivation: [4, 1], hidden: [4, 1], output: 2.5});
    expect(calculateMlpExample()).toHaveProperty("output", 1);
  });
  it("changes its response rate at the ReLU boundary", () => {
    const below = calculateMlpExample(1.5), boundary = calculateMlpExample(2), above = calculateMlpExample(2.5);
    expect(boundary.hidden[1]).toBe(0);
    expect(boundary.output - below.output).toBe(0.25);
    expect(above.output - boundary.output).toBe(0.5);
    expect(calculateMlpExample(0).output).toBe(0.5);
  });
});
