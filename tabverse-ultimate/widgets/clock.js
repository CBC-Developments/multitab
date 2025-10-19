// TabVerse Ultimate - Clock Widget

class ClockWidget {
  constructor(container) {
    this.container = container;
    this.updateInterval = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="clock-widget">
        <div class="clock-display">
          <div class="clock-time" id="clock-time" data-testid="text-clock-time">00:00:00</div>
          <div class="clock-date" id="clock-date" data-testid="text-clock-date">Loading...</div>
        </div>
        <div class="clock-timezone" id="clock-timezone" data-testid="text-clock-timezone">UTC</div>
      </div>
    `;

    this.startClock();
  }

  startClock() {
    this.updateClock();
    this.updateInterval = setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const now = new Date();
    
    // Time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    
    // Timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timeEl = this.container.querySelector('#clock-time');
    const dateEl = this.container.querySelector('#clock-date');
    const timezoneEl = this.container.querySelector('#clock-timezone');
    
    if (timeEl) timeEl.textContent = timeString;
    if (dateEl) dateEl.textContent = dateString;
    if (timezoneEl) timezoneEl.textContent = timezone;
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export default ClockWidget;
