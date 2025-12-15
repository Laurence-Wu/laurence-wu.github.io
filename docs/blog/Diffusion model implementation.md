# Diffusion model implementation



## Model Study

### LayerNorm

1. **default** - Standard PyTorch layer normalization. This is the conventional implementation most people are familiar with. Good baseline but may not be the fastest.
2. **low_precision** - A memory-efficient variant of standard layer normalization that uses lower precision floating point numbers (like float16 instead of float32). Saves memory but might have slightly reduced accuracy.
3. **rms** - Root Mean Square Normalization (RMSNorm). Simpler than standard LayerNorm and optimizes better with torch.compile. Generally faster and uses less memory.
4. **gemma_rms** - A specific RMSNorm implementation used in Google's Gemma model. Also optimizes well with torch.compile and is designed to be fast. This is a variant/improvement over the basic RMS implementation.
5. **amd_compatible** - A manual implementation of LayerNorm specifically designed to work around compatibility issues with AMD's ROCm (Radeon Open Compute) GPU framework. Needed because the standard implementations have problems on AMD GPUs.

### Activation Functions Explained

1. **gelu** - Gaussian Error Linear Unit. A smooth, differentiable activation function commonly used in transformer models (BERT, GPT). It applies a probability-based gating mechanism that's gentler than ReLU.
2. **relu** - Rectified Linear Unit. The classic activation function that outputs `max(0, x)`. Simple and fast, but can suffer from "dying ReLU" problem where neurons get stuck at zero. Less common in modern transformers.
3. **silu** - Sigmoid Linear Unit (also called Swish when multiplied by sigmoid). A smooth activation function that's become popular in modern models. Better gradient flow than ReLU and performs well in deep networks.
4. **swiglu** - A gated variant combining Swish and GLU (Gated Linear Unit). Used in models like PaLM and Llama. It applies two separate linear transformations and gates one with a Swish activation. Generally provides better performance than standard activations.



### Entire architecture explained

## Configuration Parameters (LLaDA-8B Typical)

```
d_model (hidden_size):    4096
n_heads:                  32
n_kv_heads:               32 (GQA - can be 8 for efficiency)
head_dim:                 128 (= d_model / n_heads)
n_layers:                 32
vocab_size:               128256
mlp_hidden_size:          14336 (≈ 3.5 × d_model)
max_sequence_length:      8192
activation_type:          silu (manual SwiGLU implementation)
```

## Example Dimensions Used Below

- **Batch size (B)**: 2
- **Sequence length (T)**: 256

------

## COMPLETE FORWARD PASS WITH DIMENSIONS

```
┌──────────────────────────────────────────────────────────────────┐
│                        INPUT LAYER                                │
└──────────────────────────────────────────────────────────────────┘

1. Token IDs (input)
   Shape: (B, T) = (2, 256)
   ↓

2. Token Embedding Lookup [modeling_llada.py:1399]
   nn.Embedding(vocab_size=128256, embedding_dim=4096)
   Shape: (2, 256, 4096)
   ↓

3. [Optional] Input Embedding Normalization [Line 1402]
   Multiply by √d_model = √4096 = 64
   Shape: (2, 256, 4096)
   ↓

4. [Optional] Position Embeddings [Lines 1404-1410]
   Note: SKIPPED when using RoPE (default for LLaDA)
   If used: nn.Embedding(max_seq_len=8192, d_model=4096)
   Add: pos_emb (1, 256, 4096) + x (2, 256, 4096)
   ↓

5. Embedding Dropout [Line 1414]
   Shape: (2, 256, 4096)


┌──────────────────────────────────────────────────────────────────┐
│               TRANSFORMER BLOCKS (32 layers)                      │
│                  LLaDALlamaBlock Architecture                     │
└──────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━ ATTENTION SUBLAYER ━━━━━━━━━━━━━━━━━━━━━┓

6. Input to Block
   Shape: (B, T, C) = (2, 168, 4096)
   ↓

7. Pre-Attention RMSLayerNorm [Line 968]
   RMSLayerNorm(normalized_shape=4096, eps=1e-5)
   Shape: (2, 168, 4096)
   ↓
   ┌─────────────────────────────────────────────┐
   │         Q/K/V PROJECTIONS                   │
   └─────────────────────────────────────────────┘
   
8a. Query Projection [Line 969]
    nn.Linear(in=4096, out=4096, bias=False)
    Shape: (2, 168, 4096)
    
8b. Key Projection [Line 970]  
    nn.Linear(in=4096, out=4096, bias=False)
    For GQA: out = n_kv_heads × head_dim = 32 × 128
    Shape: (2, 168, 4096)
    
8c. Value Projection [Line 971]
    nn.Linear(in=4096, out=4096, bias=False)
    For GQA: out = n_kv_heads × head_dim = 32 × 128
    Shape: (2, 168, 4096)
   ↓
   ┌─────────────────────────────────────────────┐
   │      MULTI-HEAD RESHAPE [Lines 724-728]    │
   └─────────────────────────────────────────────┘

9. Reshape Q/K/V to Multi-Head Format
   Q: (2, 168, 4096) → view(2, 168, 32, 128) → transpose(1,2)
      → (B, n_heads, T, head_dim) = (2, 32, 168, 128)
   
   K: (2, 168, 4096) → view(2, 168, 32, 128) → transpose(1,2)
      → (B, n_kv_heads, T, head_dim) = (2, 32, 168, 128)
   
   V: (2, 168, 4096) → view(2, 168, 32, 128) → transpose(1,2)
      → (B, n_kv_heads, T, head_dim) = (2, 32, 168, 128)
   ↓
   ┌─────────────────────────────────────────────┐
   │   ROTARY POSITION EMBEDDINGS [Lines 757-764]│
   └─────────────────────────────────────────────┘

10. RoPE Application (RotaryEmbedding)
    Generate sin/cos: (1, 1, seq_len, head_dim) = (1, 1, 168, 128)
    Apply rotation to Q and K (element-wise operations)
    Q after RoPE: (2, 32, 168, 128)
    K after RoPE: (2, 32, 168, 128)
   ↓
   ┌─────────────────────────────────────────────┐
   │   SCALED DOT-PRODUCT ATTENTION [Line 693]  │
   └─────────────────────────────────────────────┘

11. Attention Score Computation
    Q @ K^T: (2, 32, 168, 128) @ (2, 32, 128, 168)
           = (B, n_heads, T, T) = (2, 32, 168, 168)
    
    Scale by: 1/√head_dim = 1/√128 ≈ 0.0884
    Shape: (2, 32, 168, 168)
   ↓

12. Softmax + Attention Weights @ V
    Softmax((Q@K^T)/√d_k): (2, 32, 168, 168)
    
    Attention @ V: (2, 32, 168, 168) @ (2, 32, 168, 128)
                 = (2, 32, 168, 128)
   ↓

13. Merge Attention Heads [Line 787]
    transpose(1, 2): (2, 32, 168, 128) → (2, 168, 32, 128)
    view(B, T, C): → (2, 168, 4096)
   ↓

14. Attention Output Projection [Line 790]
    nn.Linear(in=4096, out=4096, bias=False)
    Shape: (2, 168, 4096)
   ↓

15. Attention Dropout + Residual [Line 985]
    x = x_input + dropout(attention_out)
    Shape: (2, 168, 4096)

┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛


┏━━━━━━━━━━━━━━━━━━━━━━ MLP SUBLAYER ━━━━━━━━━━━━━━━━━━━━━━━┓

16. Pre-MLP RMSLayerNorm [Line 993]
    RMSLayerNorm(normalized_shape=4096, eps=1e-5)
    Shape: (2, 168, 4096)
   ↓
   ┌─────────────────────────────────────────────┐
   │    SWIGLU-STYLE GATING (Manual) [Line 994] │
   └─────────────────────────────────────────────┘

17a. Gate Projection (ff_proj)
     nn.Linear(in=4096, out=14336, bias=False)
     Shape: (2, 168, 14336)
     
17b. Up Projection (up_proj)
     nn.Linear(in=4096, out=14336, bias=False)
     Shape: (2, 168, 14336)
   ↓

18. SiLU Activation on Gate [Line 998]
    F.silu(gate) = gate * sigmoid(gate)
    Shape: (2, 168, 14336)
   ↓

19. Element-wise Multiplication [Line 999]
    silu(gate) ⊙ up = (2, 168, 14336) ⊙ (2, 168, 14336)
    Shape: (2, 168, 14336)
   ↓

20. MLP Output Projection (ff_out / down_proj) [Line 1000]
    nn.Linear(in=14336, out=4096, bias=False)
    Shape: (2, 168, 4096)
   ↓

21. MLP Dropout + Residual [Lines 1001-1002]
    x = x_after_attn + dropout(mlp_out)
    Shape: (2, 168, 4096)

┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Block Output: (2, 168, 4096)
[Repeat for all 32 layers]


┌──────────────────────────────────────────────────────────────────┐
│                       OUTPUT LAYER                                │
└──────────────────────────────────────────────────────────────────┘

22. Final RMSLayerNorm [Line 1524]
    RMSLayerNorm(normalized_shape=4096, eps=1e-5)
    Shape: (2, 168, 4096)
   ↓

23. Output Projection (with Weight Tying) [Lines 1531-1532]
    F.linear(x, wte.weight, None)
    wte.weight shape: (vocab_size, d_model) = (128256, 4096)
    
    Computation: (2, 168, 4096) @ (4096, 128256)
    Shape: (B, T, vocab_size) = (2, 168, 128256)
   ↓

24. [Optional] Logit Scaling [Lines 1535-1536]
    logits = logits / √d_model = logits / 64
    Shape: (2, 168, 128256)
   ↓

25. OUTPUT: Logits
    Shape: (2, 168, 128256)
```

------

## KEY DIMENSION TRANSFORMATIONS SUMMARY

| Layer                  | Input Dimension                      | Output Dimension    | Parameters               |
| ---------------------- | ------------------------------------ | ------------------- | ------------------------ |
| **Token Embedding**    | (2, 168)                             | (2, 168, 4096)      | 128256 × 4096            |
| **Q/K/V Projections**  | (2, 168, 4096)                       | 3 × (2, 168, 4096)  | 3 × (4096 × 4096)        |
| **Multi-Head Reshape** | (2, 168, 4096)                       | (2, 32, 168, 128)   | None (view)              |
| **Attention Scores**   | Q:(2,32,168,128), K:(2,32,168,128)   | (2, 32, 168, 168)   | Matmul                   |
| **Attention Output**   | (2, 32, 168, 168) @ V:(2,32,168,128) | (2, 32, 168, 128)   | Matmul                   |
| **Merge Heads**        | (2, 32, 168, 128)                    | (2, 168, 4096)      | view+transpose           |
| **Attn Out Proj**      | (2, 168, 4096)                       | (2, 168, 4096)      | 4096 × 4096              |
| **MLP Gate/Up**        | (2, 168, 4096)                       | 2 × (2, 168, 14336) | 2 × (4096 × 14336)       |
| **MLP Down Proj**      | (2, 168, 14336)                      | (2, 168, 4096)      | 14336 × 4096             |
| **Output Projection**  | (2, 168, 4096)                       | (2, 168, 128256)    | Weight tied to embedding |

------

## CRITICAL ARCHITECTURAL NOTES

### 1. **Grouped Query Attention (GQA)**

When `n_kv_heads < n_heads` (e.g., 8 vs 32):

- K projection: (2, 168, 4096) → (2, 168, 1024) = (2, 168, 8×128)
- V projection: (2, 168, 4096) → (2, 168, 1024) = (2, 168, 8×128)
- After reshape: K,V = (2, 8, 168, 128)
- K,V repeated 4× along head dim: (2, 8, 168, 128) → (2, 32, 168, 128)

### 2. **RoPE Dimensions**

- Position IDs: (T,) = (168,)
- Frequency vector: (head_dim/2,) = (64,)
- Sin/Cos embeddings: (1, 1, seq_len, head_dim) = (1, 1, 168, 128)
- Applied via rotation matrix to Q and K (not V)

### 3. **Non-Causal Attention**

- **Critical**: Attention mask is NOT causal (`is_causal=False`)
- All positions can attend to all positions (bidirectional)
- Attention scores shape: (2, 32, 168, 168) - full matrix, no masking

### 4. **MLP Expansion Ratio**

- Intermediate size / d_model = 14336 / 4096 ≈ 3.5
- Common ratios: 2.67 (Llama 2), 3.5 (Llama 3), 4.0 (generic)

### 5. **Memory Footprint (per layer, fp16)**

- Activations: ~2.7 MB (2 × 168 × 4096 × 2 bytes)
- Attention: Q,K,V projections + output = 4 × 4096² × 2 = ~134 MB
- MLP: gate + up + down = (2×4096×14336 + 14336×4096) × 2 = ~469 MB
- **Total per layer**: ~600 MB parameters

------

This complete dimensional trace allows you to understand exactly how tensors flow and transform through every single layer of the LLaDA architecture!

**Little term:** the Vanilla LLM inference (autoregressive) refers to the standard unmodified token by token generation process (traditional decoder only Transformer architecture)

Ideas: 1. the model has the speculative nature, the output block has internal token dependency distribution. So now there are two basic ideas for implementation

- Disorder and reconstruct just like Chinese character: 这个世是什样界么子的. The absolute distance between characters exist an over bound. Because in this way the dependency might be disordered which meet exactly the property of parallel generation of the texts. Then after generating the disordered text we can train a DNN to reconstruct the disordered thing. Something like a VAE
- Or we were to focus on the block dependency first because the generation of the block is autoregressive. and the text generation within a block is not autoregressive, does this work？？？ Bro this is such a .... alright not a good idea (not seems to be) Or other ideas. since the dependecy decays as the absolute distance of the word decreases. Bro this freaking idea might be applied somewhere.

One thing about the context problem is that  why can't we build a machine with unlimited context length? with freaking loading a piece one by a time to achieve this infinite DNN machine? 
