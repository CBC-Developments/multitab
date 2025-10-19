// TabVerse Ultimate - Settings Page Script

class SettingsManager {
  constructor() {
    this.settings = {
      theme: {
        primaryColor: '#0f172a',
        accentColor: '#06b6d4',
        opacity: 0.95,
        blurStrength: 10
      },
      license: 'free',
      domainRules: {},
      aiSettings: {
        enabled: true,
        useAPI: false,
        apiKey: '',
        promptStyle: 'concise'
      }
    };

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (result) => {
        this.settings = { ...this.settings, ...result };
        resolve();
      });
    });
  }

  setupEventListeners() {
    // License verification
    document.getElementById('verify-license-btn')?.addEventListener('click', () => {
      this.verifyLicense();
    });

    // AI settings
    document.getElementById('ai-enabled')?.addEventListener('change', (e) => {
      this.settings.aiSettings.enabled = e.target.checked;
    });

    document.getElementById('ai-use-api')?.addEventListener('change', (e) => {
      this.settings.aiSettings.useAPI = e.target.checked;
    });

    document.getElementById('ai-api-key')?.addEventListener('input', (e) => {
      this.settings.aiSettings.apiKey = e.target.value;
    });

    document.getElementById('ai-prompt-style')?.addEventListener('change', (e) => {
      this.settings.aiSettings.promptStyle = e.target.value;
    });

    // Theme settings
    document.getElementById('theme-primary')?.addEventListener('change', (e) => {
      this.settings.theme.primaryColor = e.target.value;
    });

    document.getElementById('theme-accent')?.addEventListener('change', (e) => {
      this.settings.theme.accentColor = e.target.value;
    });

    document.getElementById('theme-opacity')?.addEventListener('input', (e) => {
      this.settings.theme.opacity = parseFloat(e.target.value);
    });

    document.getElementById('theme-blur')?.addEventListener('input', (e) => {
      this.settings.theme.blurStrength = parseInt(e.target.value);
    });

    // Domain rules
    document.getElementById('add-domain-btn')?.addEventListener('click', () => {
      this.addDomainRule();
    });

    // Actions
    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('export-settings-btn')?.addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
      this.resetSettings();
    });
  }

  updateUI() {
    // Update license info
    this.updateLicenseUI();

    // Update AI settings
    const aiEnabledEl = document.getElementById('ai-enabled');
    const aiUseAPIEl = document.getElementById('ai-use-api');
    const aiAPIKeyEl = document.getElementById('ai-api-key');
    const aiPromptStyleEl = document.getElementById('ai-prompt-style');

    if (aiEnabledEl) aiEnabledEl.checked = this.settings.aiSettings.enabled;
    if (aiUseAPIEl) aiUseAPIEl.checked = this.settings.aiSettings.useAPI;
    if (aiAPIKeyEl) aiAPIKeyEl.value = this.settings.aiSettings.apiKey;
    if (aiPromptStyleEl) aiPromptStyleEl.value = this.settings.aiSettings.promptStyle;

    // Update theme settings
    const themePrimaryEl = document.getElementById('theme-primary');
    const themeAccentEl = document.getElementById('theme-accent');
    const themeOpacityEl = document.getElementById('theme-opacity');
    const themeBlurEl = document.getElementById('theme-blur');

    if (themePrimaryEl) themePrimaryEl.value = this.settings.theme.primaryColor;
    if (themeAccentEl) themeAccentEl.value = this.settings.theme.accentColor;
    if (themeOpacityEl) themeOpacityEl.value = this.settings.theme.opacity;
    if (themeBlurEl) themeBlurEl.value = this.settings.theme.blurStrength;

    // Update domain rules
    this.renderDomainRules();
  }

  updateLicenseUI() {
    const tierEl = document.getElementById('current-tier');
    const descEl = document.getElementById('tier-description');
    const featuresEl = document.getElementById('tier-features');

    const isPremium = this.settings.license === 'premium';

    if (tierEl) tierEl.textContent = isPremium ? 'Premium Tier ✨' : 'Free Tier';
    if (descEl) descEl.textContent = isPremium ? 'Full access to all features' : 'Limited features';

    if (featuresEl) {
      if (isPremium) {
        featuresEl.innerHTML = `
          <li>Unlimited floating windows</li>
          <li>Unlimited split panes</li>
          <li>AI assistant with API support</li>
          <li>Cross-device sync</li>
          <li>Advanced customization</li>
        `;
      } else {
        featuresEl.innerHTML = `
          <li>3 floating windows</li>
          <li>1 pane layout</li>
          <li>Basic widgets</li>
          <li>Local storage only</li>
        `;
      }
    }
  }

  async verifyLicense() {
    const input = document.getElementById('license-key-input');
    const statusEl = document.getElementById('license-status');
    const key = input?.value.trim();

    if (!key) {
      this.showStatus(statusEl, 'Please enter a license key', 'error');
      return;
    }

    // Simulate verification (stubbed for now)
    if (key === 'TABVERSE-PREMIUM-DEMO') {
      this.settings.license = 'premium';
      await this.saveSettings();
      this.updateLicenseUI();
      this.showStatus(statusEl, 'License verified! You now have Premium access.', 'success');
      if (input) input.value = '';
    } else {
      this.showStatus(statusEl, 'Invalid license key. Try: TABVERSE-PREMIUM-DEMO', 'error');
    }
  }

  addDomainRule() {
    const input = document.getElementById('domain-input');
    const domain = input?.value.trim();

    if (!domain) return;

    this.settings.domainRules[domain] = {
      autoOpen: true,
      widgets: []
    };

    this.renderDomainRules();
    if (input) input.value = '';
  }

  removeDomainRule(domain) {
    delete this.settings.domainRules[domain];
    this.renderDomainRules();
  }

  renderDomainRules() {
    const container = document.getElementById('domain-rules-list');
    if (!container) return;

    const domains = Object.keys(this.settings.domainRules);

    if (domains.length === 0) {
      container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5); padding: 20px; text-align: center;">No domain rules configured</p>';
      return;
    }

    container.innerHTML = domains.map(domain => `
      <div class="domain-rule-item">
        <span>${domain}</span>
        <button class="button-danger" onclick="settingsManager.removeDomainRule('${domain}')">Remove</button>
      </div>
    `).join('');
  }

  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(this.settings, () => {
        const statusEl = document.getElementById('save-status');
        this.showStatus(statusEl, 'Settings saved successfully!', 'success');
        resolve();
      });
    });
  }

  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tabverse-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  async resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    this.settings = {
      theme: {
        primaryColor: '#0f172a',
        accentColor: '#06b6d4',
        opacity: 0.95,
        blurStrength: 10
      },
      license: 'free',
      domainRules: {},
      aiSettings: {
        enabled: true,
        useAPI: false,
        apiKey: '',
        promptStyle: 'concise'
      }
    };

    await this.saveSettings();
    this.updateUI();
  }

  showStatus(element, message, type) {
    if (!element) return;

    element.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    
    setTimeout(() => {
      element.innerHTML = '';
    }, 5000);
  }
}

// Initialize settings manager
const settingsManager = new SettingsManager();
