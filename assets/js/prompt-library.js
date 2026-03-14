/* prompt-library.js — Search, filter, copy, favorites, Try in Arena */

(function () {
  const FAV_KEY       = 'pl_favorites_v1';
  const PER_PAGE      = 6;
  let allPrompts      = [];
  let favorites       = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  let currentFilter   = { tool: 'all', category: 'all', search: '' };
  let debounceTimer   = null;
  let currentView     = 'grid';
  let currentPage     = 1;

  // ── Skeleton placeholders ─────────────────────────────────
  function showSkeletons(grid, count = 6) {
    grid.innerHTML = Array.from({ length: count }, () => `
      <div class="prompt-card skeleton-card" aria-hidden="true">
        <div class="sk sk-badge"></div>
        <div class="sk sk-title"></div>
        <div class="sk sk-line"></div>
        <div class="sk sk-line sk-short"></div>
        <div class="sk sk-tags"><div class="sk sk-tag"></div><div class="sk sk-tag"></div></div>
        <div class="sk sk-btn-row"><div class="sk sk-btn"></div><div class="sk sk-btn"></div></div>
      </div>`).join('');
  }

  // ── Load prompts ─────────────────────────────────────────
  async function loadPrompts() {
    const grid = document.getElementById('prompts-grid');
    if (grid) showSkeletons(grid);
    try {
      const res  = await fetch('assets/data/prompts.json');
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
      const toolOk   = currentFilter.tool === 'all' || p.tool === currentFilter.tool;
      const catOk    = currentFilter.category === 'all' || p.category === currentFilter.category;
      const q        = currentFilter.search.toLowerCase();
      const searchOk = !q ||
        p.title.toLowerCase().includes(q) ||
        p.template.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.includes(q)) ||
        (p.category || '').includes(q);
      return toolOk && catOk && searchOk;
    });
  }

  // ── Render ───────────────────────────────────────────────
  function renderLibrary(animate = false) {
    const grid    = document.getElementById('prompts-grid');
    const countEl = document.getElementById('prompt-result-count');
    const pagEl   = document.getElementById('library-pagination');
    if (!grid) return;

    const filtered   = getFiltered();
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    currentPage      = Math.min(currentPage, totalPages || 1);

    const start = (currentPage - 1) * PER_PAGE;
    const end   = Math.min(start + PER_PAGE, filtered.length);
    const page  = filtered.slice(start, end);

    function applyContent() {
      if (countEl) {
        countEl.innerHTML = filtered.length === 0
          ? `<strong>0</strong> prompts found`
          : `Showing <strong>${start + 1}–${end}</strong> of ${filtered.length} prompts`;
      }
      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="no-results">
            <div class="nr-icon">🔍</div>
            <p>No prompts match your search. Try different keywords or clear filters.</p>
          </div>`;
        if (pagEl) pagEl.innerHTML = '';
        return;
      }
      grid.innerHTML = page.map(p => renderCard(p)).join('');
      attachCardListeners(grid);
      renderPagination(filtered.length, totalPages, pagEl);
    }

    if (animate) {
      const savedY = window.scrollY;
      grid.classList.add('pl-fade-out');
      setTimeout(() => {
        applyContent();
        grid.classList.remove('pl-fade-out');
        window.scrollTo({ top: savedY, behavior: 'instant' });
      }, 160);
    } else {
      applyContent();
    }
  }

  // ── Pagination controls ───────────────────────────────────
  function renderPagination(total, totalPages, container) {
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const prevDis = currentPage === 1          ? 'disabled' : '';
    const nextDis = currentPage === totalPages ? 'disabled' : '';

    // Build page number buttons — show up to 5 around current page
    let pageButtons = '';
    const delta = 2;
    const left  = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    if (left > 1) {
      pageButtons += `<button class="page-num-btn" data-page="1">1</button>`;
      if (left > 2) pageButtons += `<span class="page-ellipsis">…</span>`;
    }
    for (let i = left; i <= right; i++) {
      pageButtons += `<button class="page-num-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (right < totalPages) {
      if (right < totalPages - 1) pageButtons += `<span class="page-ellipsis">…</span>`;
      pageButtons += `<button class="page-num-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    container.innerHTML = `
      <button class="page-arrow-btn" id="page-prev" ${prevDis} aria-label="Previous page">← Prev</button>
      <div class="page-nums">${pageButtons}</div>
      <button class="page-arrow-btn" id="page-next" ${nextDis} aria-label="Next page">Next →</button>`;

    container.querySelector('#page-prev')?.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderLibrary(true); }
    });
    container.querySelector('#page-next')?.addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; renderLibrary(true); }
    });
    container.querySelectorAll('.page-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderLibrary(true);
      });
    });
  }

  function resetPage() { currentPage = 1; }

  // ── Card helpers ──────────────────────────────────────────
  function toolLabel(tool) {
    const map = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', copilot: 'Copilot' };
    return map[tool] || tool;
  }

  const TOOL_URLS = {
    chatgpt: 'https://chatgpt.com/',
    claude:  'https://claude.ai/',
    gemini:  'https://gemini.google.com/',
    copilot: 'https://github.com/features/copilot'
  };

  function renderCard(p) {
    const isFav   = favorites.includes(p.id);
    const featured = p.featured ? '<span class="featured-badge">★ Featured</span>' : '';
    const tags     = (p.tags || []).slice(0, 3).map(t => `<span class="prompt-tag">${t}</span>`).join('');
    const toolName = toolLabel(p.tool);

    return `
      <article class="prompt-card fade-in" data-tool="${p.tool}" data-id="${p.id}">
        ${featured}
        <div class="prompt-card-header">
          <span class="prompt-tool-badge">${toolName}</span>
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
        <div class="card-open-row">
          <button class="open-tool-btn" data-id="${p.id}" data-tool="${p.tool}" title="Copy prompt and open ${toolName}">
            📋 Copy + Open in ${toolName} ↗
          </button>
        </div>
      </article>`;
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
    grid.querySelectorAll('.open-tool-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openInTool(btn.dataset.id, btn.dataset.tool); });
    });
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
      const ta = document.createElement('textarea');
      ta.value = p.template;
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.showToast?.('Prompt copied!', 'success', 2000);
    });
  }

  // ── Try in Arena ─────────────────────────────────────────
  function tryInArena(id) {
    const p = allPrompts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('arena')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const tabMap = { chatgpt: 'tab-chatgpt', claude: 'tab-claude', gemini: 'tab-gemini', copilot: 'tab-copilot' };
      document.getElementById(tabMap[p.tool])?.click();
      setTimeout(() => {
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

  // ── Open in Tool ──────────────────────────────────────────
  function openInTool(id, tool) {
    const p = allPrompts.find(x => x.id === id);
    if (!p) return;
    const toolUrl  = TOOL_URLS[tool] || '#';
    const toolName = toolLabel(tool);
    navigator.clipboard.writeText(p.template).then(() => {
      window.showToast?.(`Prompt copied — paste it in ${toolName}!`, 'success', 3000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = p.template;
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.showToast?.(`Prompt copied — paste it in ${toolName}!`, 'success', 3000);
    });
    window.open(toolUrl, '_blank', 'noopener');
  }

  // ── Modal ─────────────────────────────────────────────────
  function openModal(id) {
    const p = allPrompts.find(x => x.id === id);
    if (!p) return;
    const modal   = document.getElementById('prompt-modal');
    const content = document.getElementById('modal-body');
    if (!modal || !content) return;
    const vars = (p.variables || []).map(v => `<span class="modal-var">[${v}]</span>`).join('');
    content.innerHTML = `
      <span class="modal-tool-badge prompt-tool-badge"
            style="display:inline-block;margin-bottom:12px">${toolLabel(p.tool)}</span>
      <h3 class="modal-title">${escHtml(p.title)}</h3>
      <div class="modal-section-label">Template</div>
      <div class="modal-template">${escHtml(p.template)}</div>
      ${p.example ? `<div class="modal-section-label">Example (filled in)</div>
      <div class="modal-example">${escHtml(p.example)}</div>` : ''}
      ${p.variables?.length ? `<div class="modal-section-label">Variables to fill in</div>
      <div class="modal-variables">${vars}</div>` : ''}
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
  const modalEl    = document.getElementById('prompt-modal');
  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', () => modalEl?.classList.remove('open'));
  modalEl?.addEventListener('click', e => { if (e.target === modalEl) modalEl.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modalEl?.classList.remove('open'); });

  window.tryInArena = tryInArena;

  // ── Filter controls ───────────────────────────────────────
  document.querySelectorAll('.filter-chip[data-tool]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-tool]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter.tool = chip.dataset.tool;
      resetPage(); renderLibrary();
    });
  });

  document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-category]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter.category = chip.dataset.category;
      resetPage(); renderLibrary();
    });
  });

  const searchInput = document.getElementById('library-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilter.search = searchInput.value;
        resetPage(); renderLibrary();
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
      const grid = document.getElementById('prompts-grid');
      const pagEl = document.getElementById('library-pagination');
      if (favFilterBtn.classList.contains('active')) {
        favFilterBtn.classList.remove('active');
        currentFilter.search = searchInput?.value || '';
        resetPage(); renderLibrary();
      } else {
        favFilterBtn.classList.add('active');
        const favPrompts = allPrompts.filter(p => favorites.includes(p.id));
        if (!grid) return;
        if (pagEl) pagEl.innerHTML = '';
        if (favPrompts.length === 0) {
          grid.innerHTML = '<div class="no-results"><div class="nr-icon">☆</div><p>No favorites yet. Click ☆ on any prompt to save it.</p></div>';
        } else {
          grid.innerHTML = favPrompts.map(p => renderCard(p)).join('');
          attachCardListeners(grid);
        }
      }
    });
  }

  // ── Utility ───────────────────────────────────────────────
  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Init ──────────────────────────────────────────────────
  if (document.getElementById('prompts-grid')) loadPrompts();

})();
