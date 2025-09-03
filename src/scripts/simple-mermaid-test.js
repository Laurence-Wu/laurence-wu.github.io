/**
 * Simple Mermaid Test Script
 * Minimal setup to test if Mermaid can render diagrams
 */

console.log('[Simple Mermaid Test] Starting...');

// Simple function to load and initialize Mermaid
async function loadAndTestMermaid() {
  try {
    console.log('[Simple Mermaid Test] Loading Mermaid from CDN...');
    
    // Load Mermaid if not already loaded
    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      console.log('[Simple Mermaid Test] Mermaid loaded from CDN');
    } else {
      console.log('[Simple Mermaid Test] Mermaid already available');
    }

    if (!window.mermaid) {
      throw new Error('Mermaid not available after loading');
    }

    console.log('[Simple Mermaid Test] Initializing Mermaid...');
    
    // Initialize Mermaid with simple config
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral'
    });

    console.log('[Simple Mermaid Test] Finding diagram elements...');
    
    // Find all mermaid diagrams
    const diagrams = document.querySelectorAll('.mermaid-diagram');
    console.log(`[Simple Mermaid Test] Found ${diagrams.length} diagrams`);

    // Process each diagram
    for (let i = 0; i < diagrams.length; i++) {
      const diagram = diagrams[i];
      const id = diagram.id || `test-diagram-${i}`;
      const codeElement = diagram.querySelector('.mermaid-code code');
      
      console.log(`[Simple Mermaid Test] Processing diagram ${id}`);
      
      if (codeElement) {
        const code = codeElement.textContent.trim();
        console.log(`[Simple Mermaid Test] Code for ${id}:`, code.substring(0, 100) + '...');
        
        try {
          // Render the diagram
          const { svg } = await window.mermaid.render(`${id}-render`, code);
          console.log(`[Simple Mermaid Test] SVG generated for ${id}`);
          
          // Replace the loading text with the SVG
          const container = diagram.querySelector('.mermaid-container');
          if (container) {
            container.innerHTML = svg;
            console.log(`[Simple Mermaid Test] SVG inserted for ${id}`);
          } else {
            console.error(`[Simple Mermaid Test] No container found for ${id}`);
          }
          
        } catch (renderError) {
          console.error(`[Simple Mermaid Test] Render error for ${id}:`, renderError);
          
          const container = diagram.querySelector('.mermaid-container');
          if (container) {
            container.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${renderError.message}</div>`;
          }
        }
      } else {
        console.error(`[Simple Mermaid Test] No code element found for ${id}`);
      }
    }

    console.log('[Simple Mermaid Test] Completed processing all diagrams');
    
  } catch (error) {
    console.error('[Simple Mermaid Test] Fatal error:', error);
  }
}

// Run the test when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndTestMermaid);
} else {
  loadAndTestMermaid();
}

// Export for manual testing
window.testMermaid = loadAndTestMermaid;