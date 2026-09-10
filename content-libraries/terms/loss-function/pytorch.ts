export const regressionCode = `import torch
from torch import nn

# 对应数值示例的初始状态：三个样本，每个样本预测一个数
prediction = torch.tensor([1.0, 3.0, 5.0])
target = torch.tensor([3.0, 3.0, 3.0])

mae = nn.L1Loss()(prediction, target)   # 取绝对值，再求平均
mse = nn.MSELoss()(prediction, target)  # 平方，再求平均
print(round(mae.item(), 3))  # 1.333
print(round(mse.item(), 3))  # 2.667`;

export const classificationCode = `# 接着上面的 import 运行；类别顺序为：猫、狗、鸟
probabilities = torch.tensor([[0.60, 0.24, 0.16]])

# 为复现图中概率，取对数构造一组演示分数
logits = probabilities.log()
target_class = torch.tensor([0])  # 正确类别“猫”的下标为 0

# CrossEntropyLoss 接收原始分数，内部完成 log_softmax
# 实际模型直接提供 logits，无需先算概率再取对数
loss = nn.CrossEntropyLoss()(logits, target_class)
print(round(loss.item(), 3))  # 0.511`;
