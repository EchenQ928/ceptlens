export const trainingCode = `import torch

# 先看一个参数：requires_grad=True 让框架追踪它参与的计算
x = torch.tensor(2.0)
w = torch.tensor(3.0, requires_grad=True)
y_hat = w * x
loss = (y_hat - 10) ** 2
loss.backward()
print(w.grad)                 # dL/dw

# 放回真实神经网络训练循环
x = torch.tensor([[2.0]])
y = torch.tensor([[3.0]])
model = torch.nn.Linear(1, 1)
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)

optimizer.zero_grad()         # 清空上一轮梯度
y_hat = model(x)              # 前向计算
loss = (y_hat - y).square().mean()
loss.backward()               # 只负责计算梯度
optimizer.step()              # 使用梯度更新参数

for parameter in model.parameters():
    print(parameter.grad)`;
