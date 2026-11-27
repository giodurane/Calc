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

export const MODES = {
  SEXAGESIMAL: 'sexagesimal',
  DECIMAL: 'decimal',
};

const MAX_SEXAGESIMAL_DIGITS = 8;
const MAX_DECIMAL_LENGTH = 10;
const MAX_UNDO_HISTORY = 50;

/**
 * Formats total minutes into signed HH:MM (rounded to nearest minute).
 * @param {number} totalMinutes
 * @returns {string}
 */
export function formatMinutesToSexagesimal(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return '00:00';
  const rounded = Math.round(totalMinutes);
  const isNegative = rounded < 0;
  const absMinutes = Math.abs(rounded);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${isNegative ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formats total minutes into decimal hours string (e.g. "1.25").
 * @param {number} totalMinutes
 * @param {boolean} fixedTwo
 * @returns {string}
 */
export function formatMinutesToDecimal(totalMinutes, fixedTwo = true) {
  if (!Number.isFinite(totalMinutes)) return fixedTwo ? '0.00' : '0';
  const hours = totalMinutes / 60;
  if (Object.is(hours, -0) || Math.abs(hours) < 1e-10) {
    return fixedTwo ? '0.00' : '0';
  }
  if (fixedTwo) {
    return hours.toFixed(2);
  }
  const rounded = Math.round(hours * 10000) / 10000;
  return String(rounded);
}

/**
 * Right-to-left sexagesimal display formatter:
 * "" -> "00:00", "1" -> "00:01", "115" -> "01:15", "1150" -> "11:50"
 * @param {string} digits
 * @returns {string}
 */
export function formatDigitBufferToSexagesimal(digits) {
  const clean = (digits || '').replace(/\D/g, '');
  if (clean.length === 0) return '00:00';
  const padded = clean.padStart(4, '0');
  const minutesPart = padded.slice(-2);
  const hoursPart = padded.slice(0, -2);
  return `${hoursPart}:${minutesPart}`;
}

/**
 * Converts a right-to-left digit buffer to total minutes (always >= 0).
 * Example: "115" -> 75, "175" -> 135 (normalizes to 02:15).
 * @param {string} digits
 * @returns {number}
 */
export function digitBufferToMinutes(digits) {
  const clean = (digits || '').replace(/\D/g, '');
  if (clean.length === 0) return 0;
  const padded = clean.padStart(4, '0');
  const minutes = parseInt(padded.slice(-2), 10);
  const hours = parseInt(padded.slice(0, -2), 10);
  return hours * 60 + minutes;
}

/**
 * Converts non-negative minutes to a normalized right-to-left digit buffer.
 * Example: 75 -> "115", 0 -> ""
 * @param {number} totalMinutes
 * @returns {string}
 */
export function minutesToDigitBuffer(totalMinutes) {
  const rounded = Math.max(0, Math.round(totalMinutes));
  if (rounded === 0) return '';
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return `${hours}${String(minutes).padStart(2, '0')}`.replace(/^0+/, '');
}

/**
 * Calculates duration in minutes between two "HH:MM" strings.
 * If end < start, assumes overnight wrap (+24h) and sets overnight: true.
 * @param {string} startTime "HH:MM"
 * @param {string} endTime "HH:MM"
 * @returns {{ minutes: number, overnight: boolean } | null}
 */
export function calculateRangeMinutes(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const startMatch = /^(\d{1,2}):(\d{2})$/.exec(startTime.trim());
  const endMatch = /^(\d{1,2}):(\d{2})$/.exec(endTime.trim());
  if (!startMatch || !endMatch) return null;

  const sh = parseInt(startMatch[1], 10);
  const sm = parseInt(startMatch[2], 10);
  const eh = parseInt(endMatch[1], 10);
  const em = parseInt(endMatch[2], 10);
  if (sh > 23 || sm > 59 || eh > 23 || em > 59) return null;

  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  if (endTotal >= startTotal) {
    return { minutes: endTotal - startTotal, overnight: false };
  }
  return { minutes: 24 * 60 - startTotal + endTotal, overnight: true };
}

/**
 * Formats a CSV export string (with UTF-8 BOM) for a list of blocks.
 * @param {Array<{sign: number, minutes: number, timestamp: string, label?: string}>} blocks
 * @returns {string}
 */
export function buildCsvFromBlocks(blocks) {
  const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (/[",\n;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  let sumado = 0;
  let restado = 0;

  const rows = [
    ['#', 'Hora registro', 'Operación', 'HH:MM', 'Decimal (h)', 'Minutos', 'Nota'].join(','),
  ];

  blocks.forEach((b, idx) => {
    const signedMins = b.sign >= 0 ? b.minutes : -b.minutes;
    if (b.sign >= 0) sumado += b.minutes;
    else restado += b.minutes;

    rows.push(
      [
        idx + 1,
        escapeCsv(b.timestamp || ''),
        b.sign >= 0 ? '+' : '-',
        escapeCsv(formatMinutesToSexagesimal(signedMins)),
        formatMinutesToDecimal(signedMins, true),
        Math.round(signedMins),
        escapeCsv(b.label || ''),
      ].join(',')
    );
  });

  const balance = sumado - restado;
  rows.push('');
  rows.push(['', '', 'SUMADO (+)', formatMinutesToSexagesimal(sumado), formatMinutesToDecimal(sumado, true), Math.round(sumado), ''].join(','));
  rows.push(['', '', 'RESTADO (-)', formatMinutesToSexagesimal(restado), formatMinutesToDecimal(restado, true), Math.round(restado), ''].join(','));
  rows.push(['', '', 'BALANCE NETO', formatMinutesToSexagesimal(balance), formatMinutesToDecimal(balance, true), Math.round(balance), ''].join(','));

  return '\uFEFF' + rows.join('\n');
}

export class TimeCalculator {
  /**
   * @param {Array} initialBlocks
   */
  constructor(initialBlocks = []) {
    this.mode = MODES.SEXAGESIMAL;
    this.digitBuffer = '';
    this.decimalBuffer = '0';
    this.pendingSign = 1; // +1 = sumar, -1 = restar
    this.blocks = Array.isArray(initialBlocks) ? initialBlocks.map((b) => ({ ...b })) : [];
    this.undoStack = [];
  }

  _pushUndo() {
    this.undoStack.push({
      blocks: this.blocks.map((b) => ({ ...b })),
      digitBuffer: this.digitBuffer,
      decimalBuffer: this.decimalBuffer,
      pendingSign: this.pendingSign,
    });
    if (this.undoStack.length > MAX_UNDO_HISTORY) {
      this.undoStack.shift();
    }
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const prev = this.undoStack.pop();
    this.blocks = prev.blocks;
    this.digitBuffer = prev.digitBuffer;
    this.decimalBuffer = prev.decimalBuffer;
    this.pendingSign = prev.pendingSign;
    return true;
  }

  /**
   * Returns current input magnitude in minutes (>= 0).
   */
  getCurrentInputMinutes() {
    if (this.mode === MODES.SEXAGESIMAL) {
      return digitBufferToMinutes(this.digitBuffer);
    }
    const parsed = parseFloat(this.decimalBuffer);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 60 * 100) / 100;
  }

  hasInput() {
    if (this.mode === MODES.SEXAGESIMAL) {
      return this.digitBuffer.length > 0;
    }
    return this.decimalBuffer !== '0' && this.decimalBuffer !== '0.';
  }

  _clearInput() {
    this.digitBuffer = '';
    this.decimalBuffer = '0';
  }

  _setInputFromMinutes(minutes) {
    const safe = Math.max(0, minutes);
    this.digitBuffer = minutesToDigitBuffer(safe);
    this.decimalBuffer = formatMinutesToDecimal(safe, false);
  }

  /**
   * Switches between sexagesimal (HH:MM) and decimal (0.00), preserving current input.
   * @param {'sexagesimal'|'decimal'} newMode
   */
  setMode(newMode) {
    if (newMode !== MODES.SEXAGESIMAL && newMode !== MODES.DECIMAL) return;
    if (this.mode === newMode) return;
    const mins = this.getCurrentInputMinutes();
    this.mode = newMode;
    this._setInputFromMinutes(mins);
  }

  /**
   * Inputs a digit ('0'-'9' or '00').
   * @param {string} d
   */
  inputDigit(d) {
    if (this.mode === MODES.SEXAGESIMAL) {
      for (const ch of String(d)) {
        if (!/^\d$/.test(ch)) continue;
        if (this.digitBuffer === '' && ch === '0') continue;
        if (this.digitBuffer.length < MAX_SEXAGESIMAL_DIGITS) {
          this.digitBuffer += ch;
        }
      }
      return;
    }

    for (const ch of String(d)) {
      if (!/^\d$/.test(ch)) continue;
      if (this.decimalBuffer.length >= MAX_DECIMAL_LENGTH) break;
      if (this.decimalBuffer === '0') {
        this.decimalBuffer = ch;
      } else {
        this.decimalBuffer += ch;
      }
    }
  }

  /**
   * Inputs a decimal point in decimal mode.
   */
  inputDecimalPoint() {
    if (this.mode !== MODES.DECIMAL) return;
    if (!this.decimalBuffer.includes('.')) {
      this.decimalBuffer += '.';
    }
  }

  /**
   * Deletes the last entered digit/character.
   */
  backspace() {
    if (this.mode === MODES.SEXAGESIMAL) {
      if (this.digitBuffer.length > 0) {
        this.digitBuffer = this.digitBuffer.slice(0, -1);
      }
      return;
    }

    if (this.decimalBuffer.length <= 1) {
      this.decimalBuffer = '0';
    } else {
      this.decimalBuffer = this.decimalBuffer.slice(0, -1);
    }
  }

  /**
   * Clears only current input (C).
   */
  clearEntry() {
    this._clearInput();
  }

  /**
   * Clears input and all registered blocks (AC), saving to undo stack if blocks existed.
   */
  clearAll() {
    if (this.blocks.length > 0 || this.hasInput()) {
      this._pushUndo();
    }
    this._clearInput();
    this.blocks = [];
    this.pendingSign = 1;
  }

  /**
   * Clears only the registered blocks list (Limpiar), undoable.
   */
  clearBlocks() {
    if (this.blocks.length === 0) return false;
    this._pushUndo();
    this.blocks = [];
    return true;
  }

  /**
   * Internal helper to append a new block to the ledger.
   */
  _addBlock(minutes, sign, label = '', timestamp = '') {
    const cleanMins = Math.round(minutes * 100) / 100;
    if (cleanMins <= 0) return null;

    this._pushUndo();
    const block = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      minutes: cleanMins,
      sign: sign >= 0 ? 1 : -1,
      label,
      timestamp,
    };
    this.blocks.push(block);
    return block;
  }

  /**
   * Handles pressing '+' or '-'.
   * If the user typed a value, commits it using the current pendingSign,
   * clears input, and sets the next pendingSign to the pressed operator.
   * @param {1|-1} nextSign
   * @param {string} timestamp
   * @returns {object|null} The committed block, if any
   */
  applyOperator(nextSign, timestamp = '') {
    const sign = nextSign >= 0 ? 1 : -1;
    let committed = null;
    const mins = this.getCurrentInputMinutes();

    if (mins > 0) {
      committed = this._addBlock(mins, this.pendingSign, '', timestamp);
      this._clearInput();
    }

    this.pendingSign = sign;
    return committed;
  }

  /**
   * Handles pressing '=': commits the current typed value using pendingSign
   * and resets pendingSign back to +1 ("Listo para sumar").
   * @param {string} timestamp
   * @returns {object|null}
   */
  commitCurrent(timestamp = '') {
    const mins = this.getCurrentInputMinutes();
    if (mins <= 0) {
      this._clearInput();
      this.pendingSign = 1;
      return null;
    }
    const block = this._addBlock(mins, this.pendingSign, '', timestamp);
    this._clearInput();
    this.pendingSign = 1;
    return block;
  }

  /**
   * Quick-add buttons (+15m, +30m, +1h, +2h):
   * - If display is at 00:00 (empty), registers the block immediately using pendingSign.
   * - If user is typing a value, adds those minutes to the current input.
   * @param {number} minutesToAdd
   * @param {string} timestamp
   * @returns {object|null}
   */
  quickAdd(minutesToAdd, timestamp = '') {
    if (!Number.isFinite(minutesToAdd) || minutesToAdd <= 0) return null;

    if (!this.hasInput()) {
      const block = this._addBlock(minutesToAdd, this.pendingSign, 'Acceso rápido', timestamp);
      this.pendingSign = 1;
      return block;
    }

    const updated = this.getCurrentInputMinutes() + minutesToAdd;
    this._setInputFromMinutes(updated);
    return null;
  }

  /**
   * Adds a block calculated from a start -> end time range (e.g., "08:30", "14:15").
   * @param {string} startTime
   * @param {string} endTime
   * @param {1|-1} sign
   * @param {string} timestamp
   */
  addRangeBlock(startTime, endTime, sign = 1, timestamp = '') {
    const res = calculateRangeMinutes(startTime, endTime);
    if (!res || res.minutes <= 0) return null;
    const label = res.overnight ? `${startTime} → ${endTime} (+1d)` : `${startTime} → ${endTime}`;
    return this._addBlock(res.minutes, sign, label, timestamp);
  }

  /**
   * Flips a block between + (Sumado) and - (Restado).
   * @param {string} id
   */
  toggleBlockSign(id) {
    const idx = this.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this._pushUndo();
    this.blocks[idx] = {
      ...this.blocks[idx],
      sign: this.blocks[idx].sign >= 0 ? -1 : 1,
    };
    return true;
  }

  /**
   * Deletes a single block by ID.
   * @param {string} id
   */
  deleteBlock(id) {
    const exists = this.blocks.some((b) => b.id === id);
    if (!exists) return false;
    this._pushUndo();
    this.blocks = this.blocks.filter((b) => b.id !== id);
    return true;
  }

  /**
   * Computes live ledger summary totals.
   */
  getTotals() {
    let sumadoMinutes = 0;
    let restadoMinutes = 0;
    for (const b of this.blocks) {
      if (b.sign >= 0) sumadoMinutes += b.minutes;
      else restadoMinutes += b.minutes;
    }
    const balanceMinutes = sumadoMinutes - restadoMinutes;
    return {
      sumadoMinutes,
      restadoMinutes,
      balanceMinutes,
      sumadoSexagesimal: formatMinutesToSexagesimal(sumadoMinutes),
      sumadoDecimal: `${formatMinutesToDecimal(sumadoMinutes, true)} h`,
      restadoSexagesimal: formatMinutesToSexagesimal(restadoMinutes),
      restadoDecimal: `${formatMinutesToDecimal(restadoMinutes, true)} h`,
      balanceSexagesimal: formatMinutesToSexagesimal(balanceMinutes),
      balanceDecimal: `${formatMinutesToDecimal(balanceMinutes, true)} h`,
    };
  }

  /**
   * Returns complete snapshot for UI rendering.
   */
  getDisplayState() {
    const isSex = this.mode === MODES.SEXAGESIMAL;
    const inputMinutes = this.getCurrentInputMinutes();
    const totals = this.getTotals();

    const primary = isSex
      ? formatDigitBufferToSexagesimal(this.digitBuffer)
      : (this.decimalBuffer === '0' ? '0.00' : this.decimalBuffer);

    const unit = isSex ? 'h:m' : 'h';
    const equivLabel = isSex ? 'EQUIV. DECIMAL' : 'EQUIV. HH:MM';
    const equivValue = isSex
      ? `${formatMinutesToDecimal(inputMinutes, true)} h`
      : formatMinutesToSexagesimal(inputMinutes);

    const statusText = this.pendingSign >= 0
      ? (this.hasInput() ? 'Sumando bloque' : 'Listo para sumar')
      : (this.hasInput() ? 'Restando bloque' : 'Listo para restar');

    return {
      mode: this.mode,
      primary,
      unit,
      equivLabel,
      equivValue,
      statusText,
      pendingSign: this.pendingSign,
      canUndo: this.canUndo(),
      totals,
      blockCount: this.blocks.length,
    };
  }
}
