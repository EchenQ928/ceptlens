export const structureCode = `import torch
from torch import nn

# 3 个输入特征 → 2 个输出；默认包含 2 个偏置
linear = nn.Linear(in_features=3, out_features=2)
relu = nn.ReLU()  # 对全连接的结果逐个做激活

# 一行是一个样本：形状 [样本数, 输入特征数] = [1, 3]
x = torch.tensor([[1.0, 2.0, 3.0]])
with torch.no_grad():  # 只演示前向计算，不记录用于训练的梯度
    z = linear(x)     # 全连接，输出形状 [1, 2]
    h = relu(z)       # 负数归零，形状仍为 [1, 2]

print(z.shape)        # torch.Size([1, 2])
print(linear.weight.shape)  # torch.Size([2, 3])：2 个单元，各 3 个权重
print(linear.bias.shape)    # torch.Size([2])：每个单元 1 个偏置`;

export const reproduceCode = `# 接着上面的代码运行：把随机初值替换为图中的固定参数
with torch.no_grad():
    linear.weight.copy_(torch.tensor([
        [ 0.7, -0.4, -0.2],  # 单元 A
        [-0.3,  0.8,  0.5],  # 单元 B
    ]))
    linear.bias.copy_(torch.tensor([0.1, -0.2]))
    z = linear(x)
    h = relu(z)

print(z)  # tensor([[-0.6000,  2.6000]])
print(h)  # tensor([[0.0000, 2.6000]])`;
