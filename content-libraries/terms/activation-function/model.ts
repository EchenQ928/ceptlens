export const formatNumber = (value: number) => String(Number(value.toFixed(3))).replace('-', '−');
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
export interface Activation {
  id: string; name: string; description: string; range: string;
  evaluate: (z: number) => number; yMin: number; yMax: number; ticks: number[];
  formula: string;
}
export const activations: Activation[] = [
  { id:'relu', name:'ReLU', description:'负数归零，正数保持原值。曲线在 0 处从水平转为上升。', range:'输出不小于 0', evaluate:z=>Math.max(0,z), yMin:-0.6,yMax:4.5,ticks:[0,2,4], formula:String.raw`f(z)=\max(0,z)` },
  { id:'leaky-relu', name:'Leaky ReLU', description:'正数保持原值，负数按较小比例保留。本例把负数乘以 0.1。', range:'本例负半轴斜率为 0.1', evaluate:z=>z>=0?z:0.1*z, yMin:-0.6,yMax:4.5,ticks:[0,2,4], formula:String.raw`f(z)=\begin{cases}z,&z\geq0\\0.1z,&z<0\end{cases}` },
  { id:'sigmoid', name:'Sigmoid', description:'把数值压到 0 与 1 之间。输入为 0 时输出 0.5，两端逐渐变平。', range:'输出范围 (0, 1)', evaluate:sigmoid, yMin:-0.15,yMax:1.15,ticks:[0,0.5,1], formula:String.raw`f(z)=\frac{1}{1+e^{-z}}` },
  { id:'tanh', name:'Tanh', description:'把数值压到 −1 与 1 之间，保留正负方向。输入为 0 时输出 0。', range:'输出范围 (−1, 1)', evaluate:Math.tanh, yMin:-1.3,yMax:1.3,ticks:[-1,0,1], formula:String.raw`f(z)=\frac{e^z-e^{-z}}{e^z+e^{-z}}` },
  { id:'gelu', name:'GELU', description:'平滑地保留部分负值。输入足够大时基本保留；向负方向远离 0 时，输出又接近 0。', range:'图中采用 tanh 近似', evaluate:z=>0.5*z*(1+Math.tanh(Math.sqrt(2/Math.PI)*(z+0.044715*z**3))), yMin:-0.6,yMax:4.5,ticks:[0,2,4], formula:String.raw`f(z)\approx\frac{z}{2}\left[1+\tanh\!\left(\sqrt{\frac{2}{\pi}}(z+0.044715z^3)\right)\right]` },
  { id:'silu', name:'SiLU', description:'用 Sigmoid 的结果作为比例，再乘回输入。变化平滑，也会保留部分负值。', range:'正输入较大时，输出接近输入', evaluate:z=>z*sigmoid(z), yMin:-0.6,yMax:4.5,ticks:[0,2,4], formula:String.raw`f(z)=z\cdot\operatorname{Sigmoid}(z)` },
];
