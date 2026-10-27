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
import { createGuideScreen } from './ui/guide-screen.js';
import { createPinScreen } from './ui/pin-screen.js';
import { createShowScreen } from './ui/show-screen.js';
import { createMenu } from './ui/menu.js';
import { loadSeriesCatalog, episodeUrl, plutoApiMovies } from './pluto.js';
import { keyAction, registerKeys, exitApp, platform } from './platform.js';
import { state, toggleFavorite, continueWatching, isFavorite, profiles, activeProfile, useProfile, getProgress } from './store.js';
import { activeSources, loadSources } from './sources.js';
import { loadMovies, buildMovieRows, buildAnimeMovieRows, resolveMovie, VOD_SOURCES, isVodSourceOn } from './vod.js';
import { applyFilters, buildRows, buildEnglishRows, buildWorldRows, sortChannels, indexByKey, resolveSaved, mergeChannels } from './catalog.js';
import { orderForTime, recommendations, rankByHealth, isDead, greeting, resolveTheme, surprise, reloadTaste } from './smart.js';
import { createProfilesScreen, createNewProfileScreen } from './ui/profiles-screen.js';
import { loadVerified, checkUpdate } from './remote.js';
import { dueReminders } from './reminders.js';
import { installErrorCapture } from './diag.js';

// Lo primero: capturar errores para verlos en Ajustes → Diagnóstico.
installErrorCapture();
import { buildDominicanRows } from './dominican.js';
import { loadEpg, loadPlutoEpg } from './epg.js';
import { formatClock } from './ui/format.js';

const HTTPS_ONLY = location.protocol === 'https:';

const app = {
  data: { channels: [], movies: [], byKey: {}, moviesByKey: {}, liveRows: [], movieRows: [], animeRows: [], rdRows: [], seriesRows: [], seriesAll: [], stats: {}, httpsHidden: 0 },
  raw: []
};

// Se consulta antes de crear las pantallas: Buscar decide al construirse si muestra el botón de voz.
app.canVoice = (function () {
  try { return !!(window.TeleLibreNative && window.TeleLibreNative.canListen && window.TeleLibreNative.canListen()); } catch (e) { return false; }
})();

// La APK 1.3+ sabe descargarse e instalarse sola; las anteriores siguen con Downloader.
app.canSelfUpdate = !!(window.TeleLibreNative && window.TeleLibreNative.installUpdate);

// ---------- Estructura ----------
const root = document.getElementById('app');
const sidebar = createSidebar(id => navigate(id));
const screensEl = h('main', { class: 'screens' });
const toastEl = h('div', { class: 'toast' });
// Pantalla de arranque: fondo animado, logo con brillo, saludo, progreso real de las fuentes y consejos.
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const TIPS = [
  'Presiona ● Rojo sobre cualquier canal o película para guardarlo en Mi lista.',
  'Las películas recuerdan dónde te quedaste, aunque apagues la TV.',
  'En vivo, usa ▲ ▼ o CH+ CH- para cambiar de canal sin salir.',
  'Mientras más ves, mejor te conoce la app: mira "Para ti" en Inicio.',
  'En República Dominicana verás qué programa está pasando ahora.',
  'Los canales que nunca cargan en tu TV se esconden solos.',
  'En las películas, ◀ ▶ seguidos adelantan más rápido: 10, 30 y 60 segundos.'
];
const loadingLines = h('div', { class: 'loading-lines' });
const splashFill = h('div', { class: 'splash-fill' });
const splashStatus = h('div', { class: 'splash-status', text: 'Conectando…' });
const splashTip = h('div', { class: 'splash-tip' });
const splashHello = h('div', { class: 'splash-hello' });
const loadingEl = h('div', { class: 'loading splash' }, [
  h('div', { class: 'splash-bg' }, [h('span', { class: 'blob b1' }), h('span', { class: 'blob b2' }), h('span', { class: 'blob b3' })]),
  h('div', { class: 'splash-center' }, [
    h('div', { class: 'splash-logo' }, h('span', { class: 'brand-mark big', text: 'T' })),
    h('div', { class: 'splash-name', text: 'TeleLibre' }),
    h('div', { class: 'splash-tagline', text: 'TV en vivo · Películas · Anime · República Dominicana' }),
    splashHello,
    h('div', { class: 'splash-bar' }, splashFill),
    splashStatus,
    splashTip
  ]),
  loadingLines
]);
let tipIndex = Math.floor(Math.random() * TIPS.length);
function rotateTip() {
  splashTip.textContent = 'Consejo: ' + TIPS[tipIndex++ % TIPS.length];
}
let sourcesDone = 0;
let sourcesTotal = 1;
root.appendChild(sidebar.el);
root.appendChild(screensEl);
root.appendChild(loadingEl);
root.appendChild(toastEl);

const player = createPlayer(app);
// El video va fuera del contenedor escalado: algunos TV dibujan el video en un plano aparte y no toleran transformaciones.
document.body.appendChild(player.el);
// El menú emergente va encima de todo (también del reproductor).
const menu = createMenu();
document.body.appendChild(menu.el);
app.menu = menu;

// Diseño fijo 1920x1080 escalado a la pantalla (en la TV la escala es 1).
function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  [root, player.ui, menu.ui].forEach(el => {
    el.style.transform = 'scale(' + s + ')';
    el.style.left = Math.round((window.innerWidth - 1920 * s) / 2) + 'px';
    el.style.top = Math.round((window.innerHeight - 1080 * s) / 2) + 'px';
  });
}
window.addEventListener('resize', fit);
fit();

// ---------- Tema (día/noche) y barra superior ----------
const topbar = h('div', { class: 'topbar' });
root.appendChild(topbar);

function tick() {
  const now = new Date();
  const theme = resolveTheme(state.settings.theme, now);
  document.body.className = 'theme-' + theme + ' platform-' + platform;
  const who = activeProfile().name;
  const sleeping = app.sleepLeft ? app.sleepLeft() : 0;
  topbar.textContent = (kidsOn() ? 'Modo infantil  ·  ' : '') + greeting(now) + (who && who !== 'Principal' ? ', ' + who : '') + '  ·  ' + formatClock(now) + (sleeping ? '  ·  Se apaga en ' + sleeping + ' min' : '');
}
tick();
setInterval(tick, 30000);
app.applyTheme = tick;

// ---------- Filas de Inicio ----------
// Personales arriba (continuar, recientes, Mi lista, recomendaciones); luego en vivo y películas
// intercalados y reordenados según la hora (noticias en la mañana, películas de noche…).
function homeRows() {
  const rows = [];
  // En modo infantil no se muestra lo que vio el adulto (continuar, recientes, Mi lista, recomendaciones).
  if (!kidsOn()) {
    const cw = continueWatching();
    if (cw.length) rows.push({ id: 'continue', title: 'Continuar viendo', items: cw });
    const recents = resolveSaved(state.recents, app.data.byKey);
    if (recents.length) rows.push({ id: 'recents', title: 'Canales que viste', items: recents });
    const mine = resolveSaved(state.favorites, app.data.byKey);
    if (mine.length) rows.push({ id: 'mylist', title: 'Mi lista', items: mine });
    recommendations(app.data.channels, app.data.movies, recents, mine, cw).forEach(r => rows.push(r));
  }

  const live = app.data.liveRows.filter(r => r.id === 'country:do' || r.id.indexOf('cat:') === 0);
  const movies = app.data.movieRows.filter(r => r.id.indexOf('mv:en:') < 0);
  const mixed = [];
  const max = Math.max(live.length, movies.length);
  for (let i = 0; i < max; i++) {
    if (live[i]) mixed.push(live[i]);
    if (movies[i]) mixed.push(movies[i]);
  }
  return rows.concat(orderForTime(mixed, new Date())).slice(0, 18);
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
  rd: createRowsScreen(app, 'rd', () => app.data.rdRows, 'No se pudieron cargar los canales dominicanos. Revisa la conexión.'),
  grid: createGridScreen(app),
  detail: createDetailScreen(app),
  search: createSearchScreen(app),
  settings: createSettingsScreen(app),
  addlist: createAddListScreen(app),
  guide: createGuideScreen(app),
  series: createRowsScreen(app, 'series', () => app.data.seriesRows, 'Cargando series de Pluto TV… (funcionan en la app instalada en la TV)'),
  show: createShowScreen(app),
  pin: createPinScreen(app),
  profiles: createProfilesScreen(app),
  'profile-new': createNewProfileScreen(app)
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
  if (id === 'surprise') { app.surprise(); return; }
  if (id === 'series') app.loadSeries();
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
  screens.rd.dirty = true;
  screens.series.dirty = true;
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
  if (item.type === 'series') { app.push('show', { series: item }); return; }
  // Desde "Continuar viendo": abrir la ficha de su serie en ese episodio.
  if (item.type === 'episode') { openEpisode(item, false); return; }
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
  // Películas de la API de Pluto: la URL lleva la sesión actual.
  if (movie.path) {
    episodeUrl(movie).then(url => player.playMovie(movie, { urls: [url], subtitles: [], duration: movie.runtime }, startAt),
      () => app.toast('Pluto TV no respondió, intenta de nuevo'));
    return;
  }
  app.toast('Preparando película…');
  resolveMovie(movie).then(r => app.playMovie(movie, list, index, r, startAt), () => app.toast('Internet Archive no respondió, intenta de nuevo'));
};

// Episodio de Pluto: la URL lleva la sesión actual; al terminar sigue el próximo de la lista.
app.playEpisode = function (ep, list, index, startAt) {
  const next = list[index + 1];
  episodeUrl(ep).then(url => {
    player.playMovie(ep, { urls: [url], subtitles: [], duration: ep.runtime }, startAt || 0, next ? {
      next: () => app.playEpisode(next, list, index + 1, 0),
      nextLabel: 'T' + next.season + ':E' + next.number + '  ·  ' + next.title
    } : null);
  }, () => app.toast('Pluto TV no respondió, intenta de nuevo'));
};

// Catálogo de series: se carga una vez (en segundo plano o al entrar a Series) y las filas aparecen a medida que llegan.
let seriesLoading = null;
let seriesRaw = [];
function publishSeries() {
  const rows = kidsOn() ? seriesRaw.map(r => Object.assign({}, r, { items: r.items.filter(s => s.kids) })).filter(r => r.items.length >= 3) : seriesRaw.slice();
  app.data.seriesRows = rows;
  const byKey = {};
  const all = [];
  seriesRaw.forEach(r => r.items.forEach(s => { if (!byKey[s.key]) { byKey[s.key] = s; all.push(s); } }));
  app.data.seriesByKey = byKey;
  app.data.seriesAll = kidsOn() ? all.filter(s => s.kids) : all;
  screens.series.dirty = true;
  if (current() === screens.series) {
    refreshCurrent();
    // Se entró a Series cuando aún estaba vacía (el foco quedó en el menú): al llegar las filas, pasar a la primera serie.
    const f = getFocused();
    if (f && sidebar.el.contains(f) && sidebar.activeItem() === f && screens.series.firstFocus()) focusScreen(screens.series);
  }
}
app.publishSeries = publishSeries;
app.loadSeries = function () {
  if (seriesLoading) return seriesLoading;
  let pending = null;
  seriesLoading = loadSeriesCatalog(false, row => {
    seriesRaw.push(row);
    seriesRaw.sort((a, b) => a.order - b.order);
    clearTimeout(pending);
    pending = setTimeout(publishSeries, 800);
  }).then(rows => {
    clearTimeout(pending);
    seriesRaw = rows;
    publishSeries();
    // El mismo catálogo trajo películas con fecha de estreno: se suman a Películas (fila "Estrenos").
    mergeMovies();
    app.rebuild(player.isOpen() || current() === screens.movies);
  }, () => {
    seriesLoading = null;
    screens.series.dirty = true;
  });
  return seriesLoading;
};

app.onPlayerClosed = function () {
  nativeCall('keepScreenOn', false);
  app.markDirty();
  refreshCurrent();
  publishWatchNext();
};

app.onPlayerOpened = function () {
  nativeCall('keepScreenOn', true);
};

// autoplay: desde "Seguir viendo" de Google TV, el episodio arranca solo donde quedó.
function openEpisode(item, autoplay) {
  const series = app.data.seriesByKey && app.data.seriesByKey[item.seriesKey] ||
    { type: 'series', key: item.seriesKey, plutoId: item.seriesId, name: item.seriesName, poster: item.poster, art: item.art, genre: '', summary: '', seasons: 0 };
  app.push('show', { series, resumeKey: item.key, autoplay });
}

// ---------- Integraciones de Android TV (MainActivity.java) ----------
const native = window.TeleLibreNative || null;

function nativeCall(name, arg) {
  try { if (native && native[name]) return arg === undefined ? native[name]() : native[name](arg); } catch (e) { /* puente no disponible */ }
  return null;
}


// Fila "Seguir viendo" de la pantalla de inicio de Google TV: películas y episodios a medias del perfil activo.
let lastWatchNext = '';
function publishWatchNext() {
  if (!native || !native.setWatchNext) return;
  const items = continueWatching().slice(0, 10).map(it => {
    const p = getProgress(it.key);
    if (!p) return null;
    const episode = it.type === 'episode';
    return {
      key: it.key, type: episode ? 'episode' : 'movie',
      title: episode ? it.seriesName : it.name,
      subtitle: episode ? 'T' + it.season + ':E' + it.number + ' · ' + it.title : '',
      poster: it.poster || '', position: p.t * 1000, duration: p.d * 1000, at: p.at
    };
  }).filter(Boolean);
  const json = JSON.stringify(items);
  if (json === lastWatchNext) return;
  lastWatchNext = json;
  nativeCall('setWatchNext', json);
}
setInterval(publishWatchNext, 2 * 60 * 1000);

// Google TV abrió la app desde "Seguir viendo": ir directo a ese contenido, en el punto donde quedó.
window.__telelibreCheckOpen = function () {
  if (!started) return;
  const key = nativeCall('takePendingOpen');
  if (key) openFromLauncher(key);
};

function openFromLauncher(key) {
  const p = state.progress[key];
  if (!p) { app.toast('Ese contenido ya no está en Continuar viendo'); return; }
  menu.close();
  if (player.isOpen()) player.onAction('stop');
  stack = [];
  navigate('home');
  const item = p.item;
  if (item.type === 'episode') { openEpisode(item, true); return; }
  const fresh = app.data.moviesByKey[key] || item;
  if (fresh.direct && fresh.urls && !fresh.path) app.playMovie(fresh, [fresh], 0, { urls: fresh.urls, subtitles: [], duration: fresh.runtime || 0 }, p.t);
  else app.playMovie(fresh, [fresh], 0, null, p.t);
}

// Búsqueda por voz (micrófono del control o botón en Buscar).
app.voiceSearch = function () {
  if (!app.canVoice) { app.toast('La búsqueda por voz funciona en la app de Android TV'); return; }
  nativeCall('listen');
};

// Actualizar desde la misma TV: Java descarga la APK, comprueba que tenga la llave de TeleLibre y abre el instalador.
const APK_URL = 'https://edwin042331-hue.github.io/telelibre/TeleLibre.apk';
let updating = false;
app.installUpdate = function () {
  if (!app.canSelfUpdate) { app.toast('Abre Downloader y vuelve a instalar desde edwin042331-hue.github.io/telelibre/TeleLibre.apk', 8000); return; }
  if (updating) { app.toast('Ya se está descargando la actualización'); return; }
  updating = true;
  app.toast('Descargando la actualización…');
  nativeCall('installUpdate', APK_URL);
};

window.__telelibreUpdate = function (stateName, percent, message) {
  if (stateName === 'download') { app.toast('Descargando la actualización… ' + percent + ' %', 4000); return; }
  if (stateName === 'installing') { updating = false; app.toast('Abriendo el instalador de Android…', 6000); return; }
  updating = false;
  if (stateName === 'permission') {
    menu.open({
      title: 'Falta un permiso (solo la primera vez)',
      subtitle: 'En la pantalla que se abrió, activa "Permitir de esta fuente" para TeleLibre, vuelve con Atrás y elige Actualizar otra vez.',
      items: [{ label: 'Entendido', icon: 'check' }]
    });
    return;
  }
  app.toast('No se pudo actualizar' + (message ? ': ' + message : ''), 8000);
};

window.__telelibreVoice = function (text) {
  if (!text) { app.toast('No te escuché bien, intenta de nuevo'); return; }
  if (player.isOpen()) player.onAction('stop');
  navigate('search');
  screens.search.setQuery(text);
};

// ---------- Temporizador para dormir ----------
let sleepAt = 0;
let sleepWarned = false;

function setSleep(min) {
  sleepAt = min ? Date.now() + min * 60000 : 0;
  sleepWarned = false;
  tick();
  app.toast(min ? 'TeleLibre se apagará en ' + min + ' minutos' : 'Temporizador cancelado');
}

app.sleepLeft = function () {
  return sleepAt ? Math.max(0, Math.ceil((sleepAt - Date.now()) / 60000)) : 0;
};

app.sleepMenu = function () {
  const opts = [15, 30, 60, 90, 120].map(n => ({ label: n + ' minutos', icon: 'clock', action: () => setSleep(n) }));
  if (sleepAt) opts.push({ label: 'Cancelar el temporizador', icon: 'check', action: () => setSleep(0) });
  menu.open({ title: 'Apagar TeleLibre en…', subtitle: sleepAt ? 'Ahora se apaga en ' + app.sleepLeft() + ' min' : 'Para quedarse dormido viendo algo', items: opts });
};

function doSleep() {
  sleepAt = 0;
  menu.close();
  if (player.isOpen()) player.onAction('stop');
  tick();
  if (!exitApp()) app.toast('Temporizador: se detuvo la reproducción');
}

setInterval(() => {
  if (!sleepAt) return;
  const left = sleepAt - Date.now();
  if (left <= 0) { doSleep(); return; }
  if (left <= 60000 && !sleepWarned) {
    sleepWarned = true;
    menu.open({
      title: 'TeleLibre se apagará en 1 minuto',
      subtitle: 'Por el temporizador para dormir',
      items: [
        { label: 'Seguir viendo 30 minutos más', icon: 'play', action: () => setSleep(30) },
        { label: 'Apagar ya', icon: 'clock', action: doSleep }
      ]
    });
  }
  tick();
}, 15000);


let toastTimer = null;
// ms: cuánto se muestra (los recordatorios duran más).
app.toast = function (text, ms) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 2600);
};

function setFavMark(card, on) {
  const holder = card.firstChild;
  const mark = holder.querySelector('.fav-mark');
  if (on && !mark) holder.appendChild(icon('star', 'fav-mark'));
  if (!on && mark) holder.removeChild(mark);
}

// ---------- Datos ----------
// Películas: primero las del catálogo de la API de Pluto (con fecha de estreno, de la más nueva a la más vieja),
// después las de las listas; si una película está en ambas, gana la versión de la API (trae año y sinopsis).
function mergeMovies() {
  const seen = {};
  app.data.movies = [];
  plutoApiMovies().concat(app.data.listMovies || []).forEach(m => { if (!seen[m.key]) { seen[m.key] = true; app.data.movies.push(m); } });
}

// quiet: recalcula los datos sin repintar la pantalla que el usuario está mirando.
app.rebuild = function (quiet) {
  const s = state.settings;
  let visible = applyFilters(app.raw, { hideGeo: s.hideGeo, hideNot247: s.hideNot247 });
  // Canales que nunca han funcionado en esta TV (3 fallos seguidos): fuera, salvo que el usuario lo desactive.
  if (s.hideDead !== false) visible = visible.filter(c => !isDead(c.key));
  if (kidsOn()) visible = visible.filter(c => c.cats.indexOf('kids') >= 0 || c.cats.indexOf('family') >= 0);
  const channels = HTTPS_ONLY ? applyFilters(visible, { httpsOnly: true }) : visible;
  app.data.httpsHidden = visible.length - channels.length;
  app.data.channels = channels;
  app.data.byKey = indexByKey(channels);
  // Español en las filas principales; el inglés va en su propia sección al final; otros idiomas en "Del mundo".
  const spanish = channels.filter(c => c.lang === 'es');
  const english = channels.filter(c => c.lang === 'en');
  const world = channels.filter(c => c.lang === 'other');
  const liveRows = buildRows(spanish).concat(buildEnglishRows(english), buildWorldRows(world));
  liveRows.forEach(r => { r.items = rankByHealth(r.items); });
  app.data.liveRows = liveRows;
  app.data.rdRows = buildDominicanRows(spanish);
  const movies = kidsOn() ? app.data.movies.filter(m => m.genres.indexOf('animacion') >= 0 || m.genres.indexOf('familia') >= 0) : app.data.movies;
  app.data.visibleMovies = movies;
  app.data.movieRows = buildMovieRows(movies);
  app.data.animeRows = kidsOn() ? [] : buildAnimeRows(spanish, english, movies);
  app.data.moviesByKey = indexByKey(app.data.movies);
  app.markDirty();
  if (!quiet) refreshCurrent();
};

let started = false;

function progressLine(r, unit) {
  const n = (r.channels || r.movies || []).length;
  const ok = n > 0;
  const note = r.stale ? ' (sin conexión: usando copia guardada)' : r.error ? ' (' + r.error + ')' : '';
  loadingLines.appendChild(h('div', { class: 'loading-line' + (ok ? ' ok' : ' bad'), text: (ok ? '✓ ' : '✕ ') + r.source.name + ' — ' + n + ' ' + unit + note }));
  app.data.stats[r.source.id] = n;
  app.data.sourceErrors = app.data.sourceErrors || {};
  if (!ok) app.data.sourceErrors[r.source.id] = r.source.name + (r.error ? ' (' + r.error + ')' : '');
  else delete app.data.sourceErrors[r.source.id];
  sourcesDone++;
  splashFill.style.width = Math.round(100 * sourcesDone / sourcesTotal) + '%';
  splashStatus.textContent = (ok ? 'Listo: ' : 'Sin respuesta: ') + r.source.name + '  ·  ' + sourcesDone + ' de ' + sourcesTotal;
}

// full: muestra la pantalla de carga (inicio o "Actualizar ahora"); si no, recarga en segundo plano.
app.reload = function (force) {
  const full = force || !started;
  const sources = activeSources(state.settings);
  if (full) {
    const now = new Date();
    clear(loadingLines);
    sourcesDone = 0;
    sourcesTotal = Math.max(1, sources.filter(s => s.enabled).length + VOD_SOURCES.filter(s => isVodSourceOn(s, state.settings)).length);
    splashFill.style.width = '3%';
    splashHello.textContent = greeting(now) + '  ·  ' + DAYS[now.getDay()] + ' ' + now.getDate() + ' de ' + MONTHS[now.getMonth()];
    rotateTip();
    loadingEl.classList.remove('leaving');
    loadingEl.classList.add('show');
  } else app.toast('Actualizando fuentes…');
  const tipTimer = setInterval(rotateTip, 3500);
  // La guía de RD se pide en paralelo desde el principio: así el apartado RD ya trae "Ahora" al abrir.
  // Si llega después de abrir Inicio, se repintan las filas para que aparezca.
  loadEpg(force).then(ok => { if (ok && started) app.rebuild(player.isOpen()); });

  // Arranque progresivo: con lo que llegue en los primeros segundos ya se abre Inicio; las listas lentas
  // (la mundial de 11,000 canales, Pluto VOD) se suman después sin que el usuario espere.
  const liveSources = sources.filter(s => s.enabled);
  const liveParts = [];
  const vodParts = [];
  let opened = false;
  let partialTimer = null;

  function publish() {
    app.raw = mergeChannels(liveParts.filter(Boolean).map(r => r.channels));
    app.data.listMovies = [];
    vodParts.filter(Boolean).forEach(r => r.movies.forEach(m => app.data.listMovies.push(m)));
    mergeMovies();
  }

  function open() {
    if (opened) return;
    opened = true;
    clearInterval(tipTimer);
    publish();
    const firstRun = !started;
    started = true;
    app.rebuild();
    // Con más de un perfil, primero "¿Quién está viendo?".
    if (firstRun) { if (profiles.list.length > 1) show('profiles'); else { profileChosen = true; show('home'); } }
    if (firstRun) { publishWatchNext(); setTimeout(() => window.__telelibreCheckOpen(), 300); }
    if (full) {
      splashFill.style.width = '100%';
      splashStatus.textContent = app.data.channels.length.toLocaleString('es') + ' canales y ' + app.data.movies.length.toLocaleString('es') + ' películas listos';
      // Salida suave: el inicio aparece detrás mientras la portada se desvanece.
      setTimeout(() => loadingEl.classList.add('leaving'), 700);
      setTimeout(() => { loadingEl.classList.remove('show'); loadingEl.classList.remove('leaving'); }, 1500);
    }
  }

  // Lo que llega después de abrir se integra cada 1.5 s como máximo, sin repintar mientras se ve algo.
  function arrivedLate() {
    clearTimeout(partialTimer);
    partialTimer = setTimeout(() => { publish(); app.rebuild(player.isOpen()); }, 1500);
  }

  const earlyTimer = setTimeout(() => { if (liveParts.some(r => r && r.channels.length)) open(); }, 6000);

  return Promise.all([
    loadSources(sources, { force, onProgress: r => {
      progressLine(r, 'canales');
      liveParts[liveSources.indexOf(r.source)] = r;
      if (opened) arrivedLate();
    } }),
    loadMovies(state.settings, { force, onProgress: r => {
      progressLine(r, 'películas');
      vodParts[VOD_SOURCES.indexOf(r.source)] = r;
      if (opened) arrivedLate();
    } })
  ]).then(() => {
    clearTimeout(earlyTimer);
    if (opened) { clearTimeout(partialTimer); publish(); app.rebuild(player.isOpen()); } else open();
    refreshPlutoGuide();
    if (!app.raw.length && !app.data.movies.length) app.toast('Sin conexión y sin copia guardada. Revisa el internet de la TV.');
  });
};

// La programación cambia: cada 10 minutos se rearma "Ahora en la TV dominicana" y el orden por hora del día.
setInterval(() => { if (started) app.rebuild(true); }, 10 * 60 * 1000);

// "Ahora:" en los canales de Pluto TV. Su API no permite CORS: solo en las apps de TV.
function refreshPlutoGuide() {
  if (platform === 'web') return;
  loadPlutoEpg(app.raw || []).then(ok => { if (ok && started) app.rebuild(true); });
}
setInterval(refreshPlutoGuide, 60 * 60 * 1000);

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

function toggleFavOn(card) {
  const on = toggleFavorite(card._item);
  app.toast(on ? 'Agregado a Mi lista' : 'Quitado de Mi lista');
  if (card.classList.contains('card')) setFavMark(card, on);
  app.markDirty();
}

// Menú de "OK mantenido": opciones según dónde está el foco.
function openContextMenu() {
  if (player.isOpen()) { menu.open(player.menuOptions()); return; }
  const f = getFocused();
  const item = f && f._item;
  if (item && !sidebar.el.contains(f)) {
    const fav = isFavorite(item.key);
    const isLive = item.type !== 'movie' && item.type !== 'series' && item.type !== 'episode';
    menu.open({
      title: item.name,
      items: [
        { label: isLive ? 'Ver ahora' : 'Ver detalles', icon: 'play', action: () => { if (f._onEnter) f._onEnter(); } },
        { label: fav ? 'Quitar de Mi lista' : 'Agregar a Mi lista', icon: fav ? 'check' : 'plus', action: () => toggleFavOn(f) },
        isLive && item.country === 'do' ? { label: 'Guía de programación', icon: 'guide', action: () => navigate('guide') } : null,
        { label: 'Sorpréndeme', icon: 'dice', action: () => app.surprise() }
      ]
    });
    return;
  }
  menu.open({
    title: 'TeleLibre',
    items: [
      { label: 'Sorpréndeme', icon: 'dice', action: () => app.surprise() },
      app.canVoice ? { label: 'Buscar por voz', icon: 'mic', action: () => app.voiceSearch() } : null,
      { label: 'Buscar', icon: 'search', action: () => navigate('search') },
      { label: 'Apagar en…', icon: 'clock', action: () => app.sleepMenu() },
      { label: 'Guía de TV', icon: 'guide', action: () => navigate('guide') },
      { label: 'Ajustes', icon: 'gear', action: () => navigate('settings') }
    ]
  });
}

// OK mantenido (~0.6 s) abre el menú de opciones: así todo funciona con controles sin botones de colores
// (como el de la TCL). El OK normal se ejecuta al soltar; si el control no manda "soltar", se ejecuta igual.
const LONG_PRESS = 600;
let okTimer = null;
let okLong = false;

function onOkDown(e) {
  e.preventDefault();
  if (e.repeat || okTimer) return;
  okLong = false;
  okTimer = setTimeout(() => { okTimer = null; okLong = true; openContextMenu(); }, LONG_PRESS);
}

function onOkUp(e) {
  if (e.keyCode !== 13) return;
  e.preventDefault();
  if (okLong) { okLong = false; return; }
  if (!okTimer) return;
  clearTimeout(okTimer);
  okTimer = null;
  runAction('enter');
}

function onKey(e) {
  // OK con pulsación larga: solo donde no se está escribiendo (en el teclado en pantalla OK siempre es OK).
  if (e.keyCode === 13 && started && !menu.isOpen() && !typingScreen()) { onOkDown(e); return; }
  // Teclado físico: las pantallas con texto (búsqueda, URL) usan las letras antes de traducirlas a acciones.
  if (started && !player.isOpen() && !menu.isOpen()) {
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
  if (menu.isOpen()) { menu.onAction(a); return; }
  if (a === 'menu') { openContextMenu(); return; }
  if (a === 'voice') { app.voiceSearch(); return; }
  if (a === 'guide') { if (player.isOpen()) player.onAction('stop'); navigate('guide'); return; }
  if (a === 'chlist' && !player.isOpen()) { navigate('live'); return; }
  if (a === 'chlist') { player.onAction('left'); return; }
  // ● Verde justo después de un recordatorio: ir a ese canal (también desde el reproductor).
  if (a === 'green' && pendingReminder && Date.now() < pendingReminder.until) { playReminder(); return; }
  if (player.isOpen()) { player.onAction(a); return; }
  if (a === 'yellow') { app.surprise(); return; }
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
  if (a === 'red' && f && f._item) { toggleFavOn(f); return; }
  if (a === 'back') goBack();
}

document.addEventListener('keydown', onKey);
document.addEventListener('keyup', onOkUp);

function typingScreen() {
  const scr = current();
  return !player.isOpen() && !!scr && (scr.name === 'search' || scr.name === 'addlist' || scr.name === 'pin');
}
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

// ---------- Modo infantil ----------
function kidsOn() {
  return !!(state.settings.kids && state.settings.kids.on) || !!activeProfile().kids;
}

// ---------- Perfiles ----------
let profileChosen = false;

function switchProfile(id) {
  useProfile(id);
  reloadTaste();
  profileChosen = true;
  tick();
  publishSeries();
  app.rebuild(true);
  stack = [];
  navigate('home');
  app.toast('Hola, ' + activeProfile().name);
  lastWatchNext = '';
  publishWatchNext();
}

// Salir de un perfil infantil pide el PIN (si hay uno creado).
app.chooseProfile = function (id) {
  const cur = activeProfile();
  const pin = state.settings.kids && state.settings.kids.pin;
  if (cur.kids && id !== cur.id && pin) { app.push('pin', { mode: 'unlock', onSuccess: () => switchProfile(id) }); return; }
  switchProfile(id);
};

app.onProfileRemoved = function () {
  switchProfile(profiles.active);
};

app.profilesBack = function () {
  if (profileChosen) navigate('home'); else tryExit();
};
app.kidsOn = kidsOn;

app.onKidsChanged = function () {
  tick();
  publishSeries();
  app.rebuild(true);
  navigate('home');
};

// ---------- Sorpréndeme ----------
app.surprise = function () {
  const movies = app.data.visibleMovies || app.data.movies;
  const pick = surprise(app.data.channels, movies, new Date());
  if (!pick) { app.toast('Todavía no hay nada para sorprenderte'); return; }
  app.toast('Sorpréndeme: ' + pick.name);
  if (pick.type === 'movie') { app.open(pick, [pick], 0); return; }
  // Para seguir con ▲ ▼ por canales parecidos.
  const similar = app.data.channels.filter(c => c.lang === 'es' && c.cats[0] === pick.cats[0]);
  app.open(pick, similar.indexOf(pick) >= 0 ? similar : [pick].concat(similar), Math.max(0, similar.indexOf(pick)));
};

// ---------- Recordatorios ----------
let pendingReminder = null;

function playReminder() {
  const ch = app.data.byKey[pendingReminder.key];
  pendingReminder = null;
  if (!ch) { app.toast('Ese canal no está disponible ahora'); return; }
  if (player.isOpen()) player.onAction('stop');
  app.open(ch, [ch], 0);
}

setInterval(() => {
  if (!started) return;
  const due = dueReminders(Date.now());
  if (!due.length) return;
  const r = due[0];
  pendingReminder = { key: r.key, until: Date.now() + 2 * 60000 };
  // Diálogo con botones: sirve con cualquier control (● Verde sigue funcionando como atajo).
  menu.open({
    title: 'Empieza ahora: ' + r.title,
    subtitle: 'En ' + r.channel,
    timeout: 60000,
    items: [
      { label: 'Ver ahora', icon: 'play', action: () => { if (pendingReminder) playReminder(); } },
      { label: 'Ahora no', icon: 'check', action: () => { pendingReminder = null; } }
    ]
  });
}, 20000);

registerKeys();
app.reload(false);
// Las series se cargan en segundo plano poco después de abrir (no compiten con el arranque).
setTimeout(() => app.loadSeries(), 20000);

// Señales del proyecto en GitHub Pages: canales verificados anoche y aviso de versión nueva en la TV.
loadVerified().then(ok => { if (ok && started) app.rebuild(true); });
if (platform !== 'web') {
  setTimeout(() => checkUpdate(__APP_VERSION__).then(v => {
    if (!v) return;
    app.data.update = v;
    if (!app.canSelfUpdate || player.isOpen() || menu.isOpen()) {
      app.toast('Hay una versión nueva de TeleLibre (' + v + '). Mira Ajustes para actualizar.', 8000);
      return;
    }
    menu.open({
      title: 'Hay una versión nueva: ' + v,
      subtitle: 'Tienes la ' + __APP_VERSION__ + '. Se actualiza sin borrar Mi lista ni lo que dejaste a medias.',
      items: [
        { label: 'Actualizar ahora', icon: 'restart', action: () => app.installUpdate() },
        { label: 'Después', icon: 'clock' }
      ]
    });
  }), 15000);
}
