import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const zh = "zh-CN";
const en = "en-US";
const localized = (zhText, enText) => ({ [zh]: zhText, [en]: enText });

const taxonomy = {
  "G0 通用/跨模型": "G0 General / cross-model",
  "G1 MLP与基础神经网络": "G1 MLP and foundational neural networks",
  "G2 CNN": "G2 CNN",
  "G3 RNN、LSTM、GRU与时序网络": "G3 RNN, LSTM, GRU, and temporal networks",
  "G4 Transformer与Attention": "G4 Transformers and attention",
  "G5 GNN": "G5 GNN",
  "G6 生成模型：AE、VAE、GAN、Diffusion": "G6 Generative models: AE, VAE, GAN, and diffusion",
  "G7 多模态模型": "G7 Multimodal models",
  "G8 传统机器学习与表示学习": "G8 Classical machine learning and representation learning",
  "G9 SSM等新型序列架构": "G9 SSMs and other emerging sequence architectures",
  "数据评测": "Data evaluation",
  "架构模块": "Architecture modules",
  "序列建模": "Sequence modeling",
  "学习机制": "Learning mechanisms",
  "训练系统": "Training systems",
  "回归": "Regression",
  "分类": "Classification",
  "精度": "Accuracy",
  "稳定性": "Stability",
  "参数量": "Parameter count",
  "推理系统": "Inference systems",
  "高效模型": "Efficient models",
  "生成": "Generation",
  "编译硬件": "Compilation and hardware",
  "性能分析": "Performance analysis",
  "数学与数值": "Mathematics and numerics",
  "张量与模型计算": "Tensors and model computation",
  "峰值内存": "Peak memory",
  "带宽": "Bandwidth",
  "数值精度": "Numerical precision",
  "显存": "Device memory",
  "显存带宽": "Memory bandwidth",
  "泛化": "Generalization",
  "时延": "Latency",
  "吞吐": "Throughput",
  "MACs": "MACs",
  "端侧/嵌入式": "On-device / embedded",
  "自回归生成": "Autoregressive generation",
  "硬件无关": "Hardware-agnostic",
  "Decode": "Decode",
  "Prefill": "Prefill"
};

const stage = {
  "E0 基础机制与模型计算": "E0 Foundational mechanisms and model computation",
  "E1 问题定义与指标": "E1 Problem definition and metrics",
  "E2 数据与输入表示": "E2 Data and input representation",
  "E3 架构选型与整体设计": "E3 Architecture selection and system design",
  "E4 模块与算子设计": "E4 Module and operator design",
  "E5 训练目标与训练过程": "E5 Training objectives and process",
  "E6 训练稳定性与调优": "E6 Training stability and tuning",
  "E7 评测、实验与问题诊断": "E7 Evaluation, experiments, and diagnosis",
  "E8 压缩与轻量化": "E8 Compression and efficiency",
  "E9 推理与运行时优化": "E9 Inference and runtime optimization",
  "E10 编译、算子与内核": "E10 Compilation, operators, and kernels",
  "E11 硬件部署与性能分析": "E11 Hardware deployment and performance analysis",
  "E12 应用系统": "E12 Application systems"
};

const levels = {
  "L0 通用基础": "L0 General foundations",
  "L1 技术栈基础": "L1 Technical foundations",
  "L2 分支深入": "L2 Branch specialization",
  "L3 深层专业": "L3 Advanced specialization"
};

const questions = {
  "HW-AI-20260603-P4996-Q18": {
    stem: "Before data analysis, [[term:data-quality|data quality]] should be assessed to ensure reliable results. Which aspects are typically checked in a data-quality assessment?",
    explanation: "[[term:data-quality|Data quality]] is typically assessed in terms of consistency, completeness, accuracy, and timeliness.",
    concept: "Data quality assessment dimensions",
    options: {
      A: "Consistency (whether the data is contradictory)",
      B: "Completeness (whether values are missing)",
      C: "Accuracy (whether the data is correct)",
      D: "Timeliness (whether the data is updated in time)"
    }
  },
  "HW-AI-20260304-P4570-Q18": {
    stem: "In common [[term:neural-network|neural-network]] architectures, which of the following can all serve as reusable structures or computational modules? (Select all that apply)",
    explanation: "A, B, C, and D are all correct. They serve different roles: Batch Norm normalizes intermediate features and helps stabilize training; a Fully Connected Layer learns a linear combination of all input features; Attention computes weights from the input and aggregates information; Convolution uses shared kernels to extract local patterns. All are reusable modules, although a specific model may not contain all four.",
    concept: "Common neural-network modules and their basic roles",
    options: {
      A: "[[term:batch-normalization|Batch normalization (Batch Norm)]]",
      B: "[[term:fully-connected-layer|Fully connected layer (Fully Connected Layer)]]",
      C: "[[term:attention-mechanism|Attention mechanism (Attention)]]",
      D: "[[term:convolution|Convolution layer (Convolution)]]"
    }
  },
  "HW-AI-20260724-P5183-Q08": {
    stem: "In the typical structure of a [[term:neural-network|deep neural network]], what is the main role of a **[[term:hidden-layer|hidden layer]]**?",
    explanation: "A [[term:hidden-layer|hidden layer]] uses weights, biases, and [[term:activation-function|activation functions]] to extract complex features from data layer by layer.",
    concept: "Nonlinear feature representation learning in hidden layers",
    options: {
      A: "It displays the model's final prediction, such as a class label or regression value.",
      B: "It receives raw external input and passes it directly to the [[term:output-layer|output layer]].",
      C: "It automatically extracts and constructs higher-level feature representations through multiple nonlinear transformations.",
      D: "It stores [[term:loss-function|loss]] values from training so that the direction of the [[term:gradient|gradient]] can be computed."
    }
  },
  "HW-AI-20260513-P4937-Q11": {
    stem: "The main purpose of an [[term:activation-function|activation function]] is to",
    explanation: "The core role of an [[term:activation-function|activation function]] is to introduce nonlinearity, allowing a neural network to fit complex functions.",
    concept: "Activation functions introduce nonlinearity",
    options: {
      A: "Speed up training",
      B: "Improve model accuracy",
      C: "Increase the number of model parameters",
      D: "Introduce nonlinearity"
    }
  },
  "HW-AI-20260415-P4778-Q15": {
    stem: "Compared with a [[term:linear-model|linear model]], the advantage of a [[term:neural-network|neural network]] is that it",
    explanation: "With the help of [[term:activation-function|activation functions]], a [[term:neural-network|neural network]] can fit complex nonlinear relationships and has greater expressive power than a [[term:linear-model|linear model]].",
    concept: "Nonlinear representation capacity of neural networks",
    options: {
      A: "Uses fewer parameters",
      B: "Does not need [[term:activation-function|activation functions]]",
      C: "Has simpler computation",
      D: "Can learn nonlinear relationships"
    }
  },
  "HW-AI-20260617-P5119-Q01": {
    stem: "When using a [[term:mlp|multilayer perceptron (MLP)]] to predict monthly rainfall, which [[term:activation-function|activation function]] is recommended for the output layer?",
    explanation: "Rainfall prediction is a [[term:regression|regression task]]. The [[term:output-layer|output layer]] typically uses a linear output, meaning no activation function is applied.",
    concept: "Choosing the output activation for regression",
    options: {
      A: "ReLU",
      B: "Tanh",
      C: "Sigmoid",
      D: "Use no activation function"
    }
  },
  "HW-AI-20260204-P4567-Q06": {
    stem: "In a classification task, what does the [[term:softmax|Softmax function]] do?",
    explanation: "The [[term:softmax|Softmax function]] converts the neural network's raw outputs ([[term:logits|logits]]) into a [[term:probability-distribution|probability distribution]]. Each class probability lies between 0 and 1, all class probabilities sum to 1, and the result is suitable for [[term:classification|multiclass classification]].",
    concept: "Softmax probability normalization",
    options: {
      A: "Maps inputs to the [-1, 1] interval for activation",
      B: "Converts inputs into log probabilities for cross-entropy loss",
      C: "Limits the output range to prevent exploding gradients",
      D: "Maps inputs to the [0, 1] interval as a [[term:probability-distribution|probability distribution]]"
    }
  },
  "HW-AI-20260617-P5119-Q09": {
    stem: "During machine-learning training, we commonly use [[term:gradient-descent|gradient descent]] to update [[term:model-parameter|model parameters]]. In this process, the role of the [[term:loss-function|loss function]] is to",
    explanation: "[[term:gradient|Gradient]] descent updates model parameters using the gradient of the [[term:loss-function|loss function]].",
    concept: "The loss function as the training objective",
    options: {
      A: "Act as a fixed value that records the total time spent training the model",
      B: "Automatically increase the amount of training data to improve model accuracy",
      C: "Determine the maximum score the model can reach on the test set",
      D: "Serve as the optimization objective; its [[term:gradient|gradient]] with respect to the parameters indicates the update direction"
    }
  },
  "HW-AI-20260121-P4546-Q08": {
    stem: "In deep learning, the [[term:cross-entropy-loss|cross-entropy loss]] is commonly used for",
    explanation: "Cross-entropy loss is a common loss function for [[term:classification|classification]]. It measures the difference between the model's predicted probability distribution and the true label, encouraging the predicted probability of the correct class to approach 1.",
    concept: "Cross-entropy loss",
    options: {
      A: "Increasing model generalization",
      B: "Optimizing the data distribution in unsupervised learning",
      C: "Measuring the difference between predictions and targets in a [[term:regression|regression task]]",
      D: "Measuring the difference between predicted probabilities and true labels in a [[term:classification|classification task]]"
    }
  },
  "HW-AI-20260612-P5110-Q14": {
    stem: "Which statement about [[term:sgd|SGD]] is incorrect?",
    explanation: "[[term:sgd|SGD]] usually computes a gradient from a single example or a small [[term:mini-batch|mini-batch]], not from the entire dataset.",
    concept: "Gradient estimation and updates in stochastic gradient descent",
    options: {
      A: "[[term:sgd|SGD]] may converge relatively slowly",
      B: "[[term:sgd|SGD]] requires a [[term:learning-rate|learning rate]]",
      C: "[[term:sgd|SGD]] computes the gradient using the entire dataset",
      D: "[[term:sgd|SGD]] stands for stochastic gradient descent"
    }
  },
  "HW-AI-20260612-P5110-Q08": {
    stem: "Compared with ordinary [[term:sgd|SGD]], what is the main purpose of the [[term:momentum|momentum method]]?",
    explanation: "[[term:momentum|Momentum]] accumulates historical gradients, smooths the update direction, reduces oscillation, and speeds convergence.",
    concept: "Momentum updates and convergence stability",
    options: {
      A: "Guarantee the global optimum",
      B: "Remove the need to set a [[term:learning-rate|learning rate]]",
      C: "Introduce historical gradient information to reduce oscillation and speed convergence",
      D: "Automatically reduce noise in the training data"
    }
  },
  "HW-AI-20260527-P4981-Q05": {
    stem: "When building a linear regression model, the training error is small but the [[term:test-set|test error]] is large. What is the most likely cause?",
    explanation: "A small [[term:training-set|training error]] and large [[term:test-set|test error]] are typical signs of [[term:overfitting|overfitting]], indicating poor [[term:generalization|generalization]].",
    concept: "Overfitting and generalization",
    options: {
      A: "[[term:underfitting|Underfitting]]",
      B: "[[term:overfitting|Overfitting]]",
      C: "Insufficient data",
      D: "Too few features"
    }
  },
  "HW-AI-20260107-P4537-Q07": {
    stem: "If a model is [[term:overfitting|overfitting]], which operation can help reduce the resulting problems?",
    explanation: "[[term:overfitting|Overfitting]] means that the model is too complex and fits the training data too closely. Adding [[term:regularization|regularization]], such as L1/L2 penalties or [[term:dropout|Dropout]], constrains model complexity and improves generalization; the other options are ineffective or may worsen overfitting.",
    concept: "Using regularization to reduce overfitting",
    options: {
      A: "Retrain on the existing dataset",
      B: "Add [[term:regularization|regularization]]",
      C: "Duplicate the dataset and train again",
      D: "Reduce the dataset and train again"
    }
  },
  "HW-AI-20260724-P5183-Q18": {
    stem: "Which statements about the [[term:residual-connection|shortcut connection]] in [[term:resnet|ResNet]] are correct?",
    explanation: "A and D are correct. B is too absolute: an [[term:identity-mapping|identity mapping]] alone cannot guarantee that degradation will not occur. C is incorrect: an identity mapping can still help stabilize training, so parameters are not required only when they provide an obvious benefit.",
    concept: "Shortcut connections and residual learning",
    options: {
      A: "A [[term:residual-connection|shortcut connection]] helps mitigate [[term:gradient-vanishing|vanishing gradients]] in deep neural networks",
      B: "A [[term:residual-connection|shortcut connection]] gives the network an [[term:identity-mapping|identity mapping]], ensuring that a deeper network cannot perform worse than a shallower one as layers are added",
      C: "If a [[term:residual-connection|shortcut connection]] is only a direct [[term:identity-mapping|identity mapping]], it cannot benefit the neural network, so parameters must be added to the residual path",
      D: "A [[term:residual-connection|shortcut connection]] is widely applicable and can be added to [[term:mlp|MLP]], [[term:cnn|CNN]], [[term:rnn|RNN]], and other network structures"
    }
  },
  "HW-AI-20260408-P4728-Q19": {
    stem: "Which are characteristics of the [[term:convolution|convolution operation]] in a [[term:cnn|CNN]]?",
    explanation: "B is correct because local connections reduce the number of parameters; D is correct because the gradient of a shared kernel must be accumulated. A and C are incorrect.",
    concept: "Local receptive fields and parameter sharing in convolution",
    options: {
      A: "With kernel size and channel count fixed, the number of convolution-layer parameters grows linearly with the spatial size of the input feature map",
      B: "A convolution layer uses [[term:receptive-field|local receptive fields]] to connect inputs and outputs, significantly reducing parameter count",
      C: "Convolution itself guarantees strict translation invariance for any input, so [[term:pooling|pooling]] and [[term:data-augmentation|data augmentation]] are unnecessary",
      D: "A convolution reuses the same kernel at different spatial positions, so its gradient must be accumulated during [[term:backpropagation|backpropagation]]"
    }
  },
  "HW-AI-20260429-P4868-Q03": {
    stem: "In the evolution of CNN architectures, the core innovation of [[term:mobilenet|MobileNet]] is to decompose [[term:standard-convolution|standard convolution]] into",
    explanation: "[[term:mobilenet|MobileNet]] uses depthwise separable convolution to decompose [[term:standard-convolution|standard convolution]] into [[term:depthwise-separable-convolution|depthwise + pointwise]] convolution, significantly reducing computation and parameter count.",
    concept: "Depthwise separable convolution",
    options: {
      A: "Spatial convolution and temporal convolution",
      B: "[[term:depthwise-separable-convolution|Depthwise convolution and pointwise convolution]]",
      C: "Parallel 1×1 and 3×3 convolutions",
      D: "A combination of a [[term:fully-connected-layer|fully connected layer]] and a [[term:pooling|pooling layer]]"
    }
  },
  "HW-AI-20260422-P4820-Q07": {
    stem: "During deployment, fusing a [[term:convolution|convolution layer]] with a [[term:batch-normalization|batch-normalization layer]] is standard practice for major [[term:compiler|compilers]]. Which statement about [[term:conv-bn-folding|Conv + BN folding]] is most accurate?",
    explanation: "[[term:conv-bn-folding|Conv + BN folding]] is an algebraic transformation performed during compilation: BN parameters are absorbed into Conv, reducing [[term:runtime|runtime]] overhead.",
    concept: "Conv + BN inference folding",
    options: {
      A: "Folding lets BN gradients backpropagate to the Conv layer faster, which accelerates [[term:inference|inference]]",
      B: "Folding is a purely algebraic equivalent transformation: during offline compilation, BN scale and bias are absorbed into Conv weights and bias, so runtime has no separate BN overhead",
      C: "Folding passes BN mean and variance into the low-level Conv operator at runtime for parallel computation",
      D: "[[term:conv-bn-folding|Conv + BN folding]] slightly changes model accuracy because the folded operator cannot use Tensor Core acceleration"
    }
  },
  "HW-AI-20260304-P4570-Q01": {
    stem: "What is the core mechanism of a [[term:transformer|Transformer model]]?",
    explanation: "A [[term:transformer|Transformer model]] relies primarily on [[term:self-attention|self-attention]] to model dependencies between arbitrary positions in a sequence. This is its central innovation compared with traditional sequence models such as [[term:cnn|CNNs]] and [[term:rnn|RNNs]].",
    concept: "Self-attention as the core Transformer mechanism",
    options: {
      A: "Linear regression",
      B: "Convolutional neural networks",
      C: "Recurrent neural networks",
      D: "[[term:self-attention|Self-attention]]"
    }
  },
  "HW-AI-20260624-P5123-Q07": {
    stem: "What is the main purpose of [[term:self-attention|self-attention]] in a [[term:transformer|Transformer model]]?",
    explanation: "Self-attention can directly model relationships between arbitrary positions in a sequence.",
    concept: "Long-range dependency modeling with self-attention",
    options: {
      A: "Reduce the dimensionality of the input sequence",
      B: "Generate [[term:embedding|word embeddings]]",
      C: "Capture [[term:long-range-dependency|long-range dependencies]] in the sequence",
      D: "Map the input sequence to a fixed-length vector"
    }
  },
  "HW-AI-20260624-P5123-Q05": {
    stem: "In [[term:self-attention|self-attention]], how are the three matrices Q, K, and V usually obtained?",
    explanation: "[[term:qkv-projection|Q, K, and V]] are usually obtained by multiplying the input by different linear transformation matrices.",
    concept: "Q/K/V linear projections in self-attention",
    options: {
      A: "They are generated by an [[term:rnn|RNN]]",
      B: "The input vector is multiplied by three different weight matrices",
      C: "They are randomly initialized and then kept unchanged",
      D: "They are copied directly from the input vector"
    }
  },
  "HW-AI-20260522-P4968-Q12": {
    stem: "Compared with [[term:self-attention|single-head attention]], what is the core advantage of [[term:multi-head-attention|multi-head attention (MHA)]]?",
    explanation: "Multi-head attention can capture different relationships in multiple representation subspaces.",
    concept: "Representation subspaces and relation modeling in multi-head attention",
    options: {
      A: "Reduce [[term:kv-cache|KV Cache]] memory usage during inference",
      B: "Allow the model to attend to information from different positions in parallel across different representation subspaces",
      C: "Significantly reduce the model's total parameter count",
      D: "Completely eliminate positional dependence in sequence processing"
    }
  },
  "HW-AI-20260107-P4537-Q08": {
    stem: "What is the main purpose of [[term:positional-encoding|positional encoding]] in a [[term:transformer|Transformer]]?",
    explanation: "The [[term:self-attention|self-attention]] mechanism in a [[term:transformer|Transformer]] does not contain sequence-order information by itself. Positional encoding injects relative or absolute position information for each [[term:token|token]]; it is not used to increase nonlinearity, improve bandwidth, or reduce computation.",
    concept: "Positional encoding in Transformers",
    options: {
      A: "Increase nonlinearity",
      B: "Provide sequence position information",
      C: "Increase parallel bandwidth",
      D: "Reduce model computation"
    }
  },
  "HW-AI-20260204-P4567-Q02": {
    stem: "In a standard [[term:transformer-block|Transformer Block]], a [[term:multi-head-attention|Multi-Head Attention]] sublayer is usually followed by a [[term:position-wise-ffn|Position-wise FFN]] sublayer. Which description of how these two sublayers process information is most accurate?",
    explanation: "In a Transformer, [[term:multi-head-attention|Multi-Head Attention]] uses [[term:self-attention|self-attention]] to compute relationships between all positions and mix information across positions. [[term:position-wise-ffn|Position-wise FFN]] applies the same [[term:fully-connected-layer|fully connected layers]] independently to each position for nonlinear transformation, without interaction between positions.",
    concept: "The information-mixing boundary between Attention and Position-wise FFN",
    options: {
      A: "[[term:multi-head-attention|Multi-Head Attention]] and FFN both process each position independently without exchanging information between positions",
      B: "FFN mixes information between positions, while [[term:multi-head-attention|Multi-Head Attention]] applies an independent nonlinear transformation to each position",
      C: "[[term:multi-head-attention|Multi-Head Attention]] mixes information between positions, while FFN applies an independent nonlinear transformation to each position",
      D: "[[term:multi-head-attention|Multi-Head Attention]] and FFN both exchange information across all positions in the sequence"
    }
  },
  "HW-AI-20260318-P4624-Q20": {
    stem: "Which statements about the role of [[term:causal-mask|Causal Mask]] are correct?",
    explanation: "A causal mask ensures that an [[term:autoregressive-model|autoregressive model]] can access only the current position and earlier positions during training. It is commonly implemented as a matrix whose upper triangle is negative infinity. It is mainly used in the [[term:decoder|decoder]]'s [[term:self-attention|self-attention]] layer rather than the [[term:encoder|encoder]], and it applies to all autoregressive generation tasks, not only text.",
    concept: "Causal attention masks",
    options: {
      A: "Prevent the [[term:decoder|decoder]] from seeing future information during training",
      B: "Are matrices whose upper triangle is negative infinity",
      C: "Are used in the [[term:encoder|encoder]]'s [[term:self-attention|self-attention]] layer to improve locality",
      D: "Apply only to text-generation tasks"
    }
  },
  "HW-AI-20260204-P4567-Q14": {
    stem: "Which statement correctly describes the architectures of GPT, BERT, and T5?",
    explanation: "The GPT family uses a [[term:transformer|Transformer]] decoder for autoregressive generation, BERT uses a Transformer encoder for bidirectional contextual encoding, and T5 uses an [[term:transformer-architecture-families|encoder-decoder architecture]] for sequence-to-sequence tasks.",
    concept: "Transformer architecture families",
    options: {
      A: "GPT is [[term:transformer-architecture-families|encoder-only]], BERT is [[term:transformer-architecture-families|decoder-only]], and T5 is encoder-decoder",
      B: "GPT is encoder-decoder, BERT is [[term:transformer-architecture-families|decoder-only]], and T5 is [[term:transformer-architecture-families|encoder-only]]",
      C: "GPT is encoder-decoder, BERT is encoder-decoder, and T5 is [[term:transformer-architecture-families|decoder-only]]",
      D: "GPT is [[term:transformer-architecture-families|decoder-only]], BERT is [[term:transformer-architecture-families|encoder-only]], and T5 is encoder-decoder"
    }
  },
  "HW-AI-20260509-P4904-Q05": {
    stem: "Which statement about [[term:decoder-only|decoder-only]] models is incorrect?",
    explanation: "[[term:decoder-only|Decoder-only]] models do not have a separate encoder and usually predict the next token autoregressively from the context.",
    concept: "Decoder-only architectures and autoregressive generation",
    options: {
      A: "They are commonly used for text completion and dialogue generation",
      B: "The input prompt and output text are often organized as one continuous sequence",
      C: "They must contain an independent [[term:encoder|encoder]] to generate output",
      D: "A common training approach is to predict the next token from the available context"
    }
  },
  "HW-AI-20260304-P4570-Q09": {
    stem: "Which statement about the objective of [[term:pretraining|pretraining]] is incorrect?",
    explanation: "[[term:pretraining|Pretraining]], such as BERT's [[term:mlm|MLM]], is a form of [[term:self-supervised-learning|self-supervised learning]]. Its training signal, such as masked words, is constructed directly from unlabeled text without manual annotation. The objective is to learn general language [[term:representation-learning|representations]] through contextual prediction.",
    concept: "Pretraining and self-supervised learning objectives",
    options: {
      A: "It must rely on labeled data",
      B: "It mainly uses [[term:cross-entropy-loss|cross-entropy loss]]",
      C: "It captures statistical regularities of language through unsupervised learning",
      D: "The model must learn contextual representation ability"
    }
  },
  "HW-AI-20260408-P4728-Q18": {
    stem: "Which techniques are used to stabilize training or speed convergence when training a [[term:transformer|Transformer]]?",
    explanation: "All four techniques can stabilize training or speed convergence. Warmup avoids early oscillation, clipping prevents [[term:gradient-explosion|exploding gradients]], [[term:residual-connection|residual connections]] improve gradient flow, and [[term:layer-normalization|LayerNorm]] stabilizes activation distributions.",
    concept: "Training-stability techniques for Transformers",
    options: {
      A: "[[term:learning-rate-warmup|Learning-rate warmup]]",
      B: "[[term:gradient-clipping|Gradient clipping]]",
      C: "[[term:residual-connection|Residual connections]]",
      D: "[[term:layer-normalization|Layer normalization]]"
    }
  },
  "HW-AI-20260520-P4962-Q09": {
    stem: "What is the most accurate description of the role of [[term:kv-cache|KV Cache]] in [[term:autoregressive-inference|autoregressive inference]]?",
    explanation: "[[term:kv-cache|KV Cache]] stores the Key and Value tensors of historical [[term:token|tokens]], greatly reducing repeated computation.",
    concept: "Reusing historical K/V in KV Cache",
    options: {
      A: "Reduce the number of parameters and therefore reduce model storage",
      B: "Improve training convergence",
      C: "Cache the [[term:qkv-projection|K/V]] of historical [[term:token|tokens]] to avoid recomputing them at every step",
      D: "Remove the need for [[term:self-attention|attention]] during inference"
    }
  },
  "HW-AI-20260805-P5197-Q13": {
    stem: "During [[term:runtime-peak-memory|on-device inference]], which factor is most likely to make actual [[term:runtime-peak-memory|peak memory]] usage substantially larger than the model file itself?",
    explanation: "Model execution also needs to retain [[term:intermediate-activation|intermediate activations]] and temporary workspaces, so [[term:runtime-peak-memory|peak memory]] can be much larger than the model file.",
    concept: "Runtime peak-memory composition during inference",
    options: {
      A: "[[term:intermediate-activation|Intermediate activations]], temporary buffers, and concurrent execution of multiple branches",
      B: "A fixed number of output classes",
      C: "An overly large training set",
      D: "Too few label classes"
    }
  },
  "HW-AI-20260603-P4996-Q07": {
    stem: "Which of the following is not a purpose of [[term:quantization|quantization]]?",
    explanation: "[[term:quantization|Quantization]] is mainly used to reduce model size, improve inference efficiency, and adapt models to hardware.",
    concept: "Compression and inference-deployment goals of quantization",
    options: {
      A: "Reduce model size",
      B: "Increase inference throughput",
      C: "Improve training convergence speed",
      D: "Adapt to mobile hardware"
    }
  },
  "HW-AI-20260423-P4829-Q01": {
    stem: "In [[term:quantization|quantization]], converting [[term:numerical-precision|FP16]] to [[term:numerical-precision|INT8]] mainly compresses the",
    explanation: "Quantization compresses parameters from higher-precision representations such as [[term:numerical-precision|FP16]] to lower-bit-width representations such as [[term:numerical-precision|INT8]]. The main reductions are in weight storage and [[term:memory-bandwidth|bandwidth usage]].",
    concept: "Low-bit quantization and weight storage width",
    options: {
      A: "Number of attention heads",
      B: "Number of model layers",
      C: "Weight [[term:numerical-precision|storage bit width]]",
      D: "Length of the token vocabulary"
    }
  },
  "HW-AI-20260509-P4904-Q19": {
    stem: "Which factors affect model accuracy after [[term:quantization|INT8 quantization]] deployment?",
    explanation: "The distribution of the [[term:calibration-set|calibration set]] affects quantization-parameter calibration; unstable activation statistics can bias the [[term:quantization-scale|scale]]; and [[term:outlier|outliers]] can enlarge the scale and reduce accuracy. Floating-point training is a prerequisite, not a direct factor affecting post-quantization accuracy.",
    concept: "Calibration factors affecting INT8 quantization accuracy",
    options: {
      A: "Whether the [[term:calibration-set|calibration-set]] distribution is close to real data",
      B: "Whether [[term:quantization-scale|activation-range]] statistics are stable",
      C: "Whether [[term:outlier|outliers]] make the [[term:quantization-scale|scale]] unreasonable",
      D: "Whether floating-point numbers were used for training"
    }
  },
  "HW-AI-20260415-P4778-Q13": {
    stem: "What is the core idea of [[term:smoothquant|SmoothQuant]], a common large-model [[term:quantization|quantization]] method?",
    explanation: "[[term:smoothquant|SmoothQuant]] uses an equivalent transformation to move quantization difficulty from activations to weights. In essence, it absorbs the activation scale into the weights.",
    concept: "Moving activation scale into weights in SmoothQuant",
    options: {
      A: "Move weight scale to activations",
      B: "Move activation scale to weights",
      C: "Reduce the number of layers",
      D: "Reduce the batch size"
    }
  }
};

const terms = {
  "activation-function": {
    title: "Activation function",
    summary: "An activation function processes the result of a computation inside a neural network. Different functions can clip, compress, or smoothly adjust values. Their nonlinear response works with weighted computation so the network can express more complex relationships.",
    coreConclusion: "Weighted computation combines information; nonlinear activation changes the response. Different activation functions implement this role with different curves."
  },
  "backpropagation": {
    title: "Backpropagation",
    summary: "Backpropagation traces influence backward through a computation graph from the loss and efficiently computes the gradient of the loss with respect to every parameter using the chain rule.",
    coreConclusion: "The network first performs a forward pass. Backpropagation then reuses local derivatives from the loss backward to obtain every parameter gradient; the optimizer performs the parameter update."
  },
  "conv-bn-folding": {
    title: "Conv + BN folding",
    summary: "Conv + BN folding absorbs the fixed scale and bias of [[term:batch-normalization|Batch Normalization]] into [[term:convolution|convolution]] weights and bias before inference, so the [[term:runtime|runtime graph]] executes one equivalent convolution without scheduling BN separately.",
    coreConclusion: "It is an algebraically equivalent rewrite for inference: convolution parameters change, the network function does not, and the separate BN runtime cost is removed."
  },
  "convolution": {
    title: "Convolution",
    summary: "A convolution slides a small [[term:convolution-kernel|kernel]] across spatial positions in the input. At each position, it multiplies the local input and kernel element by element and sums the products to produce one output element; the same kernel [[term:model-parameter|parameters]] are reused at different positions.",
    coreConclusion: "Convolution efficiently extracts patterns that can appear at different positions through local connections and spatial parameter sharing."
  },
  "depthwise-separable-convolution": {
    title: "Depthwise separable convolution",
    summary: "Depthwise separable [[term:convolution|convolution]] splits [[term:standard-convolution|standard convolution]] into two steps: [[term:depthwise-convolution|depthwise convolution]] first extracts spatial information independently with one kernel per input channel, without mixing channels; [[term:pointwise-convolution|pointwise convolution]] then uses a 1×1 convolution to recombine information across channels.",
    coreConclusion: "Process spatial neighborhoods channel by channel, then mix channels with a 1×1 convolution to significantly reduce parameter count and computation."
  },
  "dropout": {
    title: "Dropout",
    summary: "During each training forward pass, Dropout randomly sets some neuron outputs to zero with a given probability so the model cannot depend on a fixed co-adaptation path. During [[term:inference|inference]], random masking is disabled and the complete network is used.",
    coreConclusion: "Training repeatedly samples different random subnetworks; inference restores the complete network. Masked activations are temporary, not permanently deleted parameters."
  },
  "fully-connected-layer": {
    title: "Fully connected layer",
    summary: "A fully connected layer lets every output unit receive every input, with a separate weight for each connection. Each unit computes a weighted sum of the inputs and can add its own bias, combining one set of features into another.",
    coreConclusion: "Each connection in a fully connected layer has one weight, and each output unit has one weight vector. Arrange those vectors as rows to express the whole layer with matrix multiplication."
  },
  "kv-cache": {
    title: "KV Cache",
    summary: "During [[term:autoregressive-generation|autoregressive generation]], KV Cache stores the already-computed Key and Value tensors for historical [[term:token|tokens]] at every layer. At the next step, only the new token's [[term:qkv-projection|Q, K, and V]] are computed; the new K/V are appended to the cache and the new Query reads all visible historical K/V.",
    coreConclusion: "The cache reuses each layer's historical K/V projections, avoiding recomputation of old tokens' K/V at every step. It trades memory for less repeated computation."
  },
  "layer-normalization": {
    title: "LayerNorm",
    summary: "LayerNorm normalizes the feature dimension of one [[term:token|token]] in one sample: it standardizes the row using that row's own mean and variance, then applies learnable scale and bias to restore a suitable representation. It does not depend on other samples in the batch.",
    coreConclusion: "LayerNorm keeps feature scales aligned within each token, making values and gradients easier to stabilize in deep networks."
  },
  "loss-function": {
    title: "Loss function",
    summary: "A loss function is the scoring rule used during model training: it turns the difference between predictions and targets into a number, and training adjusts parameters to make that number smaller. The scoring rule depends on the task, and different rules emphasize different errors.",
    coreConclusion: "A loss function translates the task objective into a numerical signal that the training process can optimize."
  },
  "mlp": {
    title: "Multilayer perceptron (MLP)",
    summary: "A multilayer perceptron is a neural network built from fully connected layers: every computation unit receives all results from the previous layer. Hidden layers combine weighted computation with nonlinear activation to extract features layer by layer, and the output layer produces the prediction.",
    coreConclusion: "An MLP combines information through successive fully connected layers. Each layer uses its own parameters to produce new results, and nonlinear transformations let the stack express richer relationships."
  },
  "multi-head-attention": {
    title: "Multi-head attention",
    summary: "Multi-head attention projects the same input into several smaller [[term:qkv-projection|Query, Key, and Value]] subspaces, computes attention independently in each head, then concatenates the results and applies an output projection. Different heads can learn different positional or feature relationships.",
    coreConclusion: "Multi-head attention is not the same attention repeated. It uses several independent projections to learn multiple reading relationships in parallel and fuses them at the end."
  },
  "neural-network": {
    title: "Neural network",
    summary: "A neural network is a function made from many connected small computation units. Data is passed, combined, and transformed between units until a prediction is produced. Each unit uses adjustable values, and training repeatedly changes those values so the network learns from examples.",
    coreConclusion: "The structure of a neural network defines how data is computed. Training adjusts weights and biases so the network gradually learns the input-output relationship required by the task."
  },
  "overfitting": {
    title: "Overfitting",
    summary: "Overfitting occurs when a model performs well on training data but fails to learn stable patterns that transfer to new examples. It may memorize accidental details, noise, or bias in the [[term:training-set|training set]], so performance on the [[term:validation-set|validation set]], [[term:test-set|test set]], or real data becomes much worse.",
    coreConclusion: "When training performance keeps improving while data outside the training set gets worse, the model is memorizing training details instead of improving generalization."
  },
  "position-wise-ffn": {
    title: "Position-wise feed-forward network",
    summary: "A position-wise feed-forward network applies the same small two-layer network independently to every position in a sequence. It does not read other positions; it expands, nonlinearly transforms, and projects each position back to the hidden dimension.",
    coreConclusion: "All positions share the same FFN parameters, but each row is computed independently. The FFN changes features; it does not exchange information across positions."
  },
  "positional-encoding": {
    title: "Positional encoding",
    summary: "Positional encoding writes sequence order into the model representation. Because [[term:self-attention|self-attention]] matches content, swapping input rows together with their [[term:qkv-projection|Q/K/V]] would not by itself tell the model which row is first or third.",
    coreConclusion: "Positional encoding gives the same content different representations at different positions, allowing the model to use order and relative distance."
  },
  "qkv-projection": {
    title: "QKV projection",
    summary: "Q, K, and V are not three external inputs. They are three role-specific representations produced from the same sequence representation by three learnable [[term:fully-connected-layer|linear layers]]. Q issues a query, K participates in matching, and V is the content actually aggregated after matching.",
    coreConclusion: "One input vector is projected by three parameter sets into a query, an index, and a value, each with a different role in retrieval."
  },
  "quantization": {
    title: "Model quantization",
    summary: "Model quantization represents floating-point weights or activations with fewer discrete values. For example, a floating-point range can be mapped to the finite integer grid of [[term:numerical-precision|INT8]], with a [[term:quantization-scale|scale factor]] used to recover the numerical range during inference. This reduces model size, memory bandwidth, and some hardware computation costs.",
    coreConclusion: "Quantization approximates floating-point numbers with a finite-precision grid, exchanging a controlled amount of accuracy for storage and inference efficiency."
  },
  "regularization": {
    title: "Regularization",
    summary: "Regularization constrains overly large weights or overly complex model behavior in addition to fitting the [[term:training-set|training data]], reducing the tendency to memorize details. Too little constraint may still cause [[term:overfitting|overfitting]], while too much can prevent learning and cause [[term:underfitting|underfitting]].",
    coreConclusion: "Regularization does not simply minimize [[term:loss-function|training loss]]. It deliberately limits model freedom to seek better performance on unseen data."
  },
  "residual-connection": {
    title: "Residual connection",
    summary: "A residual connection sends the input along two paths: one applies a main transformation such as [[term:convolution|convolution]], [[term:attention-mechanism|attention]], or [[term:position-wise-ffn|feed-forward processing]], while the other shortcut bypasses the main transformation. The two paths are then added element by element.",
    coreConclusion: "The output adds the main-path transformation to the original input, giving both information and gradients a more direct route."
  },
  "runtime-peak-memory": {
    title: "Runtime peak memory",
    summary: "Runtime peak memory is the sum of all device-memory allocations that remain alive at one moment during execution. It includes not only model weights, but also inputs and outputs, [[term:intermediate-activation|intermediate activations]], [[term:operator-workspace|operator workspaces]], caches, [[term:compiler|compiler]]-generated weight copies, and runtime buffers.",
    coreConclusion: "Peak memory is the memory that is alive at the same time. It is not the model file size and not the simple sum of every layer's activations."
  },
  "self-attention": {
    title: "Self-attention",
    summary: "Self-attention lets every position in a sequence inspect other positions in the same sequence. The current position uses a [[term:qkv-projection|Query]] to express a retrieval need, matches it against every position's Key, and uses the resulting weights to aggregate Values into a new context-aware representation.",
    coreConclusion: "Self-attention matches what the current position needs with what other positions provide, then aggregates information according to the match."
  },
  "softmax": {
    title: "Softmax",
    summary: "Softmax converts a set of scores with arbitrary signs and magnitudes into nonnegative weights that sum to 1. It preserves the ordering of scores and gives larger weights to larger scores.",
    coreConclusion: "Softmax does not simply select the maximum. All candidates share one denominator, producing comparable weights whose sum is 1."
  },
  "training-set": {
    title: "Training set",
    summary: "The training set directly participates in learning model parameters. The model performs forward passes, computes [[term:loss-function|loss]], and obtains [[term:gradient|gradients]] on these samples; the [[term:optimizer|optimizer]] then updates the weights. Training-set performance only shows how well the model fits data used for learning.",
    coreConclusion: "The training set teaches the model its parameters, but cannot by itself prove that the model works on new data."
  },
  "transformer-block": {
    title: "Transformer Block",
    summary: "A Transformer Block usually contains two core sublayers: [[term:multi-head-attention|multi-head attention]] and a [[term:position-wise-ffn|position-wise feed-forward network]]. Each sublayer is surrounded by [[term:residual-connection|residual connections]] and [[term:layer-normalization|LayerNorm]]. Attention exchanges information across positions; the feed-forward network performs nonlinear processing within each position.",
    coreConclusion: "A Block first lets positions exchange information, then lets each position process its own features independently, with residual connections and normalization supporting deep stacks."
  },
  "transformer": {
    title: "Transformer",
    summary: "A Transformer is a sequence-model architecture centered on [[term:attention-mechanism|Attention]]. It turns an input sequence into vectors, uses [[term:self-attention|self-attention]] to gather information from other positions according to content, and uses a [[term:position-wise-ffn|position-wise feed-forward network]] to transform each representation. [[term:residual-connection|Residual connections]] and [[term:layer-normalization|normalization]] stabilize deep stacks.",
    coreConclusion: "Transformers use Attention for information exchange between positions and feed-forward networks for representation transformation within each position."
  },
  "validation-set": {
    title: "Validation set",
    summary: "A validation set is used for model selection without participating in the current parameter-gradient updates. During training, it can reveal [[term:overfitting|overfitting]], guide hyperparameter selection, and identify the best checkpoint, but its loss must not be backpropagated into the model.",
    coreConclusion: "The validation set supports selection and diagnosis during training; it does not directly update model parameters."
  }
};

function sourceText(value) {
  return typeof value === "string" ? value : value?.[zh] ?? "";
}

function localizedValue(value, english) {
  return localized(sourceText(value), english);
}

function localizeList(values, table = taxonomy) {
  return values.map((value) => {
    const source = sourceText(value);
    const english = table[source] ?? (typeof value === "object" ? value[en] : undefined);
    if (!english) throw new Error(`Missing English taxonomy label for: ${source}`);
    return localizedValue(value, english);
  });
}

async function localizeQuestions() {
  const directory = resolve(root, "content-libraries/questions");
  for (const file of (await readdir(directory)).filter((name) => name.endsWith(".json"))) {
    const path = resolve(directory, file);
    const value = JSON.parse(await readFile(path, "utf8"));
    const translation = questions[value.id];
    if (!translation) throw new Error(`Missing question translation: ${value.id}`);
    value.stem = localizedValue(value.stem, translation.stem);
    value.explanation = localizedValue(value.explanation, translation.explanation);
    value.taxonomy.primaryConcept = localizedValue(value.taxonomy.primaryConcept, translation.concept);
    const modelFamily = sourceText(value.taxonomy.modelFamily);
    value.taxonomy.modelFamily = localizedValue(value.taxonomy.modelFamily, taxonomy[modelFamily]);
    value.taxonomy.secondaryModelFamilies = localizeList(value.taxonomy.secondaryModelFamilies ?? []);
    value.taxonomy.secondaryEngineeringStages = localizeList(value.taxonomy.secondaryEngineeringStages ?? [], stage);
    value.taxonomy.knowledgeTopics = localizeList(value.taxonomy.knowledgeTopics ?? []);
    value.taxonomy.taskScenarios = localizeList(value.taxonomy.taskScenarios ?? []);
    value.taxonomy.optimizationObjectives = localizeList(value.taxonomy.optimizationObjectives ?? []);
    value.taxonomy.runtimeEnvironments = localizeList(value.taxonomy.runtimeEnvironments ?? []);
    for (const option of value.options ?? []) {
      const english = translation.options[option.key];
      if (!english) throw new Error(`Missing option translation: ${value.id}/${option.key}`);
      option.text = localizedValue(option.text, english);
    }
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  }
}

async function localizeTerms() {
  const directory = resolve(root, "content-libraries/terms");
  for (const folder of await readdir(directory)) {
    const path = resolve(directory, folder, "manifest.json");
    let value;
    try {
      value = JSON.parse(await readFile(path, "utf8"));
    } catch {
      continue;
    }
    const translation = terms[value.id];
    if (!translation) throw new Error(`Missing term translation: ${value.id}`);
    value.title = localizedValue(value.title, translation.title);
    value.summary = localizedValue(value.summary, translation.summary);
    value.coreConclusion = localizedValue(value.coreConclusion, translation.coreConclusion);
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  }
}

await localizeQuestions();
await localizeTerms();
console.log("Localized root question and term manifests.");
