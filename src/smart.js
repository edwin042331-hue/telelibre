// "Inteligencia" local de la app: todo se calcula en la TV con lo que ve el usuario, sin servidores ni cuentas.
// - Inicio se reordena según el momento del día y el fin de semana.
// - Cada canal acumula éxitos/fallos al reproducirse: los que funcionan suben, los que nunca funcionan se esconden.
// - Recomendaciones "porque viste…" a partir de recientes, Mi lista y películas en progreso.
// - Tema claro/oscuro automático según la hora.
import { load, save } from './store.js';
import { categoryLabel, sortChannels } from './catalog.js';
import { genreLabel } from './vod.js';

// ---------- Momento del día ----------
export function daypart(d) {
  const h = d.getHours();
  if (h < 5) return 'madrugada';
  if (h < 12) return 'manana';
  if (h < 19) return 'tarde';
  return 'noche';
}

export function greeting(d) {
  const p = daypart(d);
  return p === 'manana' ? 'Buenos días' : p === 'tarde' ? 'Buenas tardes' : 'Buenas noches';
}

const PRIORITY = {
  manana: ['country:do', 'cat:news', 'cat:kids', 'cat:sports', 'mv:pluto', 'cat:music'],
  tarde: ['country:do', 'cat:novelas', 'cat:entertainment', 'mv:pluto', 'cat:kids', 'cat:anime', 'cat:series'],
  noche: ['mv:pluto', 'cat:movies', 'country:do', 'cat:series', 'mv:subs', 'cat:crime', 'mv:g:terror'],
  madrugada: ['mv:pluto', 'cat:movies', 'mv:subs', 'cat:music', 'cat:series', 'cat:anime']
};

// Reordena filas: primero las prioritarias del momento (en su orden), luego el resto como venían.
export function orderForTime(rows, d) {
  const prio = PRIORITY[daypart(d)].slice();
  const day = d.getDay();
  if (day === 0 || day === 6) prio.splice(1, 0, 'cat:sports');
  const rank = id => { const i = prio.indexOf(id); return i < 0 ? 999 : i; };
  return rows.map((r, i) => ({ r, i })).sort((a, b) => rank(a.r.id) - rank(b.r.id) || a.i - b.i).map(x => x.r);
}

// ---------- Salud de los canales ----------
// key -> [éxitos, fallos, últimaVez]
let health = load('health', {});
let healthTimer = null;

function persistHealth() {
  clearTimeout(healthTimer);
  healthTimer = setTimeout(() => {
    const keys = Object.keys(health);
    // Tope para no llenar localStorage: se quedan los 1500 más recientes.
    if (keys.length > 1500) {
      keys.sort((a, b) => health[b][2] - health[a][2]).slice(1500).forEach(k => { delete health[k]; });
    }
    save('health', health);
  }, 1000);
}

export function recordPlayback(key, ok) {
  const h = health[key] || [0, 0, 0];
  if (ok) { h[0]++; h[1] = 0; } else h[1]++;
  h[2] = Date.now();
  health[key] = h;
  persistHealth();
}

// Falló 3 veces seguidas y nunca funcionó en esta TV.
export function isDead(key) {
  const h = health[key];
  return !!h && h[0] === 0 && h[1] >= 3;
}

function score(key) {
  const h = health[key];
  if (!h) return 0;
  return h[0] > 0 ? 2 : h[1] > 0 ? -1 : 0;
}

// Orden estable: los que ya funcionaron primero, los que fallaron al final.
export function rankByHealth(items) {
  return items.map((it, i) => ({ it, i, s: score(it.key) })).sort((a, b) => b.s - a.s || a.i - b.i).map(x => x.it);
}

export function resetHealth() {
  health = {};
  save('health', health);
}

// ---------- Gustos ----------
// Minutos vistos por categoría (en vivo) y por género (películas), con olvido gradual:
// lo que viste hace meses pesa menos que lo de esta semana.
let taste = load('taste', { cats: {}, genres: {}, t: Date.now() });

function decay() {
  const weeks = (Date.now() - taste.t) / (7 * 864e5);
  if (weeks < 1) return;
  const f = Math.pow(0.85, weeks);
  ['cats', 'genres'].forEach(kind => Object.keys(taste[kind]).forEach(k => {
    taste[kind][k] *= f;
    if (taste[kind][k] < 0.5) delete taste[kind][k];
  }));
  taste.t = Date.now();
}

// seconds: tiempo real que se vio. Menos de 1 minuto no cuenta (fue zapping).
export function learnFrom(item, seconds) {
  if (!item || seconds < 60) return;
  decay();
  const minutes = Math.min(seconds, 3 * 3600) / 60;
  const kind = item.type === 'movie' ? 'genres' : 'cats';
  const keys = item.type === 'movie' ? item.genres || [] : (item.cats || []).filter(c => c !== 'general' && c !== 'other');
  keys.forEach(k => { taste[kind][k] = (taste[kind][k] || 0) + minutes / keys.length; });
  save('taste', taste);
}

function topOf(map, n) {
  return Object.keys(map).sort((a, b) => map[b] - map[a]).slice(0, n);
}

// Para mostrar en Ajustes: "Te gusta: Comedia, Noticias, Anime".
export function tasteSummary() {
  const cats = topOf(taste.cats, 3).map(categoryLabel);
  const genres = topOf(taste.genres, 3).map(genreLabel);
  const all = [];
  for (let i = 0; i < 3; i++) { if (genres[i]) all.push(genres[i]); if (cats[i]) all.push(cats[i]); }
  return all.slice(0, 4);
}

export function resetTaste() {
  taste = { cats: {}, genres: {}, t: Date.now() };
  save('taste', taste);
}

// ---------- Recomendaciones ----------
function topKey(counts, skip) {
  let best = null;
  Object.keys(counts).forEach(k => { if (skip.indexOf(k) < 0 && (!best || counts[k] > counts[best])) best = k; });
  return best;
}

// Filas "Para ti" según el tiempo visto: las 2 categorías y los 2 géneros favoritos.
export function tasteRows(channels, movies, seen) {
  const rows = [];
  topOf(taste.genres, 2).forEach(g => {
    const items = movies.filter(m => m.genres.indexOf(g) >= 0 && !seen[m.key] && m.lang === 'es').slice(0, 30);
    if (items.length >= 4) rows.push({ id: 'taste:g:' + g, title: 'Para ti · ' + genreLabel(g), items });
  });
  topOf(taste.cats, 2).forEach(c => {
    const items = rankByHealth(sortChannels(channels.filter(ch => ch.cats.indexOf(c) >= 0 && !seen[ch.key] && ch.lang === 'es'))).slice(0, 30);
    if (items.length >= 4) rows.push({ id: 'taste:c:' + c, title: 'Para ti · ' + categoryLabel(c) + ' en vivo', items });
  });
  return rows;
}

// recents/favorites: canales y películas ya resueltos; progress: películas empezadas.
export function recommendations(channels, movies, recents, favorites, progress) {
  const seen = {};
  recents.concat(favorites, progress).forEach(i => { seen[i.key] = true; });
  // Con suficiente historial manda el perfil de gustos; si no, se deduce de recientes y Mi lista.
  const rows = tasteRows(channels, movies, seen);
  if (rows.length >= 2) return rows;

  const liveTaste = recents.concat(favorites).filter(i => i.type !== 'movie');
  if (liveTaste.length) {
    const counts = {};
    liveTaste.forEach(c => (c.cats || []).forEach(k => { counts[k] = (counts[k] || 0) + 1; }));
    const cat = topKey(counts, ['general', 'other']);
    if (cat) {
      const base = liveTaste.filter(c => (c.cats || []).indexOf(cat) >= 0)[0];
      const items = sortChannels(channels.filter(c => c.cats.indexOf(cat) >= 0 && !seen[c.key] && c.lang === (base.lang || 'es'))).slice(0, 30);
      if (items.length >= 3) rows.push({ id: 'smart:live', title: 'Porque viste ' + base.name + ': más ' + categoryLabel(cat).toLowerCase(), items: rankByHealth(items) });
    }
  }

  const movieTaste = progress.concat(favorites.filter(i => i.type === 'movie'));
  if (movieTaste.length) {
    const counts = {};
    movieTaste.forEach(m => (m.genres || []).forEach(g => { counts[g] = (counts[g] || 0) + 1; }));
    const genre = topKey(counts, []);
    if (genre) {
      const items = movies.filter(m => m.genres.indexOf(genre) >= 0 && !seen[m.key]).slice(0, 30);
      const base = movieTaste.filter(m => (m.genres || []).indexOf(genre) >= 0)[0];
      if (items.length >= 3) rows.push({ id: 'smart:movies', title: 'Porque te gustó ' + base.name + ': más ' + genreLabel(genre).toLowerCase(), items });
    }
  }
  return rows.slice(0, 3);
}

// ---------- Tema ----------
// 'auto' usa el tema claro de 7:00 a 18:59 y el oscuro de noche.
export function resolveTheme(setting, d) {
  if (setting === 'light' || setting === 'dark') return setting;
  const h = d.getHours();
  return h >= 7 && h < 19 ? 'light' : 'dark';
}
