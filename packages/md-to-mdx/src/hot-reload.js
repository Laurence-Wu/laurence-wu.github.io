/**
 * Hot Reload Integration for MD to MDX compilation
 */

const { logger } = require('./logger');

/**
 * Hot Reload Manager
 */
class HotReloadManager {
  constructor(options = {}) {
    this.options = {
      debounceDelay: 300,
      reloadDelay: 100,
      ...options
    };
    
    this.pendingReloads = new Set();
    this.debounceTimers = new Map();
    this.clients = new Set();
    
    this.logger = logger.child({ component: 'HotReloadManager' });
  }

  /**
   * Register a client for hot reload notifications
   */
  addClient(client) {
    this.clients.add(client);
    this.logger.debug('Hot reload client added', { 
      clientCount: this.clients.size 
    });
  }

  /**
   * Remove a client
   */
  removeClient(client) {
    this.clients.delete(client);
    this.logger.debug('Hot reload client removed', { 
      clientCount: this.clients.size 
    });
  }

  /**
   * Trigger hot reload for a file
   */
  triggerReload(filePath, changeType = 'update') {
    this.logger.debug('Hot reload triggered', { 
      file: filePath, 
      changeType 
    });
    
    // Debounce rapid file changes
    const debounceKey = filePath;
    
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }
    
    const timer = setTimeout(() => {
      this.executeReload(filePath, changeType);
      this.debounceTimers.delete(debounceKey);
    }, this.options.debounceDelay);
    
    this.debounceTimers.set(debounceKey, timer);
  }

  /**
   * Execute the actual reload
   */
  executeReload(filePath, changeType) {
    this.logger.info('Executing hot reload', { 
      file: filePath, 
      changeType,
      clients: this.clients.size 
    });
    
    // Notify all connected clients
    for (const client of this.clients) {
      try {
        this.notifyClient(client, filePath, changeType);
      } catch (error) {
        this.logger.warn('Failed to notify client', { 
          error: error.message 
        });
        // Remove failed client
        this.clients.delete(client);
      }
    }
  }

  /**
   * Notify a specific client
   */
  notifyClient(client, filePath, changeType) {
    const message = {
      type: 'md-to-mdx-update',
      file: filePath,
      changeType,
      timestamp: Date.now()
    };
    
    if (client.send) {
      // WebSocket client
      client.send(JSON.stringify(message));
    } else if (client.write) {
      // HTTP response stream
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    } else if (typeof client === 'function') {
      // Callback function
      client(message);
    }
  }

  /**
   * Create WebSocket server for hot reload
   */
  createWebSocketServer(server) {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
      this.addClient(ws);
      
      ws.on('close', () => {
        this.removeClient(ws);
      });
      
      ws.on('error', (error) => {
        this.logger.warn('WebSocket error', { error: error.message });
        this.removeClient(ws);
      });
    });
    
    this.logger.info('WebSocket server created for hot reload');
    return wss;
  }

  /**
   * Create Server-Sent Events endpoint
   */
  createSSEEndpoint() {
    return (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      // Send initial connection message
      res.write('data: {"type":"connected"}\n\n');
      
      this.addClient(res);
      
      req.on('close', () => {
        this.removeClient(res);
      });
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    
    // Close all clients
    for (const client of this.clients) {
      try {
        if (client.close) {
          client.close();
        } else if (client.end) {
          client.end();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.clients.clear();
    
    this.logger.info('Hot reload manager destroyed');
  }
}

/**
 * Vite Hot Reload Integration
 */
class ViteHotReload {
  constructor(server) {
    this.server = server;
    this.logger = logger.child({ component: 'ViteHotReload' });
  }

  triggerReload(filePath) {
    this.logger.info('Triggering Vite hot reload', { file: filePath });
    
    this.server.ws.send({
      type: 'full-reload'
    });
  }

  triggerUpdate(filePath) {
    this.logger.info('Triggering Vite HMR update', { file: filePath });
    
    // Convert .md to .mdx for the update
    const mdxPath = filePath.replace(/\.md$/, '.mdx');
    
    this.server.ws.send({
      type: 'update',
      updates: [{
        type: 'js-update',
        path: mdxPath,
        acceptedPath: mdxPath,
        timestamp: Date.now()
      }]
    });
  }
}

/**
 * Webpack Hot Reload Integration
 */
class WebpackHotReload {
  constructor(compiler) {
    this.compiler = compiler;
    this.logger = logger.child({ component: 'WebpackHotReload' });
  }

  triggerReload(filePath) {
    this.logger.info('Triggering Webpack hot reload', { file: filePath });
    
    // Invalidate the module
    if (this.compiler.watching) {
      this.compiler.watching.invalidate();
    }
  }
}

/**
 * Next.js Hot Reload Integration
 */
class NextJSHotReload {
  constructor(server) {
    this.server = server;
    this.logger = logger.child({ component: 'NextJSHotReload' });
  }

  triggerReload(filePath) {
    this.logger.info('Triggering Next.js hot reload', { file: filePath });
    
    // Next.js handles hot reload automatically for most cases
    // We just need to ensure the file change is detected
    if (this.server.hotReloader) {
      this.server.hotReloader.send('building');
    }
  }
}

/**
 * Browser Live Reload Script
 */
const BROWSER_LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  // Connect to hot reload server
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(protocol + '//' + location.host + '/md-to-mdx-hot-reload');
  
  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'md-to-mdx-update') {
      console.log('MD to MDX file updated:', data.file);
      
      // Reload the page
      location.reload();
    }
  };
  
  ws.onopen = function() {
    console.log('MD to MDX hot reload connected');
  };
  
  ws.onclose = function() {
    console.log('MD to MDX hot reload disconnected');
    
    // Try to reconnect after 1 second
    setTimeout(function() {
      location.reload();
    }, 1000);
  };
})();
</script>
`;

/**
 * Server-Sent Events Live Reload Script
 */
const SSE_LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  const eventSource = new EventSource('/md-to-mdx-hot-reload');
  
  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'md-to-mdx-update') {
      console.log('MD to MDX file updated:', data.file);
      location.reload();
    }
  };
  
  eventSource.onerror = function() {
    console.log('MD to MDX hot reload connection error');
    eventSource.close();
    
    // Try to reconnect after 2 seconds
    setTimeout(function() {
      location.reload();
    }, 2000);
  };
})();
</script>
`;

/**
 * Create hot reload integration for different environments
 */
function createHotReloadIntegration(environment, server) {
  switch (environment.toLowerCase()) {
    case 'vite':
      return new ViteHotReload(server);
    
    case 'webpack':
      return new WebpackHotReload(server);
    
    case 'nextjs':
      return new NextJSHotReload(server);
    
    default:
      return new HotReloadManager();
  }
}

module.exports = {
  HotReloadManager,
  ViteHotReload,
  WebpackHotReload,
  NextJSHotReload,
  createHotReloadIntegration,
  BROWSER_LIVE_RELOAD_SCRIPT,
  SSE_LIVE_RELOAD_SCRIPT
};
