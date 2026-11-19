import test from 'node:test';
import assert from 'node:assert/strict';
import { validDate, daysTogether, cleanState, readState, saveState, STORAGE_KEY } from '../dist/core.js';
test('valida fechas reales, incluidos años bisiestos', () => {
  assert.equal(validDate('2024-02-29'), true);
  for (const value of ['', '2025-02-29', '2026-04-31', '2026-13-01', '<script>']) assert.equal(validDate(value), false);
});
test('cuenta días calendario, sin depender de las horas ni el horario de verano', () => {
  assert.equal(daysTogether('2026-11-18', new Date(2026, 10, 18, 23, 59)), 0);
  assert.equal(daysTogether('2026-10-18', new Date(2026, 10, 18)), 31);
  assert.equal(daysTogether('2026-11-19', new Date(2026, 10, 18)), -1);
  assert.equal(daysTogether('2024-02-28', new Date(2024, 2, 1)), 2);
  assert.equal(daysTogether('', new Date()), null);
});
test('recupera datos dañados y restringe valores guardados', () => {
  const state = cleanState({ planted: 999, discovered: [0, 0, 23, 24, -1, '3'], date: 'oops', photos: ['javascript:alert(1)'] });
  assert.equal(state.planted, 16); assert.deepEqual(state.discovered, [0, 23]); assert.equal(state.date, ''); assert.deepEqual(state.photos, ['']);
  assert.deepEqual(cleanState(null), cleanState());
  assert.equal(readState({ getItem: () => '{broken' }).available, false);
});
test('persiste y restaura los datos de una visita a otra', () => {
  const map = new Map(); const storage = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v) };
  const state = cleanState({ name: 'Jenny', date: '2026-10-18', discovered: [2], planted: 3, letterOpened: true, photos: ['data:image/jpeg;base64,YQ=='] });
  assert.equal(saveState(storage, state), true); assert.ok(map.has(STORAGE_KEY)); assert.deepEqual(readState(storage).state, state);
});
test('tolera almacenamiento bloqueado o sin espacio', () => {
  assert.equal(readState(null).available, false);
  assert.equal(saveState({ setItem() { throw new Error('QuotaExceeded'); } }, cleanState()), false);
});
