// TabVerse Ultimate - Content Script (injected into all pages)

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.tabverseInjected) return;
  window.tabverseInjected = true;

  let overlayContainer = null;
  let shadowRoot = null;
  let isOverlayVisible = false;
  let currentDomain = window.location.hostname;

  // Helper: Check if extension context is valid
  function isExtensionValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  // Initialize TabVerse on page load
  function init() {
    createOverlayContainer();
    loadDomainLayout();
    setupMessageListeners();
  }

  // Create the main overlay container with Shadow DOM
  function createOverlayContainer() {
    if (!isExtensionValid()) {
      console.warn('TabVerse: Extension context invalidated, skipping initialization');
      return;
    }

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'tabverse-overlay-host';
    overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;

    // Use Shadow DOM to isolate styles
    shadowRoot = overlayContainer.attachShadow({ mode: 'open' });
    
    // Load overlay HTML and CSS
    fetch(chrome.runtime.getURL('overlay.html'))
      .then(response => response.text())
      .then(html => {
        // Inject background overlay div for blur mode toggle
        const modifiedHtml = html.replace(
          '<div id="tabverse-root"',
          '<div id="background-overlay" class="background-blur"></div><div id="tabverse-root"'
        );
        shadowRoot.innerHTML = modifiedHtml;
        injectStyles();
        initializeOverlay();
      })
      .catch(error => {
        if (!isExtensionValid()) {
          console.warn('TabVerse: Extension reloaded, cleaning up');
          return;
        }
        console.error('TabVerse: Failed to load overlay', error);
      });

    document.documentElement.appendChild(overlayContainer);
  }

  // Inject CSS into Shadow DOM
  function injectStyles() {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles/overlay.css');
    shadowRoot.appendChild(styleLink);
  }

  // Initialize overlay functionality
  async function initializeOverlay() {
    // Import modules dynamically in content script context
    try {
      // Load modules first
      const overlayModule = await import(chrome.runtime.getURL('overlay.js'));
      const licenseModule = await import(chrome.runtime.getURL('license.js'));
      const aiModule = await import(chrome.runtime.getURL('ai.js'));
      
      // Initialize dependencies FIRST and await their async initialization
      window.tabverseLicense = new licenseModule.LicenseManager();
      await window.tabverseLicense.ready; // Wait for license data to load
      
      window.tabverseAI = new aiModule.AIAssistant();
      await window.tabverseAI.init(); // Wait for AI settings to load
      
      // NOW initialize overlay (all dependencies are fully ready)
      window.tabverseOverlay = new overlayModule.TabVerseOverlay(shadowRoot);
      
    } catch (error) {
      console.error('TabVerse: Failed to load modules', error);
    }
  }

  // Load saved layout for current domain
  function loadDomainLayout() {
    if (!isExtensionValid()) return;
    
    try {
      chrome.storage.sync.get(['layouts'], (result) => {
        if (!isExtensionValid()) return;
        const layouts = result.layouts || {};
        if (layouts[currentDomain]) {
          applyLayout(layouts[currentDomain]);
        }
      });
    } catch (error) {
      console.warn('TabVerse: Failed to load layout', error);
    }
  }

  // Apply saved layout
  function applyLayout(layout) {
    // Send layout data to overlay.js via window event
    window.dispatchEvent(new CustomEvent('tabverse-load-layout', {
      detail: layout
    }));
  }

  // Toggle overlay visibility
  function toggleOverlay() {
    isOverlayVisible = !isOverlayVisible;
    if (overlayContainer) {
      overlayContainer.style.pointerEvents = isOverlayVisible ? 'auto' : 'none';
      overlayContainer.style.opacity = isOverlayVisible ? '1' : '0';
      
      // Notify overlay.js via window events
      window.dispatchEvent(new CustomEvent('tabverse-toggle', {
        detail: { visible: isOverlayVisible }
      }));
    }
  }

  // Toggle AI assistant
  function toggleAIAssistant() {
    window.dispatchEvent(new CustomEvent('tabverse-toggle-ai'));
  }

  // Setup message listeners
  function setupMessageListeners() {
    if (!isExtensionValid()) return;
    
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (!isExtensionValid()) {
          sendResponse({ error: 'Extension context invalidated' });
          return;
        }

        switch (request.action) {
          case 'toggle-overlay':
            toggleOverlay();
            sendResponse({ success: true });
            break;

          case 'toggle-ai-assistant':
            toggleAIAssistant();
            sendResponse({ success: true });
            break;

          case 'autoOpenOverlay':
            if (!isOverlayVisible) {
              toggleOverlay();
            }
            sendResponse({ success: true });
            break;

          case 'processAI':
            // Forward to AI module
            handleAIRequest(request.data)
              .then(response => sendResponse(response))
              .catch(error => sendResponse({ error: error.message }));
            return true;

          default:
            sendResponse({ error: 'Unknown action' });
        }
      });
    } catch (error) {
      console.warn('TabVerse: Failed to setup message listeners', error);
    }

    // Listen for layout save events from overlay (on window)
    window.addEventListener('tabverse-save-layout', (e) => {
      saveLayout(e.detail);
    });
  }

  // Save current layout
  function saveLayout(layout) {
    if (!isExtensionValid()) {
      console.warn('TabVerse: Extension context invalidated, cannot save layout');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({
        action: 'saveLayout',
        data: {
          domain: currentDomain,
          layout
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('TabVerse: Failed to save layout:', chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.warn('TabVerse: Error saving layout', error);
    }
  }

  // Handle AI requests
  async function handleAIRequest(data) {
    // This will be implemented by ai.js module
    const event = new CustomEvent('tabverse-ai-request', {
      detail: data
    });
    
    return new Promise((resolve) => {
      const responseHandler = (e) => {
        window.removeEventListener('tabverse-ai-response', responseHandler);
        resolve(e.detail);
      };
      window.addEventListener('tabverse-ai-response', responseHandler);
      window.dispatchEvent(event);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
