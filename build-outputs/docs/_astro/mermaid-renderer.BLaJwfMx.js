class v{constructor(){this.mermaidLoaded=!1,this.mermaidInitialized=!1,this.pendingDiagrams=new Set}async loadMermaid(){return window.mermaid?(this.mermaidLoaded=!0,window.mermaid):new Promise((o,r)=>{const e=document.createElement("script");e.src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js",e.onload=()=>{window.mermaid?(this.mermaidLoaded=!0,o(window.mermaid)):r(new Error("Mermaid failed to load"))},e.onerror=()=>r(new Error("Failed to load mermaid script")),document.head.appendChild(e)})}async initializeMermaid(){if(this.mermaidInitialized)return;(await this.loadMermaid()).initialize({startOnLoad:!1,theme:"neutral",themeVariables:{primaryColor:"#8A9A7E",primaryTextColor:"#2E3A59",primaryBorderColor:"#39647c",lineColor:"#2E3A59",secondaryColor:"#F4E9D8",tertiaryColor:"#A87C5D",background:"#ffffff",mainBkg:"#ffffff",secondaryBkg:"#F4E9D8",tertiaryBkg:"#8A9A7E",textColor:"#2E3A59",fontSize:"16px",fontFamily:"Montserrat, sans-serif"},securityLevel:"loose"}),this.mermaidInitialized=!0}async renderDiagram(o,r){try{await this.initializeMermaid();const e=document.querySelector(`#${o} .mermaid-container`);if(!e){console.error("Container not found for:",o);return}if(!r){console.error("No code provided for:",o);return}const{svg:n}=await window.mermaid.render(`${o}-svg`,r),t=document.createElement("div");t.className="mermaid-svg-wrapper",t.innerHTML=n;const a=document.createElement("div");a.className="mermaid-controls-sidebar",a.innerHTML=`
        <div class="mermaid-controls-toggle" title="Toggle Controls">⚙</div>
        <div class="mermaid-controls-panel">
          <button class="mermaid-btn zoom-in" title="Zoom In">+</button>
          <button class="mermaid-btn zoom-out" title="Zoom Out">−</button>
          <button class="mermaid-btn zoom-reset" title="Reset Zoom">⌂</button>
          <button class="mermaid-btn fullscreen" title="View Fullscreen">⛶</button>
        </div>
      `,e.innerHTML="",e.appendChild(t),e.appendChild(a),this.setupZoomControls(t,a,n,o)}catch(e){console.error("Mermaid rendering error for",o,":",e);const n=document.querySelector(`#${o} .mermaid-container`);n&&(n.innerHTML=`
          <div style="color: #ff6b6b; padding: 1rem; border: 1px solid #ff6b6b; border-radius: 4px;">
            <strong>Mermaid Error:</strong> ${e.message||"Unknown error"}
            <details style="margin-top: 0.5rem;">
              <summary>Show code</summary>
              <pre style="background: #f5f5f5; padding: 0.5rem; margin-top: 0.5rem; overflow-x: auto;"><code>${r}</code></pre>
            </details>
          </div>
        `)}}setupZoomControls(o,r,e,n){let t=.7;const a=o.querySelector("svg");function d(){a&&(a.style.transform=`scale(${t})`,a.style.transformOrigin="center center")}d();const f=r.querySelector(".mermaid-controls-toggle"),y=r.querySelector(".mermaid-controls-panel");f.addEventListener("click",()=>{y.classList.toggle("visible")}),r.querySelector(".zoom-in").addEventListener("click",()=>{t=Math.min(t+.2,3),d()}),r.querySelector(".zoom-out").addEventListener("click",()=>{t=Math.max(t-.2,.3),d()}),r.querySelector(".zoom-reset").addEventListener("click",()=>{t=.7,d()}),r.querySelector(".fullscreen").addEventListener("click",()=>{const i=document.createElement("div");i.className="mermaid-modal",i.innerHTML=`
        <div class="mermaid-modal-content">
          <div class="mermaid-modal-header">
            <h3>Diagram</h3>
            <button class="mermaid-modal-close">×</button>
          </div>
          <div class="mermaid-modal-body">
            ${e}
          </div>
        </div>
      `,document.body.appendChild(i);const m=()=>{document.body.removeChild(i)};i.querySelector(".mermaid-modal-close").addEventListener("click",m),i.addEventListener("click",s=>{s.target===i&&m()});const c=s=>{s.key==="Escape"&&(m(),document.removeEventListener("keydown",c))};document.addEventListener("keydown",c)}),o.addEventListener("click",i=>{i.target.closest(".mermaid-controls-sidebar")||(t=t<1?1:.7,d())})}async renderAllDiagrams(){const o=document.querySelectorAll(".mermaid-diagram");for(const r of o){const e=r.id,n=r.querySelector(".mermaid-code code");if(e&&n){const t=n.textContent?.trim();t&&await this.renderDiagram(e,t)}}}}const u=new v;function l(){u.renderAllDiagrams().catch(console.error)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",l):l();window.addEventListener("load",l);window.mermaidRenderer=u;
