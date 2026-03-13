/* python-runner.js — Pyodide lazy-load, Claude→code→graph pipeline */

(function () {

  let pyodide = null;
  let pyodideLoading = false;
  let retryCount = 0;

  const VIZ_SYSTEM = `You are a Python/matplotlib code generator for math visualizations.
Generate ONLY valid Python code using matplotlib and numpy.
The code MUST end with: plt.savefig('/tmp/output.png', dpi=100, bbox_inches='tight')
Use plt.style.use('dark_background') at the start.
Set figure size: plt.figure(figsize=(8,5))
Wrap your code in a markdown code block: \`\`\`python ... \`\`\`
Do not include any explanation outside the code block.`;

  const QUICK_CHIPS = [
    'Graph y = x² - 4x + 3, mark the vertex and x-intercepts',
    'Plot sin(x) and cos(x) from -2π to 2π, label key points',
    'Show a histogram of 50 student test scores (mean 75, std 10)',
    'Graph y = 2x + 3 and y = -x + 5, mark intersection'
  ];

  const vizInput   = document.getElementById('viz-input');
  const vizRunBtn  = document.getElementById('viz-run-btn');
  const vizOutput  = document.getElementById('viz-output');
  const pyProgress = document.getElementById('pyodide-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressMsg  = document.getElementById('progress-msg');
  const chartResult  = document.getElementById('chart-result');
  const chartImg     = document.getElementById('chart-img');
  const downloadBtn  = document.getElementById('chart-download');
  const colabLink    = document.getElementById('chart-colab');
  const codeDetails  = document.getElementById('generated-code');
  const codeBlock    = document.getElementById('code-block');
  const codeCopyBtn  = document.getElementById('code-copy');

  if (!vizInput) return; // Not on this page

  // Quick chips
  const vizChips = document.getElementById('viz-chips');
  if (vizChips) {
    QUICK_CHIPS.forEach(text => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = text;
      btn.addEventListener('click', () => {
        vizInput.value = text;
        vizInput.focus();
      });
      vizChips.appendChild(btn);
    });
  }

  vizRunBtn?.addEventListener('click', () => {
    const prompt = vizInput?.value.trim();
    if (!prompt) { window.showToast?.('Describe what to graph', 'warning'); return; }
    runVisualization(prompt);
  });

  vizInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); vizRunBtn?.click(); }
  });

  codeCopyBtn?.addEventListener('click', () => {
    const code = codeBlock?.textContent || '';
    navigator.clipboard.writeText(code).then(() => {
      window.showToast?.('Code copied!', 'success');
    });
  });

  async function runVisualization(userPrompt) {
    const key = window.getKey?.('anthropic') || '';
    if (!key) {
      window.showToast?.('Add your Anthropic API key in the panel header', 'warning', 3000);
      return;
    }

    vizRunBtn.disabled = true;
    vizRunBtn.innerHTML = '<span>⟳</span> Generating...';
    retryCount = 0;

    try {
      const code = await getCodeFromClaude(key, userPrompt);
      if (!code) throw new Error('No Python code generated');
      await executeAndDisplay(code, key, userPrompt);
    } catch (e) {
      showError(e.message);
    } finally {
      vizRunBtn.disabled = false;
      vizRunBtn.innerHTML = '▶ Generate Graph';
    }
  }

  async function getCodeFromClaude(key, prompt, errorContext = '') {
    const userMsg = errorContext
      ? `The following Python code failed with this error:\n${errorContext}\n\nOriginal request: ${prompt}\n\nPlease fix the code.`
      : `Create a matplotlib visualization: ${prompt}`;

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
        system: VIZ_SYSTEM,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text || '';
    return extractCode(rawText);
  }

  function extractCode(text) {
    const match = text.match(/```python\s*([\s\S]+?)```/);
    if (match) return match[1].trim();
    // Fallback: try without language tag
    const fallback = text.match(/```\s*([\s\S]+?)```/);
    if (fallback) return fallback[1].trim();
    return null;
  }

  async function executeAndDisplay(code, key, originalPrompt) {
    // Show progress
    showProgress('Loading Python environment...', 5);

    if (!pyodide) {
      await loadPyodide(code, key, originalPrompt);
    } else {
      await runCode(code, key, originalPrompt);
    }
  }

  async function loadPyodide(code, key, originalPrompt) {
    if (pyodideLoading) return;
    pyodideLoading = true;

    showProgress('Loading Pyodide (~7MB, one-time)...', 10);

    try {
      pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/'
      });
      showProgress('Loading matplotlib & numpy...', 50);
      await pyodide.loadPackage(['matplotlib', 'numpy']);
      showProgress('Ready!', 90);
      pyodideLoading = false;
      await runCode(code, key, originalPrompt);
    } catch (e) {
      pyodideLoading = false;
      pyodide = null;
      throw new Error('Failed to load Python environment: ' + e.message);
    }
  }

  async function runCode(code, key, originalPrompt) {
    showProgress('Running your visualization...', 95);
    try {
      await pyodide.runPythonAsync(code);

      // Read the PNG
      const pngBytes = pyodide.FS.readFile('/tmp/output.png');
      const blob = new Blob([pngBytes], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      displayChart(url, code);
      hideProgress();
    } catch (pyError) {
      if (retryCount < 1) {
        retryCount++;
        showProgress('Fixing error, retrying...', 80);
        window.showToast?.('Auto-retrying with error context...', 'info', 2000);
        const fixedCode = await getCodeFromClaude(key, originalPrompt, pyError.message);
        if (fixedCode) {
          await runCode(fixedCode, key, originalPrompt);
        } else {
          throw pyError;
        }
      } else {
        throw new Error('Python error: ' + pyError.message);
      }
    }
  }

  function showProgress(msg, pct) {
    if (pyProgress) pyProgress.classList.add('visible');
    if (chartResult) chartResult.classList.remove('visible');
    if (progressMsg) progressMsg.textContent = msg;
    if (progressFill) progressFill.style.width = pct + '%';
  }

  function hideProgress() {
    if (pyProgress) pyProgress.classList.remove('visible');
  }

  function displayChart(url, code) {
    if (!chartResult || !chartImg) return;
    chartImg.src = url;
    chartResult.classList.add('visible');

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'math-visualization.png';
        a.click();
      };
    }

    if (codeBlock) codeBlock.textContent = code;

    if (colabLink) {
      const encoded = encodeURIComponent(code);
      colabLink.href = `https://colab.research.google.com/gist/#code=${encoded.substring(0, 1000)}`;
    }

    window.showToast?.('Graph generated!', 'success');
  }

  function showError(msg) {
    hideProgress();
    if (vizOutput) {
      const errEl = document.createElement('div');
      errEl.style.cssText = 'padding:16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;font-size:0.85rem;color:#ef4444;';
      errEl.innerHTML = `<strong>⚠ Error:</strong> ${msg}`;
      // Remove old errors
      vizOutput.querySelectorAll('[style*="239,68,68"]').forEach(el => el.remove());
      vizOutput.appendChild(errEl);
    }
    window.showToast?.('Error: ' + msg, 'error', 4000);
  }

  // Load Pyodide script lazily when Math Visualizer tab clicked
  const vizTab = document.getElementById('tab-math');
  if (vizTab) {
    let pyodideScriptLoaded = false;
    vizTab.addEventListener('click', () => {
      if (!pyodideScriptLoaded && !window.loadPyodide) {
        pyodideScriptLoaded = true;
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
        document.head.appendChild(script);
      }
    });
  }

})();
