// Persistencia local (favoritos, recientes, ajustes, caché de listas).
// localStorage puede fallar (cuota llena, modo privado): todo va en try/catch y la app sigue sin él.
import { snapshot } from './catalog.js';

const PREFIX = 'telelibre:';
const MAX_RECENTS = 20;

export function load(name, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function save(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function remove(name) {
  try { localStorage.removeItem(PREFIX + name); } catch (e) { /* sin almacenamiento */ }
}

const DEFAULT_SETTINGS = { sources: {}, custom: [], hideGeo: true, hideNot247: false, english: true };

export const state = {
  settings: Object.assign({}, DEFAULT_SETTINGS, load('settings', {})),
  favorites: load('favorites', []),
  recents: load('recents', []),
  // key -> { item, t (segundos vistos), d (duración), at (fecha) }
  progress: load('progress', {})
};

export function saveSettings() {
  save('settings', state.settings);
}

export function isFavorite(key) {
  return state.favorites.some(f => f.key === key);
}

// Devuelve true si quedó como favorito.
export function toggleFavorite(ch) {
  const was = isFavorite(ch.key);
  state.favorites = was ? state.favorites.filter(f => f.key !== ch.key) : [snapshot(ch)].concat(state.favorites);
  save('favorites', state.favorites);
  return !was;
}

export function pushRecent(ch) {
  state.recents = [snapshot(ch)].concat(state.recents.filter(r => r.key !== ch.key)).slice(0, MAX_RECENTS);
  save('recents', state.recents);
}

export function clearRecents() {
  state.recents = [];
  save('recents', state.recents);
}

const MAX_PROGRESS = 50;

export function saveProgress(item, t, d) {
  if (!d || t < 30) return;
  // Vista casi completa: sale de "Continuar viendo".
  if (t > d * 0.95) delete state.progress[item.key];
  else state.progress[item.key] = { item: snapshot(item), t: Math.floor(t), d: Math.floor(d), at: Date.now() };
  const keys = Object.keys(state.progress).sort((a, b) => state.progress[b].at - state.progress[a].at);
  keys.slice(MAX_PROGRESS).forEach(k => { delete state.progress[k]; });
  save('progress', state.progress);
}

export function getProgress(key) {
  return state.progress[key] || null;
}

export function clearProgress(key) {
  delete state.progress[key];
  save('progress', state.progress);
}

export function continueWatching() {
  return Object.keys(state.progress)
    .map(k => state.progress[k])
    .sort((a, b) => b.at - a.at)
    .map(p => p.item);
}
