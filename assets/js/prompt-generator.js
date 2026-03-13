/* prompt-generator.js — RTFC live preview builder */

(function () {

  const TEMPLATES = [
    {
      label: 'Worksheet',
      role: 'experienced high school [SUBJECT] teacher',
      task: 'create a [NUMBER]-question practice worksheet on [TOPIC] for [GRADE] students with space for student work',
      format: 'a clean printable with problems numbered 1-[NUMBER] and a separate answer key page',
      criteria: 'aligned to Common Core standards, all answers integers only'
    },
    {
      label: 'Lesson Plan',
      role: 'experienced [GRADE] [SUBJECT] teacher designing a 60-minute lesson',
      task: 'design a complete lesson plan on [TOPIC] with warm-up, instruction, guided practice, and exit ticket',
      format: 'a structured document with time allocations and materials list',
      criteria: 'aligned to California Common Core, usable by a substitute teacher'
    },
    {
      label: 'Parent Email',
      role: '[GRADE] [SUBJECT] teacher at a California high school',
      task: 'write an email to parents explaining what we\'re covering this month ([TOPIC]) and how they can support their child',
      format: 'a professional but friendly email, under 150 words',
      criteria: 'jargon-free, warm tone, actionable tips that don\'t require math knowledge'
    },
    {
      label: 'Exit Ticket',
      role: 'expert [GRADE] [SUBJECT] teacher',
      task: 'create 5 exit ticket questions on [TOPIC] covering conceptual, procedural, and application levels',
      format: 'numbered questions with space for answers, each completable in 2-3 minutes',
      criteria: 'varied question types, includes answer key, appropriate grade-level difficulty'
    }
  ];

  const roleInput     = document.getElementById('rtfc-role');
  const taskInput     = document.getElementById('rtfc-task');
  const formatInput   = document.getElementById('rtfc-format');
  const criteriaInput = document.getElementById('rtfc-criteria');
  const previewBox    = document.getElementById('rtfc-preview');
  const charCount     = document.getElementById('rtfc-char-count');
  const wordCount     = document.getElementById('rtfc-word-count');
  const copyBtn       = document.getElementById('rtfc-copy');
  const clearBtn      = document.getElementById('rtfc-clear');
  const arenaBtn      = document.getElementById('rtfc-to-arena');
  const templateChips = document.querySelectorAll('.template-chip');

  if (!previewBox) return;

  function buildPrompt() {
    const role     = roleInput?.value.trim() || '';
    const task     = taskInput?.value.trim() || '';
    const format   = formatInput?.value.trim() || '';
    const criteria = criteriaInput?.value.trim() || '';

    if (!role && !task && !format && !criteria) return '';

    const parts = [];
    if (role)     parts.push(`Act as a ${role}.`);
    if (task)     parts.push(`${task.charAt(0).toUpperCase() + task.slice(1)}${task.endsWith('.') ? '' : '.'}`);
    if (format)   parts.push(`Format it as ${format}${format.endsWith('.') ? '' : '.'}`);
    if (criteria) parts.push(`Make sure it is ${criteria}${criteria.endsWith('.') ? '' : '.'}`);

    return parts.join(' ');
  }

  function updatePreview() {
    const prompt = buildPrompt();
    if (!prompt) {
      previewBox.innerHTML = '<span class="preview-empty">Your prompt will appear here as you type...</span>';
      if (charCount) charCount.textContent = '0';
      if (wordCount) wordCount.textContent = '0';
      return;
    }

    // Color code parts
    const role     = roleInput?.value.trim() || '';
    const task     = taskInput?.value.trim() || '';
    const format   = formatInput?.value.trim() || '';
    const criteria = criteriaInput?.value.trim() || '';

    let html = '';
    if (role)     html += `<span class="preview-role">Act as a ${escHtml(role)}. </span>`;
    if (task)     html += `<span class="preview-task">${escHtml(task.charAt(0).toUpperCase() + task.slice(1))}${task.endsWith('.') ? '' : '.'} </span>`;
    if (format)   html += `<span class="preview-format">Format it as ${escHtml(format)}${format.endsWith('.') ? '' : '.'} </span>`;
    if (criteria) html += `<span class="preview-criteria">Make sure it is ${escHtml(criteria)}${criteria.endsWith('.') ? '' : '.'}</span>`;

    previewBox.innerHTML = html;

    if (charCount) charCount.textContent = prompt.length;
    if (wordCount) wordCount.textContent = prompt.split(/\s+/).filter(Boolean).length;
  }

  [roleInput, taskInput, formatInput, criteriaInput].forEach(el => {
    el?.addEventListener('input', updatePreview);
  });

  // ── Templates ─────────────────────────────────────────────
  templateChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.template;
      const tpl = TEMPLATES.find(t => t.label === name);
      if (!tpl) return;
      if (roleInput)     roleInput.value     = tpl.role;
      if (taskInput)     taskInput.value     = tpl.task;
      if (formatInput)   formatInput.value   = tpl.format;
      if (criteriaInput) criteriaInput.value = tpl.criteria;
      updatePreview();
    });
  });

  // ── Actions ───────────────────────────────────────────────
  copyBtn?.addEventListener('click', () => {
    const prompt = buildPrompt();
    if (!prompt) { window.showToast?.('Nothing to copy yet', 'warning'); return; }
    navigator.clipboard.writeText(prompt).then(() => {
      window.showToast?.('Prompt copied!', 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.showToast?.('Prompt copied!', 'success');
    });
  });

  clearBtn?.addEventListener('click', () => {
    if (roleInput)     roleInput.value = '';
    if (taskInput)     taskInput.value = '';
    if (formatInput)   formatInput.value = '';
    if (criteriaInput) criteriaInput.value = '';
    updatePreview();
  });

  arenaBtn?.addEventListener('click', () => {
    const prompt = buildPrompt();
    if (!prompt) { window.showToast?.('Build your prompt first', 'warning'); return; }
    const arenaSection = document.getElementById('arena');
    arenaSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      // Pre-fill in active chat panel
      const activePanel = document.querySelector('.arena-panel.active');
      const input = activePanel?.querySelector('.chat-input');
      if (input) {
        input.value = prompt;
        input.focus();
        window.showToast?.('Prompt loaded in Arena!', 'success');
      }
    }, 700);
  });

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  updatePreview();

})();
