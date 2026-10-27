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

// Cachés que se pueden volver a descargar. Los datos del usuario (Mi lista, progreso, ajustes, gustos) no.
const CACHE_RE = /^telelibre:(cache:|vod:|pluto:series|epg:|verified)/;

function cacheKeysBySize() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (CACHE_RE.test(k)) keys.push([k, (localStorage.getItem(k) || '').length]);
  }
  return keys.sort((a, b) => b[1] - a[1]).map(x => x[0]);
}

// Si no cabe (cuota de ~5 MB en las TVs): una caché solo falla; un dato del usuario libera cachés
// (de la más grande a la más chica) y reintenta, para que Mi lista o el progreso nunca se pierdan.
export function save(name, value) {
  const key = PREFIX + name;
  let text;
  try { text = JSON.stringify(value); } catch (e) { return false; }
  const isCache = CACHE_RE.test(key);
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      localStorage.setItem(key, text);
      return true;
    } catch (e) {
      if (isCache) return false;
      const victims = cacheKeysBySize();
      if (!victims.length) return false;
      try { localStorage.removeItem(victims[0]); } catch (err) { return false; }
    }
  }
  return false;
}

// Uso aproximado de localStorage en bytes (para la pantalla de diagnóstico).
export function storageUsage() {
  let total = 0;
  let caches = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const n = (k.length + (localStorage.getItem(k) || '').length) * 2;
      total += n;
      if (CACHE_RE.test(k)) caches += n;
    }
  } catch (e) { /* sin almacenamiento */ }
  return { total, caches };
}

export function remove(name) {
  try { localStorage.removeItem(PREFIX + name); } catch (e) { /* sin almacenamiento */ }
}

// ---------- Perfiles ----------
// Cada perfil guarda lo suyo (Mi lista, progreso, vistos, recientes, gustos) bajo "u:<id>:".
// Los ajustes, la salud de los canales y las cachés son de la TV y se comparten.
const USER_DATA = ['favorites', 'recents', 'progress', 'watched', 'taste'];
export const COLORS = ['#ff3b5c', '#7b2ff7', '#1aa3ff', '#18b87a', '#ff9f1a', '#e83e8c'];

export const profiles = {
  list: load('profiles', null) || [{ id: 'p1', name: 'Principal', color: 0, kids: false }],
  active: load('profile', 'p1')
};
if (!profiles.list.some(p => p.id === profiles.active)) profiles.active = profiles.list[0].id;

// Lo guardado antes de que existieran los perfiles pasa al perfil principal (una sola vez).
USER_DATA.forEach(name => {
  const old = load(name, null);
  if (old != null && load('u:p1:' + name, null) == null) save('u:p1:' + name, old);
  if (old != null) remove(name);
});

export function userKey(name) {
  return 'u:' + profiles.active + ':' + name;
}

export function activeProfile() {
  return profiles.list.filter(p => p.id === profiles.active)[0] || profiles.list[0];
}

function saveProfiles() {
  save('profiles', profiles.list);
}

export function addProfile(name, kids) {
  const p = { id: 'p' + Date.now().toString(36), name: name.slice(0, 20), color: profiles.list.length % COLORS.length, kids: !!kids };
  profiles.list.push(p);
  saveProfiles();
  return p;
}

// Borra el perfil y todo lo suyo. El último perfil no se puede borrar.
export function removeProfile(id) {
  if (profiles.list.length < 2) return false;
  profiles.list = profiles.list.filter(p => p.id !== id);
  saveProfiles();
  USER_DATA.forEach(name => remove('u:' + id + ':' + name));
  if (profiles.active === id) useProfile(profiles.list[0].id);
  return true;
}

export function renameProfile(id, name) {
  profiles.list.forEach(p => { if (p.id === id) p.name = name.slice(0, 20); });
  saveProfiles();
}

const DEFAULT_SETTINGS = { sources: {}, custom: [], hideGeo: true, hideNot247: false, english: true };

export const state = {
  settings: Object.assign({}, DEFAULT_SETTINGS, load('settings', {})),
  favorites: [],
  recents: [],
  // key -> { item, t (segundos vistos), d (duración), at (fecha) }
  progress: {},
  // Episodios terminados (para la marca ✓ y para saber cuál sigue).
  watched: {}
};

function loadUserState() {
  state.favorites = load(userKey('favorites'), []);
  state.recents = load(userKey('recents'), []);
  state.progress = load(userKey('progress'), {});
  state.watched = load(userKey('watched'), {});
}
loadUserState();

// Cambia de perfil (los gustos se recargan aparte: viven en smart.js).
export function useProfile(id) {
  profiles.active = id;
  save('profile', id);
  loadUserState();
}

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
  save(userKey('favorites'), state.favorites);
  return !was;
}

export function pushRecent(ch) {
  state.recents = [snapshot(ch)].concat(state.recents.filter(r => r.key !== ch.key)).slice(0, MAX_RECENTS);
  save(userKey('recents'), state.recents);
}

export function clearRecents() {
  state.recents = [];
  save(userKey('recents'), state.recents);
}

const MAX_PROGRESS = 50;

export function isWatched(key) {
  return !!state.watched[key];
}

function markWatched(key) {
  state.watched[key] = Date.now();
  const keys = Object.keys(state.watched);
  if (keys.length > 3000) keys.sort((a, b) => state.watched[a] - state.watched[b]).slice(0, keys.length - 3000).forEach(k => { delete state.watched[k]; });
  save(userKey('watched'), state.watched);
}

let lastAt = 0;

export function saveProgress(item, t, d) {
  if (!d || t < 30) return;
  // Vista casi completa: sale de "Continuar viendo" (y un episodio queda marcado como visto).
  if (t > d * 0.95) {
    delete state.progress[item.key];
    if (item.type === 'episode') markWatched(item.key);
  } else {
    // Siempre creciente: dos guardados en el mismo milisegundo no deben empatar al ordenar.
    lastAt = Math.max(Date.now(), lastAt + 1);
    state.progress[item.key] = { item: snapshot(item), t: Math.floor(t), d: Math.floor(d), at: lastAt };
  }
  const keys = Object.keys(state.progress).sort((a, b) => state.progress[b].at - state.progress[a].at);
  keys.slice(MAX_PROGRESS).forEach(k => { delete state.progress[k]; });
  save(userKey('progress'), state.progress);
}

export function getProgress(key) {
  return state.progress[key] || null;
}

export function clearProgress(key) {
  delete state.progress[key];
  save(userKey('progress'), state.progress);
}

// Una entrada por serie (su episodio más reciente), no un episodio por fila.
export function continueWatching() {
  const seenSeries = {};
  return Object.keys(state.progress)
    .map(k => state.progress[k])
    .sort((a, b) => b.at - a.at)
    .map(p => p.item)
    .filter(item => {
      if (item.type !== 'episode') return true;
      if (seenSeries[item.seriesKey]) return false;
      seenSeries[item.seriesKey] = true;
      return true;
    });
}

// Último episodio con progreso de una serie (para el botón "Continuar T1:E5").
export function lastEpisodeOf(seriesKey) {
  const list = Object.keys(state.progress).map(k => state.progress[k])
    .filter(p => p.item.type === 'episode' && p.item.seriesKey === seriesKey)
    .sort((a, b) => b.at - a.at);
  return list[0] || null;
}
