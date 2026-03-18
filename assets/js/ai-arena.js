/* ai-arena.js — Tab switching + launcher prompt buttons.
   No API calls — all tools link to free public websites. */

(function () {

  // ── Tab switching ─────────────────────────────────────────
  document.querySelectorAll('.arena-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.dataset.panel;
      document.querySelectorAll('.arena-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.arena-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(panelId)?.classList.add('active');
    });
  });

  // ── Launcher prompt buttons ───────────────────────────────
  // Click → copy prompt to clipboard → open tool in new tab → toast
  document.querySelectorAll('.launcher-prompts-grid').forEach(grid => {
    grid.addEventListener('click', async e => {
      const btn = e.target.closest('.launcher-prompt-btn');
      if (!btn) return;

      const toolUrl    = grid.dataset.toolUrl  || 'https://chatgpt.com/';
      const toolName   = grid.dataset.toolName || 'the tool';
      const promptText = btn.textContent.trim();

      try {
        await navigator.clipboard.writeText(promptText);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = promptText;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      btn.classList.add('copied');
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1500);

      window.showToast?.(`Prompt copied!`, 'success');
    });
  });

})();
