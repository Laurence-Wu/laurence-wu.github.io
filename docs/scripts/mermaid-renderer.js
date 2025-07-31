/**
 * Simplified Mermaid Diagram Renderer
 * Handles loading and rendering of mermaid diagrams with zoom and fullscreen controls
 */

class MermaidRenderer {
  constructor() {
    this.mermaidLoaded = false;
    this.mermaidInitialized = false;
  }

  async loadMermaid() {
    if (window.mermaid) {
      this.mermaidLoaded = true;
      return window.mermaid;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.8.1/dist/mermaid.min.js';
      script.onload = () => {
        if (window.mermaid) {
          this.mermaidLoaded = true;
          resolve(window.mermaid);
        } else {
          reject(new Error('Mermaid failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load mermaid script'));
      document.head.appendChild(script);
    });
  }

  async initializeMermaid() {
    if (this.mermaidInitialized) return;

    const mermaid = await this.loadMermaid();
    
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'neutral',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#2563eb',
        lineColor: '#374151',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#e5e7eb',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondaryBkg: '#f9fafb',
        textColor: '#1f2937',
        fontSize: '16px'
      },
      securityLevel: 'loose'
    });
    
    this.mermaidInitialized = true;
  }

  async renderDiagram(diagramId, code) {
    try {
      await this.initializeMermaid();
      
      const container = document.querySelector(`#${diagramId} .mermaid-container`);
      if (!container) {
        console.error('Container not found for:', diagramId);
        return;
      }
      
      if (!code) {
        console.error('No code provided for:', diagramId);
        return;
      }

      // Render the diagram
      const { svg } = await window.mermaid.render(`${diagramId}-svg`, code);
      
      // Create wrapper with zoom functionality
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-svg-wrapper';
      wrapper.innerHTML = svg;
      
      container.innerHTML = '';
      container.appendChild(wrapper);
      
      // Add controls to the source section
      const sourceSection = container.closest('.mermaid-diagram').querySelector('.mermaid-source');
      if (sourceSection) {
        this.addControlsToSource(sourceSection, wrapper, svg);
        this.setupZoomControls(wrapper, sourceSection);
      }
      
    } catch (error) {
      console.error('Mermaid rendering error for', diagramId, ':', error);
      const container = document.querySelector(`#${diagramId} .mermaid-container`);
      if (container) {
        container.innerHTML = `
          <div style="color: #ef4444; padding: 1rem; border: 1px solid #ef4444; border-radius: 4px;">
            <strong>Mermaid Error:</strong> ${error.message || 'Unknown error'}
            <details style="margin-top: 0.5rem;">
              <summary>Show code</summary>
              <pre style="background: #f5f5f5; padding: 0.5rem; margin-top: 0.5rem; overflow-x: auto;"><code>${code}</code></pre>
            </details>
          </div>
        `;
      }
    }
  }

  addControlsToSource(sourceSection, wrapper, svg) {
    const summary = sourceSection.querySelector('summary');
    if (!summary) return;
    
    // Create controls panel
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'mermaid-controls-panel';
    controlsPanel.innerHTML = `
      <button class="mermaid-btn zoom-in" title="Zoom In">+</button>
      <button class="mermaid-btn zoom-out" title="Zoom Out">−</button>
      <button class="mermaid-btn zoom-reset" title="Reset Zoom">⌂</button>
      <button class="mermaid-btn fullscreen" title="View Fullscreen">⛶</button>
    `;
    
    summary.appendChild(controlsPanel);
    
    // Fullscreen functionality
    controlsPanel.querySelector('.fullscreen').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showFullscreen(svg);
    });
  }

  setupZoomControls(wrapper, sourceSection) {
    let currentScale = 0.8;
    const svgElement = wrapper.querySelector('svg');
    const controlsPanel = sourceSection.querySelector('.mermaid-controls-panel');
    
    if (!svgElement || !controlsPanel) return;
    
    function updateScale() {
      svgElement.style.transform = `scale(${currentScale})`;
      svgElement.style.transformOrigin = 'center center';
    }
    
    // Initial scale
    updateScale();
    
    // Zoom controls
    controlsPanel.querySelector('.zoom-in').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentScale = Math.min(currentScale + 0.2, 3);
      updateScale();
    });
    
    controlsPanel.querySelector('.zoom-out').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentScale = Math.max(currentScale - 0.2, 0.3);
      updateScale();
    });
    
    controlsPanel.querySelector('.zoom-reset').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentScale = 0.8;
      updateScale();
    });
  }

  showFullscreen(svg) {
    const modal = document.createElement('div');
    modal.className = 'mermaid-modal';
    modal.innerHTML = `
      <div class="mermaid-modal-content">
        <div class="mermaid-modal-header">
          <h3>Diagram</h3>
          <button class="mermaid-modal-close">×</button>
        </div>
        <div class="mermaid-modal-body">
          ${svg}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    modal.querySelector('.mermaid-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  // Auto-discover and render all mermaid diagrams
  async renderAllDiagrams() {
    const diagrams = document.querySelectorAll('.mermaid-diagram');
    
    for (const diagram of diagrams) {
      const diagramId = diagram.id;
      const codeElement = diagram.querySelector('.mermaid-code code');
      
      if (diagramId && codeElement) {
        const code = codeElement.textContent?.trim();
        if (code) {
          await this.renderDiagram(diagramId, code);
        }
      }
    }
  }
}

// Initialize and render diagrams when DOM is ready
const mermaidRenderer = new MermaidRenderer();

function initMermaid() {
  mermaidRenderer.renderAllDiagrams().catch(console.error);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMermaid);
} else {
  initMermaid();
}

// Export for manual use
window.mermaidRenderer = mermaidRenderer;