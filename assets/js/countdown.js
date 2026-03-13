/* countdown.js — Hero countdown to March 17, 2026 6PM PT */

(function () {
  // March 17, 2026 6:00 PM Pacific Time
  // PT = UTC-8 (standard), PDT = UTC-7 (daylight saving — March 8 2026 clocks spring forward)
  // March 17 is after March 8, so PDT is in effect: UTC-7 → UTC = Mar 17 2026 01:00 UTC+1 → Mar 18 01:00 UTC
  const TARGET = new Date('2026-03-18T01:00:00Z'); // Mar 17 6PM PDT = Mar 18 01:00 UTC

  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs'),
    wrapper: document.getElementById('countdown-wrapper'),
    live: document.getElementById('countdown-live'),
  };

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = Date.now();
    const diff = TARGET.getTime() - now;

    if (!els.days) return;

    if (diff <= 0) {
      // Workshop is live or over
      if (els.wrapper) els.wrapper.style.display = 'none';
      if (els.live) els.live.style.display = 'inline-flex';
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    els.days.textContent  = pad(d);
    els.hours.textContent = pad(h);
    els.mins.textContent  = pad(m);
    els.secs.textContent  = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();
