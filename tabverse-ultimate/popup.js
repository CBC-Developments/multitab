// TabVerse Ultimate - Popup Script

// Load license tier
chrome.storage.sync.get(['license'], (result) => {
  const tier = result.license || 'free';
  document.getElementById('license-tier').textContent = tier === 'premium' ? 'Premium ✨' : 'Free';
});

// Helper function to check if tab can receive messages
function isValidTab(tab) {
  const url = tab.url || '';
  // Content scripts can't run on chrome:// pages, extension pages, or chrome web store
  return !url.startsWith('chrome://') && 
         !url.startsWith('chrome-extension://') && 
         !url.startsWith('https://chrome.google.com/webstore');
}

// Helper function to send message with error handling
function sendMessageToTab(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      if (!isValidTab(tabs[0])) {
        showStatus('TabVerse cannot run on this page. Try a regular website!', 'warning');
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
        // Handle errors silently (content script might not be loaded yet)
        if (chrome.runtime.lastError) {
          console.log('TabVerse: Content script not ready yet');
          showStatus('Please refresh this page to use TabVerse', 'info');
        } else if (response && response.success) {
          showStatus('Success!', 'success');
        }
      });
    }
  });
}

// Show status message
function showStatus(message, type) {
  const existingStatus = document.querySelector('.status-message');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  const status = document.createElement('div');
  status.className = 'status-message';
  status.textContent = message;
  status.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    background: ${type === 'success' ? 'rgba(34, 197, 94, 0.2)' : type === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
    border: 1px solid ${type === 'success' ? '#22c55e' : type === 'warning' ? '#eab308' : '#3b82f6'};
    color: white;
    z-index: 10000;
  `;
  document.body.appendChild(status);
  
  setTimeout(() => {
    status.remove();
  }, 2000);
}

// Toggle overlay
document.getElementById('toggle-overlay-btn').addEventListener('click', () => {
  sendMessageToTab('toggle-overlay');
});

// Toggle AI assistant
document.getElementById('toggle-ai-btn').addEventListener('click', () => {
  sendMessageToTab('toggle-ai-assistant');
});

// Open settings
document.getElementById('open-settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Upgrade link
document.getElementById('upgrade-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
