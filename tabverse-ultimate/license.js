// TabVerse Ultimate - License Management

export class LicenseManager {
  constructor() {
    this.tiers = {
      free: {
        maxWindows: 3,
        maxPanes: 1,
        syncEnabled: false,
        aiEnabled: false,
        advancedCustomization: false
      },
      premium: {
        maxWindows: Infinity,
        maxPanes: Infinity,
        syncEnabled: true,
        aiEnabled: true,
        advancedCustomization: true,
        price: 5.00
      }
    };
    this.currentTier = null;
    this.ready = this.initialize();
  }

  async initialize() {
    // Pre-load current tier for synchronous access
    this.currentTier = await this.getCurrentTier();
    
    // Listen for storage changes to update tier across tabs
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.license) {
        this.currentTier = changes.license.newValue || 'free';
        // Emit event so overlay can react to tier changes
        window.dispatchEvent(new CustomEvent('tabverse-license-changed', {
          detail: { tier: this.currentTier }
        }));
      }
    });
    
    return true;
  }

  async getCurrentTier() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['license'], (result) => {
        resolve(result.license || 'free');
      });
    });
  }

  async getTierLimits(tier = null) {
    if (!tier) {
      tier = this.currentTier || await this.getCurrentTier();
    }
    return this.tiers[tier] || this.tiers.free;
  }

  async canAddWindow(currentCount) {
    const limits = await this.getTierLimits(this.currentTier);
    return currentCount < limits.maxWindows;
  }

  async canAddPane(currentCount) {
    const limits = await this.getTierLimits(this.currentTier);
    return currentCount < limits.maxPanes;
  }

  async isFeatureEnabled(feature) {
    const limits = await this.getTierLimits();
    return limits[feature] === true;
  }

  // Stubbed verification - ready for real API integration
  async verifyLicenseKey(key) {
    // TODO: Integrate with real payment API (Stripe, PayPal, etc.)
    // For now, accept a demo key
    if (key === 'TABVERSE-PREMIUM-DEMO') {
      await this.upgradeToPremium();
      return { success: true, tier: 'premium' };
    }
    return { success: false, error: 'Invalid license key' };
  }

  async upgradeToPremium() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ license: 'premium' }, () => {
        this.currentTier = 'premium'; // Update cached tier immediately
        resolve({ success: true });
      });
    });
  }

  async downgradToFree() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ license: 'free' }, () => {
        this.currentTier = 'free'; // Update cached tier immediately
        resolve({ success: true });
      });
    });
  }

  getPricingInfo() {
    return {
      free: {
        name: 'Free',
        price: 0,
        features: [
          '3 floating windows',
          '1 pane layout',
          'Basic widgets',
          'Local storage only'
        ]
      },
      premium: {
        name: 'Premium',
        price: 5.00,
        period: 'month',
        features: [
          'Unlimited floating windows',
          'Unlimited split panes',
          'AI assistant with API support',
          'Cross-device sync',
          'Advanced customization',
          'Domain-specific rules',
          'Priority support'
        ]
      }
    };
  }
}

// ES module export handled above
