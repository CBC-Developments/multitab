// TabVerse Ultimate - Background Service Worker

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    theme: {
      primaryColor: '#0f172a',
      accentColor: '#06b6d4',
      opacity: 0.95,
      blurStrength: 10
    },
    license: 'free',
    domainRules: {},
    layouts: {},
    aiSettings: {
      enabled: true,
      useAPI: false,
      apiKey: '',
      promptStyle: 'concise'
    },
    shortcuts: {
      'toggle-overlay': 'Alt+T',
      'toggle-ai-assistant': 'Alt+A'
    }
  };

  chrome.storage.sync.get(['theme', 'license', 'domainRules', 'layouts', 'aiSettings'], (result) => {
    if (!result.theme) {
      chrome.storage.sync.set({ theme: defaults.theme });
    }
    if (!result.license) {
      chrome.storage.sync.set({ license: defaults.license });
    }
    if (!result.domainRules) {
      chrome.storage.sync.set({ domainRules: defaults.domainRules });
    }
    if (!result.layouts) {
      chrome.storage.sync.set({ layouts: defaults.layouts });
    }
    if (!result.aiSettings) {
      chrome.storage.sync.set({ aiSettings: defaults.aiSettings });
    }
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: command,
        source: 'background'
      });
    }
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSettings') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getLicense') {
    chrome.storage.sync.get(['license'], (result) => {
      sendResponse({ license: result.license || 'free' });
    });
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ settings });
    });
    return true;
  }

  if (request.action === 'saveLayout') {
    const { domain, layout } = request.data;
    chrome.storage.sync.get(['layouts'], (result) => {
      const layouts = result.layouts || {};
      layouts[domain] = layout;
      chrome.storage.sync.set({ layouts }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'aiAssist') {
    // Forward AI requests to be handled by ai.js in content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'processAI',
          data: request.data
        }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }
});

// Listen for tab updates to inject overlay if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = new URL(tab.url).hostname;
    
    chrome.storage.sync.get(['domainRules'], (result) => {
      const domainRules = result.domainRules || {};
      if (domainRules[domain]?.autoOpen) {
        chrome.tabs.sendMessage(tabId, {
          action: 'autoOpenOverlay',
          domain
        });
      }
    });
  }
});
