import { CONFIG } from './config.js';
import { daysTogether, readState, saveState } from './core.js';
import { flowerSVG, memorySVG } from './art.js';

const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let { state, available } = readState(storage);
let activeMemory = 0;
let toastTimer;
function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 4500);
}
function persist() {
  available = saveState(storage, state);
  if (!available) toast('No se pudo guardar. Los cambios durarán esta visita.');
  return available;
}
function openDialog(id) { $(id).showModal(); }
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => {
  const box = dialog.getBoundingClientRect();
  if (e.target === dialog && (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom)) dialog.close();
}));

const palette = ['#deb1bd', '#c3c6e4', '#ead2a5', '#c9b4d9', '#e8c3a9', '#b9c9ac', '#e0a4b2', '#dbd8b7'];
const positions = [10, 23, 36, 48, 61, 73, 85, 94];
function renderGarden(newest = -1) {
  $('flowers').replaceChildren();
  const total = 8 + state.planted;
  for (let i = 0; i < total; i++) {
    const button = document.createElement('button');
    button.className = `flower${state.discovered.includes(i) ? ' seen' : ''}${i === newest ? ' new' : ''}`;
    button.style.setProperty('--x', `${i < 8 ? positions[i] : 5 + ((i * 37) % 90)}%`);
    button.style.setProperty('--height', `${i < 8 ? [76, 95, 68, 100, 82, 64, 91, 70][i] : 50 + (i * 13) % 45}%`);
    button.style.setProperty('--speed', `${3 + i % 4}s`);
    button.style.setProperty('--delay', `${-(i % 5)}s`);
    button.style.zIndex = i % 3;
    button.setAttribute('aria-label', `Flor ${i + 1}: ${CONFIG.messages[i % CONFIG.messages.length].title}${state.discovered.includes(i) ? ', descubierta' : ''}`);
    button.innerHTML = flowerSVG(palette[i % palette.length], i);
    button.addEventListener('click', () => {
      const message = CONFIG.messages[i % CONFIG.messages.length];
      $('message-title').textContent = message.title;
      $('message-body').textContent = message.text;
      if (!state.discovered.includes(i)) { state.discovered.push(i); persist(); }
      button.classList.add('seen');
      button.setAttribute('aria-label', `Flor ${i + 1}: ${message.title}, descubierta`);
      renderDiscovery();
      openDialog('message-dialog');
    });
    $('flowers').append(button);
  }
  $('plant').disabled = total >= 24;
  $('plant').textContent = total >= 24 ? 'Jardín completo ♡' : '＋ Plantar una flor';
  renderDiscovery();
}
function renderDiscovery() { $('discovered').textContent = `${state.discovered.length} de ${8 + state.planted} flores descubiertas`; }
$('plant').addEventListener('click', () => {
  if (state.planted >= 16) return;
  state.planted++;
  persist(); renderGarden(7 + state.planted);
  toast('Una nueva flor, otra forma de decirte que te quiero.');
});
for (let i = 0; i < 42; i++) {
  const star = document.createElement('i'); star.className = 'star';
  star.style.cssText = `left:${(i * 43 + 7) % 100}%;top:${10 + (i * 29) % 66}%;animation-delay:-${i % 5}s`;
  $('stars').append(star);
}
function renderCounter() {
  const date = state.date || CONFIG.startDate;
  const count = daysTogether(date);
  if (count === null) {
    $('days').textContent = '∞'; $('days-label').textContent = 'una historia por escribir';
    $('date-caption').textContent = 'Cada día con vos merece quedarse.';
    $('set-date').textContent = 'Elegir nuestra fecha';
  } else {
    $('days').textContent = Math.abs(count).toLocaleString('es-AR');
    $('days-label').textContent = count < 0 ? `día${count === -1 ? '' : 's'} para nuestro comienzo` : `día${count === 1 ? '' : 's'} creciendo juntos`;
    const formatted = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date + 'T12:00:00'));
    $('date-caption').textContent = `${count < 0 ? 'Nos espera el' : 'Desde el'} ${formatted}. Y tantas flores por delante.`;
    $('set-date').textContent = 'Cambiar nuestra fecha';
  }
}
function renderName() {
  const name = state.name || CONFIG.name;
  document.title = `El jardín de ${name} · Un amor que florece`;
  document.querySelector('.brand').replaceChildren();
  const flower = document.createElement('span'); flower.className = 'brand-flower'; flower.setAttribute('aria-hidden', 'true'); flower.textContent = '✳';
  const dot = document.createElement('span'); dot.className = 'brand-dot'; dot.textContent = '.';
  document.querySelector('.brand').append(flower, ` El jardín de ${name}`, dot);
  $('letter-greeting').textContent = `Mi querida ${name},`;
}
function artElement(i) {
  const art = document.createElement('div'); art.className = 'memory-art';
  const url = state.photos[i] || CONFIG.memories[i].image;
  if (url) {
    const image = document.createElement('img'); image.src = url; image.alt = CONFIG.memories[i].title; image.loading = 'lazy';
    image.addEventListener('error', () => { art.innerHTML = memorySVG(CONFIG.memories[i].art); });
    art.append(image);
  } else art.innerHTML = memorySVG(CONFIG.memories[i].art);
  return art;
}
function renderMemories() {
  $('memory-grid').replaceChildren();
  CONFIG.memories.slice(0, 3).forEach((memory, i) => {
    const card = document.createElement('button'); card.className = 'memory-card';
    const tag = document.createElement('div'); tag.className = 'memory-tag'; tag.textContent = memory.tag;
    const title = document.createElement('h3'); title.textContent = memory.title;
    const caption = document.createElement('p'); caption.textContent = memory.caption;
    card.append(artElement(i), tag, title, caption);
    card.addEventListener('click', () => {
      activeMemory = i; renderMemoryDialog(); openDialog('memory-dialog');
    });
    $('memory-grid').append(card);
  });
}
function renderMemoryDialog() {
  $('memory-view').replaceChildren(artElement(activeMemory));
  $('memory-title').textContent = CONFIG.memories[activeMemory].title;
  $('memory-caption').textContent = CONFIG.memories[activeMemory].detail || CONFIG.memories[activeMemory].caption;
  $('remove-photo').hidden = !state.photos[activeMemory];
}
// Reduce each photograph before persistence: three photos stay comfortably below common storage limits.
async function compressPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elegí una imagen JPG, PNG o WebP.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Elegí una foto de menos de 15 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const ratio = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d'); context.fillStyle = '#1b2a27'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', .78);
    if (data.length >= 900000) throw new Error('Esta foto ocupa demasiado. Probá una versión más pequeña.');
    return data;
  } finally { URL.revokeObjectURL(url); }
}
$('photo-input').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  const index = activeMemory;
  try {
    const data = await compressPhoto(file); const previous = state.photos[index];
    state.photos[index] = data;
    if (!persist()) { state.photos[index] = previous || ''; return; }
    renderMemories(); renderMemoryDialog(); toast('Un nuevo recuerdo se queda en el jardín.');
  } catch (error) { toast(error.message || 'No pudimos abrir esa foto. Probá otra.'); }
  finally { e.target.value = ''; }
});
$('remove-photo').addEventListener('click', () => {
  state.photos[activeMemory] = ''; persist(); renderMemories(); renderMemoryDialog(); toast('La ilustración volvió a su lugar.');
});
CONFIG.milestones.forEach(item => {
  const entry = document.createElement('li');
  const date = document.createElement('time'); date.dateTime = item.date;
  date.textContent = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(item.date + 'T12:00:00'));
  const title = document.createElement('h3'); title.textContent = item.title;
  const text = document.createElement('p'); text.textContent = item.text;
  entry.append(date, title, text); $('timeline').append(entry);
});
CONFIG.letter.forEach(text => { const p = document.createElement('p'); p.textContent = text; $('letter-body').append(p); });
$('letter-signature').textContent = CONFIG.signature + ' ♡';
function renderLetterStatus() { $('letter-status').textContent = state.letterOpened ? 'Una carta para volver a leer, siempre.' : ''; }
$('open-letter').addEventListener('click', () => { state.letterOpened = true; persist(); renderLetterStatus(); openDialog('letter-dialog'); });
function openSettings() {
  $('settings-form').elements.name.value = state.name || CONFIG.name;
  $('settings-form').elements.date.value = state.date || CONFIG.startDate;
  $('storage-status').textContent = available ? 'Guardado local activo. Las fotos no se suben a ningún servidor.' : 'El guardado local no está disponible. Podés usar el jardín durante esta visita.';
  openDialog('settings-dialog');
}
$('settings').addEventListener('click', openSettings); $('set-date').addEventListener('click', openSettings);
$('settings-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = e.target.elements.name.value.trim();
  if (!name) { e.target.elements.name.setCustomValidity('Escribí un nombre.'); e.target.elements.name.reportValidity(); return; }
  state.name = name; state.date = e.target.elements.date.value;
  const saved = persist(); renderName(); renderCounter(); $('settings-dialog').close();
  if (saved) toast('Nuestro jardín, un poquito más nuestro.');
});
$('settings-form').elements.name.addEventListener('input', e => e.target.setCustomValidity(''));
let audioContext, audioGain, soundOn = false;
$('sound').addEventListener('click', async () => {
  try {
    if (!audioContext) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio no disponible');
      audioContext = new Audio(); audioGain = audioContext.createGain(); audioGain.gain.value = 0; audioGain.connect(audioContext.destination);
      [130.81, 196, 261.63, 329.63].forEach((frequency, i) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .045 / (i + 1); oscillator.connect(gain); gain.connect(audioGain); oscillator.start(); });
    }
    await audioContext.resume(); soundOn = !soundOn;
    audioGain.gain.setTargetAtTime(soundOn && !document.hidden ? 1 : 0, audioContext.currentTime, .4);
    $('sound').setAttribute('aria-pressed', String(soundOn)); $('sound').querySelector('span').textContent = soundOn ? 'Sonido encendido' : 'Sonido apagado';
  } catch { toast('El sonido no está disponible en este navegador.'); }
});
document.addEventListener('visibilitychange', () => { renderCounter(); if (audioGain) audioGain.gain.setTargetAtTime(soundOn && !document.hidden ? 1 : 0, audioContext.currentTime, .2); });
setInterval(renderCounter, 60000);
renderName(); renderGarden(); renderCounter(); renderMemories(); renderLetterStatus();
if (!available) toast('El guardado local no está disponible en este navegador.');
