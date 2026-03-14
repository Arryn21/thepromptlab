/* prompt-generator.js — Prompt Workshop: Build + Improve modes */

(function () {

  // ── Mode toggle ───────────────────────────────────────────────
  document.querySelectorAll('.pw-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      document.querySelectorAll('.pw-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pw-panel-build').classList.toggle('hidden', mode !== 'build');
      document.getElementById('pw-panel-improve').classList.toggle('hidden', mode !== 'improve');
    });
  });

  // ── Copy helper ───────────────────────────────────────────────
  async function copyText(text, btn, label) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    }
    window.showToast?.(label || 'Prompt copied!', 'success', 3000);
  }

  // ── Mode 1: Copy Build prompt ─────────────────────────────────
  document.getElementById('pw-copy-build')?.addEventListener('click', () => {
    const text = document.getElementById('pw-text-build')?.textContent || '';
    copyText(text, document.getElementById('pw-copy-build'),
      'Meta-prompt copied — paste it into ChatGPT or Claude!');
  });

  // ── Mode 2: Improve existing ──────────────────────────────────
  const IMPROVE_PREFIX = `You are a professional prompt engineer and educator. I am going to give you a prompt I have written. Your job is to transform it into something significantly more powerful and to teach me exactly what was wrong and how you fixed it.

Here is my prompt:

`;

  const IMPROVE_SUFFIX = `

─────────────────────────────────────────
STEP 1 — DIAGNOSE WHAT'S WEAK
─────────────────────────────────────────
Give me a frank, line-by-line critique of my prompt. For each weakness you find:
- Name the problem precisely (e.g. "no role assigned," "vague task," "no output format," "AI has too much to guess")
- Explain what bad output this weakness typically produces
- Rate its severity: Minor / Significant / Critical

─────────────────────────────────────────
STEP 2 — THREE REBUILT VERSIONS
─────────────────────────────────────────
Rewrite my prompt three times, each progressively more powerful:

VERSION 1 — FIXED
Fix only the Critical and Significant problems. Keep it close to my original structure and wording so the improvement feels accessible.
After the prompt, annotate every change using [CHANGED: reason] inline so I can see exactly what you touched and why.

VERSION 2 — REBUILT
Rewrite from scratch using professional prompt engineering principles. Same goal as my original, entirely new architecture.
After the prompt, explain every structural decision: why you chose this role, how you framed the task, what the format instruction achieves, what the constraints prevent, and what you removed and why.

VERSION 3 — MAXIMUM POWER
The highest-performing version of this prompt. You must include:
- A specific expert role with named credentials, experience level, and the professional mindset I want the AI to adopt
- Rich context: who the audience is, what they already know, what success looks like
- An explicit output structure with labeled sections, approximate lengths, and formatting rules
- Hard constraints: what to include, what to exclude, what tone to use, what to never do
- At least one concrete example embedded in the prompt showing the style or quality expected
- A self-check instruction at the very end: before outputting, the AI must verify it has met every stated requirement
After the prompt, explain every advanced technique used, what problem it solves, and when a teacher should reach for this level vs. Version 2.

─────────────────────────────────────────
STEP 3 — TEACH ME WHAT I'M MISSING
─────────────────────────────────────────
Based on the gap between my original and your best version, identify the 3 prompting skills I most urgently need to develop. For each one:
- State the skill as a one-sentence rule I can remember
- Show a before/after example — NOT from my prompt, write a brand new one — that isolates exactly how applying this skill changes the AI's output
- Tell me when to apply it and when it's overkill

─────────────────────────────────────────
STEP 4 — GIVE ME A REUSABLE TEMPLATE
─────────────────────────────────────────
End with a prompt template — a reusable skeleton I can apply to any future prompt with a similar goal. Label every section:
[REQUIRED] — always include this
[RECOMMENDED] — include unless you're in a hurry
[OPTIONAL] — only when you need maximum quality

This template should reflect what you learned about my specific use case, not a generic one.`;

  const input    = document.getElementById('pw-improve-input');
  const output   = document.getElementById('pw-combined-output');
  const charEl   = document.getElementById('pw-improve-chars');
  const copyBtn  = document.getElementById('pw-copy-improve');

  function updateCombined() {
    const userPrompt = input?.value?.trim() || '';
    if (charEl) charEl.textContent = (input?.value?.length || 0) + ' chars';

    if (!userPrompt) {
      if (output) {
        output.textContent = '← Paste your prompt above and the full meta-prompt will appear here, ready to copy.';
        output.classList.remove('has-content');
      }
      return;
    }

    const combined = IMPROVE_PREFIX + userPrompt + IMPROVE_SUFFIX;
    if (output) {
      output.textContent = combined;
      output.classList.add('has-content');
    }
  }

  input?.addEventListener('input', updateCombined);

  copyBtn?.addEventListener('click', () => {
    const userPrompt = input?.value?.trim() || '';
    if (!userPrompt) {
      window.showToast?.('Paste your existing prompt first!', 'warning', 2000);
      return;
    }
    const combined = IMPROVE_PREFIX + userPrompt + IMPROVE_SUFFIX;
    copyText(combined, copyBtn, 'Combined prompt copied — paste it into ChatGPT or Claude!');
  });

})();
