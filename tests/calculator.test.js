/*
 * Calc - Tests unitarios para el motor de bloques sexagesimal y decimal
 * Copyright (C) 2026 Giovanny Durán
 * Licensed under GNU GPL v3.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TimeCalculator,
  MODES,
  calculateRangeMinutes,
  buildCsvFromBlocks,
} from '../js/calculator.js';

test('starts at 00:00 with zero totals', () => {
  const calc = new TimeCalculator();
  const s = calc.getDisplayState();
  assert.equal(s.primary, '00:00');
  assert.equal(s.equivValue, '0.00 h');
  assert.equal(s.totals.balanceSexagesimal, '00:00');
  assert.equal(s.statusText, 'Listo para sumar');
});

test('right-to-left sexagesimal input: 1 -> 00:01, 115 -> 01:15, 1150 -> 11:50', () => {
  const calc = new TimeCalculator();
  calc.inputDigit('1');
  assert.equal(calc.getDisplayState().primary, '00:01');
  calc.inputDigit('1');
  assert.equal(calc.getDisplayState().primary, '00:11');
  calc.inputDigit('5');
  assert.equal(calc.getDisplayState().primary, '01:15');
  assert.equal(calc.getDisplayState().equivValue, '1.25 h');
  calc.inputDigit('0');
  assert.equal(calc.getDisplayState().primary, '11:50');
});

test('adding and subtracting blocks updates Sumado, Restado and Balance Neto', () => {
  const calc = new TimeCalculator();
  // 01:30 - 00:45 = 00:45
  calc.inputDigit('1');
  calc.inputDigit('3');
  calc.inputDigit('0');
  calc.applyOperator(-1, '10:00'); // commits +01:30, sets next sign to -1

  calc.inputDigit('4');
  calc.inputDigit('5');
  calc.commitCurrent('10:01'); // commits -00:45

  const { totals } = calc.getDisplayState();
  assert.equal(totals.sumadoSexagesimal, '01:30');
  assert.equal(totals.sumadoDecimal, '1.50 h');
  assert.equal(totals.restadoSexagesimal, '00:45');
  assert.equal(totals.restadoDecimal, '0.75 h');
  assert.equal(totals.balanceSexagesimal, '00:45');
  assert.equal(totals.balanceDecimal, '0.75 h');
  assert.equal(calc.blocks.length, 2);
});

test('toggling a block sign flips it between Sumado and Restado live', () => {
  const calc = new TimeCalculator();
  calc.quickAdd(60, '10:00'); // +01:00
  calc.quickAdd(30, '10:01'); // +00:30
  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '01:30');

  const secondId = calc.blocks[1].id;
  calc.toggleBlockSign(secondId);

  const { totals } = calc.getDisplayState();
  assert.equal(totals.sumadoSexagesimal, '01:00');
  assert.equal(totals.restadoSexagesimal, '00:30');
  assert.equal(totals.balanceSexagesimal, '00:30');
});

test('undo restores previous ledger state after add, toggle, delete, and clear', () => {
  const calc = new TimeCalculator();
  calc.quickAdd(15);
  calc.quickAdd(30);
  assert.equal(calc.blocks.length, 2);

  calc.clearBlocks();
  assert.equal(calc.blocks.length, 0);

  assert.equal(calc.undo(), true);
  assert.equal(calc.blocks.length, 2);
  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '00:45');

  assert.equal(calc.undo(), true);
  assert.equal(calc.blocks.length, 1);
  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '00:15');
});

test('quick-add accumulates on active input or adds block immediately when at 00:00', () => {
  const calc = new TimeCalculator();
  // At 00:00 -> adds block directly
  calc.quickAdd(15);
  calc.quickAdd(120);
  assert.equal(calc.blocks.length, 2);
  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '02:15');

  // With active input -> adds to current input
  calc.inputDigit('1');
  calc.inputDigit('0');
  calc.inputDigit('0'); // 01:00
  calc.quickAdd(30); // 01:30 in display
  assert.equal(calc.getDisplayState().primary, '01:30');
  calc.commitCurrent();
  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '03:45');
});

test('mode switching between Normal HH:MM and Decimal 0.00 preserves input', () => {
  const calc = new TimeCalculator();
  calc.inputDigit('1');
  calc.inputDigit('3');
  calc.inputDigit('0'); // 01:30
  calc.setMode(MODES.DECIMAL);
  assert.equal(calc.getDisplayState().primary, '1.5');
  assert.equal(calc.getDisplayState().equivValue, '01:30');

  calc.commitCurrent();
  calc.inputDigit('2');
  calc.inputDecimalPoint();
  calc.inputDigit('2');
  calc.inputDigit('5'); // 2.25 h = 02:15
  calc.commitCurrent();

  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '03:45');
  assert.equal(calc.getDisplayState().totals.balanceDecimal, '3.75 h');
});

test('start -> end time range handles daytime and overnight shifts', () => {
  const day = calculateRangeMinutes('08:30', '14:15');
  assert.deepEqual(day, { minutes: 345, overnight: false });

  const night = calculateRangeMinutes('22:00', '06:00');
  assert.deepEqual(night, { minutes: 480, overnight: true });

  const calc = new TimeCalculator();
  const block = calc.addRangeBlock('08:30', '14:15', 1, '14:16');
  assert.equal(block.label, '08:30 → 14:15');
  assert.equal(calc.getDisplayState().totals.balanceSexagesimal, '05:45');
});

test('CSV export includes UTF-8 BOM, block rows, and summary totals', () => {
  const calc = new TimeCalculator();
  calc.quickAdd(90, '09:00');
  calc.applyOperator(-1);
  calc.quickAdd(30, '09:15');
  const csv = buildCsvFromBlocks(calc.blocks);
  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.match(csv, /01:30,1\.50,90/);
  assert.match(csv, /BALANCE NETO,01:00,1\.00,60/);
});
