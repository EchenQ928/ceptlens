export const activationCode = `import torch
from torch import nn

# 同一组输入：负数、零、正数；各函数分别处理这三个数
z = torch.tensor([-1.0, 0.0, 2.0])
activations = {
    "ReLU": nn.ReLU(),
    "Leaky ReLU": nn.LeakyReLU(negative_slope=0.1),
    "Sigmoid": nn.Sigmoid(),
    "Tanh": nn.Tanh(),
    "GELU": nn.GELU(approximate="tanh"),  # 与图中的近似方式一致
    "SiLU": nn.SiLU(),
}

for name, activation in activations.items():
    h = activation(z)  # 每次都用原始 z，各函数相互独立
    print(name, [round(value, 3) for value in h.tolist()])

# ReLU       [0.0, 0.0, 2.0]
# Leaky ReLU [-0.1, 0.0, 2.0]
# Sigmoid    [0.269, 0.5, 0.881]
# Tanh       [-0.762, 0.0, 0.964]
# GELU       [-0.159, 0.0, 1.955]
# SiLU       [-0.269, 0.0, 1.762]`;
