/* prompt-generator.js — Prompt Workshop: Build + Improve + Humanize modes */

(function () {

  // ── Mode toggle ───────────────────────────────────────────────
  document.querySelectorAll('.pw-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      document.querySelectorAll('.pw-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pw-panel-build').classList.toggle('hidden', mode !== 'build');
      document.getElementById('pw-panel-improve').classList.toggle('hidden', mode !== 'improve');
      document.getElementById('pw-panel-humanize').classList.toggle('hidden', mode !== 'humanize');
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

  const improveInput  = document.getElementById('pw-improve-input');
  const improveOutput = document.getElementById('pw-combined-output');
  const improveChars  = document.getElementById('pw-improve-chars');
  const improveCopy   = document.getElementById('pw-copy-improve');

  function updateImprove() {
    const userPrompt = improveInput?.value?.trim() || '';
    if (improveChars) improveChars.textContent = (improveInput?.value?.length || 0) + ' chars';
    if (!userPrompt) {
      if (improveOutput) {
        improveOutput.textContent = '← Paste your prompt above and the full meta-prompt will appear here, ready to copy.';
        improveOutput.classList.remove('has-content');
      }
      return;
    }
    const combined = IMPROVE_PREFIX + userPrompt + IMPROVE_SUFFIX;
    if (improveOutput) {
      improveOutput.textContent = combined;
      improveOutput.classList.add('has-content');
    }
  }

  improveInput?.addEventListener('input', updateImprove);

  improveCopy?.addEventListener('click', () => {
    const userPrompt = improveInput?.value?.trim() || '';
    if (!userPrompt) {
      window.showToast?.('Paste your existing prompt first!', 'warning', 2000);
      return;
    }
    copyText(IMPROVE_PREFIX + userPrompt + IMPROVE_SUFFIX, improveCopy,
      'Combined prompt copied — paste it into ChatGPT or Claude!');
  });

  // ── Mode 3: Humanize Output ───────────────────────────────────
  const CONTENT_TYPE_LABELS = {
    worksheet:   'a student worksheet',
    lesson:      'a lesson plan',
    email:       'a parent email',
    explanation: 'a math concept explanation for students',
    rubric:      'a grading rubric',
    feedback:    'written student feedback',
    general:     'general educational text',
  };

  function buildHumanizePrompt(text, type) {
    const label = CONTENT_TYPE_LABELS[type] || 'educational text';
    return `You are an expert editor specializing in making AI-generated content sound genuinely human. I am a high school math teacher. I used an AI tool to generate ${label}, and I need you to rewrite it so it sounds like I — a real classroom teacher — actually wrote it.

Here is the AI-generated text:

─────────────────────────────────────────
${text}
─────────────────────────────────────────

STEP 1 — DIAGNOSE THE AI PATTERNS
Scan the text above and list every AI writing pattern you detect. For each one:
- Quote the exact phrase or sentence
- Name the pattern (e.g. "em dash overuse," "corporate vocabulary," "filler opener," "perfectly symmetrical list," "false range," "AI buzzword")
- Rate how jarring it sounds to a real teacher: Low / Medium / High

Use this checklist of known AI patterns:
• Overused em dashes (—) where a comma or period would work better
• AI vocabulary: "delve," "leverage," "tapestry," "foster," "nuanced," "comprehensive," "robust," "crucial," "pivotal," "paramount," "meticulous," "commendable," "invaluable"
• Filler openers: "Certainly!", "Great question!", "Of course!", "Absolutely!", "I'd be happy to"
• False ranges: "a 5–7 step process," "3–4 examples" (humans pick one number)
• Corporate structure: every section has exactly 3 bullets, every bullet is the same length
• Over-hedging: "It is worth noting that," "It is important to mention," "One must consider"
• Passive voice stacking: more than 2 passive constructions per paragraph
• Unnatural transitions: "Furthermore," "Moreover," "In conclusion," "It is evident that"
• Missing contractions: AI avoids "don't / won't / it's / I've" — real teachers use them
• Generic praise language: "This is an excellent opportunity to," "Students will benefit greatly from"

STEP 2 — REWRITE: HUMANIZED VERSION
Rewrite the entire text applying these rules:
- Keep ALL factual content, structure, and intent exactly intact — change only the voice
- Write the way a real experienced math teacher talks: direct, practical, occasionally informal
- Use contractions naturally (don't, won't, let's, you'll, it's)
- Vary sentence length — mix short punchy sentences with longer ones
- Replace symmetric bullet lists with natural, uneven ones (some bullets longer, some shorter)
- Cut every filler opener, corporate buzzword, and over-formal transition
- Where the AI wrote something vague or generic, make it specific and concrete
- The tone should feel like a colleague explaining something in the teacher's lounge, not a textbook

STEP 3 — SHOW ME THE DIFF
After the rewrite, show a side-by-side comparison of the 3–5 most impactful changes you made:
| Original (AI) | Rewritten (Human) | Why this change matters |

STEP 4 — TEACH ME THE PATTERN
Based on what you changed, give me one rule I can apply every time I review AI output before using it in class — stated as a single memorable sentence.`;
  }

  const humanizeInput  = document.getElementById('pw-humanize-input');
  const humanizeOutput = document.getElementById('pw-humanize-output');
  const humanizeChars  = document.getElementById('pw-humanize-chars');
  const humanizeCopy   = document.getElementById('pw-copy-humanize');
  const humanizeType   = document.getElementById('pw-humanize-type');

  function updateHumanize() {
    const text = humanizeInput?.value?.trim() || '';
    const type = humanizeType?.value || 'general';
    if (humanizeChars) humanizeChars.textContent = (humanizeInput?.value?.length || 0) + ' chars';

    if (!text) {
      if (humanizeOutput) {
        humanizeOutput.textContent = '← Paste your AI output above and the humanizer prompt will appear here, ready to copy.';
        humanizeOutput.classList.remove('has-content');
      }
      return;
    }

    const prompt = buildHumanizePrompt(text, type);
    if (humanizeOutput) {
      humanizeOutput.textContent = prompt;
      humanizeOutput.classList.add('has-content');
    }
  }

  humanizeInput?.addEventListener('input', updateHumanize);
  humanizeType?.addEventListener('change', updateHumanize);

  humanizeCopy?.addEventListener('click', () => {
    const text = humanizeInput?.value?.trim() || '';
    if (!text) {
      window.showToast?.('Paste your AI output first!', 'warning', 2000);
      return;
    }
    const type = humanizeType?.value || 'general';
    copyText(buildHumanizePrompt(text, type), humanizeCopy,
      'Humanizer prompt copied — paste it into ChatGPT or Claude!');
  });

})();
