/**
 * Mermaid Diagram Renderer
 * Handles loading and rendering of mermaid diagrams
 */

class MermaidRenderer {
  constructor() {
    this.mermaidLoaded = false;
    this.mermaidInitialized = false;
    this.pendingDiagrams = new Set();
  }

  async loadMermaid() {
    if (window.mermaid) {
      this.mermaidLoaded = true;
      return window.mermaid;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js";
      script.onload = () => {
        if (window.mermaid) {
          this.mermaidLoaded = true;
          resolve(window.mermaid);
        } else {
          reject(new Error("Mermaid failed to load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load mermaid script"));
      document.head.appendChild(script);
    });
  }

  async initializeMermaid() {
    if (this.mermaidInitialized) return;

    const mermaid = await this.loadMermaid();

    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      themeVariables: {
        primaryColor: "#8A9A7E",
        primaryTextColor: "#2E3A59",
        primaryBorderColor: "#39647c",
        lineColor: "#2E3A59",
        secondaryColor: "#F4E9D8",
        tertiaryColor: "#A87C5D",
        background: "#ffffff",
        mainBkg: "#ffffff",
        secondaryBkg: "#F4E9D8",
        tertiaryBkg: "#8A9A7E",
        textColor: "#2E3A59",
        fontSize: "16px",
        fontFamily: "Montserrat, sans-serif",
      },
      securityLevel: "loose",
    });

    this.mermaidInitialized = true;
  }

  async renderDiagram(diagramId, code) {
    try {
      await this.initializeMermaid();

      const container = document.querySelector(
        `#${diagramId} .mermaid-container`
      );
      if (!container) {
        return;
      }

      if (!code) {
        return;
      }

      // Render the diagram
      const { svg } = await window.mermaid.render(`${diagramId}-svg`, code);

      // Create wrapper with zoom functionality
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-svg-wrapper";
      wrapper.innerHTML = svg;

      container.innerHTML = "";
      container.appendChild(wrapper);

      // Add controls to the source section
      const sourceSection = container
        .closest(".mermaid-diagram")
        .querySelector(".mermaid-source");
      if (sourceSection) {
        const controlsPanel = this.addControlsToSource(
          sourceSection,
          wrapper,
          svg,
          diagramId
        );
        // Add zoom functionality
        this.setupZoomControls(wrapper, controlsPanel, svg, diagramId);
      }
    } catch (error) {
      const container = document.querySelector(
        `#${diagramId} .mermaid-container`
      );
      if (container) {
        container.innerHTML = `
          <div style="color: #ff6b6b; padding: 1rem; border: 1px solid #ff6b6b; border-radius: 4px;">
            <strong>Mermaid Error:</strong> ${error.message || "Unknown error"}
            <details style="margin-top: 0.5rem;">
              <summary>Show code</summary>
              <pre style="background: #f5f5f5; padding: 0.5rem; margin-top: 0.5rem; overflow-x: auto;"><code>${code}</code></pre>
            </details>
          </div>
        `;
      }
    }
  }

  addControlsToSource(sourceSection, wrapper, svg, diagramId) {
    // Add controls directly to the source summary bar
    const summary = sourceSection.querySelector("summary");
    if (!summary) return null;

    // Create controls panel and add it directly to the summary
    const controlsPanel = document.createElement("div");
    controlsPanel.className = "mermaid-controls-panel";
    controlsPanel.innerHTML = `
      <button class="mermaid-btn zoom-in" title="Zoom In" aria-label="Zoom In">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      <button class="mermaid-btn zoom-out" title="Zoom Out" aria-label="Zoom Out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      <button class="mermaid-btn zoom-reset" title="Reset Zoom" aria-label="Reset Zoom">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3.8 3.8 20.2 20.2M16 16l4 4m-4-10V4M10 10H4"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
      <button class="mermaid-btn fullscreen" title="View Fullscreen" aria-label="View Fullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
      </button>
    `;

    // Add controls to the summary bar
    summary.appendChild(controlsPanel);

    return controlsPanel;
  }

  setupZoomControls(wrapper, controlsContainer, svg, diagramId) {
    let currentScale = 0.7; // Start smaller
    const svgElement = wrapper.querySelector("svg");

    function updateScale() {
      if (svgElement) {
        svgElement.style.transform = `scale(${currentScale})`;
        svgElement.style.transformOrigin = "center center";
      }
    }

    // Initial scale
    updateScale();

    // Zoom controls
    controlsContainer
      .querySelector(".zoom-in")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentScale = Math.min(currentScale + 0.2, 3);
        updateScale();
      });

    controlsContainer
      .querySelector(".zoom-out")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentScale = Math.max(currentScale - 0.2, 0.3);
        updateScale();
      });

    controlsContainer
      .querySelector(".zoom-reset")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentScale = 0.7;
        updateScale();
      });

    // Fullscreen modal
    controlsContainer
      .querySelector(".fullscreen")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modal = document.createElement("div");
        modal.className = "mermaid-modal";
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

        modal
          .querySelector(".mermaid-modal-close")
          .addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
          if (e.target === modal) closeModal();
        });

        // ESC key to close
        const handleEsc = (e) => {
          if (e.key === "Escape") {
            closeModal();
            document.removeEventListener("keydown", handleEsc);
          }
        };
        document.addEventListener("keydown", handleEsc);
      });

    // Click to zoom functionality
    wrapper.addEventListener("click", (e) => {
      if (e.target.closest(".mermaid-controls-container")) return;
      currentScale = currentScale < 1 ? 1 : 0.7;
      updateScale();
    });
  }

  // Auto-discover and render all mermaid diagrams
  async renderAllDiagrams() {
    const diagrams = document.querySelectorAll(".mermaid-diagram");

    for (const diagram of diagrams) {
      const diagramId = diagram.id;
      const codeElement = diagram.querySelector(".mermaid-code code");

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
  mermaidRenderer.renderAllDiagrams().catch(() => {});
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMermaid);
} else {
  initMermaid();
}

// Also try after window load as fallback
window.addEventListener("load", initMermaid);

// Export for manual use
window.mermaidRenderer = mermaidRenderer;
