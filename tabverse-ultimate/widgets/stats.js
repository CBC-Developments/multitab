// TabVerse Ultimate - Stats Counter Widget

class StatsWidget {
  constructor(container) {
    this.container = container;
    this.stats = {
      windowsOpened: 0,
      panesCreated: 0,
      todosCompleted: 0,
      aiQueries: 0,
      sessionStart: new Date().toISOString()
    };
    this.loadStats();
  }

  render() {
    this.container.innerHTML = `
      <div class="stats-widget">
        <div class="stats-header">
          <h3>Session Stats</h3>
          <button id="reset-stats-btn" class="stats-reset-btn" data-testid="button-reset-stats">Reset</button>
        </div>
        <div class="stats-grid">
          <div class="stat-card" data-testid="stat-windows">
            <div class="stat-icon">🪟</div>
            <div class="stat-value" id="stat-windows">${this.stats.windowsOpened}</div>
            <div class="stat-label">Windows</div>
          </div>
          <div class="stat-card" data-testid="stat-panes">
            <div class="stat-icon">📐</div>
            <div class="stat-value" id="stat-panes">${this.stats.panesCreated}</div>
            <div class="stat-label">Panes</div>
          </div>
          <div class="stat-card" data-testid="stat-todos">
            <div class="stat-icon">✓</div>
            <div class="stat-value" id="stat-todos">${this.stats.todosCompleted}</div>
            <div class="stat-label">Tasks Done</div>
          </div>
          <div class="stat-card" data-testid="stat-ai">
            <div class="stat-icon">🤖</div>
            <div class="stat-value" id="stat-ai">${this.stats.aiQueries}</div>
            <div class="stat-label">AI Queries</div>
          </div>
        </div>
        <div class="stats-time" data-testid="text-session-time">
          Session: <span id="session-time">0m</span>
        </div>
      </div>
    `;

    this.setupListeners();
    this.startSessionTimer();
  }

  setupListeners() {
    const resetBtn = this.container.querySelector('#reset-stats-btn');
    resetBtn?.addEventListener('click', () => this.resetStats());

    // Listen for stat updates from other parts of the app
    document.addEventListener('tabverse-stat-update', (e) => {
      this.updateStat(e.detail.type, e.detail.increment);
    });
  }

  updateStat(type, increment = 1) {
    if (type in this.stats && typeof this.stats[type] === 'number') {
      this.stats[type] += increment;
      this.saveStats();
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const windowsEl = this.container.querySelector('#stat-windows');
    const panesEl = this.container.querySelector('#stat-panes');
    const todosEl = this.container.querySelector('#stat-todos');
    const aiEl = this.container.querySelector('#stat-ai');

    if (windowsEl) windowsEl.textContent = this.stats.windowsOpened;
    if (panesEl) panesEl.textContent = this.stats.panesCreated;
    if (todosEl) todosEl.textContent = this.stats.todosCompleted;
    if (aiEl) aiEl.textContent = this.stats.aiQueries;
  }

  startSessionTimer() {
    setInterval(() => {
      const sessionTime = this.container.querySelector('#session-time');
      if (sessionTime && this.stats.sessionStart) {
        const start = new Date(this.stats.sessionStart);
        const now = new Date();
        const minutes = Math.floor((now - start) / 60000);
        
        if (minutes < 60) {
          sessionTime.textContent = `${minutes}m`;
        } else {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          sessionTime.textContent = `${hours}h ${mins}m`;
        }
      }
    }, 60000); // Update every minute
  }

  resetStats() {
    this.stats = {
      windowsOpened: 0,
      panesCreated: 0,
      todosCompleted: 0,
      aiQueries: 0,
      sessionStart: new Date().toISOString()
    };
    this.saveStats();
    this.updateDisplay();
  }

  loadStats() {
    chrome.storage.local.get(['stats'], (result) => {
      if (result.stats) {
        this.stats = { ...this.stats, ...result.stats };
      }
      this.updateDisplay();
    });
  }

  saveStats() {
    chrome.storage.local.set({ stats: this.stats });
  }
}

export default StatsWidget;
