# Ideas on Block scheduling: Dynamics of Block-Wise Inference in Diffusion Large Language Models

## 1. Executive Summary: The Non-Autoregressive Paradigm Shift



The contemporary landscape of Natural Language Processing (NLP) is witnessing a fundamental schism between the established autoregressive (AR) hegemony and the nascent, yet rapidly maturing, paradigm of Diffusion Large Language Models (dLLMs). For the past half-decade, the sequential nature of the Transformer decoder—generating text one token at a time conditioned strictly on the past—has been the immutable law governing throughput. While this mechanism ensures high coherence, it imposes a rigid $O(N)$ latency floor, where $N$ is the sequence length, fundamentally tethering generation speed to memory bandwidth rather than compute capability.

Diffusion LLMs promise to shatter this barrier by reframing text generation not as a sequence of discrete classifications, but as a continuous denoising process. By modeling the joint distribution of an entire sequence (or large subsequences) simultaneously, dLLMs theoretically unlock massive parallelism, allowing for $O(1)$ or $O(K)$ generation steps where $K$ is the number of denoising iterations, independent of sequence length. However, the translation of this theoretical advantage into wall-clock superiority has revealed a complex optimization landscape defined by a phenomenon this report identifies as the **Throughput-Confidence Paradox**.

This paradox manifests in a counterintuitive relationship between inference block size and system throughput. In principle, larger blocks should maximize GPU saturation and amortization of overheads. In practice, increasing block sizes beyond a certain threshold (often empirically observed around 32 to 64 tokens) frequently yields diminishing returns or outright performance regression. This report posits that this behavior is not merely an artifact of unoptimized code, but a fundamental property arising from the tension between the **conditional independence assumptions** required for parallel decoding and the **entropy-driven decay of coherence** in natural language.

To dissect this problem, we synthesize a comprehensive body of recent literature, including pivotal works on "Spiffy" 1, "Discrete Diffusion Forcing" (D2F) 1, and "Fast-dLLM".1 We integrate emerging concepts such as **One-Shot Dynamic Thresholding (OSDT)** 2, **Truncated Block Diffusion** 3, and **Quokka Scaling Laws** 4 to construct a holistic view of the field. Our analysis culminates in the proposal of three distinct theories—The Entropy-Coherence Horizon, The Cache-Compute Intersection, and The Draft Graph Branching Capacity—which provide a rigorous mathematical and theoretical basis for determining optimal inference granularity.



## 2. Critical Literature Review and Hierarchy of Utility



The efficient deployment of dLLMs hinges on solving the "block size" problem—determining the optimal chunk of text to denoise in parallel. The current research corpus can be stratified by the granularity of their solution: those addressing the drafting mechanism, those restructuring the pipeline, and those optimizing the underlying probability foundations. We present a ranked analysis of the most critical contributions to this domain.



### Rank 1: Spiffy: Multiplying Diffusion LLM Acceleration via Lossless Speculative Decoding 

1



Utility: Paramount.

Analysis: This work represents the most sophisticated attempt to grapple with the probabilistic nature of parallel decoding. Unlike predecessor methods that rely on static block structures, Spiffy introduces the Directed Draft Graph. This construct is revolutionary because it acknowledges that the "optimal block" is not a fixed sequence of tokens, but a branching tree of probabilities. By allowing multiple parent nodes for a single draft token, Spiffy captures the bidirectional dependencies inherent in dLLMs.1 The paper’s rigorous treatment of "lossless" verification provides the necessary boundary conditions for any optimization theory; if the block size optimization breaks losslessness, it is invalid. Furthermore, Spiffy's use of auto-speculation—leveraging the target model's own distribution rather than an auxiliary model—streamlines the memory footprint, directly impacting the throughput calculations central to our inquiry.



### Rank 2: Diffusion LLMs Can Do Faster-Than-AR Inference via Discrete Diffusion Forcing (D2F) 

1



Utility: Extremely High.

Analysis: While Spiffy optimizes the content of the block, D2F optimizes the schedule. This paper is foundational for understanding the temporal dynamics of block-wise inference. It introduces the concept of Discrete Diffusion Forcing, which allows the model to effectively "borrow" confidence from the future. By employing a pipelined parallel decoding algorithm, D2F decouples the decoding of Block $N$ from the completion of Block $N-1$. This introduces a "semi-activated" state for blocks, effectively blurring the lines of "block size" into a continuous sliding window. The empirical data provided on the trade-offs between the "add threshold" ($\tau_{add}$) and "confidence threshold" ($\tau_{conf}$) is vital for modeling the Throughput-Confidence Paradox, as it quantifies the cost of premature speculation.1



### Rank 3: FAST-dLLM v2: Efficient Block-Diffusion LLM 

1



Utility: High.

Analysis: This research cements the architectural requirements for scalable block diffusion. Its primary contribution to the block size problem is the Hierarchical Caching Mechanism. By distinguishing between a "block-level cache" (inter-block) and a "sub-block cache" (intra-block), Fast-dLLM v2 provides the hardware-level substrates necessary to support large blocks. Without this hierarchical caching, the $O(N^2)$ attention cost within a large block would trivially dominate any parallelization gains. The paper also provides critical ablation studies (e.g., Figure 6 in the source) explicitly linking sub-block size to accuracy degradation, offering the raw data points needed to validate our theoretical models.1 The reduction in fine-tuning requirements (1B tokens vs 500B for Dream) also suggests that block-wise efficiency is deeply tied to training objectives.



### Rank 4: Fast-dLLM: Training-free Acceleration of Diffusion LLM 

1



Utility: High.

Analysis: This paper provides the mathematical "Theorem 1," which is the Rosetta Stone for understanding the Throughput-Confidence Paradox. The theorem establishes a hard bound on the error rate $\epsilon$ relative to the number of parallel tokens $n$: $(n+1)\epsilon \leq 1$. This inequality mathematically proves why simply doubling the block size fails when confidence is imperfect. It provides the "ground truth" mechanics for why parallel decoding collapses into incoherence, necessitating the Confidence-Aware Parallel Decoding strategy. This work is essential for deriving the "validity ratio" in our mathematical formulation.1



### Rank 5: Beyond Static Cutoffs: One-Shot Dynamic Thresholding (OSDT) 

2



Utility: Medium-High.

Analysis: This recent work addresses a critical flaw in previous methods like Fast-dLLM: the assumption of a static confidence threshold. OSDT demonstrates that confidence trajectories are highly input-dependent but consistent within a task. By calibrating thresholds on a single "one-shot" sequence, OSDT achieves significant throughput gains (+50% on HumanEval) without architectural changes. This directly informs the "Optimal Block Size" theory by suggesting that block size shouldn't just be static (e.g., 32 tokens) but dynamic based on the type of prompt processing.2



### Rank 6: Truncated Block Diffusion 

3



Utility: Medium.

Analysis: This paper introduces the concept of Attention Dilution, a crucial factor in the failure of large blocks. It argues that excessive masked tokens in a large block dilute the attention mechanism's ability to focus on relevant context, leading to hallucinations. This provides a distinct, non-probabilistic explanation for the paradox (structural attention failure vs. probabilistic confidence failure) and proposes dynamic truncation as a remedy.3



## 3. The Mechanics of Block-Wise Diffusion Inference



To analyze the optimization of block size, we must first establish a rigorous understanding of how "blocks" physically and mathematically exist within a Diffusion LLM. Unlike AR models where the "block" is implicitly a single token, dLLMs operate on a canvas of noise that is iteratively refined.



### 3.1. The Thermodynamic Origins and Discrete Translation



Diffusion models originate from non-equilibrium thermodynamics, modeling the reversal of entropy increase. In the continuous domain (images), this involves reversing a Gaussian noise process. In the discrete text domain, however, the process is categorical. As defined in the foundational literature for models like LLaDA 9 and Quokka 4, the forward process $q(x_t | x_0)$ introduces noise by masking tokens or swapping them with uniform random tokens.

The reverse process $p_\theta(x_{t-1} | x_t)$ is the inference engine. Ideally, for a sequence of length $L$, the model would predict the entire vector $X_0$ at every step $t$.



$$p_\theta(X_0 | X_t) = \prod_{i=1}^L p(x_i | X_t)$$



However, this full-sequence prediction is computationally intractable for long contexts due to the quadratic scaling of attention and the difficulty of training stable long-range dependencies from scratch.



### 3.2. The Block Diffusion Architecture



To mitigate these scaling issues, architectures like Block Diffusion (BD3-LM) 10 and LLaDA 9 introduce the concept of semi-autoregressive generation. The global sequence is partitioned into blocks $B_1, B_2, \dots, B_K$.



$$p(X) = \prod_{k=1}^K p(B_k | B_{<k})$$



Here, the inter-block dependency $p(B_k | B_{<k})$ is autoregressive—Block 2 waits for Block 1. However, the intra-block generation $p(B_k)$ is diffusion-based. Within Block $k$, consisting of $N_B$ tokens, the model performs iterative denoising in parallel.

This architecture creates a "Hybrid State" in memory:

- **Fixed Context (Past Blocks):** Treated as a key-value (KV) cache, similar to AR models. It is static and fully visible.
- **Active Context (Current Block):** A dynamic tensor of size $N_B$. This tensor undergoes bidirectional attention updates. The "draft" tokens here are fluid and subject to change until the diffusion process converges.



### 3.3. Draft Graphs: The Spiffy Innovation



**Spiffy** 1 complicates the definition of a "block" by introducing **Directed Draft Graphs**. In a standard dLLM, a block is a flat sequence. In Spiffy, the block is a directed acyclic graph (DAG) where each node represents a potential state of the sequence at a specific timestep.

- **Nodes:** States $S_{t, i}$ representing the $i$-th hypothesis at timestep $t$.
- **Edges:** Transition probabilities derived from the dLLM's predicted distribution.

The "size" of the block in Spiffy is effectively the depth and breadth of this graph. A "larger block" corresponds to a deeper graph (speculating further into the future) or a wider graph (considering more alternatives). Spiffy's innovation is the **lossless verification** of this entire graph structure in a single forward pass using a custom attention mask.1 This allows the model to accept non-contiguous tokens or jump multiple timesteps if a path in the graph aligns with the ground truth distribution.



### 3.4. Pipelined Decoding: The D2F Innovation



**Discrete Diffusion Forcing (D2F)** 1 challenges the rigid boundaries of blocks. In standard block diffusion, Block $k$ cannot start until Block $k-1$ is finished. D2F introduces **pipelining**: Block $k$ begins its diffusion process based on the *partial, noisy* state of Block $k-1$.

- **Semi-Activated State:** Block $k$ computes updates based on the low-confidence draft of Block $k-1$.
- **Fully-Activated State:** Once Block $k-1$ crosses a confidence threshold $\tau_{act}$, Block $k$ switches to aggressive decoding.

This mechanism effectively smears the "block size" across time. The effective window of active computation might span multiple blocks (e.g., 64 tokens in Block $k$ + 64 tokens in Block $k+1$), but they are at different stages of maturity.1



## 4. Mathematical Explanation of the Block Size vs. Throughput Paradox



The central dilemma facing dLLM deployment is the **Throughput-Confidence Paradox**. Intuition suggests that parallel systems scale linearly: if a GPU can process 512 tokens in parallel as easily as 256 (due to massive memory bandwidth), then doubling the block size $N_B$ should double throughput. Empirical evidence from Fast-dLLM 1 and LLaDA 11 refutes this, showing plateaus or regressions at larger sizes.



### 4.1. The Conditional Independence Violation



The paradox arises from the probabilistic assumptions required for parallel decoding. To generate $N_B$ tokens simultaneously, the model implicitly assumes conditional independence given the context $E$.



$$q(X_{block} | E) \approx \prod_{i=1}^{N_B} p(x_i | E)$$



The model predicts a marginal distribution for each token position independently. It then samples the most likely token for each position to form the block candidate.

However, natural language is highly correlated. The true joint distribution $p(X_{block} | E)$ captures dependencies: token $x_2$ ("House") depends on token $x_1$ ("White"). If the model predicts "Blue" for $x_1$ and "House" for $x_2$ independently, the resulting bigram "Blue House" might be valid, but if it predicts "High" for $x_1$ and "House" for $x_2$ (expecting "Full House" or "High Card"), the result "High House" is nonsensical.1



### 4.2. Mathematical Derivation of the Validity Collapse



We can formalize this using the bounds established in Theorem 1 of Fast-dLLM.1

Let $\epsilon$ be the error probability for a single token, such that the model's confidence $p(x_i | E) > 1 - \epsilon$.

For the greedy parallel decoding (product of marginals) to be equivalent to the true greedy sequential decoding (joint distribution), the following condition must hold:



$$(N_B + 1)\epsilon \le 1$$

Rearranging for the maximum viable block size $N_B^*$:

$$N_B^* \le \frac{1}{\epsilon} - 1$$

**The Paradox Mechanism:**

1. **Confidence Decay:** As we extend the block size $N_B$, we are predicting tokens further into the future. The epistemic uncertainty (entropy) of token $x_{N_B}$ is naturally higher than token $x_1$. Thus, $\epsilon$ is not constant; it grows with position $i$. Let $\epsilon_i$ be the error at position $i$ in the block.
2. **The Tightening Bound:** The condition $(N_B+1)\max(\epsilon_i) \le 1$ becomes impossibly strict as $N_B$ grows.
   - If $N_B=16$, we need $\epsilon \approx 0.05$ (95% confidence). This is achievable.
   - If $N_B=512$, we need $\epsilon \approx 0.0019$ (99.8% confidence). This is extremely rare for dLLMs, especially in early diffusion steps where noise is high.

If the condition is violated, the parallel decoding $q(X)$ diverges from the true distribution $p(X)$. This leads to **validity collapse**: the generated block contains incoherent n-grams. The verification step (or the next diffusion step) must reject these tokens or expend significant compute correcting them.



### 4.3. Throughput Formulation with Correction Penalty



We can model the Effective Throughput $\Theta$ as:



$$\Theta(N_B) = \frac{N_B \cdot \alpha(N_B, \epsilon)}{C_{step} + C_{attention}(N_B)}$$



Where:

- $C_{step}$ is the fixed cost of model weights.
- $C_{attention}(N_B)$ is the quadratic attention cost ($O(N_B^2)$).
- $\alpha(N_B, \epsilon)$ is the **Acceptance Rate**, which decays exponentially as $N_B$ exceeds the coherence limit $1/\epsilon$.

The Paradox: When $N_B$ is small, $\alpha \approx 1$. $\Theta$ grows linearly with $N_B$.

When $N_B$ becomes large, $\alpha$ drops precipitously (due to the violation of the independence theorem). Simultaneously, $C_{attention}$ grows quadratically. The numerator shrinks while the denominator grows, causing throughput to crash.



### 4.4. The Role of Attention Dilution



Recent work on **Truncated Block Diffusion** 3 adds a structural dimension to this paradox. It suggests that simply having many `tokens in the attention window dilutes the attention scores. In the softmax operation: $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$ If the key set $K$ contains hundreds of uninformative` tokens (large $N_B$), the probability mass of the softmax is spread thin over noise. This "Attention Dilution" lowers the signal-to-noise ratio for the valid tokens, effectively increasing $\epsilon$ and accelerating the validity collapse described above.



## 5. Three Distinct Theories for Determining Optimal Block Size



Moving beyond empirical trial-and-error, we propose three theoretical frameworks derived from the synthesis of the reviewed literature to systematically determine the optimal block size $N_B^*$.



### Theory 1: The Entropy-Coherence Horizon (ECH) Theory



**Premise:** The optimal block size is a dynamic variable inversely proportional to the local entropy (uncertainty) of the text generation stream.

Derivation:

Research from Fast-dLLM 1 and OSDT 2 confirms that confidence is not static. Some text segments (e.g., "The United States of...") have near-zero entropy; others (e.g., the punchline of a joke) have maximal entropy.

The "Theorem 1" bound $N_B \le 1/\epsilon$ implies that block size is a function of model confidence. Since confidence is a proxy for inverse entropy ($1/H$), we can postulate:



$$N_B^*(t) \propto \frac{k}{H(X_t | X_{<t})}$$



where $k$ is a model-specific constant derived from its calibration curve.

**Implication:** A static block size (e.g., fixed at 64) is suboptimal. An optimal system must employ **Adaptive Granularity**. It should estimate the entropy of the current context. If entropy is low (high confidence), it should expand the block size to 128 or 256 to maximize parallelism. If entropy is high (low confidence), it should contract the block size to 4 or 8 to prevent coherence collapse. This aligns with the findings of **AdaBlock-dLLM** 12, which adaptively aligns boundaries with semantic steps.



### Theory 2: The Cache-Compute Intersection (CCI) Theory



**Premise:** The optimal block size is the point where the marginal latency gain from KV cache reuse intersects with the marginal penalty of "cache staleness" updates.

Derivation:

Fast-dLLM v2 1 and DualCache 13 rely on reusing KV pairs from previous steps. However, this reuse is an approximation. In a diffusion model, the "true" KV pairs for token $i$ change slightly at every denoising step $t$ as the context evolves.

Let $E_{staleness}(N_B)$ be the error introduced by reusing cached keys/values across a block of size $N_B$. This error grows with $N_B$ because the divergence between the cached state (computed at step $t$) and the true state (needed at step $t+k$) increases.

Let $L_{refresh}$ be the latency cost of a full cache refresh.

The efficiency $\eta$ is maximized when:



$$\frac{\partial}{\partial N_B} \left( \frac{N_B}{L_{refresh}} \right) = \frac{\partial}{\partial N_B} E_{staleness}(N_B)$$

**Implication:** This theory explains why **DualCache** allows for larger blocks than simple PrefixCache. By caching suffix tokens (even if masked), DualCache reduces the $E_{staleness}$ gradient, shifting the intersection point to a larger $N_B$. It also suggests that hardware with faster memory bandwidth (lower $L_{refresh}$) should favor smaller, more frequent blocks to minimize staleness, while compute-bound hardware implies larger blocks to amortize the refresh.



### Theory 3: The Draft Graph Branching Capacity (DGBC) Theory



**Premise:** For speculative approaches like Spiffy, optimal block size is constrained by the memory bandwidth available to verify the combinatorial explosion of the draft graph.

Derivation:

In Spiffy 1, the "block" is a graph. A block of effective size $N_B$ might require checking a graph with $M$ nodes. If the language has a branching factor $\beta$ (average number of plausible next tokens), a tree of depth $N_B$ has $\beta^{N_B}$ nodes. Even with Spiffy's DAG compression, the number of edges grows super-linearly.

GPU kernels have a finite Arithmetic Intensity limit. If the number of nodes in the draft graph exceeds the capacity of the parallel verification kernel (limited by Shared Memory size or Register File size on the GPU), the verification step spills to slower memory hierarchy or requires serial execution.

Formulation:



$$N_B^* = \arg\max_D \left( \sum_{i=0}^D \text{Nodes}(i) \cdot \text{Cost}_{verify} \le \text{Bandwidth}_{saturation} \right)$$

**Implication:** This theory posits that block size is strictly hardware-dependent. On an NVIDIA A100 (high HBM bandwidth), one might support a "bushy" graph of depth 10. On consumer hardware, the graph must be pruned aggressively. This theory also integrates **BlockSpec** 14, which organizes tokens into tree exploration paths; the optimal path length is defined by the hardware's ability to verify that tree in a single kernel launch.



## 6. Detailed Analysis of Acceleration Methodologies





### 6.1. Spiffy: The Graph-Based Approach



Spiffy 1 fundamentally redefines the unit of generation. By utilizing **offline calibration**, Spiffy constructs a static "Draft Graph" that represents the most likely token transition patterns for a specific task.

- **Mechanism:** Instead of dynamically guessing $N_B$ tokens, Spiffy uses a pre-computed graph structure. If the calibration data shows that the model typically gets the first 3 tokens right but struggles on the 4th, the graph will be deep for levels 1-3 and wide at level 4.
- **Block Size Dynamics:** The "block size" in Spiffy is the depth of this calibrated graph. The offline calibration algorithm (Algorithm 2 in the paper) empirically finds the $N_B$ that maximizes acceptance $\sum (count(q) + \sum count(parents))$.
- **Comparison:** Unlike **SSD (Self Speculative Decoding)** 15 which uses the model itself for live drafting, Spiffy's drafts are structurally pre-determined, trading flexibility for extremely low runtime overhead (negligible drafting cost).



### 6.2. Faster-than-AR (D2F): The Pipelined Approach



D2F 1 attacks the latency problem via **Asynchronous Pipelining**.

- **Mechanism:** D2F breaks the dependency chain $B_1 \to B_2$. It allows $B_2$ to start denoising based on the *intermediate* state of $B_1$.
- **Block Size Dynamics:** Here, block size determines the "pipeline stage length." If $N_B$ is too large, the latency to get the first usable intermediate state from $B_1$ is too high, stalling the pipeline. If too small, the overhead of managing pipeline bubbles dominates. D2F empirically settles on blocks of 16-32 tokens as the sweet spot where pipeline saturation balances against coherence.
- **Paradox Resolution:** D2F mitigates the paradox by never demanding 100% confidence. The "semi-activated" blocks consume low-confidence inputs, effectively performing "speculative computation" that is refined as the previous block matures.



### 6.3. Fast-dLLM v2: The Hierarchical Caching Approach



Fast-dLLM v2 1 focuses on the memory hierarchy.

- **Mechanism:** It implements **DualCache**, caching both the prefix (past blocks) and the suffix (future masked tokens).
- **Block Size Dynamics:** Table 4 in the Fast-dLLM v2 paper demonstrates that mismatched training/inference block sizes degrade performance. This strongly supports the "Cache-Compute Intersection" theory. The model learns temporal dependencies during training based on a specific block window (e.g., 64). Forcing a 128-token window at inference violates the learned attention patterns, causing accuracy drops that necessitate re-generation (lowering throughput).
- **Data Efficiency:** The ability to fine-tune with only 1B tokens (vs 500B for Dream) suggests that block-wise constraints act as a strong inductive bias, helping the model converge faster by localizing the attention mechanism.



### 6.4. One-Shot Dynamic Thresholding (OSDT)



OSDT 2 introduces the temporal dimension to block optimization.

- **Mechanism:** Instead of a global confidence threshold $\tau$, OSDT profiles the confidence trajectory of a single sample input. It observes that confidence fluctuates predictably (e.g., drops at the start of a reasoning step, rises during rote text).
- **Block Size Dynamics:** OSDT implies that $N_B$ should not be spatially fixed but temporally adaptive. When the "confidence signature" is high, the block size effectively expands (more tokens accepted). When the signature dips, the effective block size contracts. This dynamic resizing achieves +50% throughput on HumanEval by avoiding the "over-confidence" pitfalls of static thresholds.



## 7. Comparative Analysis of Acceleration Strategies



To visualize the landscape of dLLM acceleration, we compare the core methodologies along key dimensions of block handling and throughput strategy.

| **Feature**          | **Spiffy**                           | **Faster-than-AR (D2F)**              | **Fast-dLLM v2**                   | **BlockSpec**            | **OSDT**                      |
| -------------------- | ------------------------------------ | ------------------------------------- | ---------------------------------- | ------------------------ | ----------------------------- |
| **Core Mechanism**   | Directed Draft Graphs                | Pipelined Diffusion Forcing           | Hierarchical KV Caching            | Tree-based Trajectory    | Dynamic Threshold Calibration |
| **Block Definition** | Depth of calibrated graph            | Pipeline stage length (16-32)         | Fixed window (aligned w/ training) | Tree exploration paths   | Dynamic confidence window     |
| **Paradox Solution** | Multi-path verification (redundancy) | Asynchronous overlap (hiding latency) | DualCache (minimizing re-compute)  | Speculative Trajectories | Input-specific calibration    |
| **Dependency**       | Bidirectional (Multi-parent)         | Inter-block Causal                    | Bidirectional (Approximate)        | Tree-structured          | Temporal Confidence           |
| **Key Insight**      | "Structure the uncertainty."         | "Start before you finish."            | "Cache the future (suffix)."       | "Branch the future."     | "Profile the uncertainty."    |





## 8. Hardware-Level Implications and the Roofline Model



The theoretical optimization of block size cannot be decoupled from the hardware reality. As detailed in the **Quokka** analysis 16, dLLMs exhibit distinct scaling behaviors compared to AR models.



### 8.1. The Roofline Analysis



The throughput of a dLLM is governed by the Roofline Model:



$$\text{Perf} = \min(\text{Peak GFLOPS}, \text{Peak Bandwidth} \times \text{Arithmetic Intensity})$$

- **AR Models:** Typically memory-bound. Every token requires loading the entire model weights.
- **Diffusion Models:** Can be compute-bound or memory-bound depending on $N_B$.
  - Small $N_B$: Memory-bound. We load model weights to generate few tokens. Low Arithmetic Intensity.
  - Large $N_B$: Compute-bound. The $O(N_B^2)$ attention mechanism increases Arithmetic Intensity.

The "optimal block size" is the point where the workload transitions from memory-bound to compute-bound. Pushing $N_B$ beyond this point (e.g., to 512 on an A100) yields **diminishing returns** because the system is no longer waiting for memory; it is waiting for tensor cores. Combined with the "Validity Collapse" (where algorithmic accuracy drops), this hardware saturation explains the hard ceiling on throughput observed in Figure 6 of Fast-dLLM.5



### 8.2. Batch Size Interaction



The acceleration strategies show distinct scaling with batch size. **DualCache** improves throughput as batch size increases (better amortization). In contrast, **Parallel Decoding** (and by extension, large block sizes) sees benefits *diminish* as batch size grows.16 This is because large batches already saturate the GPU's compute capacity. Adding parallel decoding (more compute per step) to a saturated GPU just increases latency without improving throughput. Thus, the optimal block size $N_B^*$ is inversely related to batch size.



## 9. Conclusion





The determination of optimal block size in Diffusion LLMs is a multivariate optimization problem that defies static constants. The "Throughput-Confidence Paradox"—the failure of large blocks to scale throughput linearly—is a fundamental property emerging from the violation of conditional independence assumptions in parallel decoding and the hardware saturation of compute resources.

Our analysis of Spiffy, D2F, and Fast-dLLM reveals that the industry is converging on **Adaptive Granularity**:

1. **Structural Adaptation:** Spiffy's graphs allow the "block" to be a flexible set of probabilistic paths rather than a rigid sequence.
2. **Temporal Adaptation:** D2F's pipelining and OSDT's dynamic thresholds allow the system to adjust its "effective block size" in real-time based on confidence signals.
3. **Hardware Alignment:** Fast-dLLM's caching strategies align the block size with the memory hierarchy to maximize arithmetic intensity.

**Future Outlook:** The next frontier lies in **Semantics-Aware Scheduling**, as hinted by AdaBlock-dLLM 12 and CtrlDiff.17 Future inference engines will likely employ lightweight "Lookahead Heads" (or leverage the dLLM's own internal confidence states) to dynamically predict the entropy of the upcoming sequence segment. They will then modulate the block size on-the-fly—expanding to 128+ tokens for low-entropy boilerplate code, and contracting to <8 tokens for high-entropy reasoning steps. This **Elastic Block Diffusion** represents the ultimate resolution to the paradox, matching the granularity of inference to the granularity of thought.