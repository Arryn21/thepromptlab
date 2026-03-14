/* activities.js — Countdown timers for 4 breakout activity cards (5-hour format) */

(function () {

  const ACTIVITIES = [
    { id: 'activity-1', duration: 1800 },  // 30 min — Prompt Makeover
    { id: 'activity-2', duration: 1800 },  // 30 min — Differentiation Challenge
    { id: 'activity-3', duration: 1800 },  // 30 min — AI Showdown
    { id: 'activity-4', duration: 1800 },  // 30 min — Math Viz Challenge
  ];

  ACTIVITIES.forEach(({ id, duration }) => {
    const card = document.getElementById(id);
    if (!card) return;

    const display = card.querySelector('.timer-display');
    const btn     = card.querySelector('.timer-btn');
    if (!display || !btn) return;

    let remaining = duration;
    let interval  = null;
    let running   = false;

    function pad(n) { return String(n).padStart(2, '0'); }

    function render() {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      display.textContent = `${pad(m)}:${pad(s)}`;

      if (remaining === 0) {
        display.style.color = '#ef4444';
        btn.textContent = 'Reset';
        window.showToast?.(`⏰ Time's up! Wrap up and share back to the main room.`, 'warning', 6000);
        running = false;
        clearInterval(interval);
      } else if (remaining <= 120) {
        // Last 2 minutes — yellow warning
        display.style.color = '#f0c040';
      } else {
        display.style.color = 'var(--accent-cyber)';
      }
    }

    render();

    btn.addEventListener('click', () => {
      if (remaining === 0) {
        remaining = duration;
        running = false;
        clearInterval(interval);
        btn.textContent = 'Start';
        render();
        return;
      }

      if (!running) {
        running = true;
        btn.textContent = 'Pause';
        interval = setInterval(() => {
          remaining--;
          render();
        }, 1000);
      } else {
        running = false;
        btn.textContent = 'Resume';
        clearInterval(interval);
      }
    });
  });

})();
