# generate function in the diffusion LLM

**It's actually quite a challenge to code the generate function for the diffusion LLM. Unlike Autoregressive LLM, you would need more coding to handle the edge cases.**

## Simple version for the diffusion LLM generate function

The entire workflow of the diffusion LLM generate function is as follows:

- set up the model (tokenizer / model) and apply the chat template
- prepare for the diffusion model: 
  - mask the desired generated length
  - base on the step and block size calculate the number of token unrevealed each step.
- for time_step in range(number_of_blocks) : send the masked input to the diffusion model
  - get the output logit
  - mask the output logit again so that the masked position will not affect the unmasking process
  - sort the tokens base on the embedding dimension and get the top N (N is the number of token you should mask at this point)
  - unmask the token base on the per step budget (N)
- repeat the for loop for unmasking the next block
- decode the final output

## D2F generate function implementation

The main idea behind this method is to add another block when the model is pretty confidence about the next block's token. This implementation also includes KV cache.

- Set-up model / Load configuration

  - Here's the block properties:

   ```json
    'start_pos': 0,
    'end_pos': prompt.shape[1],
    'mask_count': 0,
    'total_masks': prompt.shape[1],
    'state': 'to_cache',  # Prompt is immediately ready for caching
    'is_complete': True,  # Prompt is always in a complete state
   ```

- Check if a new block needs to be added.

  - If current_progress >= block_add_threshold then add the new block

    /* current progress = $\frac{unmasked}{total\_masked}$ */

- Update block complete states.

- Add the blocks with status == 'to_cache' to KV cache

- Create input sequence:

  - If cached, then start at the end of the 


