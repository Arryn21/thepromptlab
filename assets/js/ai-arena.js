/* ai-arena.js — Tabbed chat, 3 API streaming parsers + Cloudflare Worker proxy */

(function () {

  const SYSTEM_PROMPT = 'You are a helpful assistant for high school math teachers at a CSUDH LIFT LAB workshop. Be concise, practical, and focused on math education.';

  // ── Worker routing helpers ────────────────────────────────
  function getWorkerURL() {
    return (window.WORKER_URL || '').replace(/\/$/, '');
  }

  async function isWorkerSessionActive() {
    const url = getWorkerURL();
    if (!url) return false;
    try {
      const r = await fetch(`${url}/session/status`);
      const data = await r.json();
      return data.active === true;
    } catch { return false; }
  }

  // Cache session status to avoid hammering worker on every message
  let _sessionActiveCache = null;
  let _sessionCacheTime = 0;
  async function getSessionActive() {
    const now = Date.now();
    if (_sessionActiveCache !== null && now - _sessionCacheTime < 30000) {
      return _sessionActiveCache;
    }
    _sessionActiveCache = await isWorkerSessionActive();
    _sessionCacheTime = now;
    return _sessionActiveCache;
  }
  // Invalidate cache when status badge updates (called by session.js)
  window.invalidateSessionCache = () => { _sessionActiveCache = null; };

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

  // ── Chat panel factory ────────────────────────────────────
  function initChatPanel(panelId, provider) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const messagesEl = panel.querySelector('.chat-messages');
    const inputEl    = panel.querySelector('.chat-input');
    const sendBtn    = panel.querySelector('.send-btn');
    const clearBtn   = panel.querySelector('[data-action="clear"]');
    const modelSel   = panel.querySelector('.model-selector');

    let history = [];
    let streaming = false;

    // ── Self-service key save ────
    const keyBar = panel.querySelector('.key-bar');
    const keyInput = panel.querySelector('.key-bar input');
    const keySaveBtn = panel.querySelector('.key-save-btn');
    if (keySaveBtn && keyInput) {
      keySaveBtn.addEventListener('click', () => {
        const val = keyInput.value.trim();
        if (val) {
          window.setKey?.(provider, val);
          window.showToast?.('API key saved', 'success');
          keyBar?.classList.add('hidden');
        }
      });
    }

    // ── Auto-resize textarea ────
    if (inputEl) {
      inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
      });

      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!streaming) sendMessage();
        }
      });
    }

    sendBtn?.addEventListener('click', () => { if (!streaming) sendMessage(); });
    clearBtn?.addEventListener('click', () => {
      history = [];
      if (messagesEl) messagesEl.innerHTML = renderEmpty(panelId);
    });

    // Quick-start chips
    panel.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (inputEl) inputEl.value = chip.textContent.trim();
        inputEl?.focus();
      });
    });

    function renderEmpty(id) {
      const chipSuggestions = [
        'Create a warm-up for teaching slope',
        'Explain quadratic formula simply',
        'Write 3 real-world linear equation problems',
        'Lesson plan for Pythagorean theorem'
      ];
      return `<div class="chat-empty">
        <div class="empty-icon">💬</div>
        <p>Ask anything about math teaching, or try a starter prompt:</p>
        <div class="chat-chips">
          ${chipSuggestions.map(s => `<button class="chip">${s}</button>`).join('')}
        </div>
      </div>`;
    }

    async function sendMessage() {
      const text = inputEl?.value.trim();
      if (!text) return;

      // Check if worker session is active — if so, route through worker (no key needed)
      const useWorker = await getSessionActive();

      if (!useWorker) {
        // Fall back to self-service key
        const key = window.getKey?.(provider) || '';
        if (!key) {
          window.showToast?.(`Add your ${provider.charAt(0).toUpperCase()+provider.slice(1)} API key first`, 'warning', 3000);
          keyBar?.classList.remove('hidden');
          keyInput?.focus();
          return;
        }
      }

      // Hide key bar when session is active
      if (useWorker && keyBar) keyBar.classList.add('hidden');

      // Clear empty state
      const emptyEl = messagesEl?.querySelector('.chat-empty');
      if (emptyEl) emptyEl.remove();

      // Append user message
      appendMsg('user', text);
      history.push({ role: 'user', content: text });
      if (inputEl) inputEl.value = '';
      inputEl.style.height = 'auto';

      // Show typing
      const typingId = 'typing-' + Date.now();
      appendTyping(typingId);

      streaming = true;
      sendBtn && (sendBtn.disabled = true);

      const model = modelSel?.value || getDefaultModel(provider);
      const key = useWorker ? '' : (window.getKey?.(provider) || '');

      // Dispatch to correct API (worker or direct)
      if (provider === 'openai') {
        useWorker ? streamOpenAIWorker(model, text, typingId) : streamOpenAI(key, model, text, typingId);
      } else if (provider === 'anthropic') {
        useWorker ? streamClaudeWorker(model, text, typingId) : streamClaude(key, model, text, typingId);
      } else if (provider === 'google') {
        useWorker ? streamGeminiWorker(model, text, typingId) : streamGemini(key, model, text, typingId);
      }
    }

    function getDefaultModel(p) {
      if (p === 'openai') return 'gpt-4o-mini';
      if (p === 'anthropic') return 'claude-sonnet-4-6';
      if (p === 'google') return 'gemini-2.0-flash';
      return '';
    }

    function appendMsg(role, content) {
      if (!messagesEl) return;
      const div = document.createElement('div');
      div.className = `msg ${role}`;
      div.innerHTML = `
        <div class="msg-avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="msg-bubble">${formatContent(content)}</div>`;
      messagesEl.appendChild(div);
      renderMath(div.querySelector('.msg-bubble'));
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendTyping(id) {
      if (!messagesEl) return;
      const div = document.createElement('div');
      div.className = 'msg assistant';
      div.id = id;
      div.innerHTML = `
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>`;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function finishStreaming(id, fullText) {
      const el = document.getElementById(id);
      if (el) {
        const bubble = el.querySelector('.msg-bubble');
        bubble.innerHTML = formatContent(fullText);
        renderMath(bubble);  // render math once streaming is done
      }
      history.push({ role: 'assistant', content: fullText });
      streaming = false;
      if (sendBtn) sendBtn.disabled = false;
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function streamingUpdate(id, partial) {
      const el = document.getElementById(id);
      if (el) {
        el.querySelector('.msg-bubble').innerHTML = formatContent(partial) +
          '<span class="typed-cursor">|</span>';
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    }

    function handleError(id, msg) {
      const el = document.getElementById(id);
      if (el) {
        el.querySelector('.msg-bubble').innerHTML =
          `<span style="color:#ef4444">⚠ ${escHtml(msg)}</span>`;
      }
      streaming = false;
      if (sendBtn) sendBtn.disabled = false;
    }

    // ── Worker proxy streams ─────────────────────────────────

    async function streamOpenAIWorker(model, userMsg, typingId) {
      let fullText = '';
      try {
        const res = await fetch(`${getWorkerURL()}/proxy/openai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: true,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-10)]
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') break;
            try { const j = JSON.parse(data); fullText += j.choices?.[0]?.delta?.content || ''; streamingUpdate(typingId, fullText); } catch {}
          }
        }
        finishStreaming(typingId, fullText);
      } catch (e) { handleError(typingId, e.message); }
    }

    async function streamClaudeWorker(model, userMsg, typingId) {
      let fullText = '';
      try {
        const res = await fetch(`${getWorkerURL()}/proxy/anthropic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, max_tokens: 1024, stream: true, system: SYSTEM_PROMPT, messages: history.slice(-10) })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data:')) continue;
            try { const j = JSON.parse(line.slice(5).trim()); if (j.type === 'content_block_delta') { fullText += j.delta?.text || ''; streamingUpdate(typingId, fullText); } } catch {}
          }
        }
        finishStreaming(typingId, fullText);
      } catch (e) { handleError(typingId, e.message); }
    }

    async function streamGeminiWorker(model, userMsg, typingId) {
      let fullText = '';
      try {
        const geminiHistory = history.slice(-10).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        const res = await fetch(`${getWorkerURL()}/proxy/google?model=${encodeURIComponent(model)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: geminiHistory, generationConfig: { maxOutputTokens: 1024 } })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data:')) continue;
            try { const j = JSON.parse(line.slice(5).trim()); fullText += j.candidates?.[0]?.content?.parts?.[0]?.text || ''; streamingUpdate(typingId, fullText); } catch {}
          }
        }
        finishStreaming(typingId, fullText);
      } catch (e) { handleError(typingId, e.message); }
    }

    // ── OpenAI SSE ───────────────────────────────────────────
    async function streamOpenAI(key, model, userMsg, typingId) {
      let fullText = '';
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model,
            stream: true,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...history.slice(-10)
            ]
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') break;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content || '';
              fullText += delta;
              streamingUpdate(typingId, fullText);
            } catch {}
          }
        }
        finishStreaming(typingId, fullText);
      } catch (e) {
        handleError(typingId, e.message);
      }
    }

    // ── Claude SSE ───────────────────────────────────────────
    async function streamClaude(key, model, userMsg, typingId) {
      let fullText = '';
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            stream: true,
            system: SYSTEM_PROMPT,
            messages: history.slice(-10)
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            try {
              const json = JSON.parse(data);
              if (json.type === 'content_block_delta') {
                fullText += json.delta?.text || '';
                streamingUpdate(typingId, fullText);
              }
            } catch {}
          }
        }
        finishStreaming(typingId, fullText);
      } catch (e) {
        handleError(typingId, e.message);
      }
    }

    // ── Gemini SSE ───────────────────────────────────────────
    async function streamGemini(key, model, userMsg, typingId) {
      let fullText = '';
      try {
        const geminiHistory = history.slice(-10).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: geminiHistory,
              generationConfig: { maxOutputTokens: 1024 }
            })
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            try {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              fullText += text;
              streamingUpdate(typingId, fullText);
            } catch {}
          }
        }
        finishStreaming(typingId, fullText);
      } catch (e) {
        handleError(typingId, e.message);
      }
    }

    // ── Render markdown via marked.js ────────────────────────
    function formatContent(text) {
      if (!text) return '';
      return window.marked
        ? marked.parse(text, { breaks: true, gfm: true })
        : `<p>${text.replace(/\n/g, '<br>')}</p>`;
    }

    // ── Render LaTeX math via KaTeX auto-render ───────────────
    // Called after streaming finishes — handles \(...\), \[...\], $...$ and $$...$$
    function renderMath(el) {
      if (!el || !window.renderMathInElement) return;
      renderMathInElement(el, {
        delimiters: [
          { left: '$$',     right: '$$',     display: true  },
          { left: '\\[',    right: '\\]',    display: true  },
          { left: '$',      right: '$',      display: false },
          { left: '\\(',    right: '\\)',    display: false },
        ],
        throwOnError: false,
        output: 'html'
      });
    }
  }

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Launcher prompt buttons ───────────────────────────────
  // Click → copy prompt text to clipboard → open tool in new tab → toast
  document.querySelectorAll('.launcher-prompts-grid').forEach(grid => {
    grid.addEventListener('click', async e => {
      const btn = e.target.closest('.launcher-prompt-btn');
      if (!btn) return;

      const toolUrl  = grid.dataset.toolUrl  || 'https://chatgpt.com/';
      const toolName = grid.dataset.toolName || 'the tool';
      const promptText = btn.textContent.trim();

      try {
        await navigator.clipboard.writeText(promptText);
      } catch {
        // Fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = promptText;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      // Visual feedback on button
      btn.classList.add('copied');
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = orig;
      }, 1500);

      // Open tool in new tab
      window.open(toolUrl, '_blank', 'noopener,noreferrer');

      // Toast notification
      if (window.showToast) {
        window.showToast(`Prompt copied — paste it in ${toolName}!`, 'success');
      }
    });
  });

  // ── Init Math Visualizer key bar ──────────────────────────
  // (ChatGPT / Claude / Gemini are now Tool Launchers — no API needed)
  // initChatPanel handles the .key-bar save button; viz logic is in python-runner.js
  initChatPanel('panel-math', 'anthropic');

})();
