/* know-your-ai.js — Break the AI Challenge + insight interactions */

(function () {

  // ── Round navigation ─────────────────────────────────────────
  document.querySelectorAll('.kya-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const round = pill.dataset.round;
      document.querySelectorAll('.kya-pill').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.kya-round').forEach(r => r.classList.remove('active'));
      pill.classList.add('active');
      document.getElementById('kya-round-' + round)?.classList.add('active');
    });
  });

  // ── Copy prompt buttons ──────────────────────────────────────
  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    }
  }

  document.querySelectorAll('.kya-copy-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.kya-prompt-wrap')?.querySelector('.kya-prompt-text');
      if (pre) copyText(pre.textContent.trim(), btn);
      window.showToast?.('Prompt copied — paste it into your AI tool!', 'success', 2500);
    });
  });

  // ── Reveal buttons ───────────────────────────────────────────
  document.querySelectorAll('.kya-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const round = btn.dataset.round;
      const panel = document.getElementById('kya-reveal-' + round);
      if (!panel) return;
      const open = !panel.classList.contains('visible');
      panel.classList.toggle('visible', open);
      btn.textContent = open ? '▲ Hide Results' : '▼ See What Usually Happens';
      btn.classList.toggle('open', open);
      if (open) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  // ── Checklist copy ───────────────────────────────────────────
  const CHECKLIST_TEXT = `Before Using Any AI Math Output in Class — 10-Question Checklist
(Source: NCTM 2024 + practitioner research)

 1. Did I solve every problem myself? (Not skim — actually work it out.)
 2. Is the method shown one I would accept from a student?
 3. Are the difficulty levels appropriate for my class and standards?
 4. Are the word problems actually solvable with clean answers?
 5. Does this match my curriculum sequence? (AI doesn't know what you've taught yet.)
 6. Does the vocabulary match my grade level?
 7. Any cultural or contextual issues with the scenarios used?
 8. What happens if a student asks the AI for help on this problem?
 9. Am I using this because it's genuinely better — or just faster?
10. Does this task require understanding, or can students complete it with pattern-matching?

Rule of thumb: If you can't verify it, don't hand it to students.`;

  document.getElementById('kya-copy-checklist')?.addEventListener('click', (e) => {
    copyText(CHECKLIST_TEXT, e.currentTarget);
    window.showToast?.('Checklist copied — save it somewhere you\'ll see it!', 'success', 3000);
  });

})();
