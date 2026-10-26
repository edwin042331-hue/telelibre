import './styles.css';
import { h, clear, isAttached, closest } from './ui/dom.js';
import { focus, getFocused, move, onFocusChange } from './ui/focus.js';
import { icon } from './ui/icons.js';
import { createSidebar } from './ui/sidebar.js';
import { createRowsScreen } from './ui/rows-screen.js';
import { createGridScreen } from './ui/grid-screen.js';
import { createDetailScreen } from './ui/detail-screen.js';
import { createSearchScreen } from './ui/search-screen.js';
import { createSettingsScreen, createAddListScreen } from './ui/settings-screen.js';
import { createPlayer } from './ui/player.js';
import { keyAction, registerKeys, exitApp } from './platform.js';
import { state, toggleFavorite, continueWatching } from './store.js';
import { activeSources, loadSources } from './sources.js';
import { loadMovies, buildMovieRows, buildAnimeMovieRows, resolveMovie } from './vod.js';
import { applyFilters, buildRows, buildEnglishRows, sortChannels, indexByKey, resolveSaved } from './catalog.js';

const HTTPS_ONLY = location.protocol === 'https:';

const app = {
  data: { channels: [], movies: [], byKey: {}, moviesByKey: {}, liveRows: [], movieRows: [], animeRows: [], stats: {}, httpsHidden: 0 },
  raw: []
};

// ---------- Estructura ----------
const root = document.getElementById('app');
const sidebar = createSidebar(id => navigate(id));
const screensEl = h('main', { class: 'screens' });
const toastEl = h('div', { class: 'toast' });
const loadingLines = h('div', { class: 'loading-lines' });
const loadingEl = h('div', { class: 'loading' }, [
  h('div', { class: 'loading-brand' }, [h('span', { class: 'brand-mark big', text: 'T' }), h('span', { class: 'loading-name', text: 'TeleLibre' })]),
  h('div', { class: 'spinner static' }),
  loadingLines
]);
root.appendChild(sidebar.el);
root.appendChild(screensEl);
root.appendChild(loadingEl);
root.appendChild(toastEl);

const player = createPlayer(app);
// El video va fuera del contenedor escalado: algunos TV dibujan el video en un plano aparte y no toleran transformaciones.
document.body.appendChild(player.el);

// Diseño fijo 1920x1080 escalado a la pantalla (en la TV la escala es 1).
function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  [root, player.ui].forEach(el => {
    el.style.transform = 'scale(' + s + ')';
    el.style.left = Math.round((window.innerWidth - 1920 * s) / 2) + 'px';
    el.style.top = Math.round((window.innerHeight - 1080 * s) / 2) + 'px';
  });
}
window.addEventListener('resize', fit);
fit();

// ---------- Filas de Inicio ----------
function homeRows() {
  const rows = [];
  const cw = continueWatching();
  if (cw.length) rows.push({ id: 'continue', title: 'Continuar viendo', items: cw });
  const recents = resolveSaved(state.recents, app.data.byKey);
  if (recents.length) rows.push({ id: 'recents', title: 'Canales que viste', items: recents });
  const mine = resolveSaved(state.favorites, app.data.byKey);
  if (mine.length) rows.push({ id: 'mylist', title: 'Mi lista', items: mine });

  const live = app.data.liveRows.filter(r => r.id === 'country:do' || r.id.indexOf('cat:') === 0);
  const movies = app.data.movieRows;
  // Intercala en vivo y películas para que Inicio tenga de todo sin ser eterno.
  const max = Math.max(live.length, movies.length);
  for (let i = 0; i < max && rows.length < 16; i++) {
    if (live[i]) rows.push(live[i]);
    if (movies[i]) rows.push(movies[i]);
  }
  return rows;
}

// Sección Anime: canales 24/7 (Naruto, One Piece, Dragon Ball, Crunchyroll…) y películas, español primero.
function buildAnimeRows(spanish, english, movies) {
  const isAnime = c => c.cats.indexOf('anime') >= 0;
  const rows = [];
  const es = sortChannels(spanish.filter(isAnime));
  const en = sortChannels(english.filter(isAnime));
  if (es.length) rows.push({ id: 'an:live:es', title: 'Anime en vivo · español', items: es });
  const movieRows = buildAnimeMovieRows(movies);
  if (movieRows[0]) rows.push(movieRows[0]);
  if (en.length) rows.push({ id: 'an:live:en', title: 'Anime 24/7 · en inglés', items: en });
  return rows.concat(movieRows.slice(1));
}

const screens = {
  home: createRowsScreen(app, 'home', homeRows, 'Cargando contenido…'),
  live: createRowsScreen(app, 'live', () => app.data.liveRows, 'No se pudieron cargar canales. Revisa la conexión o las fuentes en Ajustes.'),
  movies: createRowsScreen(app, 'movies', () => app.data.movieRows, 'No se pudieron cargar películas. Revisa la conexión.'),
  anime: createRowsScreen(app, 'anime', () => app.data.animeRows, 'No hay anime disponible ahora. Revisa la conexión o las fuentes en Ajustes.'),
  grid: createGridScreen(app),
  detail: createDetailScreen(app),
  search: createSearchScreen(app),
  settings: createSettingsScreen(app),
  addlist: createAddListScreen(app)
};
for (const k in screens) screensEl.appendChild(screens[k].el);

// ---------- Navegación ----------
let stack = [];
let navId = 'home';

function current() {
  return stack[stack.length - 1];
}

function focusScreen(scr) {
  const target = scr.lastFocus && isAttached(scr.lastFocus) && scr.el.contains(scr.lastFocus) ? scr.lastFocus : scr.firstFocus();
  if (target) { sidebar.expand(false); focus(target); } else openSidebar();
}

function activate(scr, params, isReturn) {
  const prev = current();
  if (prev && prev !== scr) prev.el.classList.remove('active');
  scr.el.classList.add('active');
  if (!isReturn) scr.mount(params || {});
  else if (scr.refresh) scr.refresh();
  else if (scr.dirty) scr.mount({});
  sidebar.setActive(navId);
  focusScreen(scr);
  if (scr.afterShow) scr.afterShow();
}

function show(name, params, nav) {
  navId = nav || name;
  const scr = screens[name];
  const prev = current();
  stack = [scr];
  if (prev && prev !== scr) prev.el.classList.remove('active');
  activate(scr, params, false);
}

app.push = function (name, params) {
  const scr = screens[name];
  const prev = current();
  if (prev) prev.el.classList.remove('active');
  stack.push(scr);
  activate(scr, params, false);
};

app.pop = function () {
  if (stack.length < 2) return false;
  const leaving = stack.pop();
  leaving.el.classList.remove('active');
  activate(current(), null, true);
  return true;
};

function navigate(id) {
  if (id === 'mylist') {
    show('grid', {
      title: 'Mi lista',
      items: resolveSaved(state.favorites, app.data.byKey),
      emptyText: 'Aún no tienes nada en Mi lista. Sobre cualquier canal o película presiona el botón ● Rojo del control (F en el teclado).'
    }, 'mylist');
  } else {
    show(id);
  }
}

function openSidebar() {
  sidebar.expand(true);
  focus(sidebar.activeItem());
}

app.markDirty = function () {
  screens.home.dirty = true;
  screens.live.dirty = true;
  screens.movies.dirty = true;
  screens.anime.dirty = true;
};

function refreshCurrent() {
  const scr = current();
  if (!scr) return;
  if (scr.refresh) scr.refresh();
  else if (scr.dirty) scr.mount({});
  const f = getFocused();
  if (!f || !isAttached(f)) focusScreen(scr);
}

// ---------- Acciones de contenido ----------
app.open = function (item, list, index) {
  if (item.type === 'movie') {
    // Desde favoritos/progreso llega una copia guardada: usar la del catálogo actual (URLs de Pluto con token vigente).
    const fresh = app.data.moviesByKey[item.key] || item;
    app.push('detail', { item: fresh, list, index });
    return;
  }
  const live = list.filter(i => i.type !== 'movie');
  player.playLive(live, Math.max(0, live.indexOf(item)));
};

app.openGrid = function (title, items) {
  app.push('grid', { title, items });
};

app.playMovie = function (movie, list, index, resolved, startAt) {
  if (resolved) {
    if (!resolved.urls.length) { app.toast('Esta película no tiene un video compatible'); return; }
    player.playMovie(movie, resolved, startAt);
    return;
  }
  app.toast('Preparando película…');
  resolveMovie(movie).then(r => app.playMovie(movie, list, index, r, startAt), () => app.toast('Internet Archive no respondió, intenta de nuevo'));
};

app.onPlayerClosed = function () {
  app.markDirty();
  refreshCurrent();
};

let toastTimer = null;
app.toast = function (text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
};

function setFavMark(card, on) {
  const holder = card.firstChild;
  const mark = holder.querySelector('.fav-mark');
  if (on && !mark) holder.appendChild(icon('star', 'fav-mark'));
  if (!on && mark) holder.removeChild(mark);
}

// ---------- Datos ----------
app.rebuild = function () {
  const s = state.settings;
  const visible = applyFilters(app.raw, { hideGeo: s.hideGeo, hideNot247: s.hideNot247 });
  const channels = HTTPS_ONLY ? applyFilters(visible, { httpsOnly: true }) : visible;
  app.data.httpsHidden = visible.length - channels.length;
  app.data.channels = channels;
  app.data.byKey = indexByKey(channels);
  // Español en las filas principales; el inglés va en su propia sección al final. Otros idiomas: solo en la búsqueda.
  const spanish = channels.filter(c => c.lang === 'es');
  const english = channels.filter(c => c.lang === 'en');
  app.data.liveRows = buildRows(spanish).concat(buildEnglishRows(english));
  app.data.movieRows = buildMovieRows(app.data.movies);
  app.data.animeRows = buildAnimeRows(spanish, english, app.data.movies);
  app.data.moviesByKey = indexByKey(app.data.movies);
  app.markDirty();
  refreshCurrent();
};

let started = false;

function progressLine(r, unit) {
  const n = (r.channels || r.movies || []).length;
  const ok = n > 0;
  const note = r.stale ? ' (sin conexión: usando copia guardada)' : r.error ? ' (' + r.error + ')' : '';
  loadingLines.appendChild(h('div', { class: 'loading-line' + (ok ? ' ok' : ' bad'), text: (ok ? '✓ ' : '✕ ') + r.source.name + ' — ' + n + ' ' + unit + note }));
  app.data.stats[r.source.id] = n;
}

// full: muestra la pantalla de carga (inicio o "Actualizar ahora"); si no, recarga en segundo plano.
app.reload = function (force) {
  const full = force || !started;
  if (full) { clear(loadingLines); loadingEl.classList.add('show'); } else app.toast('Actualizando fuentes…');
  const sources = activeSources(state.settings);
  return Promise.all([
    loadSources(sources, { force, onProgress: r => progressLine(r, 'canales') }),
    loadMovies(state.settings, { force, onProgress: r => progressLine(r, 'películas') })
  ]).then(res => {
    app.raw = res[0].channels;
    app.data.movies = res[1].movies;
    const firstRun = !started;
    started = true;
    app.rebuild();
    if (firstRun) show('home');
    setTimeout(() => loadingEl.classList.remove('show'), full ? 500 : 0);
    if (!app.raw.length && !app.data.movies.length) app.toast('Sin conexión y sin copia guardada. Revisa el internet de la TV.');
  });
};

// ---------- Control remoto ----------
let lastBack = 0;
function tryExit() {
  if (Date.now() - lastBack < 2500) {
    if (!exitApp()) app.toast('En el navegador, cierra la pestaña para salir');
    return;
  }
  lastBack = Date.now();
  app.toast('Presiona Atrás otra vez para salir');
}

function goBack() {
  if (app.pop()) return;
  if (current().name !== 'home') { navigate('home'); return; }
  openSidebar();
}

function sidebarAction(action, f) {
  if (action === 'up' || action === 'down') { move(action, sidebar.el); return; }
  if (action === 'right') { focusScreen(current()); return; }
  if (action === 'enter') { f._onEnter(); return; }
  if (action === 'back') { if (current().name === 'home' && stack.length === 1) tryExit(); else navigate('home'); }
}

function onKey(e) {
  // Teclado físico: las pantallas con texto (búsqueda, URL) usan las letras antes de traducirlas a acciones.
  if (started && !player.isOpen()) {
    const scr = current();
    const f = getFocused();
    const inSidebar = !!f && sidebar.el.contains(f);
    if (!inSidebar && scr.onRawKey && scr.onRawKey(e)) { e.preventDefault(); return; }
  }
  const a = keyAction(e);
  if (!a) return;
  e.preventDefault();
  runAction(a);
}

// Acción ya traducida (del teclado/control o del puente nativo de Android).
function runAction(a) {
  if (!started) { if (a === 'back') tryExit(); return; }
  if (player.isOpen()) { player.onAction(a); return; }
  const scr = current();
  const f = getFocused();
  const inSidebar = !!f && sidebar.el.contains(f);
  if (inSidebar) { sidebarAction(a, f); return; }
  if (scr.onAction && scr.onAction(a, f)) return;

  if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
    if (!f) { focusScreen(scr); return; }
    const cands = scr.candidates ? scr.candidates(f, a) : null;
    if (move(a, scr.el, cands)) return;
    if (scr.onEdge && scr.onEdge(a, f)) return;
    if (a === 'left') openSidebar();
    return;
  }
  if (a === 'enter') { if (f && f._onEnter) f._onEnter(); return; }
  if (a === 'red' && f && f._item) {
    const on = toggleFavorite(f._item);
    app.toast(on ? 'Agregado a Mi lista' : 'Quitado de Mi lista');
    setFavMark(f, on);
    app.markDirty();
    return;
  }
  if (a === 'back') goBack();
}

document.addEventListener('keydown', onKey);
// Android TV entrega Atrás, canales, multimedia y colores por aquí (ver MainActivity.java).
window.__telelibreKey = runAction;
window.__telelibreHidden = () => player.onHidden();

onFocusChange(el => {
  const inSidebar = sidebar.el.contains(el);
  if (!inSidebar) sidebar.expand(false);
  const scr = current();
  if (scr && scr.el.contains(el)) {
    scr.lastFocus = el;
    if (scr.onFocus) scr.onFocus(el);
  }
});

// Puntero: Magic Remote de LG y ratón en la PC.
document.addEventListener('mouseover', e => {
  if (!started || player.isOpen()) return;
  const t = closest(e.target, '.focusable');
  if (t && t !== getFocused()) focus(t, { noScroll: true });
});
document.addEventListener('click', e => {
  if (!started) return;
  if (player.isOpen()) { player.onAction('enter'); return; }
  const t = closest(e.target, '.focusable');
  if (!t) return;
  focus(t, { noScroll: true });
  if (t._onEnter) t._onEnter();
});
let wheelAt = 0;
document.addEventListener('wheel', e => {
  if (Date.now() - wheelAt < 180) return;
  wheelAt = Date.now();
  onKey({ keyCode: e.deltaY > 0 ? 40 : 38, preventDefault() {} });
});
document.addEventListener('paste', e => {
  const scr = current();
  const data = e.clipboardData || window.clipboardData;
  if (scr && scr.onPaste && data) scr.onPaste(data.getData('text'));
});

// Apagar la TV o cambiar de app: guardar dónde iba la película.
document.addEventListener('visibilitychange', () => { if (document.hidden) player.onHidden(); });
window.addEventListener('pagehide', () => player.persist());
window.addEventListener('beforeunload', () => player.persist());

registerKeys();
app.reload(false);
