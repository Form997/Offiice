(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const HISTORY_KEY = 'haidat-calc';
  const APPEARANCE_KEY = 'haidat-writer-appearance-v1';

  // Sync theme with HAI ĐẤT OFFICE shared appearance setting
  const themeBtn = $('#calcThemeToggle');
  function applyCalcTheme(mode) {
    const dark = mode === 'dark';
    document.documentElement.dataset.calcTheme = dark ? 'dark' : 'light';
    if (themeBtn) themeBtn.textContent = dark ? '☀️ Sáng' : '🌙 Tối';
  }
  function readSavedTheme() {
    try {
      const v = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '{}');
      return v && v.theme === 'dark' ? 'dark' : 'light';
    } catch { return 'light'; }
  }
  applyCalcTheme(readSavedTheme());
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.dataset.calcTheme === 'dark' ? 'light' : 'dark';
      applyCalcTheme(next);
      try {
        const cur = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '{}');
        localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ ...(cur && typeof cur === 'object' ? cur : {}), theme: next === 'dark' ? 'dark' : 'green' }));
      } catch {}
    });
  }
  window.addEventListener('storage', e => {
    if (e.key === APPEARANCE_KEY) applyCalcTheme(readSavedTheme());
  });

  // Scientific Calculator utility modal (preserved from HAI ĐẤT CALC V1)
  const dlg = $('#sciCalcDialog');
  const openBtn = $('#openSciCalc');
  const closeBtn = $('#closeSciCalc');
  const expr = $('#sciExpr');
  const keysHost = $('#sciKeys');
  const resultEl = $('#sciResult');
  const historyEl = $('#sciHistory');
  const equalBtn = $('#sciEqual');
  const insertBtn = $('#sciInsertCell');
  const clearBtn = $('#sciClear');
  let lastNumericResult = null;

  if (openBtn && dlg) {
    openBtn.addEventListener('click', () => {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      expr?.focus();
    });
  }
  if (closeBtn && dlg) {
    closeBtn.addEventListener('click', () => (typeof dlg.close === 'function' ? dlg.close() : dlg.removeAttribute('open')));
  }
  if (dlg) {
    dlg.addEventListener('click', e => {
      if (e.target === dlg) (typeof dlg.close === 'function' ? dlg.close() : dlg.removeAttribute('open'));
    });
  }

  const keys = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','(',')','+','^','sqrt(','sin(','cos(','tan(','pi','log(','ln(','abs(','⌫','C'];
  if (keysHost && expr) {
    keys.forEach(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      b.addEventListener('click', () => {
        if (k === 'C') { expr.value = ''; resultEl.textContent = '0'; lastNumericResult = null; }
        else if (k === '⌫') { expr.value = expr.value.slice(0, -1); }
        else { expr.value += ({ '÷': '/', '×': '*', '−': '-' }[k] || k); }
        expr.focus();
      });
      keysHost.append(b);
    });
  }

  function tokenize(s) {
    const a = s.replace(/π/g, 'pi').match(/(?:\d+(?:\.\d*)?|\.\d+)|(?:sin|cos|tan|sqrt|log|ln|abs|pi|e)|[()+\-*/^]/gi);
    if (!a || a.join('') !== s.replace(/\s/g, '')) throw new Error('Biểu thức có ký tự không hợp lệ');
    return a;
  }
  function evaluate(src) {
    const t = tokenize(src);
    let i = 0;
    const peek = () => t[i], take = () => t[i++];
    function atom() {
      const x = take();
      if (x === '+') return atom();
      if (x === '-') return -atom();
      if (x === '(') {
        const v = add();
        if (take() !== ')') throw new Error('Thiếu dấu )');
        return v;
      }
      if (!x) throw new Error('Thiếu toán hạng');
      if (/^\d/.test(x) || x[0] === '.') return Number(x);
      const n = x.toLowerCase();
      if (n === 'pi') return Math.PI;
      if (n === 'e') return Math.E;
      if (['sin','cos','tan','sqrt','log','ln','abs'].includes(n)) {
        if (take() !== '(') throw new Error('Thiếu dấu (');
        const v = add();
        if (take() !== ')') throw new Error('Thiếu dấu )');
        return ({ sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, log: Math.log10, ln: Math.log, abs: Math.abs })[n](
          n === 'sin' || n === 'cos' || n === 'tan' ? v * Math.PI / 180 : v
        );
      }
      throw new Error('Không hiểu: ' + x);
    }
    function power() { let v = atom(); if (peek() === '^') { take(); v = Math.pow(v, power()); } return v; }
    function mul() { let v = power(); while (['*','/'].includes(peek())) { const op = take(), r = power(); v = op === '*' ? v * r : v / r; } return v; }
    function add() { let v = mul(); while (['+','-'].includes(peek())) { const op = take(), r = mul(); v = op === '+' ? v + r : v - r; } return v; }
    const v = add();
    if (i < t.length) throw new Error('Còn ký tự chưa xử lý: ' + peek());
    if (!Number.isFinite(v)) throw new Error('Kết quả không xác định');
    return v;
  }

  function runCalc() {
    if (!expr || !resultEl) return;
    if (!expr.value.trim()) { resultEl.textContent = '0'; lastNumericResult = 0; return; }
    try {
      const v = evaluate(expr.value);
      const clean = Number(v.toPrecision(12));
      lastNumericResult = clean;
      resultEl.textContent = clean.toLocaleString('vi-VN');
      const entry = expr.value.trim() + ' = ' + clean;
      if (historyEl) {
        const li = document.createElement('li');
        li.textContent = entry;
        li.addEventListener('click', () => { expr.value = String(clean); expr.focus(); });
        historyEl.prepend(li);
      }
      try {
        const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const next = [entry, ...(Array.isArray(h) ? h : [])].slice(0, 30);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
    } catch (e) {
      lastNumericResult = null;
      resultEl.textContent = 'Lỗi: ' + e.message;
    }
  }

  if (equalBtn) equalBtn.addEventListener('click', runCalc);
  if (expr) expr.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runCalc(); } });
  if (insertBtn) {
    insertBtn.addEventListener('click', () => {
      if (lastNumericResult === null && expr?.value.trim()) runCalc();
      if (lastNumericResult === null) return;
      const formulaInput = $('#formulaInput'), applyBtn = $('#applyFormula');
      if (formulaInput && applyBtn) {
        formulaInput.value = String(lastNumericResult);
        applyBtn.click();
        if (dlg) (typeof dlg.close === 'function' ? dlg.close() : dlg.removeAttribute('open'));
      }
    });
  }
  if (historyEl) {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) {
        saved.forEach(x => {
          const li = document.createElement('li');
          li.textContent = String(x);
          li.addEventListener('click', () => {
            const parts = String(x).split('=');
            if (expr) { expr.value = (parts[parts.length - 1] || '').trim(); expr.focus(); }
          });
          historyEl.append(li);
        });
      }
    } catch {}
  }
  if (clearBtn && historyEl) {
    clearBtn.addEventListener('click', () => {
      try { localStorage.removeItem(HISTORY_KEY); } catch {}
      historyEl.replaceChildren();
    });
  }

  // PWA Service Worker & Install prompt
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  let deferredInstall = null;
  const installBtn = $('#install');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstall = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstall) return;
      const ev = deferredInstall;
      deferredInstall = null;
      try { await ev.prompt(); await ev.userChoice; } catch {}
      installBtn.hidden = true;
    });
  }
})();
