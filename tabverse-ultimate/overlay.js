// TabVerse Ultimate - Overlay Logic (runs in content script context)

export class TabVerseOverlay {
  constructor(shadowRoot) {
    this.windows = [];
    this.panes = [];
    this.licenseManager = null;
    this.isVisible = false;
    this.draggedElement = null;
    this.dragOffset = { x: 0, y: 0 };
    this.resizeHandle = null;
    this.shadowRoot = shadowRoot;
    
    this.init();
  }

  async init() {
    // Shadow root passed directly, no waiting needed
    this.setup();
  }

  async setup() {
    // Verify shadow root is available
    if (!this.shadowRoot) {
      console.error('TabVerse: Shadow root not available');
      return;
    }

    // License manager will be available globally
    this.licenseManager = window.tabverseLicense;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load saved windows and panes
    await this.loadSavedLayout();
  }

  setupEventListeners() {
    const root = this.shadowRoot.getElementById('tabverse-root');
    if (!root) {
      console.error('TabVerse: Root element not found in shadow DOM');
      return;
    }

    // Initialize with defaults FIRST to prevent race conditions
    this.blurMode = 'accessible'; // Default: no blur like DockOS
    this.autoHide = false; // Default: pinned (no auto-hide)
    
    // Apply defaults immediately
    this.applyBlurMode();
    this.applyAutoHide();

    // Load settings - then reapply if different from defaults
    try {
      chrome.storage.sync.get(['blurMode', 'autoHide'], (result) => {
        const newBlurMode = result.blurMode || 'accessible';
        const newAutoHide = result.autoHide || false;
        
        // Only reapply if changed
        if (newBlurMode !== this.blurMode) {
          this.blurMode = newBlurMode;
          this.applyBlurMode();
        }
        if (newAutoHide !== this.autoHide) {
          this.autoHide = newAutoHide;
          this.applyAutoHide();
        }
      });
    } catch (error) {
      // Extension context invalidated, defaults already applied
      console.warn('TabVerse: Failed to load preferences, using defaults');
    }

    // Control panel buttons - use shadowRoot to query
    this.shadowRoot.getElementById('add-window-btn')?.addEventListener('click', () => this.addWindow());
    this.shadowRoot.getElementById('split-horizontal-btn')?.addEventListener('click', () => this.splitPane('horizontal'));
    this.shadowRoot.getElementById('split-vertical-btn')?.addEventListener('click', () => this.splitPane('vertical'));
    this.shadowRoot.getElementById('toggle-ai-btn')?.addEventListener('click', () => this.toggleAI());
    this.shadowRoot.getElementById('widgets-menu-btn')?.addEventListener('click', () => this.toggleWidgetsMenu());
    this.shadowRoot.getElementById('blur-toggle-btn')?.addEventListener('click', () => this.toggleBlurMode());
    this.shadowRoot.getElementById('auto-hide-toggle-btn')?.addEventListener('click', () => this.toggleAutoHide());
    this.shadowRoot.getElementById('close-overlay-btn')?.addEventListener('click', () => this.closeOverlay());
    
    // Setup hover trigger for auto-hide
    this.setupAutoHideTrigger();

    // AI sidebar
    this.shadowRoot.getElementById('ai-close')?.addEventListener('click', () => this.toggleAI());
    this.shadowRoot.getElementById('ai-send')?.addEventListener('click', () => this.sendAIMessage());
    this.shadowRoot.getElementById('ai-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendAIMessage();
    });

    // Widgets menu
    this.shadowRoot.querySelectorAll('.widget-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const widgetType = item.dataset.widget;
        this.addWidgetWindow(widgetType);
        this.toggleWidgetsMenu();
      });
    });

    // Upgrade prompt
    this.shadowRoot.getElementById('upgrade-btn')?.addEventListener('click', () => this.showUpgradeOptions());
    this.shadowRoot.getElementById('close-upgrade-btn')?.addEventListener('click', () => this.hideUpgradePrompt());

    // Custom events from content.js (listen on window)
    window.addEventListener('tabverse-toggle', (e) => {
      this.isVisible = e.detail.visible;
      root.classList.toggle('tabverse-hidden', !this.isVisible);
    });

    window.addEventListener('tabverse-load-layout', (e) => {
      this.applyLayout(e.detail);
    });

    window.addEventListener('tabverse-toggle-ai', () => {
      this.toggleAI();
    });
  }

  async addWindow(type = 'empty', content = null) {
    const canAdd = await this.licenseManager.canAddWindow(this.windows.length);
    
    if (!canAdd) {
      this.showUpgradePrompt();
      return null;
    }

    const win = this.createWindow(type, content);
    this.windows.push(win);
    
    const container = this.shadowRoot.getElementById('windows-container');
    container?.appendChild(win.element);
    
    this.saveLayout();
    return win;
  }

  createWindow(type, content) {
    const windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const windowEl = document.createElement('div');
    windowEl.className = 'floating-window';
    windowEl.dataset.windowId = windowId;
    windowEl.dataset.type = type;
    
    // Random position for new windows
    const x = 100 + Math.random() * 300;
    const y = 100 + Math.random() * 200;
    
    windowEl.style.left = `${x}px`;
    windowEl.style.top = `${y}px`;
    windowEl.style.width = '400px';
    windowEl.style.height = '300px';
    
    windowEl.innerHTML = `
      <div class="window-header" data-testid="header-window-${windowId}">
        <span class="window-title">${this.getWindowTitle(type)}</span>
        <div class="window-controls">
          <button class="window-btn minimize" title="Minimize" data-testid="button-minimize-${windowId}">−</button>
          <button class="window-btn maximize" title="Maximize" data-testid="button-maximize-${windowId}">□</button>
          <button class="window-btn close" title="Close" data-testid="button-close-${windowId}">×</button>
        </div>
      </div>
      <div class="window-content" data-testid="content-window-${windowId}">
        ${content || this.getDefaultContent(type)}
      </div>
      <div class="window-resize-handle"></div>
    `;
    
    this.setupWindowDragging(windowEl);
    this.setupWindowResizing(windowEl);
    this.setupWindowControls(windowEl);
    
    return {
      id: windowId,
      type,
      element: windowEl,
      position: { x, y },
      size: { width: 400, height: 300 },
      minimized: false
    };
  }

  getWindowTitle(type) {
    const titles = {
      empty: 'New Window',
      clock: '🕐 Clock',
      todo: '✓ To-Do List',
      stats: '📊 Stats Counter',
      webview: '🌐 Web View'
    };
    return titles[type] || 'Window';
  }

  getDefaultContent(type) {
    if (type === 'empty') {
      return `
        <div class="empty-window">
          <p>Drag a widget here or add content</p>
          <button class="add-content-btn" data-testid="button-add-content">Add Content</button>
        </div>
      `;
    }
    return '<div class="window-loading">Loading...</div>';
  }

  setupWindowDragging(windowEl) {
    const header = windowEl.querySelector('.window-header');
    let isDragging = false;
    let currentX, currentY;
    let animationId = null;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-btn')) return;
      
      isDragging = true;
      this.draggedElement = windowEl;
      
      // Get current position from existing left/top
      const rect = windowEl.getBoundingClientRect();
      currentX = rect.left;
      currentY = rect.top;
      
      this.dragOffset = {
        x: e.clientX - currentX,
        y: e.clientY - currentY
      };
      
      windowEl.classList.add('dragging');
      windowEl.style.willChange = 'transform';
      
      const handleDrag = (e) => {
        if (!isDragging) return;
        
        currentX = e.clientX - this.dragOffset.x;
        currentY = e.clientY - this.dragOffset.y;
        
        // Use RAF for smooth updates
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          if (windowEl) {
            windowEl.style.left = `${currentX}px`;
            windowEl.style.top = `${currentY}px`;
          }
        });
      };
      
      const handleDragEnd = () => {
        isDragging = false;
        if (animationId) cancelAnimationFrame(animationId);
        
        if (windowEl) {
          windowEl.classList.remove('dragging');
          windowEl.style.willChange = 'auto';
          this.saveLayout();
        }
        
        this.draggedElement = null;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
      };
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    });
  }

  setupWindowResizing(windowEl) {
    const resizeHandle = windowEl.querySelector('.window-resize-handle');
    let isResizing = false;
    let currentWidth, currentHeight;
    let animationId = null;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      this.resizeHandle = windowEl;
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = windowEl.offsetWidth;
      const startHeight = windowEl.offsetHeight;
      
      windowEl.style.willChange = 'width, height';
      
      const handleResize = (e) => {
        if (!isResizing) return;
        
        currentWidth = startWidth + (e.clientX - startX);
        currentHeight = startHeight + (e.clientY - startY);
        
        // Use RAF for smooth updates
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          if (windowEl) {
            windowEl.style.width = `${Math.max(200, currentWidth)}px`;
            windowEl.style.height = `${Math.max(150, currentHeight)}px`;
          }
        });
      };
      
      const handleResizeEnd = () => {
        isResizing = false;
        if (animationId) cancelAnimationFrame(animationId);
        
        if (windowEl) {
          windowEl.style.willChange = 'auto';
          this.saveLayout();
        }
        
        this.resizeHandle = null;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
    });
  }

  setupWindowControls(windowEl) {
    const minimizeBtn = windowEl.querySelector('.window-btn.minimize');
    const maximizeBtn = windowEl.querySelector('.window-btn.maximize');
    const closeBtn = windowEl.querySelector('.window-btn.close');
    
    minimizeBtn?.addEventListener('click', () => {
      windowEl.classList.toggle('minimized');
      this.saveLayout();
    });
    
    maximizeBtn?.addEventListener('click', () => {
      windowEl.classList.toggle('maximized');
      this.saveLayout();
    });
    
    closeBtn?.addEventListener('click', () => {
      this.closeWindow(windowEl.dataset.windowId);
    });
  }

  closeWindow(windowId) {
    const index = this.windows.findIndex(w => w.id === windowId);
    if (index !== -1) {
      this.windows[index].element.remove();
      this.windows.splice(index, 1);
      this.saveLayout();
    }
  }

  async splitPane(direction) {
    const canAdd = await this.licenseManager.canAddPane(this.panes.length);
    
    if (!canAdd) {
      this.showUpgradePrompt();
      return;
    }
    
    // Split pane implementation
    const paneEl = document.createElement('div');
    paneEl.className = `split-pane ${direction}`;
    paneEl.innerHTML = `
      <div class="pane-content">
        <p>Pane ${this.panes.length + 1}</p>
      </div>
    `;
    
    this.shadowRoot.getElementById('panes-container')?.appendChild(paneEl);
    this.panes.push({ element: paneEl, direction });
    this.saveLayout();
  }

  toggleAI() {
    const sidebar = this.shadowRoot.getElementById('ai-sidebar');
    sidebar?.classList.toggle('hidden');
  }

  async sendAIMessage() {
    const input = this.shadowRoot.getElementById('ai-input');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    this.addAIMessage('user', message);
    input.value = '';
    
    // Send to AI module
    const response = await this.processAIRequest(message);
    this.addAIMessage('assistant', response);
  }

  addAIMessage(role, content) {
    const messagesContainer = this.shadowRoot.getElementById('ai-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;
    messageEl.textContent = content;
    messagesContainer?.appendChild(messageEl);
    messagesContainer?.scrollTo(0, messagesContainer.scrollHeight);
  }

  async processAIRequest(message) {
    // This will be handled by ai.js via window events
    return new Promise((resolve) => {
      const event = new CustomEvent('tabverse-ai-request', {
        detail: { message, pageText: document.body.innerText }
      });
      
      const responseHandler = (e) => {
        window.removeEventListener('tabverse-ai-response', responseHandler);
        resolve(e.detail.response);
      };
      
      window.addEventListener('tabverse-ai-response', responseHandler);
      window.dispatchEvent(event);
      
      // Fallback response after 5 seconds
      setTimeout(() => resolve('AI is processing...'), 5000);
    });
  }

  toggleWidgetsMenu() {
    const menu = this.shadowRoot.getElementById('widgets-menu');
    menu?.classList.toggle('hidden');
  }

  async addWidgetWindow(widgetType) {
    const window = await this.addWindow(widgetType);
    if (window) {
      this.loadWidget(window, widgetType);
    }
  }

  async loadWidget(window, type) {
    const content = window.element.querySelector('.window-content');
    
    try {
      const widgetModule = await import(chrome.runtime.getURL(`widgets/${type}.js`));
      const widget = new widgetModule.default(content);
      widget.render();
    } catch (error) {
      content.innerHTML = `<div class="widget-error">Failed to load ${type} widget</div>`;
    }
  }

  showUpgradePrompt() {
    this.shadowRoot.getElementById('upgrade-prompt')?.classList.remove('hidden');
  }

  hideUpgradePrompt() {
    this.shadowRoot.getElementById('upgrade-prompt')?.classList.add('hidden');
  }

  showUpgradeOptions() {
    // Send message to background to open settings (content scripts can't use openOptionsPage)
    try {
      chrome.runtime.sendMessage({ action: 'openSettings' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('TabVerse: Failed to open settings:', chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.warn('TabVerse: Extension context invalidated');
    }
  }

  toggleBlurMode() {
    this.blurMode = this.blurMode === 'blur' ? 'accessible' : 'blur';
    this.applyBlurMode();
    
    // Save preference
    try {
      chrome.storage.sync.set({ blurMode: this.blurMode });
    } catch (error) {
      console.warn('TabVerse: Failed to save blur mode preference');
    }
  }

  applyBlurMode() {
    const bgOverlay = this.shadowRoot.getElementById('background-overlay');
    const btn = this.shadowRoot.getElementById('blur-toggle-btn');
    
    if (this.blurMode === 'blur') {
      bgOverlay?.classList.add('background-blur');
      bgOverlay?.classList.remove('background-accessible');
      if (btn) {
        btn.innerHTML = '<span>👁️</span><span>Blur</span>';
        btn.title = 'Switch to Clear Mode (No Blur)';
      }
    } else {
      bgOverlay?.classList.remove('background-blur');
      bgOverlay?.classList.add('background-accessible');
      if (btn) {
        btn.innerHTML = '<span>🔓</span><span>Clear</span>';
        btn.title = 'Switch to Blur Mode';
      }
    }
  }

  toggleAutoHide() {
    this.autoHide = !this.autoHide;
    this.applyAutoHide();
    
    // Save preference
    try {
      chrome.storage.sync.set({ autoHide: this.autoHide });
    } catch (error) {
      console.warn('TabVerse: Failed to save auto-hide preference');
    }
  }

  applyAutoHide() {
    const controlPanel = this.shadowRoot.getElementById('control-panel');
    const trigger = this.shadowRoot.getElementById('control-panel-trigger');
    const btn = this.shadowRoot.getElementById('auto-hide-toggle-btn');
    
    if (this.autoHide) {
      // Auto-hide is ON - panel will hide when not hovering
      controlPanel?.classList.add('auto-hide');
      trigger?.classList.remove('hidden');
      if (btn) {
        btn.innerHTML = '<span>📌</span><span>Auto-Hide</span>';
        btn.title = 'Click to Pin Panel (Disable Auto-Hide)';
      }
    } else {
      // Auto-hide is OFF - panel is always visible (pinned)
      controlPanel?.classList.remove('auto-hide');
      trigger?.classList.add('hidden');
      if (btn) {
        btn.innerHTML = '<span>📍</span><span>Pinned</span>';
        btn.title = 'Click to Enable Auto-Hide';
      }
    }
  }

  setupAutoHideTrigger() {
    const trigger = this.shadowRoot.getElementById('control-panel-trigger');
    const controlPanel = this.shadowRoot.getElementById('control-panel');
    
    if (trigger && controlPanel) {
      trigger.addEventListener('mouseenter', () => {
        if (this.autoHide) {
          controlPanel.classList.add('show-on-hover');
        }
      });
      
      trigger.addEventListener('mouseleave', () => {
        controlPanel.classList.remove('show-on-hover');
      });
    }
  }

  closeOverlay() {
    const root = this.shadowRoot.getElementById('tabverse-root');
    root?.classList.add('tabverse-hidden');
    this.isVisible = false;
  }

  saveLayout() {
    const layout = {
      windows: this.windows.map(w => ({
        id: w.id,
        type: w.type,
        position: {
          x: parseInt(w.element.style.left),
          y: parseInt(w.element.style.top)
        },
        size: {
          width: parseInt(w.element.style.width),
          height: parseInt(w.element.style.height)
        },
        minimized: w.element.classList.contains('minimized'),
        maximized: w.element.classList.contains('maximized')
      })),
      panes: this.panes.map(p => ({
        direction: p.direction
      }))
    };
    
    const event = new CustomEvent('tabverse-save-layout', { detail: layout });
    window.dispatchEvent(event);
  }

  async loadSavedLayout() {
    // Will be loaded via event from content.js
  }

  applyLayout(layout) {
    if (!layout) return;
    
    // Clear existing
    this.windows.forEach(w => w.element.remove());
    this.windows = [];
    
    // Restore windows
    layout.windows?.forEach(async (savedWindow) => {
      const window = this.createWindow(savedWindow.type);
      window.element.style.left = `${savedWindow.position.x}px`;
      window.element.style.top = `${savedWindow.position.y}px`;
      window.element.style.width = `${savedWindow.size.width}px`;
      window.element.style.height = `${savedWindow.size.height}px`;
      
      if (savedWindow.minimized) window.element.classList.add('minimized');
      if (savedWindow.maximized) window.element.classList.add('maximized');
      
      this.windows.push(window);
      this.shadowRoot.getElementById('windows-container')?.appendChild(window.element);
      
      if (savedWindow.type !== 'empty') {
        await this.loadWidget(window, savedWindow.type);
      }
    });
  }
}

// Export for module import - instance created by content.js
