---
title: "Hy²: Accelerating Hybrid Mamba-Transformer Serving Through Adaptive GPU–PIM Co-Design"
description: "A co-design framework for serving hybrid Mamba-Transformer models on GPU–PIM heterogeneous hardware, achieving 1.51× throughput over prior art and 2.47× over GPU-only baselines while reducing tail latency to 0.61×."
pubDate: 2026-05-27
tags: ["GPU-PIM", "LLM Serving", "Mamba", "Hardware Architecture", "Systems", "Research", "Georgia Tech"]
thumbnail: "/projects/hy2/thumbnail.png"
---

## Overview

Hybrid Mamba-Transformer models combine the constant-time decoding of state space models (SSMs) with the in-context recall of attention, promising higher decode throughput, smaller KV-cache footprint, and lower serving cost than pure Transformers. But they create a fundamentally new serving challenge: **different operators within the same model have different hardware affinities that shift dynamically at runtime under continuous batching.**

- **SSM scans and attention GEMVs** are memory-bound — they belong on PIM, which provides bank-local bandwidth far exceeding the external HBM interface.
- **Linear projections (MLP/MoE)** are compute-bound at moderate-to-large batch sizes — they demand GPU-class throughput.
- As batching grows, operator arithmetic intensity shifts, meaning no static device assignment is optimal.

Existing GPU-only engines underutilize GPU compute on bandwidth-bound SSM scans. Existing GPU-PIM systems target uniform Transformer workloads with fixed operator partitioning. Hy² is the first system to address the full co-design problem for hybrid models under continuous batching.

## Key Challenges

**C1: PIM microarchitecture design.** Hybrid models interleave SSM and attention layers at architecture-specific ratios. The operators offloaded to PIM span a wide range of arithmetic intensities. The ideal PIM configuration — MAC count, buffer organization, precision — depends jointly on the target model architecture and the batch-size distribution at serving time.

**C2: Heterogeneous state management.** Hybrid models carry two structurally different per-request state types simultaneously:

- **KV caches** that grow with sequence length (paged, variable-size allocation)
- **SSM states** that are fixed-size per layer but updated in-place with sequential dependencies (slab allocation)

Both must be placed and potentially migrated across GPU HBM and PIM memory for many concurrent requests without pipeline stalls.

**C3: Runtime-adaptive scheduling.** Under continuous batching with chunked prefill, batch composition changes every iteration — shifting operator arithmetic intensity and therefore each operator's preferred device. No static assignment is optimal across the range of batch sizes encountered at runtime.

## The Hy² Framework

Hy² jointly addresses all three challenges through four integrated components:

### Hybrid Model Characterization

Hy² profiles all operator types across prefill and decode phases on GPU and PIM, producing cycle-level dataflow breakdowns that quantify arithmetic intensity, bandwidth demand, and compute utilization under varying batch sizes and sequence lengths. These profiles drive hardware design space exploration and scheduling policy design.

### Workload-Guided PIM Microarchitecture Exploration

Using the operator characterization, Hy² sweeps the PIM design space — MAC count, buffer organization, precision — under DRAM process constraints, identifying Pareto-optimal PIM configurations for hybrid model serving. Commercial PIM chips (Samsung HBM-PIM, SK Hynix GDDR6-AiM) demonstrate 20–27% die area overhead for placing FP16 MAC units within each bank.

### Unified State Management for Heterogeneous Memory

Hy² designs a memory management subsystem that unifies KV cache pages and SSM state blocks across GPU HBM and PIM memory. The system supports efficient allocation, placement, and in-place update of both state types for concurrent requests without pipeline stalls, handling the paged (variable-size) vs. slab (fixed-size) allocation semantics each state type requires.

### Adaptive GPU–PIM Serving Scheduler

Hy² develops a runtime scheduler that maps operators to GPU or PIM based on their profiled characteristics and the current serving load, adapting per layer and per phase as batch size and sequence length change under continuous batching, while enforcing per-request SLO latency targets (TTFT, TBT).

## Results

Hy² was evaluated on five representative hybrid models — including Nemotron-H 8B, Zamba2 7B, and Hybra 1.5B — spanning dense hybrid and MoE hybrid architectures across a wide range of SSM-to-attention ratios.

| Metric | Result |
| ------ | ------ |
| Throughput over prior GPU-PIM art | **1.51×** average |
| Throughput over GPU-only baselines | **2.47×** average |
| Tail latency vs. prior GPU-PIM art | reduced to **0.61×** |

Key findings from the roofline analysis:

- SSM state updates stay memory-bound at all batch sizes (AI ≈ 0.38); PIM is always preferable
- Attention GEMVs stay memory-bound regardless of batch size (AI ≈ 4.0); PIM is always preferable
- MLP crosses the compute-bound threshold with batch size; GPU takes over as batching amortizes weight access
- At B=128, SSM and attention account for 84% of full-model GPU-only decode time — the regime where Hy² provides the largest gains

## Authors

Xiaoyou Wu et al. — Georgia Institute of Technology

Under submission, ASPLOS 2027
