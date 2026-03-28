---
title: "SEED Interview Preparation: Ultimate Guide"
description: "A structured study guide covering LLMs, deep learning, classic ML, and algorithms for SEED interviews."
pubDate: 2026-03-27
author: "Xiaoyou Wu"
tags: ["interview-prep", "llm", "machine-learning", "algorithms"]
category: "Learning Journal"
thumbnail: "https://picsum.photos/seed/seed-interview-prep/400/300"
draft: false
---

A structured study guide for SEED interviews. Notes mix English and Chinese for fast recall.

## Table of Contents
1. [I. Large Language Models (LLMs) & Transformers](#i-large-language-models-llms--transformers)
   - [1.1 Transformer & BERT Architecture](#11-transformer--bert-architecture)
   - [1.2 Attention Mechanisms (MHA, GQA, FlashAttention)](#12-attention-mechanisms-mha-gqa-flashattention)
   - [1.3 LLM Training & Fine-Tuning (SFT, RLHF, PEFT)](#13-llm-training--fine-tuning)
   - [1.4 LoRA & Efficient Tuning](#14-lora--efficient-tuning)
   - [1.5 Inference, Quantization & Acceleration](#15-inference-quantization--acceleration)
   - [1.6 Advanced Topics (Scaling Laws, Hallucination, MoE, CoT)](#16-advanced-topics)
   - [1.7 Mathematical Deep Dives (Proofs & Formalisms)](#17-mathematical-deep-dives)
2. [II. Deep Learning Foundations](#ii-deep-learning-foundations)
   - [2.1 Activation, Normalization & Regularization](#21-activation-normalization--regularization)
   - [2.2 Computer Vision (CNN)](#22-computer-vision-cnn)
   - [2.3 Sequential Models (RNN, LSTM, GRU)](#23-sequential-models-rnn-lstm-gru)
3. [III. Traditional Machine Learning](#iii-traditional-machine-learning)
   - [3.1 Data Preparation & Feature Engineering](#31-data-preparation--feature-engineering)
   - [3.2 Supervised Learning (Classical & Ensemble)](#32-supervised-learning-classical--ensemble)
   - [3.3 Unsupervised Learning & Evaluation Metrics](#33-unsupervised-learning--evaluation-metrics)
4. [V. Data Structures & Algorithms](#v-data-structures--algorithms)
   - [5.1 Leetcode Problems](#51-leetcode-problems)
   - [5.2 Checklist (Key Interview Questions)](#52-checklist-key-interview-questions)

---

# I. Large Language Models (LLMs) & Transformers

## 1.1 Transformer & BERT Architecture

### **介绍一下 transformer？**
传统的seq2seq模型使用循环神经网络（RNN）来处理序列数据，但RNN存在一些限制，如难以并行计算和难以捕捉长期依赖关系。Transformer则通过使用自注意力机制（self-attention）来解决这些问题。

Transformer模型由编码器和解码器组成。编码器将输入序列转换为一系列高维特征表示，而解码器则将 these 特征表示转换为输出序列。编码器和解码器都由多个相同的层组成。每个层都包含一个自注意力子层和一个前馈神经网络子层。

自注意力机制允许模型在编码和解码过程中对输入序列的不同部分进行加权。它通过计算每个输入位置与其他位置之间的相关性得分，来决定每个位置的重要性。这样，模型可以更好地关注关键的上下文信息。

除了自注意力机制，Transformer还引入了残差连接和层归一化，来帮助模型更好地训练和优化。残差连接允许模型在不同层之间直接传递信息，层归一化则有助于减轻训练过程中的梯度问题。

Transformer模型的训练通常使用无监督的方式，如自编码器或语言模型。一旦训练完成，它可以用于各种序列到序列任务，如机器翻译、文本摘要、对话生成等。

### **Transformer 的输入和输出分别是什么？**
Transformer 的输入是**经过词嵌入（Word Embedding）和位置嵌入（Positional Embedding）处理后的序列**，**输出也是经过词嵌入和位置嵌入处理后的序列**。

具体来说，Transformer 的输入是一个由单词或符号组成的序列，如句子或文本。首先，将这些单词或符号转换为它们的嵌入向量，通常是通过词嵌入技术实现的。然后，为每个单词或符号分配一个位置嵌入向量，以表示它们在序列中的位置。这些嵌入向量和位置嵌入向量被组合在一起，形成一个三维的张量，作为 Transformer 的输入。

Transformer 的输出也是一个由单词或符号组成的序列，与输入序列具有相同的形状。在 Transformer 中，输入序列 and 输出序列之间通过自注意力机制（Self-Attention）进行交互。在每个时间步，Transformer 都会计算输入序列中每个单词或符号与输出序列中每个单词或符号的注意力权重，并基于 these 权重生成输出序列中的每个单词或符号的嵌入向量。最终，这些嵌入向量被转换回单词或符号，形成输出序列。

### **说一下 Bert 模型？**
BERT 模型的核心思想是通过大规模的无监督预训练来学习通用的语言表示，然后在特定任务上进行微调。相比传统的基于词的语言模型，BERT 引入了双向 Transformer 编码器，使得模型能够同时利用上下文信息，从而更好地理解词语在不同上下文中的含义。

BERT 模型的预训练阶段包含两个任务：Masked Language Model (MLM) 和 Next Sentence Prediction (NSP)。在 MLM 任务中，模型会随机遮盖输入序列的一部分单词，然后预测 these 被遮盖的单词。这样的训练方式使得模型能够学习到单词之间的上下文关系。在 NSP 任务中，模型会输入两个句子，并预测这两个句子是否是连续的。这个任务有助于模型理解句子之间的关联性。

在预训练完成后，BERT 模型可以通过微调在各种下游任务上进行应用，如文本分类、命名实体识别、问答系统等。通过微调，BERT 模型能够根据具体任务的数据进行特定领域的学习，从而提高模型在特定任务上的性能。

BERT 模型的优势在于它能够捕捉词语之间的上下文信息，从而更好地理解自然语言。它在多项自然语言处理任务中取得了领先的性能，并推动了该领域的发展。

### **Transformer 的输出和 BERT 有什么区别？**
- **Transformer输出**：在标准的Transformer模型中，输出是由解码器的最终层产生的，通常是一个表示整个序列的向量。这个向量可以用于各种任务，如文本分类、生成等。
- **BERT输出**：BERT（Bidirectional Encoder Representations from Transformers）是基于Transformer的预训练模型，主要用于学习丰富的上下文语境。BERT的输出不仅包含了整个序列的向量，还包括了每个输入词的上下文相关表示。BERT的预训练阶段包括两个任务：Masked Language Model（MLM）和Next Sentence Prediction（NSP）。

总的来说，BERT的输出更注重于每个词的上下文相关表示，而标准的Transformer输出更倾向于整个序列的表示。

### **Transformer 八股文 (Deep Dive)**

**a. Self-Attention 的表达式与张量维度**
定义输入矩阵为 $X \in \mathbb{R}^{n \times d}$，通过权重矩阵 $W^Q, W^K, W^V \in \mathbb{R}^{d \times d_k}$ 映射得到 $Q=XW^Q, K=XW^K, V=XW^V$。
$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V $$

#### **关键张量维度定义 (Tensor Dimensions):**
1.  **Input Matrix ($X$):** $[n, d]$
2.  **Weight Matrices ($W^Q, W^K, W^V$):** $[d, d_k]$
3.  **Q, K, V Tensors:** $[n, d_k]$ (单头) 或 $[B, h, n, d_k]$ (多头并查)。
4.  **Attention Score Matrix ($QK^T$):** $[n, n]$ — 这是计算瓶颈，显存复杂度 $O(n^2)$。
5.  **Output Matrix:** $[n, d]$ (经过 $W^O$ 映射后)。

**b. 为什么公式要对 QK 进行 scaling?**
除以 $\sqrt{d_k}$ 可以将点积结果的方差重新缩放到 1，防止进入 softmax 的饱和区（梯度消失），使训练更稳定。

**c. Self-attention 一定要这样表达吗？**
不一定，只要可以建模相关性就可以。但矩阵乘法 $\frac{QK^T}{\sqrt{d_k}}$ 具有极高的硬件计算效率。

**d. 为什么 Transformer 用 Layer Norm？**
在 NLP 中序列长度变化大，Batch Norm 跨样本统计不稳定。LN 在样本内归一化，能更有效地稳定隐层状态分布。

**e. BERT 为什么要加入位置编码？**
Self-Attention 是置换不变的（Permutation Invariant），不含位置信息。必须显式加入位置编码以区分词序。

**f. BERT 处理一词多义？**
通过动态表征：$\mathbf{h}_i = \sum_{j} \text{attn}_{ij} (W^V \mathbf{x}_j)$。上下文信息直接参与了当前词向量的构建。

**g. Attention 中的 mask 有什么用？（BERT 中）**
处理变长序列。在 softmax 前将 padding 部分设为 $-\infty$，使其权重接近零，忽略无效信息。

**h. Decoder 中的 mask 有什么用？**
**Causal Mask**：防止第 $i$ 个位置看到未来的信息，模拟生成过程，防止信息泄露。

**i. BERT 如何处理溢出词表词 (OOV)？**
使用 Subword Tokenization (WordPiece/BPE)。将词分解为更小的子词单元。

**j. 为什么 GPT 是单向的，BERT 是双向的？**
GPT 是 Decoder-only，带 Causal Mask，适配生成；BERT 是 Encoder-only，全双向关注，适配语义理解。

---

## 1.2 Attention Mechanisms (MHA, GQA, FlashAttention)

### **MHA vs MQA vs GQA**
- **Multi-Head Attention (MHA)**：每个 Query 头都有对应的 Key 和 Value 头。
- **Multi-Query Attention (MQA)**：所有 Query 头共享一个 Key 和一个 Value 头。显存带宽压力最小。
- **Grouped-Query Attention (GQA)**：Query 头分组，每组共享一个 KV。性能与速度的平衡点（如 Llama 3）。

### **FlashAttention 核心原理**
- **分块 (Tiling)**：利用在线 Softmax 算法，将计算限制在 SRAM 中，减少对 HBM 的访问。
- **重计算 (Recomputation)**：反向传播时不存储大矩阵，根据块信息重算，显存复杂度从 $O(N^2)$ 降至 $O(N)$。

---

## 1.3 LLM Training & Fine-Tuning

### **指令微调 (SFT) 策略**
- **数据组织**：混合 few-shot/zero-shot，加入 CoT，使用多样的提示模板。
- **超参数**：Batch Size, Learning Rate, Warmup, Weight Decay 等。
- **P-tuning vs Prefix-tuning**：P-tuning 在输入层加入连续向量；Prefix-tuning 在每一层加入 Prefix 向量。

---

## 1.4 LoRA & Efficient Tuning

### **LoRA 原理**
基于低秩属性（Low-Rank Adaptation）：$W = W_0 + BA$，其中 $A \in \mathbb{R}^{r \times k}, B \in \mathbb{R}^{d \times r}$，$r \ll \min(d, k)$。
- **优点**：极低显存占用，推理无延迟（可合并权重）。
- **QLoRA**：引入 4-bit NormalFloat 和分页优化器，进一步压缩显存。

---

## 1.5 Inference, Quantization & Acceleration

- **显存估算**：14B FP16 模型约占 28GB 显存。训练时由于梯度和优化器状态（Adam），需 12-16 字节/参数。
- **torch.contiguous()**：确保张量内存连续，提升 CUDA 算子执行效率。
- **量化**：AWQ, GPTQ (权重量化)；INT8/INT4 推理加速。

---

## 1.6 Advanced Topics

- **Scaling Laws**：模型性能随算力、参数量、数据量的增长呈幂律关系。
- **涌现能力**：模型规模跨过阈值后，突然具备复杂推理等高级能力。
- **MoE (Mixture of Experts)**：通过 Gate 网络选择专家，在不增加推理成本的情况下大幅提升参数规模。

---

## 1.7 Mathematical Deep Dives (Proofs & Formalisms)

### **1.7.1 RoPE (Rotary Positional Embedding)**
将 Query/Key 映射到复数空间进行旋转：$\langle f_Q(x, m), f_K(y, n) \rangle = g(x, y, n-m)$。内积仅取决于相对距离。

### **1.7.2 LayerNorm 稳定性证明**
具有 **权重缩放不变性**：$LN(\lambda W x) = LN(Wx)$。这使得模型对学习率和权重初始化更具鲁棒性。

### **1.7.3 关键数学证明与公式推导 (Formula Derivations)**

1.  **Xavier 初始化推导**：
    目标使 $Var(y) = Var(x)$。对于 $y = \sum w_i x_i$，需 $Var(w) = 1/n_{in}$。

2.  **Logistic Regression (LR) 核心推导**：
    - **Sigmoid 导数**：$g'(z) = g(z)(1 - g(z))$。
    - **Loss (Cross-Entropy)**：$L(w) = -\frac{1}{m} \sum [y \log(g(z)) + (1-y) \log(1-g(z))]$。
    - **梯度更新**：$\frac{\partial L}{\partial w_j} = \frac{1}{m} \sum (g(z) - y)x_j$。

3.  **XGBoost 目标函数推导**：
    使用二阶泰勒展开优化损失：
    $$ L^{(t)} \approx \sum [g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i)] + \Omega(f_t) $$
    通过求导令其为 0，得到叶子节点最优权重 $w_j = -\frac{G_j}{H_j + \lambda}$。

4.  **Factorization Machines (FM) 推导**：
    化简二阶特征交互复杂度：
    $$ \sum \sum \langle v_i, v_j \rangle x_i x_j = \frac{1}{2} \sum [(\sum v_{i,f} x_i)^2 - \sum v_{i,f}^2 x_i^2] $$
    复杂度从 $O(n^2)$ 降至 $O(kn)$。

5.  **CNN 数学计算**：
    - **输出尺寸**：$L_{out} = \lfloor \frac{L_{in} - k + 2p}{s} \rfloor + 1$。
    - **FLOPs**：$k \cdot k \cdot C_{in} \cdot C_{out} \cdot H_{out} \cdot W_{out}$。

6.  **BP 神经网络反向传播**：
    基于链式法则（Chain Rule）：$\frac{\partial E}{\partial w_{ij}} = \frac{\partial E}{\partial o_j} \frac{\partial o_j}{\partial net_j} \frac{\partial net_j}{\partial w_{ij}}$。

---

# II. Deep Learning Foundations

## 2.1 Activation, Normalization & Regularization

- **BN vs LN**：BN 跨 Batch 归一化（CV常用）；LN 样本内特征归一化（NLP常用）。
- **激活函数**：ReLU (快), GELU (Transformer标准), Swish/SiLU (Llama标准)。
- **L1/L2 正则化**：L1 产生稀疏权重；L2 惩罚大权重，使分布均匀。

## 2.2 Computer Vision (CNN)

- **1*1 卷积**：跨通道特征融合，升/降维。
- **Depthwise 卷积**：逐通道独立卷积，降低计算量。
- **ResNet**：Skip Connection 解决梯度消失。

## 2.3 Sequential Models (RNN, LSTM, GRU)

- **LSTM 三个门**：遗忘门、输入门、输出门。
- **RNN 梯度消失**：长序列权重的连乘导致。LSTM 通过细胞状态的加法路径缓解该问题。

---

# III. Traditional Machine Learning

## 3.1 Data Preparation & Feature Engineering

### **3.1.1 数据准备 (Data Preparation)**
- **采样方法 (Sampling)**：随机采样、分层采样、过采样（SMOTE）与欠采样。
- **MCMC 采样**：马尔科夫链蒙特卡洛采样原理及其在复杂分布中的应用。

### **3.1.2 特征降维 (Dimensionality Reduction)**
- **PCA (主成分分析)**：线性降维，寻找最大方差方向。PCA 与 SVD 的联系（SVD 可用于加速 PCA 计算）。
- **LDA (线性判别分析)**：有监督降维，使类内方差最小、类间方差大。
- **t-SNE**：非线性降维，擅长保持局部结构，常用于高维数据可视化。

### **3.1.3 特征选择 (Feature Selection)**
- **过滤式 (Filter)**：互信息（Mutual Information）、相关系数、方差。
- **包裹式 (Wrapper)**：递归特征消除 (RFE)。
- **嵌入式 (Embedded)**：L1 正则化 (Lasso)、树模型特征重要性。

---

## 3.2 Supervised Learning (Classical & Ensemble)

### **3.2.1 线性与逻辑回归 (Linear & Logistic)**
- **LR 原理**：为什么用 Sigmoid？（源自最大熵模型）。
- **参数特性**：冗余特征对权重的影响（权重平分）；特征关联大对模型稳定性的影响。
- **几率 (Odds)**：对数几率的数学含义。

### **3.2.2 支持向量机 (SVM)**
- **核心原理**：最大化间隔、对偶问题、KKT 条件、核技巧 (Kernel Trick)。
- **常用核函数**：线性、多项式、RBF (高斯)、Sigmoid。
- **异常值敏感度**：SVM 对异常值的鲁棒性（主要由支持向量决定）。

### **3.2.3 决策树与集成学习 (Tree & Ensemble)**
- **决策树 (DT)**：ID3 (信息增益)、C4.5 (增益比)、CART (基尼指数)；剪枝策略。
- **集成方法原理**：
  - **Bagging (随机森林)**：并行训练，降低方差 (Variance)。
  - **Boosting (Adaboost, GBDT)**：串行训练，降低偏差 (Bias)。
- **GBDT vs XGBoost vs LightGBM**：
  - **GBDT**：基于残差的负梯度拟合。
  - **XGBoost**：二阶泰勒展开、显式正则项、特征并行分裂。
  - **LightGBM**：直方图算法、Leaf-wise 生长策略、支持类别特征。

### **3.2.4 其他经典模型**
- **K-最近邻 (KNN)**：K 值选择、距离度量（欧式、曼哈顿）、KD 树优化。
- **朴素贝叶斯 (NB)**：条件独立假设、极大似然估计与贝叶斯估计。
- **FM (因子分解机)**：特征二阶组合与隐向量建模。

---

## 3.3 Unsupervised Learning & Evaluation Metrics

### **3.3.1 聚类算法 (Clustering)**
- **K-Means**：原理、K 值选择（手肘法）、收敛性证明、异常值敏感度。
- **GMM (高斯混合模型)**：EM 算法求解、软聚类思想。
- **K-Means vs GMM**：硬聚类与概率聚类的区别。

### **3.3.2 评价指标 (Metrics)**
- **分类指标**：查准率 (Precision)、查全率 (Recall)、F1-Score、PR 曲线。
- **排序指标**：AUC 的物理含义（随机正负样本对的排序概率）、ROC 曲线。
- **分布差异**：KL 散度（相对熵）与交叉熵的关系。
- **回归指标**：$R^2$、MSE、MAE。

---

# V. Data Structures & Algorithms

## 5.1 Leetcode Problems

- **无重复字符的最长子串 (Sliding Window)**：使用双指针 + 哈希表维护窗口内字符。
- **链表反转**：迭代或递归实现。
- **快速排序**：分治思想，平均复杂度 $O(n \log n)$。

## 5.2 Checklist (Key Interview Questions)
- 两个有序数组的中位数 ($O(\log(m+n))$)。
- 海量数据 TopK 问题 (Min-Heap)。
- 树的最近公共祖先 (LCA)。
- 二维矩阵最长递增路径 (DFS + Memo)。
