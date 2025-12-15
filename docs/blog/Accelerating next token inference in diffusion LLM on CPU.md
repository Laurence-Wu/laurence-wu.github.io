# Accelerating next token inference in diffusion LLM on CPU

This is an idea that is already abandoned by my lab, but I love this idea. 

## **Motivation**

During the inference, we always use the same Gate and Up matrix. But the problem is that the Loading the Gate and Up matrix to the GPU takes the 90% time. So is there another way that we can just use the information on the GPU to calculate the SwiGLU output without have to load the Gate matrix every time ?

## **Ideas formulation and the math**

### Problem Definition:

Let the output at step $t$ be defined as $Y_t = X_t W_t$. We aim to compute $Y_{t+1}$ without explicitly accessing $W_t$.

**We assume there exists a transition matrix $C$ such that $Y_{t+1} = C Y_t$.**

Substituting the definition of $Y_t$, we get: $$Y_{t+1} = C (X_t W_t)$$ Since $Y_{t+1} = X_{t+1} W_t$, we can deduce the relationship between the inputs: $$C X_t = X_{t+1}$$

### Solving for $C$ via Pseudo-Inverse:

To find $C$, we must invert $X_t$. Since $X_t$ is generally not square, we use the right pseudo-inverse.

We seek an inverse in the form $X_t^{-1} = X_t^T (X_t X_t^T)^{-1}$. This yields the solution for $C$:

$$C = X_{t+1} X_t^{-1} = X_{t+1} X_t^T (X_t X_t^T)^{-1}$$ 

Substituting $C$ back into the equation for $Y_{t+1}$: $$Y_{t+1} = X_{t+1} X_t^T (X_t X_t^T)^{-1} Y_t$$

### Proof of Invertibility (Existence of MP Inverse):

For the term $(X_t X_t^T)^{-1}$ to exist, the matrix $X_t X_t^T$ must be full rank. We define $X_t \in \mathbb{R}^{S \times H}$, where $S$ is sequence length and $H$ is hidden dimension.

1. Consider a vector $x$ such that $X_t X_t^T x = 0$.

2. Left-multiply by $x^T$:

   $$x^T X_t X_t^T x = 0 \implies (X_t^T x)^T (X_t^T x) = 0 \implies \| X_t^T x \|^2 = 0$$

3. This implies $X_t^T x = 0$.

4. If $S \ll H$ (the standard inference case), the rows of $X_t$ (columns of $X_t^T$) are likely to be linearly independent. Therefore, the null space of $X_t^T$ contains only the zero vector.

5. Consequently, $x = 0$, proving that $X_t X_t^T$ is full rank and invertible.

------

## **3. Performance and Error Analysis**

### Speedup Metrics:

In our specific experimental setup, using a Hidden Layer dimension of $4 \times 12,288$ and a Sequence Length of $128$, this method achieved a 17x speedup. This observation matches theoretical expectations regarding computational complexity reduction **ON CPU**.![3d_surfaces_comprehensive_cpu](C:\Users\MSI\Desktop\WinCoding\laurence-wu.github.io\docs\blog\3d_surfaces_comprehensive_cpu.png)

### Constraint: Dimensionality & Stability:

The algorithm's performance is strictly tied to the relationship between the Sequence Length ($S$) and the Hidden Layer Dimension ($H$).

- **Optimal Case ($S \ll H$):** This is the typical scenario in real-world inference. The relative error is minimized because the vectors in the $S$ dimension are almost guaranteed to be linearly independent, ensuring $X_t X_t^T$ is well-conditioned.
- **Edge Case ($S \approx H$):** As $S$ approaches $H$, the probability of linear dependence among vectors increases. This makes the matrix $X_t X_t^T$ ill-conditioned, leading to significant approximation errors.

### Precision Limitations:

A minor relative error (approximately $<1\%$) is observed, which is attributed to the floating-point precision limitations of torch.inverse. However, given that real-world applications predominantly operate in the $S \ll H$ regime, these errors remain negligible, making the method highly effective for accelerating the method highly effective for acceleration.

## 4. BUT only on CPU

While this method demonstrates significant efficiency on CPU architectures (achieving a **17x speedup**), it encounters critical scalability limitations when deployed on GPUs.![3d_surfaces_comprehensive_gpu](C:\Users\MSI\Desktop\WinCoding\laurence-wu.github.io\docs\blog\3d_surfaces_comprehensive_gpu.png)

###  The Dimensionality Bottleneck:

The fundamental issue lies in the intermediate matrix operations required to reconstruct the effective linear mapping. In the GPU implementation, the multiplication of the intermediate matrices—specifically the projection of the pseudo-inverse onto the output space—effectively materializes a tensor of dimensions $d_{model} \times d_{model}$ (i.e., $H \times H$).

**Impact on Performance:**

1. **Memory Overhead:** Generating an intermediate matrix of size $d_{model} \times d_{model}$ forces the system to allocate memory equivalent to the original large weight matrix $W$. This directly contradicts the algorithm's primary motivation, which is to bypass the memory bandwidth costs associated with loading $W$.
2. **Experimental Validation:** Our experimental results confirm that while the CPU benefits from the reduced complexity of the sequential row-based operations, the GPU suffers from the memory latency and computational cost of handling the materialized $H \times H$ matrix. Consequently, this acceleration technique is currently viable **strictly for CPU-based inference**, as the GPU implementation fails to outperform the baseline due to these structural overheads.



## 5. Other potential pseudoinverse

SVD inverse and the left and right mp inverse, are the most common practice. But none of them really works to speed up the GPU execution. Theoretically you would want the sequence length * hidden_state >> d_model^2 to be able to speed up in the GPU, but this is almost impossible since the d_model is so big and hidden_state is usually just 4 ( or some other trivial constant) times the d_model.



## 6. **Conclusion: The Pseudo-Inverse Paradox**

Although this project was ultimately shelved, it remains a compelling case study in algorithmic optimization. By exploiting the linear independence inherent when Sequence Length ($S$) $\ll$ Hidden Dimension ($H$), we successfully bypassed the memory bandwidth bottleneck—converting heavy matrix loads into lightweight algebraic predictions.

**The Verdict:**

- **The Win:** A massive **17x speedup on CPU** with negligible accuracy loss ($<1\%$), proving that mathematical shortcuts can outperform brute force under specific constraints.
- **The Wall:** The approach is fundamentally **incompatible with GPUs**. The intermediate operations required to reconstruct the linear mapping materialize a massive $H \times H$ tensor, re-introducing the exact memory overhead we sought to eliminate.

While standard SVD or alternative inverses offer no respite from this dimensional explosion, this method stands as a powerful, albeit niche, technique for CPU-bound inference—a reminder that sometimes the most elegant mathematical solutions are strictly bound by the hardware that executes them.



