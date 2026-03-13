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

  // ── SHA-256 (pure JS — works on http, file://, and https) ──
  function sha256(str) {
    function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const bytes = new TextEncoder().encode(str);
    const bits = bytes.length * 8;
    const padLen = bytes.length % 64 < 56 ? 56 - bytes.length % 64 : 120 - bytes.length % 64;
    const padded = new Uint8Array(bytes.length + padLen + 8);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, bits, false);
    for (let i = 0; i < padded.length; i += 64) {
      const w = new Array(64);
      for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4, false);
      for (let j = 16; j < 64; j++) {
        const s0 = rightRotate(w[j-15],7)^rightRotate(w[j-15],18)^(w[j-15]>>>3);
        const s1 = rightRotate(w[j-2],17)^rightRotate(w[j-2],19)^(w[j-2]>>>10);
        w[j] = (w[j-16]+s0+w[j-7]+s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,hh] = h;
      for (let j = 0; j < 64; j++) {
        const S1 = rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25);
        const ch = (e&f)^(~e&g);
        const t1 = (hh+S1+ch+K[j]+w[j]) >>> 0;
        const S0 = rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22);
        const maj = (a&b)^(a&c)^(b&c);
        const t2 = (S0+maj) >>> 0;
        hh=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      h = h.map((v,i)=>(v+[a,b,c,d,e,f,g,hh][i])>>>0);
    }
    return h.map(v=>v.toString(16).padStart(8,'0')).join('');
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
  function doAuth() {
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
      const hash = sha256(pw);
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
