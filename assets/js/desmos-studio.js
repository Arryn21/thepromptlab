/* desmos-studio.js — AI Desmos Studio
   Plain English → Claude generates expressions → live Desmos embed
   Also supports no-API-key flow: copy prompt → paste into Claude/ChatGPT → paste JSON back
*/

(function () {

  // ── Quick-start templates ──────────────────────────────────
  const TEMPLATES = [
    {
      label: '📐 Quadratic Transformations',
      desc: 'Graph y = a(x-h)² + k in vertex form with sliders for a, h, and k. Start a=1, h=0, k=0. Show y=x² in gray for comparison so students can see the transformation.'
    },
    {
      label: '🌊 Sine & Cosine with Sliders',
      desc: 'Graph y = A·sin(Bx + C) + D with sliders for amplitude A (0.5 to 3), period B (0.5 to 3), phase shift C (-π to π), and vertical shift D (-3 to 3). Show the midline as a dashed horizontal line.'
    },
    {
      label: '📏 Linear Systems',
      desc: 'Graph two lines that form a system: y = 2x - 1 and y = -0.5x + 4. Mark the intersection point with a dot and label it "Solution". Add a note with the coordinates.'
    },
    {
      label: '📈 Exponential Growth vs Decay',
      desc: 'Show exponential growth y = 2^x and exponential decay y = (0.5)^x on the same axes. Add a slider b from 0.1 to 3 and a third curve y = b^x so students can explore what happens as b changes.'
    },
    {
      label: '⭕ Unit Circle',
      desc: 'Draw the unit circle x²+y²=1. Add a point at (cos θ, sin θ) where θ is a slider from 0 to 2π. Draw dashed lines from the point to both axes. Label the x-coordinate "cos θ" and y-coordinate "sin θ".'
    },
    {
      label: '∞ Limits & Asymptotes',
      desc: 'Graph y = (x²-1)/(x-1) and mark where the hole is at x=1. Also show y = 1/(x-2) with its vertical asymptote at x=2 and horizontal asymptote y=0 as dashed lines.'
    }
  ];

  // ── Claude prompt builder ─────────────────────────────────
  function buildPrompt(userDesc) {
    return `You are helping a high school math teacher create a Desmos graphing calculator visualization.

Teacher's request: "${userDesc}"

Respond with ONLY a valid JSON object in exactly this format — no explanation, no markdown, no code fences:

{
  "expressions": [
    {"id": "1", "latex": "y=x^2", "color": "#2d70b3"},
    {"id": "2", "latex": "a=1", "sliderBounds": {"min": "-5", "max": "5", "step": "0.1"}}
  ],
  "teacherNotes": "One or two sentences on how to present this graph to students.",
  "discussionQuestions": [
    "Question to ask students about this graph?",
    "Another discussion question?",
    "A third question connecting to real world or prior knowledge?"
  ]
}

Rules:
- Use valid Desmos LaTeX syntax (e.g. y=x^{2}, \\frac{1}{x}, \\sqrt{x})
- For sliders: define as simple assignment like a=1 and Desmos auto-creates the slider
- For sliderBounds: use string values like "min": "-5"
- Colors: #2d70b3 (blue), #c74440 (red), #388c46 (green), #fa7e19 (orange), #6042a6 (purple)
- For dashed lines add "lineStyle": "DASHED"
- Max 10 expressions
- Output ONLY the raw JSON object`;
  }

  // ── Parse pasted text (flexible: JSON array, one-per-line, etc.) ──
  function parsePasted(text) {
    text = text.trim();
    // Try JSON
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const p = JSON.parse(text);
        if (Array.isArray(p)) return p;
        if (p.expressions) return p.expressions;
      } catch {}
    }
    // One expression per line
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
    if (lines.length) {
      return lines.map((l, i) => ({
        id: String(i + 1),
        latex: l.replace(/^[-•*`]\s*/, '').replace(/`$/, '')
      }));
    }
    return [];
  }

  // ── State ─────────────────────────────────────────────────
  let calculator = null;

  // ── Init Desmos embed ─────────────────────────────────────
  function initDesmos() {
    const el = document.getElementById('desmos-container');
    if (!el || !window.Desmos) return;

    calculator = Desmos.GraphingCalculator(el, {
      keypad:       false,
      settingsMenu: false,
      zoomButtons:  true,
      border:       false,
      autosize:     true,
    });

    // Default welcome graph
    calculator.setExpressions([
      { id: 'welcome1', latex: 'y=x^{2}-4x+3',   color: '#00d4ff' },
      { id: 'welcome2', latex: 'y=2x-3',          color: '#a78bfa', lineStyle: 'DASHED' },
    ]);
  }

  // ── Load expressions into Desmos ─────────────────────────
  function loadExpressions(expressions) {
    if (!calculator) return false;
    try {
      calculator.setBlank();
      calculator.setExpressions(expressions);
      return true;
    } catch (e) {
      console.error('Desmos error:', e);
      return false;
    }
  }

  // ── Claude API call ───────────────────────────────────────
  async function callClaude(desc) {
    const key = window.getKey?.('anthropic') || '';
    if (!key) return null;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildPrompt(desc) }]
      })
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Extract JSON robustly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Claude response');
    return JSON.parse(jsonMatch[0]);
  }

  // ── Show AI results panel ────────────────────────────────
  function showResults(result) {
    const container = document.getElementById('desmos-ai-results');
    if (!container) return;

    const notesEl     = container.querySelector('.desmos-teacher-notes');
    const questionsEl = container.querySelector('.desmos-questions');

    if (notesEl && result.teacherNotes) {
      notesEl.textContent = result.teacherNotes;
    }
    if (questionsEl && Array.isArray(result.discussionQuestions)) {
      questionsEl.innerHTML = result.discussionQuestions
        .map(q => `<li>${q}</li>`)
        .join('');
    }
    container.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Key bar setup ─────────────────────────────────────────
  function setupKeyBar() {
    const bar      = document.getElementById('desmos-key-bar');
    const input    = document.getElementById('desmos-key-input');
    const saveBtn  = document.getElementById('desmos-key-save');
    const toggleBtn = document.getElementById('desmos-key-toggle');

    toggleBtn?.addEventListener('click', () => {
      bar?.classList.toggle('hidden');
      if (!bar?.classList.contains('hidden')) input?.focus();
    });

    saveBtn?.addEventListener('click', () => {
      const val = input?.value.trim();
      if (val) {
        window.setKey?.('anthropic', val);
        window.showToast?.('Anthropic key saved — Generate Graph is now active!', 'success');
        bar?.classList.add('hidden');
        updateGenBtn();
      }
    });
  }

  // ── Update Generate button state ──────────────────────────
  function updateGenBtn() {
    const btn = document.getElementById('desmos-gen-btn');
    if (!btn) return;
    const hasKey = !!(window.getKey?.('anthropic'));
    btn.title = hasKey ? '' : 'Add your Anthropic API key first';
  }

  // ── Main setup ────────────────────────────────────────────
  function setup() {
    // Template chips
    const chipsContainer = document.getElementById('desmos-templates');
    if (chipsContainer) {
      TEMPLATES.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'desmos-template-chip';
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
          const ta = document.getElementById('desmos-desc');
          if (ta) {
            ta.value = t.desc;
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
            ta.focus();
          }
        });
        chipsContainer.appendChild(btn);
      });
    }

    // Auto-resize textarea
    const descTA = document.getElementById('desmos-desc');
    descTA?.addEventListener('input', () => {
      descTA.style.height = 'auto';
      descTA.style.height = Math.min(descTA.scrollHeight, 160) + 'px';
    });

    // ── Generate Graph (with API key) ──────────────────────
    document.getElementById('desmos-gen-btn')?.addEventListener('click', async () => {
      const desc = document.getElementById('desmos-desc')?.value.trim();
      if (!desc) { window.showToast?.('Describe your graph first', 'warning'); return; }

      const key = window.getKey?.('anthropic') || '';
      if (!key) {
        window.showToast?.('Add your Anthropic key → click the 🔑 button', 'warning', 4000);
        document.getElementById('desmos-key-bar')?.classList.remove('hidden');
        document.getElementById('desmos-key-input')?.focus();
        return;
      }

      const btn = document.getElementById('desmos-gen-btn');
      btn.disabled = true;
      btn.textContent = '⏳ Asking Claude...';

      try {
        const result = await callClaude(desc);
        if (result?.expressions?.length) {
          if (loadExpressions(result.expressions)) {
            showResults(result);
            window.showToast?.('Graph loaded! Check teacher notes below.', 'success');
          }
        } else {
          throw new Error('No expressions returned');
        }
      } catch (e) {
        window.showToast?.(`Error: ${e.message}`, 'error', 5000);
      } finally {
        btn.disabled = false;
        btn.textContent = '✨ Generate Graph';
      }
    });

    // ── Copy AI Prompt (no API key) ────────────────────────
    document.getElementById('desmos-copy-prompt-btn')?.addEventListener('click', async () => {
      const desc = document.getElementById('desmos-desc')?.value.trim();
      if (!desc) { window.showToast?.('Describe your graph first', 'warning'); return; }

      const prompt = buildPrompt(desc);
      try {
        await navigator.clipboard.writeText(prompt);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      window.open('https://claude.ai/', '_blank', 'noopener,noreferrer');
      window.showToast?.('Prompt copied! Paste into Claude → copy the JSON → paste it below', 'success', 5000);
    });

    // ── Load pasted expressions ────────────────────────────
    document.getElementById('desmos-load-btn')?.addEventListener('click', () => {
      const text = document.getElementById('desmos-paste-area')?.value.trim();
      if (!text) { window.showToast?.('Paste Claude\'s JSON response first', 'warning'); return; }

      const exprs = parsePasted(text);
      if (!exprs.length) {
        window.showToast?.('Could not parse. Try pasting the raw JSON from Claude.', 'error', 4000);
        return;
      }
      if (loadExpressions(exprs)) {
        window.showToast?.(`Loaded ${exprs.length} expression${exprs.length !== 1 ? 's' : ''} into Desmos!`, 'success');
      }
    });

    // ── Clear ──────────────────────────────────────────────
    document.getElementById('desmos-clear-btn')?.addEventListener('click', () => {
      calculator?.setBlank();
      document.getElementById('desmos-ai-results')?.classList.add('hidden');
    });

    // ── Open full Desmos ───────────────────────────────────
    // (handled by <a> tag in HTML)

    setupKeyBar();
    updateGenBtn();
  }

  // ── Boot: wait for Desmos API ─────────────────────────────
  function boot() {
    if (window.Desmos) {
      initDesmos();
      setup();
    } else {
      // Desmos script not loaded yet — retry
      setTimeout(boot, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
