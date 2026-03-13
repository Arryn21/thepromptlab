/* ai-arena.js — Tabbed chat, 3 API streaming parsers */

(function () {

  const SYSTEM_PROMPT = 'You are a helpful assistant for high school math teachers at a CSUDH LIFT LAB workshop. Be concise, practical, and focused on math education.';

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

    function sendMessage() {
      const text = inputEl?.value.trim();
      if (!text) return;

      const key = window.getKey?.(provider) || '';
      if (!key) {
        window.showToast?.(`Add your ${provider.charAt(0).toUpperCase()+provider.slice(1)} API key first`, 'warning', 3000);
        keyBar?.classList.remove('hidden');
        keyInput?.focus();
        return;
      }

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

      // Dispatch to correct API
      if (provider === 'openai') {
        streamOpenAI(key, model, text, typingId);
      } else if (provider === 'anthropic') {
        streamClaude(key, model, text, typingId);
      } else if (provider === 'google') {
        streamGemini(key, model, text, typingId);
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
        el.querySelector('.msg-bubble').innerHTML = formatContent(fullText);
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

    // ── Format markdown-ish content ──────────────────────────
    function formatContent(text) {
      if (!text) return '';
      const lines = text.split('\n');
      const out = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        // Fenced code block
        if (line.startsWith('```')) {
          const codeLines = [];
          i++;
          while (i < lines.length && !lines[i].startsWith('```')) {
            codeLines.push(escHtml(lines[i]));
            i++;
          }
          out.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
          i++;
          continue;
        }
        // Table block (lines starting with |)
        if (line.trim().startsWith('|')) {
          const tLines = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            tLines.push(lines[i]);
            i++;
          }
          out.push(renderTable(tLines));
          continue;
        }
        // Headings
        const hm = line.match(/^(#{1,4})\s+(.+)/);
        if (hm) {
          const lvl = hm[1].length;
          out.push(`<h${lvl} class="md-h">${inlineFmt(hm[2])}</h${lvl}>`);
          i++; continue;
        }
        // Bullet list
        if (/^[ \t]*[-*+] /.test(line)) {
          const items = [];
          while (i < lines.length && /^[ \t]*[-*+] /.test(lines[i])) {
            items.push(`<li>${inlineFmt(lines[i].replace(/^[ \t]*[-*+] /, ''))}</li>`);
            i++;
          }
          out.push(`<ul>${items.join('')}</ul>`);
          continue;
        }
        // Numbered list
        if (/^[ \t]*\d+\. /.test(line)) {
          const items = [];
          while (i < lines.length && /^[ \t]*\d+\. /.test(lines[i])) {
            items.push(`<li>${inlineFmt(lines[i].replace(/^[ \t]*\d+\. /, ''))}</li>`);
            i++;
          }
          out.push(`<ol>${items.join('')}</ol>`);
          continue;
        }
        // Blank line → paragraph break
        if (line.trim() === '') {
          out.push('');
          i++; continue;
        }
        // Regular line
        out.push(`<p>${inlineFmt(line)}</p>`);
        i++;
      }
      return out.join('\n');
    }

    function renderTable(lines) {
      const parseRow = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const sepIdx = lines.findIndex(l => /^\|[\s|:\-]+\|$/.test(l.trim()));
      if (sepIdx < 0) return lines.map(l => `<p>${inlineFmt(l)}</p>`).join('');
      const headers = parseRow(lines[0]);
      const rows = lines.filter((_, idx) => idx !== 0 && idx !== sepIdx);
      let html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
      headers.forEach(h => { html += `<th>${inlineFmt(h)}</th>`; });
      html += '</tr></thead><tbody>';
      rows.forEach(row => {
        if (!row.trim()) return;
        html += '<tr>' + parseRow(row).map(c => `<td>${inlineFmt(c)}</td>`).join('') + '</tr>';
      });
      return html + '</tbody></table></div>';
    }

    function inlineFmt(text) {
      return escHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>');
    }
  }

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Init panels ───────────────────────────────────────────
  initChatPanel('panel-chatgpt', 'openai');
  initChatPanel('panel-claude',  'anthropic');
  initChatPanel('panel-gemini',  'google');
  initChatPanel('panel-copilot', 'anthropic'); // copilot uses Claude API

})();
