/* session.js — Admin panel, SHA-256 password, sessionStorage key management */

(function () {

  // ── Constants ──────────────────────────────────────────────
  // SHA-256 hash of the admin password (set before workshop)
  // Default password: "liftlab2026" — CHANGE before workshop!
  // To generate new hash: run in browser console:
  //   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
  //     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
  const ADMIN_HASH = '29e4e33720fe99236b0b854994397a05af8a517968088ff9b9bdad7ceda8e26b';

  const SESSION_WINDOW_START = new Date('2026-03-18T01:00:00Z').getTime(); // Mar 17 6PM PDT
  const SESSION_WINDOW_END   = new Date('2026-03-18T13:00:00Z').getTime(); // Mar 18 6AM PDT

  const KEY_OPENAI    = 'pl_key_openai';
  const KEY_ANTHROPIC = 'pl_key_anthropic';
  const KEY_GOOGLE    = 'pl_key_google';
  const ADMIN_ACTIVE  = 'pl_admin_active';

  // ── SHA-256 helper ─────────────────────────────────────────
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // ── Session mode check ─────────────────────────────────────
  function isSessionMode() {
    const now = Date.now();
    return sessionStorage.getItem(ADMIN_ACTIVE) === 'true' &&
           now >= SESSION_WINDOW_START && now <= SESSION_WINDOW_END;
  }

  function isAdminAuthed() {
    return sessionStorage.getItem(ADMIN_ACTIVE) === 'true';
  }

  // ── Key getters (used by ai-arena.js & python-runner.js) ──
  window.getKey = function (provider) {
    switch (provider) {
      case 'openai':     return sessionStorage.getItem(KEY_OPENAI) || '';
      case 'anthropic':  return sessionStorage.getItem(KEY_ANTHROPIC) || '';
      case 'google':     return sessionStorage.getItem(KEY_GOOGLE) || '';
      default: return '';
    }
  };

  window.setKey = function (provider, value) {
    const keyMap = { openai: KEY_OPENAI, anthropic: KEY_ANTHROPIC, google: KEY_GOOGLE };
    if (keyMap[provider]) sessionStorage.setItem(keyMap[provider], value.trim());
  };

  // ── Admin Panel UI ─────────────────────────────────────────
  const overlay    = document.getElementById('admin-overlay');
  const closeBtn   = document.getElementById('admin-close');
  const authForm   = document.getElementById('admin-auth-form');
  const keysForm   = document.getElementById('admin-keys-form');
  const pwInput    = document.getElementById('admin-password');
  const authStatus = document.getElementById('admin-auth-status');
  const lockMsg    = document.getElementById('admin-locked-msg');

  function openAdmin() {
    if (!overlay) return;
    overlay.classList.add('open');
    if (isAdminAuthed()) {
      showKeysPanel();
    } else {
      showAuthPanel();
    }
  }

  function closeAdmin() {
    overlay?.classList.remove('open');
  }

  function showAuthPanel() {
    authForm?.style && (authForm.style.display = 'block');
    keysForm?.style && (keysForm.style.display = 'none');
    lockMsg?.style  && (lockMsg.style.display = 'none');
  }

  function showKeysPanel() {
    authForm?.style && (authForm.style.display = 'none');
    keysForm?.style && (keysForm.style.display = 'block');
    lockMsg?.style  && (lockMsg.style.display = 'none');
    // Pre-fill saved keys
    const oai = document.getElementById('admin-openai-key');
    const ant = document.getElementById('admin-anthropic-key');
    const goo = document.getElementById('admin-google-key');
    if (oai) oai.value = sessionStorage.getItem(KEY_OPENAI) || '';
    if (ant) ant.value = sessionStorage.getItem(KEY_ANTHROPIC) || '';
    if (goo) goo.value = sessionStorage.getItem(KEY_GOOGLE) || '';
  }

  // Auth form submit
  async function doAuth() {
    const pw = (pwInput?.value || '').trim();
    if (!pw) {
      if (authStatus) {
        authStatus.className = 'admin-status error';
        authStatus.textContent = 'Please enter the workshop password.';
      }
      return;
    }
    const btn = document.getElementById('admin-auth-submit');
    if (btn) btn.textContent = 'Checking...';
    try {
      const hash = await sha256(pw);
      if (hash === ADMIN_HASH) {
        sessionStorage.setItem(ADMIN_ACTIVE, 'true');
        if (authStatus) {
          authStatus.className = 'admin-status success';
          authStatus.textContent = 'Access granted!';
        }
        setTimeout(showKeysPanel, 500);
        window.showToast?.('Admin session started', 'success');
        updateKeyBars();
      } else {
        if (authStatus) {
          authStatus.className = 'admin-status error';
          authStatus.textContent = 'Incorrect password. Try again.';
        }
        if (pwInput) pwInput.value = '';
        if (btn) btn.textContent = 'Unlock Session';
      }
    } catch (e) {
      if (authStatus) {
        authStatus.className = 'admin-status error';
        authStatus.textContent = 'Error: ' + e.message;
      }
      if (btn) btn.textContent = 'Unlock Session';
    }
  }

  const authSubmitBtn = document.getElementById('admin-auth-submit');
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', doAuth);
  }
  if (pwInput) {
    pwInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doAuth();
    });
  }

  // Keys form save
  const keysSaveBtn = document.getElementById('admin-keys-save');
  if (keysSaveBtn) {
    keysSaveBtn.addEventListener('click', () => {
      const oai = document.getElementById('admin-openai-key')?.value?.trim() || '';
      const ant = document.getElementById('admin-anthropic-key')?.value?.trim() || '';
      const goo = document.getElementById('admin-google-key')?.value?.trim() || '';
      if (oai) sessionStorage.setItem(KEY_OPENAI, oai);
      if (ant) sessionStorage.setItem(KEY_ANTHROPIC, ant);
      if (goo) sessionStorage.setItem(KEY_GOOGLE, goo);
      window.showToast?.('API keys saved to session', 'success');
      closeAdmin();
      updateKeyBars();
    });
  }

  // Clear keys
  const keysClearBtn = document.getElementById('admin-keys-clear');
  if (keysClearBtn) {
    keysClearBtn.addEventListener('click', () => {
      sessionStorage.removeItem(KEY_OPENAI);
      sessionStorage.removeItem(KEY_ANTHROPIC);
      sessionStorage.removeItem(KEY_GOOGLE);
      sessionStorage.removeItem(ADMIN_ACTIVE);
      window.showToast?.('Session keys cleared', 'warning');
      closeAdmin();
      updateKeyBars();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeAdmin);
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeAdmin();
  });

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      openAdmin();
    }
    if (e.key === 'Escape') closeAdmin();
  });

  // ── Self-service key bars ─────────────────────────────────
  function updateKeyBars() {
    document.querySelectorAll('.key-bar').forEach(bar => {
      const provider = bar.dataset.provider;
      const input = bar.querySelector('input');
      const key = window.getKey(provider);
      if (input && key) input.value = key;
      // Hide if admin authed (admin panel handles keys)
      if (isAdminAuthed()) {
        bar.classList.add('hidden');
      } else {
        bar.classList.remove('hidden');
      }
    });
  }

  // Save from self-service bars
  document.querySelectorAll('.key-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bar = btn.closest('.key-bar');
      const provider = bar?.dataset.provider;
      const input = bar?.querySelector('input');
      if (provider && input?.value) {
        window.setKey(provider, input.value);
        window.showToast?.('API key saved', 'success');
        updateKeyBars();
      }
    });
  });

  updateKeyBars();
  window.isAdminAuthed = isAdminAuthed;
  window.openAdmin = openAdmin;

})();
