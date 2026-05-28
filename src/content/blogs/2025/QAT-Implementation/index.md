---
title: Quantization Aware Training Implementation Guide
description: Implementation details and best practices for Quantization Aware Training (QAT) with LoRA, including GPU memory optimization strategies
pubDate: 2025-01-15T00:00:00.000Z
author: Xiaoyou Wu
thumbnail: https://live.staticflickr.com/6073/6128667994_412864eb43_b.jpg
tags:
  - AI-ML
  - GPU & Compilers
  - research
---

# Quantization Aware Training

# Basic information

### LoRA:

- Old method to improve domain specific fine-tuning faces disadvantages like sequential processing bottleneck. So LoRA changes the feed forward layer to self.linear(x) + (x @ self.lora_A @ self.lora_B) *
    self.scaling .

**PRT (Precision Range Test)**

- Start from the lowest bit and detect the predetermined threshold to record the B_min. Then the B_max should be determined by the max precision you will be need to experiment with.

## Implementation details

### Loading weights

For model from the transformer, you should remember to import the weight of the projection layer

### Initializing the model

Use apply function in torch to optimize the initialization of different layers. In the current case, you should initialize transformer layer with its final projection layer and also two layers of ffn.

### Inheritance of  nn.Module and torch.autograd.Function 



# APPENDIX ON torch and transformer usage

## Important functions in torch

1. torch.save: uses the pickle for operations. For tensors, its raw data, size information, gradient requirements. For models, it mainly store the state_dict which is an orderedDict that maps each layer or params name to its tensor values.
2. torch.amp.GradScaler('cuda'): Automatic Mixed Precision
3. torch.nn.module: its handy to inherit this class for your customized model. You can just do model(input_params) to call the "\__call__" function inherited to perform ffn.
4. For dataset objects imported with the load_dataset from the datasets library. Its handy to call the .feature property  or you can call the \__dict\__ method to understand the structure.
5. return_tensor = "pt" adds a dimension so remember to do the [0] for the tensor.
6. While loading information from a dataset, pay attention to the dataset padding token and eos token, if their choice is the same, you should change the padding token to be something else

## Important functions in transformer

1. GPT2Config return an json with all those configurations and then could be utilized by other tuning methods.
2. model.eval() turn on the evaluation mode and disable those dropout, 

# APPENDIX ON GPU RAM usage

# GPU Memory Hierarchy & Parameter Impact Guide

## Memory Hierarchy Overview

| Memory Type | Size (A100) | Bandwidth | Latency | What's Stored |
| --- | --- | --- | --- | --- |
| **Registers** | 256 KB/SM | ~19 TB/s | 1 cycle | Active thread variables, loop counters |
| **L1 Cache/SMEM** | 192 KB/SM | ~19 TB/s | ~30 cycles | Shared memory, frequently accessed data |
| **L2 Cache** | 40 MB | ~4 TB/s | ~200 cycles | Recently accessed data from HBM |
| **HBM (VRAM)** | 40-80 GB | ~2 TB/s | ~400 cycles | Model weights, activations, optimizer states |

## Parameter Impact on Memory Usage

| Parameter | HBM Usage | L1/SMEM Usage | Register Usage | Impact Description |
| --- | --- | --- | --- | --- |
| **batch_size** | High 🔴 | Medium 🟡 | Low 🟢 | Multiplies activation memory linearly |
| **model_size** | High 🔴 | Low 🟢 | Low 🟢 | Weights stored entirely in HBM |
| **sequence_length** | High 🔴 | Medium 🟡 | Low 🟢 | Quadratic for attention (seq_len²) |
| **hidden_dim** | High 🔴 | Medium 🟡 | Low 🟢 | Affects weight matrices & activations |
| **num_layers** | High 🔴 | Low 🟢 | Low 🟢 | Linear increase in weights |
| **precision (FP32/16/8)** | High 🔴 | Medium 🟡 | Medium 🟡 | Halves memory per precision drop |
| **gradient_accumulation** | Low 🟢 | Low 🟢 | Low 🟢 | Reduces batch memory requirement |
| **optimizer (SGD/Adam)** | High 🔴 | Low 🟢 | Low 🟢 | Adam uses 3x memory (m, v states) |

## Detailed HBM Storage Breakdown

| Component | Formula | FP32 Memory | FP16 Memory | Stored Location |
| --- | --- | --- | --- | --- |
| **Model Weights** | `num_params × precision` | 4 bytes/param | 2 bytes/param | HBM |
| **Gradients** | `num_params × precision` | 4 bytes/param | 2 bytes/param | HBM |
| **Adam Optimizer** | `2 × num_params × FP32` | 8 bytes/param | 8 bytes/param* | HBM |
| **Activations** | `batch × seq_len × hidden × layers` | Variable | Variable/2 | HBM |
| **KV Cache (LLMs)** | `batch × heads × seq_len × dim × layers × 2` | Large | Large/2 | HBM |
| **Temp Buffers** | `workspace for ops` | ~1-2 GB | ~0.5-1 GB | HBM |

*Adam states typically stay FP32 even in mixed precision

## Kernel-Level Memory Usage

| Operation | Register Pressure | L1/SMEM Usage | HBM Access Pattern |
| --- | --- | --- | --- |
| **GEMM (MatMul)** | High 🔴 | High 🔴 | Tiled access |
| **Element-wise** | Medium 🟡 | Low 🟢 | Sequential streaming |
| **Softmax** | Medium 🟡 | Medium 🟡 | Row-wise access |
| **LayerNorm** | Medium 🟡 | Medium 🟡 | Channel-wise access |
| **Attention** | High 🔴 | High 🔴 | Complex tiling |
| **Conv2D** | High 🔴 | High 🔴 | Im2col or tiled |

## Optimization Strategies by Memory Type

| Memory Type | Optimization Strategy | Impact |
| --- | --- | --- |
| **HBM** | Gradient checkpointing, model sharding, mixed precision | Reduce total storage |
| **L2 Cache** | Increase arithmetic intensity, kernel fusion | Reduce HBM traffic |
| **L1/SMEM** | Tile size tuning, shared memory allocation | Better data reuse |
| **Registers** | Loop unrolling, reduce live variables | Higher throughput |

## Practical Example: GPT-2 Medium (345M Parameters)

### Memory Breakdown

| Component | Calculation | Memory Usage |
| --- | --- | --- |
| **Parameters** | 345M params × 4 bytes | 1.4 GB (FP32) |
| **Gradients** | 345M params × 4 bytes | 1.4 GB (FP32) |
| **Adam States** | 345M × 2 × 4 bytes | 2.8 GB (FP32) |
| **Activations** | batch=8, seq=1024, ~20 layers | ~4 GB |
| **Total Training** | Sum of above | **~9.6 GB** |
| **Inference Only** | Parameters only | **~1.4 GB** |

### Memory Usage by Precision

| Precision | Weights | Gradients | Adam | Activations | Total Training |
| --- | --- | --- | --- | --- | --- |
| **FP32** | 1.4 GB | 1.4 GB | 2.8 GB | 4 GB | 9.6 GB |
| **FP16 Mixed** | 0.7 GB | 0.7 GB | 2.8 GB | 2 GB | 6.2 GB |
| **INT8** | 0.35 GB | N/A | N/A | 1 GB | 1.35 GB (Inference) |

## Memory Calculation Formulas

### Training Memory
```
Total_Memory = Model_Weights + Gradients + Optimizer_States + Activations + Temp_Buffers
```

### Model Weights
```
Model_Memory = num_parameters × bytes_per_param
```

### Activation Memory (Transformer)
```
Activation_Memory = batch_size × seq_length × hidden_dim × num_layers × 
                   (attention_heads + mlp_ratio + norm_layers)
```

### Attention Memory
```
Attention_Memory = batch_size × num_heads × seq_length² × head_dim × num_layers
```

## Common Memory Bottlenecks

| Bottleneck | Symptoms | Solution |
| --- | --- | --- |
| **OOM on forward pass** | Crashes during model(input) | Reduce batch size or model size |
| **OOM on backward pass** | Crashes during loss.backward() | Enable gradient checkpointing |
| **OOM on optimizer step** | Crashes during optimizer.step() | Use gradient accumulation or efficient optimizer |
| **Slow training** | Low GPU utilization | Increase batch size or arithmetic intensity |
| **Memory fragmentation** | OOM with available memory | Clear cache: `torch.cuda.empty_cache()` |



