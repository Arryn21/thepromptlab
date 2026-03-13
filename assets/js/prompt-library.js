/* prompt-library.js — Search, filter, copy, favorites, Try in Arena */

(function () {
  const FAV_KEY = 'pl_favorites_v1';
  let allPrompts = [];
  let favorites  = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  let currentFilter = { tool: 'all', category: 'all', search: '' };
  let debounceTimer = null;
  let currentView = 'grid';

  // ── Load prompts ─────────────────────────────────────────
  async function loadPrompts() {
    try {
      const res = await fetch('assets/data/prompts.json');
      const data = await res.json();
      allPrompts = data.prompts;
      renderLibrary();
    } catch (e) {
      console.error('Failed to load prompts.json', e);
      document.getElementById('prompts-grid')?.insertAdjacentHTML('beforeend',
        '<p class="text-muted text-center">Failed to load prompts. Please refresh.</p>');
    }
  }

  // ── Filter logic ─────────────────────────────────────────
  function getFiltered() {
    return allPrompts.filter(p => {
      const toolOk = currentFilter.tool === 'all' || p.tool === currentFilter.tool;
      const catOk  = currentFilter.category === 'all' || p.category === currentFilter.category;
      const q = currentFilter.search.toLowerCase();
      const searchOk = !q ||
        p.title.toLowerCase().includes(q) ||
        p.template.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.includes(q)) ||
        (p.category || '').includes(q);
      return toolOk && catOk && searchOk;
    });
  }

  // ── Render ───────────────────────────────────────────────
  function renderLibrary() {
    const grid = document.getElementById('prompts-grid');
    const countEl = document.getElementById('prompt-result-count');
    if (!grid) return;

    const filtered = getFiltered();
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of ${allPrompts.length} prompts`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <div class="nr-icon">🔍</div>
          <p>No prompts match your search. Try different keywords or clear filters.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => renderCard(p)).join('');

    // Attach event listeners
    grid.querySelectorAll('.prompt-fav-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFav(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.prompt-copy-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        copyPrompt(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.prompt-arena-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        tryInArena(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.prompt-expand-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openModal(btn.dataset.id);
      });
    });
  }

  function toolLabel(tool) {
    const map = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', copilot: 'Copilot' };
    return map[tool] || tool;
  }

  function renderCard(p) {
    const isFav = favorites.includes(p.id);
    const featured = p.featured
      ? '<span class="featured-badge">★ Featured</span>' : '';
    const tags = (p.tags || []).slice(0, 3).map(t =>
      `<span class="prompt-tag">${t}</span>`).join('');

    return `
      <article class="prompt-card fade-in" data-tool="${p.tool}" data-id="${p.id}">
        ${featured}
        <div class="prompt-card-header">
          <span class="prompt-tool-badge">${toolLabel(p.tool)}</span>
          <button class="prompt-fav-btn ${isFav ? 'active' : ''}"
                  data-id="${p.id}"
                  aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
                  title="${isFav ? 'Remove favorite' : 'Save to favorites'}">
            ${isFav ? '★' : '☆'}
          </button>
        </div>
        <div class="prompt-title">${escHtml(p.title)}</div>
        <div class="prompt-template">${escHtml(p.template)}</div>
        <div class="prompt-tags">${tags}</div>
        <div class="prompt-actions">
          <button class="prompt-copy-btn" data-id="${p.id}">📋 Copy</button>
          <button class="prompt-arena-btn" data-id="${p.id}">⚡ Try</button>
          <button class="prompt-expand-btn" data-id="${p.id}">↗ View</button>
        </div>
      </article>`;
  }

  // ── Favorites ────────────────────────────────────────────
  function toggleFav(id) {
    const idx = favorites.indexOf(id);
    if (idx >= 0) {
      favorites.splice(idx, 1);
      window.showToast?.('Removed from favorites', 'info', 1500);
    } else {
      favorites.push(id);
      window.showToast?.('Saved to favorites ★', 'success', 1500);
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));

    // Update button without full re-render
    const btn = document.querySelector(`.prompt-fav-btn[data-id="${id}"]`);
    if (btn) {
      const isFav = favorites.includes(id);
      btn.textContent = isFav ? '★' : '☆';
      btn.classList.toggle('active', isFav);
    }
  }

  // ── Copy ─────────────────────────────────────────────────
  function copyPrompt(id) {
    const p = allPrompts.find(x => x.id === id);
    if (!p) return;
    navigator.clipboard.writeText(p.template).then(() => {
      window.showToast?.('Prompt copied to clipboard!', 'success', 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = p.template;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.showToast?.('Prompt copied!', 'success', 2000);
    });
  }

  // ── Try in Arena ─────────────────────────────────────────
  function tryInArena(id) {
    const p = allPrompts.find(x => x.id === id);
    if (!p) return;

    // Navigate to arena section
    const arenaSection = document.getElementById('arena');
    if (arenaSection) {
      arenaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Select matching tab
    setTimeout(() => {
      const tabMap = { chatgpt: 'tab-chatgpt', claude: 'tab-claude', gemini: 'tab-gemini', copilot: 'tab-copilot' };
      const tabId = tabMap[p.tool];
      if (tabId) {
        document.getElementById(tabId)?.click();
      }

      // Pre-fill chat input
      setTimeout(() => {
        const tool = p.tool === 'copilot' ? 'claude' : p.tool; // copilot uses claude tab
        const input = document.querySelector(`#panel-${tool} .chat-input, #panel-copilot .chat-input`);
        const targetInput = document.querySelector(`#panel-${p.tool === 'copilot' ? 'copilot' : p.tool} .chat-input`);
        if (targetInput) {
          targetInput.value = p.template;
          targetInput.focus();
          targetInput.dispatchEvent(new Event('input'));
        }
        window.showToast?.(`"${p.title}" loaded in Arena`, 'success', 2500);
      }, 400);
    }, 600);
  }

  // ── Modal ─────────────────────────────────────────────────
  function openModal(id) {
    const p = allPrompts.find(x => x.id === id);
    if (!p) return;

    const modal = document.getElementById('prompt-modal');
    const content = document.getElementById('modal-body');
    if (!modal || !content) return;

    const vars = (p.variables || []).map(v => `<span class="modal-var">[${v}]</span>`).join('');

    content.innerHTML = `
      <span class="modal-tool-badge prompt-tool-badge"
            style="display:inline-block;margin-bottom:12px">${toolLabel(p.tool)}</span>
      <h3 class="modal-title">${escHtml(p.title)}</h3>

      <div class="modal-section-label">Template</div>
      <div class="modal-template">${escHtml(p.template)}</div>

      ${p.example ? `
      <div class="modal-section-label">Example (filled in)</div>
      <div class="modal-example">${escHtml(p.example)}</div>
      ` : ''}

      ${p.variables?.length ? `
      <div class="modal-section-label">Variables to fill in</div>
      <div class="modal-variables">${vars}</div>
      ` : ''}

      <div class="modal-actions">
        <button class="btn btn-primary btn-sm" onclick="
          navigator.clipboard.writeText(${JSON.stringify(p.template)});
          window.showToast('Copied!','success',1500);
        ">📋 Copy Template</button>
        ${p.example ? `<button class="btn btn-outline btn-sm" onclick="
          navigator.clipboard.writeText(${JSON.stringify(p.example)});
          window.showToast('Example copied!','success',1500);
        ">📋 Copy Example</button>` : ''}
        <button class="btn btn-outline btn-sm" onclick="
          document.getElementById('prompt-modal').classList.remove('open');
          setTimeout(() => window.tryInArena && window.tryInArena('${p.id}'), 300);
        ">⚡ Try in Arena</button>
        <a href="https://github.com/Arryn21/thepromptlab/issues/new?title=Prompt+suggestion:+${encodeURIComponent(p.title)}&body=Suggest+an+improvement+for+prompt+id:+${p.id}"
           target="_blank" class="btn btn-outline btn-sm">💡 Suggest Edit</a>
      </div>`;

    modal.classList.add('open');
  }

  // Close modal
  const modalEl = document.getElementById('prompt-modal');
  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', () => modalEl?.classList.remove('open'));
  modalEl?.addEventListener('click', e => {
    if (e.target === modalEl) modalEl.classList.remove('open');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') modalEl?.classList.remove('open');
  });

  // Expose for inline use
  window.tryInArena = tryInArena;

  // ── Filter controls ───────────────────────────────────────
  document.querySelectorAll('.filter-chip[data-tool]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-tool]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter.tool = chip.dataset.tool;
      renderLibrary();
    });
  });

  document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-category]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter.category = chip.dataset.category;
      renderLibrary();
    });
  });

  const searchInput = document.getElementById('library-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilter.search = searchInput.value;
        renderLibrary();
      }, 150);
    });
  }

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      const grid = document.getElementById('prompts-grid');
      if (grid) grid.classList.toggle('list-view', currentView === 'list');
    });
  });

  // Favorites filter
  const favFilterBtn = document.getElementById('filter-favorites');
  if (favFilterBtn) {
    favFilterBtn.addEventListener('click', () => {
      if (favFilterBtn.classList.contains('active')) {
        favFilterBtn.classList.remove('active');
        currentFilter.search = searchInput?.value || '';
        renderLibrary();
      } else {
        favFilterBtn.classList.add('active');
        const grid = document.getElementById('prompts-grid');
        const favPrompts = allPrompts.filter(p => favorites.includes(p.id));
        if (!grid) return;
        if (favPrompts.length === 0) {
          grid.innerHTML = '<div class="no-results"><div class="nr-icon">☆</div><p>No favorites yet. Click ☆ on any prompt to save it.</p></div>';
        } else {
          grid.innerHTML = favPrompts.map(p => renderCard(p)).join('');
          attachCardListeners(grid);
        }
      }
    });
  }

  function attachCardListeners(grid) {
    grid.querySelectorAll('.prompt-fav-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); toggleFav(btn.dataset.id); });
    });
    grid.querySelectorAll('.prompt-copy-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); copyPrompt(btn.dataset.id); });
    });
    grid.querySelectorAll('.prompt-arena-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); tryInArena(btn.dataset.id); });
    });
    grid.querySelectorAll('.prompt-expand-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openModal(btn.dataset.id); });
    });
  }

  // ── Utility ───────────────────────────────────────────────
  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Init ──────────────────────────────────────────────────
  if (document.getElementById('prompts-grid')) {
    loadPrompts();
  }

})();
