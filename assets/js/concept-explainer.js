/* concept-explainer.js — AI Math Concept Explainer */

(function () {

  const CHIPS = [
    'Quadratic Formula',
    'Slope-Intercept Form',
    'Pythagorean Theorem',
    'Systems of Equations',
    'Factoring Polynomials',
    'Limits',
    'Derivatives',
    'Trigonometric Functions',
    'Exponential Growth & Decay',
    'Geometric Sequences',
    'Law of Sines & Cosines',
    'Integration',
  ];

  function buildPrompt(concept) {
    return `You are an expert math educator and instructional coach helping a high school math teacher understand a concept deeply so they can teach it effectively.

The math concept I need help with is: **${concept}**

Please respond in exactly these 7 sections:

─────────────────────────────────────────
SECTION 1 — TEACHER EXPLANATION
─────────────────────────────────────────
Explain this concept as you would to a math teacher who knows the subject but wants a crisp, comprehensive refresher. Include:
- The core definition (precise, no handwaving)
- Why this concept matters in the broader curriculum
- How it connects to prerequisite concepts students need first
- Where this concept leads next in the math sequence

─────────────────────────────────────────
SECTION 2 — STUDENT-FRIENDLY EXPLANATION
─────────────────────────────────────────
Explain the same concept as if talking directly to a 9th–12th grade student who is encountering it for the first time. Use:
- Plain, everyday language (no jargon without immediate definition)
- One vivid real-world analogy or story that makes it click
- A simple worked example, shown step by step

─────────────────────────────────────────
SECTION 3 — COMMON MISCONCEPTIONS
─────────────────────────────────────────
List exactly 3 misconceptions students almost always have about this concept. For each:
- State the misconception as a student might say it
- Explain what is actually wrong
- Give the correct understanding in one sentence
- Suggest one quick classroom activity to surface and fix this misconception

─────────────────────────────────────────
SECTION 4 — YOUTUBE VIDEO RECOMMENDATIONS
─────────────────────────────────────────
Recommend 5 YouTube videos that would genuinely help students understand this concept. For each video:
- Channel name
- Suggested search query to find it (exact title if you know it)
- Why this video is good: what it explains that others miss
- Best for: (struggling students / average students / advanced students)
Note: Provide search queries, not links, since URLs may be outdated.

─────────────────────────────────────────
SECTION 5 — WEBSITES & INTERACTIVE RESOURCES
─────────────────────────────────────────
Recommend 4 websites or interactive tools. For each:
- Name and URL
- What the tool does
- How a teacher could use it in class (specific activity idea)
- What makes it better than just reading a textbook for this concept

─────────────────────────────────────────
SECTION 6 — CLASSROOM ACTIVITIES
─────────────────────────────────────────
Design 2 ready-to-run classroom activities. For each:
- Activity name
- Time required
- Materials needed (assume standard classroom — no special equipment)
- Step-by-step instructions (numbered)
- How to differentiate: one modification for struggling students, one for advanced students
- What the teacher should listen/look for to assess understanding during the activity

─────────────────────────────────────────
SECTION 7 — CHECK FOR UNDERSTANDING
─────────────────────────────────────────
Write 3 exit ticket questions for this concept. For each:
- The question (could be multiple choice, short answer, or show-your-work)
- What a correct answer looks like
- What a wrong answer reveals about the student's gap
- One follow-up question to probe deeper if the student got it right

End your response with one sentence: "The single most important thing a student must truly understand about [concept] is: ___"`;
  }

  // ── Render chips ──────────────────────────────────────────────
  const chipsContainer = document.getElementById('ce-chips');
  if (chipsContainer) {
    CHIPS.forEach(concept => {
      const btn = document.createElement('button');
      btn.className = 'ce-chip';
      btn.textContent = concept;
      btn.addEventListener('click', () => {
        const input = document.getElementById('ce-input');
        if (input) {
          input.value = concept;
          input.dispatchEvent(new Event('input'));
        }
        // highlight active chip
        chipsContainer.querySelectorAll('.ce-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
      });
      chipsContainer.appendChild(btn);
    });
  }

  // ── Live prompt update ────────────────────────────────────────
  const input   = document.getElementById('ce-input');
  const preview = document.getElementById('ce-prompt-preview');
  const charEl  = document.getElementById('ce-char-count');
  const copyBtn = document.getElementById('ce-copy-btn');

  function updatePreview() {
    const concept = input?.value?.trim() || '';

    if (charEl) charEl.textContent = concept.length ? `"${concept}"` : '';

    if (!concept) {
      if (preview) {
        preview.textContent = '← Type a concept above and the full prompt will appear here, ready to copy.';
        preview.classList.remove('has-content');
      }
      if (copyBtn) copyBtn.disabled = true;
      return;
    }

    const prompt = buildPrompt(concept);
    if (preview) {
      preview.textContent = prompt;
      preview.classList.add('has-content');
    }
    if (copyBtn) copyBtn.disabled = false;

    // clear chip highlights if user typed manually
    const matchedChip = CHIPS.find(c => c.toLowerCase() === concept.toLowerCase());
    if (!matchedChip && chipsContainer) {
      chipsContainer.querySelectorAll('.ce-chip').forEach(c => c.classList.remove('active'));
    }
  }

  input?.addEventListener('input', updatePreview);

  // ── Copy button ───────────────────────────────────────────────
  async function copyText(text, btn) {
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
    const concept = input?.value?.trim() || 'concept';
    window.showToast?.(`Prompt copied — paste it into ChatGPT or Claude for "${concept}"!`, 'success', 3500);
  }

  copyBtn?.addEventListener('click', () => {
    const concept = input?.value?.trim() || '';
    if (!concept) {
      window.showToast?.('Type a concept first!', 'warning', 2000);
      return;
    }
    copyText(buildPrompt(concept), copyBtn);
  });

})();
