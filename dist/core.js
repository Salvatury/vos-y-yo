export const STORAGE_KEY = 'jenny-garden-v1';
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}
export function daysTogether(start, now = new Date()) {
  if (!validDate(start)) return null;
  const [y, m, d] = start.split('-').map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - Date.UTC(y, m - 1, d)) / 86400000);
}
export function cleanState(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};
  return {
    name: typeof raw.name === 'string' ? raw.name.slice(0, 40) : '',
    date: validDate(raw.date) ? raw.date : '',
    discovered: Array.isArray(raw.discovered) ? [...new Set(raw.discovered.filter(n => Number.isInteger(n) && n >= 0 && n < 24))] : [],
    planted: Number.isInteger(raw.planted) ? Math.min(16, Math.max(0, raw.planted)) : 0,
    letterOpened: raw.letterOpened === true,
    photos: Array.isArray(raw.photos) ? raw.photos.slice(0, 3).map(p => typeof p === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(p) && p.length < 900000 ? p : '') : []
  };
}
export function readState(storage) {
  try { return { state: cleanState(JSON.parse(storage.getItem(STORAGE_KEY) || '{}')), available: true }; }
  catch { return { state: cleanState(), available: false }; }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
