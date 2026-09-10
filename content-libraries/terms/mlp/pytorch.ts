export const structureCode = `import torch
from torch import nn

# Sequential 按书写顺序连接各层；输出会自动传给下一层
model = nn.Sequential(
    nn.Linear(2, 2),  # model[0]：隐藏层 1 的 A、B，2 个输入 → 2 个结果
    nn.ReLU(),       # model[1]：得到 hA、hB
    nn.Linear(2, 2),  # model[2]：隐藏层 2 的 C、D，接收 hA、hB
    nn.ReLU(),       # model[3]：得到 hC、hD
    nn.Linear(2, 1),  # model[4]：输出层，合成一个数值 y
)

# 一个样本有 2 个特征，形状为 [1, 2]
x = torch.tensor([[1.0, 2.0]])
with torch.no_grad():  # 这里只运行前向过程，不做训练
    y = model(x)
print(y.shape)        # torch.Size([1, 1])：一个样本，一个预测值`;

export const reproduceCode = `# 接着上面的代码运行：设置图中各个 Linear 的权重与偏置
with torch.no_grad():
    model[0].weight.copy_(torch.tensor([[1., 1.], [1., -1.]]))
    model[0].bias.copy_(torch.tensor([-1., 0.]))
    model[2].weight.copy_(torch.tensor([[1., 2.], [2., -1.]]))
    model[2].bias.copy_(torch.tensor([-1., 0.]))
    model[4].weight.copy_(torch.tensor([[0.5, 0.5]]))
    model[4].bias.zero_()

    # 分段运行同一个模型，核对两个隐藏层与最终输出
    h1 = model[:2](x)    # Linear → ReLU
    h2 = model[2:4](h1)  # Linear → ReLU
    y = model[4](h2)     # 最后一层 Linear

print(h1)  # tensor([[2., 0.]])
print(h2)  # tensor([[1., 4.]])
print(y)   # tensor([[2.5000]])`;
