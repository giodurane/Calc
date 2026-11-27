/*
 * Calc - Calculadora de horas sexagesimal y decimal
 * Copyright (C) 2026 Giovanny Duran
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  TimeCalculator,
  MODES,
  formatMinutesToSexagesimal,
  formatMinutesToDecimal,
  calculateRangeMinutes,
  buildCsvFromBlocks,
} from './calculator.js';

const STORAGE_KEYS = {
  THEME: 'calc_theme',
  BLOCKS: 'calc_time_blocks_v2',
};

const calc = new TimeCalculator(loadBlocks());
let toastTimer = null;

const $ = (id) => document.getElementById(id);

const els = {
  // Display
  screenModeText: $('screen-mode-text'),
  screenStatus: $('screen-status'),
  displayPrimary: $('display-primary'),
  displayUnit: $('display-unit'),
  displayEquivLabel: $('display-equiv-label'),
  displayEquivValue: $('display-equiv-value'),
  displayTotalValue: $('display-total-value'),

  // Header & Mode
  btnModeSex: $('btn-mode-sexagesimal'),
  btnModeDec: $('btn-mode-decimal'),
  btnThemeToggle: $('btn-theme-toggle'),
  iconSun: $('icon-sun'),
  iconMoon: $('icon-moon'),
  metaThemeColor: $('meta-theme-color'),
  btnOpenLog: $('btn-open-log'),
  btnCloseLog: $('btn-close-log'),
  mobileLogBadge: $('mobile-log-badge'),

  // Keypad
  keyExtra: $('key-extra'),
  keyUndo: $('key-undo'),
  keyAdd: $('key-add'),
  keySub: $('key-sub'),
  quickButtons: document.querySelectorAll('[data-quick]'),

  // Range accordion
  rangeAccordion: $('range-accordion'),
  btnRangeToggle: $('btn-range-toggle'),
  inputRangeStart: $('input-range-start'),
  inputRangeEnd: $('input-range-end'),
  rangePreviewValue: $('range-preview-value'),
  btnRangeAdd: $('btn-range-add'),
  btnRangeSub: $('btn-range-sub'),

  // Log panel & summary
  logPanel: $('log-panel'),
  drawerBackdrop: $('drawer-backdrop'),
  logCount: $('log-count'),
  logEmpty: $('log-empty'),
  logList: $('log-list'),
  sumadoHhmm: $('sumado-hhmm'),
  sumadoDec: $('sumado-dec'),
  restadoHhmm: $('restado-hhmm'),
  restadoDec: $('restado-dec'),
  balanceHhmm: $('balance-hhmm'),
  balanceDec: $('balance-dec'),
  footerTotalHhmm: $('footer-total-hhmm'),
  footerTotalDec: $('footer-total-dec'),
  btnCopyLog: $('btn-copy-log'),
  btnExportCsv: $('btn-export-csv'),
  btnClearLog: $('btn-clear-log'),
  toast: $('toast'),
};

/* =========================================================
   Persistence
   ========================================================= */
function loadBlocks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveBlocks() {
  try {
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(calc.blocks));
  } catch (_) {}
}

function nowTime() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/* =========================================================
   Theme Management
   ========================================================= */
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (els.metaThemeColor) {
    els.metaThemeColor.setAttribute('content', theme === 'dark' ? '#0e1116' : '#eceee9');
  }
  const isDark = theme === 'dark';
  els.iconSun.style.display = isDark ? 'block' : 'none';
  els.iconMoon.style.display = isDark ? 'none' : 'block';
  els.btnThemeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (_) {}
  }
}

/* =========================================================
   Toast & Clipboard
   ========================================================= */
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('is-visible');
  }, 1900);
}

async function copyToClipboard(text, successMsg = 'Copiado al portapapeles') {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast(successMsg);
  } catch (_) {
    showToast('No se pudo copiar');
  }
}

/* =========================================================
   Rendering
   ========================================================= */
function renderAll() {
  saveBlocks();
  const state = calc.getDisplayState();
  const { totals } = state;
  const isSex = state.mode === MODES.SEXAGESIMAL;

  // Header mode pills
  els.btnModeSex.setAttribute('aria-pressed', String(isSex));
  els.btnModeDec.setAttribute('aria-pressed', String(!isSex));

  // Display screen
  els.screenModeText.textContent = isSex ? 'HORAS NORMALES (HH:MM)' : 'MODO DECIMAL (0.00)';
  els.screenStatus.textContent = state.statusText;
  els.screenStatus.classList.toggle('is-sub', state.pendingSign < 0);

  els.displayPrimary.textContent = state.primary;
  els.displayUnit.textContent = state.unit;
  els.displayEquivLabel.textContent = state.equivLabel;
  els.displayEquivValue.textContent = state.equivValue;

  els.displayTotalValue.textContent = isSex ? totals.balanceSexagesimal : totals.balanceDecimal;
  els.displayTotalValue.classList.toggle('is-negative', totals.balanceMinutes < 0);

  // Keypad dynamic state
  els.keyExtra.textContent = isSex ? '00' : '.';
  els.keyExtra.setAttribute('aria-label', isSex ? 'Doble cero' : 'Punto decimal');
  els.keyUndo.disabled = !state.canUndo;
  els.keySub.classList.toggle('is-active', state.pendingSign < 0);
  els.keyAdd.classList.remove('is-active');

  // Summary cards (adapt primary/secondary to active mode)
  els.sumadoHhmm.textContent = isSex ? totals.sumadoSexagesimal : totals.sumadoDecimal;
  els.sumadoDec.textContent = isSex ? totals.sumadoDecimal : totals.sumadoSexagesimal;
  els.restadoHhmm.textContent = isSex ? totals.restadoSexagesimal : totals.restadoDecimal;
  els.restadoDec.textContent = isSex ? totals.restadoDecimal : totals.restadoSexagesimal;
  els.balanceHhmm.textContent = isSex ? totals.balanceSexagesimal : totals.balanceDecimal;
  els.balanceHhmm.classList.toggle('is-negative', totals.balanceMinutes < 0);
  els.balanceDec.textContent = isSex ? totals.balanceDecimal : totals.balanceSexagesimal;

  // Footer total
  els.footerTotalHhmm.textContent = isSex ? totals.balanceSexagesimal : totals.balanceDecimal;
  els.footerTotalDec.textContent = isSex ? totals.balanceDecimal : totals.balanceSexagesimal;

  // Range preview adapts to active mode
  updateRangePreview();

  // Counts
  const count = calc.blocks.length;
  els.logCount.textContent = String(count);
  els.mobileLogBadge.textContent = String(count);
  els.mobileLogBadge.setAttribute('data-count', String(count));

  // Blocks list (newest first visually)
  els.logEmpty.style.display = count === 0 ? 'flex' : 'none';
  els.logList.style.display = count === 0 ? 'none' : 'flex';
  els.logList.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const reversed = [...calc.blocks].reverse();

  for (const block of reversed) {
    const isAdd = block.sign >= 0;
    const li = document.createElement('li');
    li.className = 'block-item';

    const left = document.createElement('div');
    left.className = 'block-left';

    const signBtn = document.createElement('button');
    signBtn.type = 'button';
    signBtn.className = `block-sign-btn ${isAdd ? 'is-add' : 'is-sub'}`;
    signBtn.textContent = isAdd ? '+' : '−';
    signBtn.title = 'Clic para invertir entre sumar y restar';
    signBtn.setAttribute('aria-label', isAdd ? 'Cambiar bloque a restado' : 'Cambiar bloque a sumado');
    signBtn.addEventListener('click', () => {
      calc.toggleBlockSign(block.id);
      renderAll();
    });

    const info = document.createElement('div');
    info.className = 'block-info';

    const values = document.createElement('div');
    values.className = 'block-values';

    const sexStr = formatMinutesToSexagesimal(block.minutes);
    const decStr = `${formatMinutesToDecimal(block.minutes, true)} h`;

    const primaryVal = document.createElement('span');
    primaryVal.className = 'block-hhmm';
    primaryVal.textContent = isSex ? sexStr : decStr;

    const secondaryVal = document.createElement('span');
    secondaryVal.className = 'block-dec';
    secondaryVal.textContent = isSex ? decStr : sexStr;

    values.append(primaryVal, secondaryVal);
    info.appendChild(values);

    if (block.label) {
      const meta = document.createElement('span');
      meta.className = 'block-meta';
      meta.textContent = block.label;
      info.appendChild(meta);
    }

    left.append(signBtn, info);

    const right = document.createElement('div');
    right.className = 'block-right';

    if (block.timestamp) {
      const ts = document.createElement('span');
      ts.className = 'block-timestamp';
      ts.textContent = block.timestamp;
      right.appendChild(ts);
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'block-del-btn';
    delBtn.setAttribute('aria-label', 'Eliminar bloque');
    delBtn.title = 'Eliminar bloque';
    delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    delBtn.addEventListener('click', () => {
      calc.deleteBlock(block.id);
      renderAll();
    });

    right.appendChild(delBtn);
    li.append(left, right);
    fragment.appendChild(li);
  }

  els.logList.appendChild(fragment);
}

function updateRangePreview() {
  const isSex = calc.mode === MODES.SEXAGESIMAL;
  const res = calculateRangeMinutes(els.inputRangeStart.value, els.inputRangeEnd.value);
  if (!res) {
    els.rangePreviewValue.textContent = isSex ? '00:00 · 0.00 h' : '0.00 h · 00:00';
    return;
  }
  const suffix = res.overnight ? ' (+1 día)' : '';
  const sexStr = formatMinutesToSexagesimal(res.minutes);
  const decStr = `${formatMinutesToDecimal(res.minutes, true)} h`;
  els.rangePreviewValue.textContent = isSex
    ? `${sexStr} · ${decStr}${suffix}`
    : `${decStr} · ${sexStr}${suffix}`;
}

/* =========================================================
   Export & Copy Summary
   ========================================================= */
function copySummary() {
  if (calc.blocks.length === 0) {
    showToast('No hay bloques para copiar');
    return;
  }
  const t = calc.getTotals();
  const lines = calc.blocks.map((b, i) => {
    const sign = b.sign >= 0 ? '+' : '-';
    const note = b.label ? ` (${b.label})` : '';
    return `${i + 1}. ${sign}${formatMinutesToSexagesimal(b.minutes)} (${formatMinutesToDecimal(b.minutes, true)} h)${note}`;
  });
  lines.push('---');
  lines.push(`Sumado (+): ${t.sumadoSexagesimal} (${t.sumadoDecimal})`);
  lines.push(`Restado (-): ${t.restadoSexagesimal} (${t.restadoDecimal})`);
  lines.push(`Balance neto: ${t.balanceSexagesimal} (${t.balanceDecimal})`);
  copyToClipboard(lines.join('\n'), 'Resumen copiado');
}

function exportCsv() {
  if (calc.blocks.length === 0) {
    showToast('No hay bloques para exportar');
    return;
  }
  const csv = buildCsvFromBlocks(calc.blocks);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `calculadora-horas-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Archivo CSV descargado');
}

/* =========================================================
   Drawer Helpers (Mobile / iPad)
   ========================================================= */
function openDrawer() {
  els.logPanel.classList.add('is-open');
  els.drawerBackdrop.classList.add('is-open');
  els.btnOpenLog.setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
  els.logPanel.classList.remove('is-open');
  els.drawerBackdrop.classList.remove('is-open');
  els.btnOpenLog.setAttribute('aria-expanded', 'false');
}

function flashKey(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add('is-pressed');
  setTimeout(() => el.classList.remove('is-pressed'), 120);
}

/* =========================================================
   Event Listeners
   ========================================================= */
function bindEvents() {
  els.btnThemeToggle.addEventListener('click', () => {
    applyTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark', true);
  });

  els.btnModeSex.addEventListener('click', () => {
    calc.setMode(MODES.SEXAGESIMAL);
    renderAll();
  });

  els.btnModeDec.addEventListener('click', () => {
    calc.setMode(MODES.DECIMAL);
    renderAll();
  });

  els.quickButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.quick, 10);
      calc.quickAdd(mins, nowTime());
      renderAll();
    });
  });

  document.querySelector('.keypad').addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn || btn.disabled) return;

    if (btn.dataset.digit !== undefined) {
      calc.inputDigit(btn.dataset.digit);
      renderAll();
      return;
    }

    if (btn.dataset.op !== undefined) {
      calc.applyOperator(parseInt(btn.dataset.op, 10), nowTime());
      renderAll();
      return;
    }

    switch (btn.dataset.action) {
      case 'ac':
        calc.clearAll();
        renderAll();
        showToast('Todo reiniciado');
        break;
      case 'c':
        calc.clearEntry();
        renderAll();
        break;
      case 'backspace':
        calc.backspace();
        renderAll();
        break;
      case 'undo':
        if (calc.undo()) {
          renderAll();
          showToast('Acción deshecha');
        }
        break;
      case 'extra':
        if (calc.mode === MODES.DECIMAL) calc.inputDecimalPoint();
        else calc.inputDigit('00');
        renderAll();
        break;
      case 'equals':
        calc.commitCurrent(nowTime());
        renderAll();
        break;
    }
  });

  // Range Accordion
  els.btnRangeToggle.addEventListener('click', () => {
    const open = els.rangeAccordion.classList.toggle('is-open');
    els.btnRangeToggle.setAttribute('aria-expanded', String(open));
  });

  els.inputRangeStart.addEventListener('input', updateRangePreview);
  els.inputRangeEnd.addEventListener('input', updateRangePreview);

  els.btnRangeAdd.addEventListener('click', () => {
    const added = calc.addRangeBlock(els.inputRangeStart.value, els.inputRangeEnd.value, 1, nowTime());
    if (added) {
      renderAll();
      showToast(`Sumado ${formatMinutesToSexagesimal(added.minutes)}`);
    } else {
      showToast('Introduce un rango mayor que 00:00');
    }
  });

  els.btnRangeSub.addEventListener('click', () => {
    const added = calc.addRangeBlock(els.inputRangeStart.value, els.inputRangeEnd.value, -1, nowTime());
    if (added) {
      renderAll();
      showToast(`Restado ${formatMinutesToSexagesimal(added.minutes)}`);
    } else {
      showToast('Introduce un rango mayor que 00:00');
    }
  });

  // Log Actions
  els.btnCopyLog.addEventListener('click', copySummary);
  els.btnExportCsv.addEventListener('click', exportCsv);
  els.btnClearLog.addEventListener('click', () => {
    if (calc.clearBlocks()) {
      renderAll();
      showToast('Bloques limpiados (Ctrl+Z para deshacer)');
    }
  });

  // Mobile Drawer
  els.btnOpenLog.addEventListener('click', openDrawer);
  els.btnCloseLog.addEventListener('click', closeDrawer);
  els.drawerBackdrop.addEventListener('click', closeDrawer);

  // Keyboard Shortcuts
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (calc.undo()) {
        flashKey('key-undo');
        renderAll();
        showToast('Acción deshecha');
      }
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      calc.inputDigit(key);
      flashKey(`key-${key}`);
      renderAll();
      return;
    }

    if (key === '.' || key === ',') {
      event.preventDefault();
      if (calc.mode === MODES.DECIMAL) {
        calc.inputDecimalPoint();
        flashKey('key-extra');
        renderAll();
      }
      return;
    }

    if (key === '+') {
      event.preventDefault();
      calc.applyOperator(1, nowTime());
      flashKey('key-add');
      renderAll();
      return;
    }

    if (key === '-') {
      event.preventDefault();
      calc.applyOperator(-1, nowTime());
      flashKey('key-sub');
      renderAll();
      return;
    }

    if (key === 'Enter' || key === '=') {
      event.preventDefault();
      calc.commitCurrent(nowTime());
      flashKey('key-eq');
      renderAll();
      return;
    }

    if (key === 'Backspace') {
      event.preventDefault();
      calc.backspace();
      flashKey('key-back');
      renderAll();
      return;
    }

    if (key === 'Delete') {
      event.preventDefault();
      calc.clearEntry();
      flashKey('key-c');
      renderAll();
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      if (els.logPanel.classList.contains('is-open')) {
        closeDrawer();
      } else {
        calc.clearEntry();
        flashKey('key-c');
        renderAll();
      }
      return;
    }

    if (key === 'm' || key === 'M') {
      event.preventDefault();
      calc.setMode(calc.mode === MODES.SEXAGESIMAL ? MODES.DECIMAL : MODES.SEXAGESIMAL);
      renderAll();
    }
  });
}

// Init
applyTheme(getCurrentTheme(), false);
updateRangePreview();
renderAll();
bindEvents();

// Register Service Worker for offline PWA installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
