// Series de Pluto TV por episodios, con la misma API que usa la web de Pluto (gratis, con anuncios).
// La sesión se pide desde la propia TV: así el catálogo y los permisos son los de la región del usuario (RD → Latinoamérica).
// La API solo acepta CORS de pluto.tv: funciona en las apps de TV (sin CORS); en la versión web la sección avisa.
import { getText } from './net.js';
import { load, save } from './store.js';

const BOOT = 'https://boot.pluto.tv/v4/start';
const APP_VERSION = '8.0.0-111b2b9dc00bd0bea9030b30662159ed9e7c8bc6';
const CATALOG_TTL = 12 * 60 * 60 * 1000;

// Categorías infantiles (para el modo infantil).
const KIDS_CATEGORY_RE = /infantil|niños|kids|familia|animad|caricatura|junior|nick|preescolar|juguetes|canta y baila/i;

let session = null;

function uuid() {
  let d = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// El clientID se guarda: Pluto lo usa para su conteo de dispositivos y para el progreso de anuncios.
function clientId() {
  let id = load('pluto:client', null);
  if (!id) { id = uuid(); save('pluto:client', id); }
  return id;
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 25000;
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }
      } else reject(new Error('HTTP ' + xhr.status));
    };
    xhr.onerror = () => reject(new Error('sin conexión con Pluto'));
    xhr.ontimeout = () => reject(new Error('Pluto no respondió'));
    xhr.send();
  });
}

// Sesión válida (se renueva sola antes de vencer).
export function plutoSession() {
  if (session && Date.now() < session.expires) return Promise.resolve(session);
  const params = ['appName=web', 'appVersion=' + APP_VERSION, 'deviceVersion=122.0.0', 'deviceModel=web', 'deviceMake=chrome',
    'deviceType=web', 'clientID=' + clientId(), 'clientModelNumber=1.0.0', 'serverSideAds=false', 'drmCapabilities=',
    'blockingMode=', 'notificationVersion=1', 'appLaunchCount=0', 'lastAppLaunchDate='];
  return getJson(BOOT + '?' + params.join('&')).then(b => {
    const refresh = Math.max(600, Math.min(b.refreshInSec || 3600, 6 * 3600));
    session = {
      token: b.sessionToken,
      vod: b.servers.vod,
      stitcher: b.servers.stitcher,
      params: b.stitcherParams,
      country: b.session && b.session.countryCode,
      expires: Date.now() + (refresh - 120) * 1000
    };
    return session;
  });
}

const GUIDE = 'https://service-channels.clusters.pluto.tv/v2/guide/timelines';
const GUIDE_BATCH = 100;

// "T2:E15 · Objetivo en movimiento": sirve en los canales de una sola serie, donde el título repite el del canal.
function episodeLabel(t) {
  const e = t.episode || {};
  // "Episodio 7" no agrega nada a "T1:E7".
  const name = e.name && e.name !== t.title && !/^(episodio|episode|cap[ií]tulo|cap\.?)\s*\d+$/i.test(e.name) ? e.name : '';
  const se = e.season > 0 && e.number > 0 ? 'T' + e.season + ':E' + e.number : '';
  return se && name ? se + ' · ' + name : se || name;
}

// Programación de los canales en vivo de Pluto (los tvg-id de las listas son los ids de Pluto):
// 4 horas desde la media hora en curso, de 100 en 100 canales. Devuelve id -> [[inicioMs, finMs, título], ...].
export function loadLiveGuide(ids) {
  if (!ids.length) return Promise.resolve({});
  const start = new Date(Math.floor(Date.now() / 1800000) * 1800000).toISOString();
  return plutoSession().then(s => {
    const out = {};
    const batches = [];
    for (let i = 0; i < ids.length; i += GUIDE_BATCH) batches.push(ids.slice(i, i + GUIDE_BATCH));
    return Promise.all(batches.map(b =>
      getJson(GUIDE + '?start=' + encodeURIComponent(start) + '&channelIds=' + b.join(',') + '&duration=240', s.token).then(r => {
        (r.data || []).forEach(ch => {
          const list = (ch.timelines || [])
            .map(t => [Date.parse(t.start), Date.parse(t.stop), String(t.title || '').trim(), episodeLabel(t)])
            .filter(p => p[0] && p[1] && p[2]);
          if (list.length) out[ch.channelId] = list.sort((a, c) => a[0] - c[0]);
        });
      }, () => null)
    )).then(() => out);
  });
}

function poster(covers, width) {
  const c = (covers || []).filter(x => x.aspectRatio === '347:500')[0] || (covers || [])[0];
  if (!c) return '';
  return c.url.replace(/([?&])w=\d+/, '$1w=' + width).replace(/([?&])h=\d+/, '$1h=' + Math.round(width * 1.44));
}

export function toSeries(item, category) {
  const seasons = item.seasonsNumbers || [];
  return {
    type: 'series',
    key: 'pls:' + item._id,
    plutoId: item._id,
    name: item.name,
    genre: item.genre || '',
    summary: String(item.summary || item.description || '').slice(0, 280),
    seasons: seasons.length,
    category,
    kids: KIDS_CATEGORY_RE.test(category) || /infantil|niños|children|kids/i.test(item.genre || ''),
    poster: poster(item.covers, 300),
    art: item.featuredImage && item.featuredImage.path ? artUrl(imgPath(item.featuredImage.path)) : poster(item.covers, 700)
  };
}

// Imágenes de Pluto: en caché se guarda solo la ruta ("series/<id>/poster_<n>.jpg") y la URL se arma al leer.
const IMG = 'https://images.pluto.tv/';

function imgPath(url) {
  return url ? url.replace(IMG, '').split('?')[0] : '';
}

function posterUrl(path) {
  return path ? IMG + path + '?fill=blur&fit=fill&fm=jpg&q=75&w=300&h=432' : '';
}

function artUrl(path) {
  return path ? IMG + path + '?fm=jpg&q=75&w=1200&h=675' : '';
}

// Géneros de películas de Pluto -> géneros de la app (vod.js).
const MOVIE_GENRES = {
  'Drama': 'drama', 'Action & Adventure': 'accion', 'Comedy': 'comedia', 'Documentary': 'documental', 'Horror': 'terror',
  'Thriller': 'suspenso', 'Romance': 'romance', 'Children & Family': 'familia', 'Sci-Fi & Fantasy': 'scifi', 'Crime': 'crimen',
  'Anime': 'anime', 'Western': 'western', 'Musical': 'musical', 'War': 'guerra', 'Paranormal': 'terror'
};

// Película del catálogo de Pluto (con fecha de estreno). Misma clave que las de la lista M3U, así se reemplazan.
export function toPlutoMovie(item) {
  const date = item.clip && item.clip.originalReleaseDate;
  const released = date ? Date.parse(date) : 0;
  const genre = MOVIE_GENRES[item.genre];
  return {
    type: 'movie',
    key: 'pluto:' + item._id,
    name: item.name,
    year: released ? String(new Date(released).getUTCFullYear()) : '',
    released,
    genres: genre ? [genre] : [],
    regions: [],
    runtime: Math.round((item.duration || 0) / 1000),
    subs: false,
    lang: 'es',
    summary: String(item.summary || item.description || '').slice(0, 400),
    direct: true,
    path: item.stitched && item.stitched.path,
    poster: poster(item.covers, 300),
    art: item.featuredImage && item.featuredImage.path ? artUrl(imgPath(item.featuredImage.path)) : poster(item.covers, 700),
    src: 'pluto-api'
  };
}

// Orden de filas en "Series": primero series de verdad, luego anime/infantil/juvenil, luego el resto,
// y al final las categorías de cine (que solo traen alguna docuserie). Dentro de cada grupo, el orden de Pluto.
export function rowOrder(name, index) {
  // Lo latino y las novelas primero: es lo que más se ve en RD.
  // "Cine Latino" son películas sueltas: lo latino que va primero son las series y novelas.
  const tier = /latin|novela/i.test(name) && !/^cine|pel[ií]culas|pelis/i.test(name) ? 0
    : /^series/i.test(name) ? 1
    : /anime|naruto|boruto|one piece|nick|junior|teen|retro|mtv|reality|maratonear|nuevo/i.test(name) ? 2
    : /^cine|pel[ií]culas|pelis/i.test(name) ? 4
    : 3;
  return tier * 1000 + index;
}

// Catálogo: filas [{ id, title, items }] por categoría de Pluto.
// Se arma por partes (lista de 24 KB + ~36 KB por categoría) en vez de la respuesta completa de ~10 MB;
// el resultado resumido se guarda 12 h. onRow(fila) permite ir mostrando filas mientras llegan.
export function loadSeriesCatalog(force, onRow) {
  const cached = load('pluto:series', null);
  if (!force && cached && cached.v === 4 && Date.now() - cached.t < CATALOG_TTL) { lastMovies = cached.movies.map(unpackMovie); return Promise.resolve(unpackRows(cached)); }
  return plutoSession().then(s => getJson(s.vod + '/v4/vod/categories?includeItems=false&offset=1000&page=1', s.token).then(list => {
    const cats = list.categories || list;
    const rows = [];
    // Las mismas categorías traen películas con fecha de estreno: se aprovechan sin pedir nada más.
    const movieMap = {};
    // De a 4 categorías a la vez para no saturar la TV ni a Pluto.
    let i = 0;
    function next() {
      if (i >= cats.length) return Promise.resolve();
      const batch = cats.slice(i, i + 4);
      i += 4;
      return Promise.all(batch.map(c => getJson(s.vod + '/v4/vod/categories/' + c._id + '/items?offset=200&page=1', s.token).then(r => {
        (r.items || r).forEach(it => { if (it.type === 'movie' && it.stitched && !movieMap[it._id]) movieMap[it._id] = toPlutoMovie(it); });
        const items = (r.items || r).filter(it => it.type === 'series').map(it => toSeries(it, c.name));
        if (items.length < 3) return;
        const row = { id: 'pls:' + c._id, title: c.name, order: rowOrder(c.name, cats.indexOf(c)), items };
        rows.push(row);
        if (onRow) onRow(row);
      }, () => null))).then(next);
    }
    return next().then(() => {
      rows.sort((a, b) => a.order - b.order);
      // Para la caché se guardan las 1,200 películas más recientes (localStorage tiene ~5 MB para todo).
      lastMovies = Object.keys(movieMap).map(k => movieMap[k]).sort((a, b) => b.released - a.released);
      save('pluto:series', packRows(rows, lastMovies.slice(0, 500)));
      return rows;
    });
  })).catch(err => {
    if (cached && cached.v === 4) { lastMovies = cached.movies.map(unpackMovie); return unpackRows(cached); }
    throw err;
  });
}

// Caché compacta: cada serie se guarda una vez aunque aparezca en varias categorías; las filas guardan solo claves.
// Además cada serie/película va como lista corta en vez de objeto (de ~3.4 MB a ~1 MB en localStorage).
function packSeries(s) {
  return [s.plutoId, s.name, s.genre, s.summary.slice(0, 200), s.seasons, s.category, s.kids ? 1 : 0, imgPath(s.poster), imgPath(s.art)];
}

function unpackSeries(a) {
  return { type: 'series', key: 'pls:' + a[0], plutoId: a[0], name: a[1], genre: a[2], summary: a[3], seasons: a[4], category: a[5], kids: a[6] === 1, poster: posterUrl(a[7]), art: artUrl(a[8]) };
}

function packMovie(m) {
  return [m.key.slice(6), m.name, m.released, m.genres[0] || '', m.runtime, m.summary.slice(0, 200), imgPath(m.poster), imgPath(m.art), m.path];
}

function unpackMovie(a) {
  return {
    type: 'movie', key: 'pluto:' + a[0], name: a[1], released: a[2], year: a[2] ? String(new Date(a[2]).getUTCFullYear()) : '',
    genres: a[3] ? [a[3]] : [], regions: [], runtime: a[4], subs: false, lang: 'es', summary: a[5], direct: true,
    path: a[8], poster: posterUrl(a[6]), art: artUrl(a[7]), src: 'pluto-api'
  };
}

function packRows(rows, movies) {
  const series = {};
  const packed = rows.map(r => {
    r.items.forEach(s => { if (!series[s.plutoId]) series[s.plutoId] = packSeries(s); });
    return [r.id, r.title, r.order, r.items.map(s => s.plutoId)];
  });
  return { v: 4, t: Date.now(), series, rows: packed, movies: movies.map(packMovie) };
}

function unpackRows(c) {
  const cache = {};
  const get = id => cache[id] || (cache[id] = c.series[id] ? unpackSeries(c.series[id]) : null);
  return c.rows.map(r => ({ id: r[0], title: r[1], order: r[2], items: r[3].map(get).filter(Boolean) }));
}

// Películas que vinieron con el último catálogo (ordenadas de la más nueva a la más vieja).
let lastMovies = [];
export function plutoApiMovies() {
  return lastMovies;
}

// Temporadas y episodios de una serie.
export function loadSeasons(series) {
  return plutoSession().then(s => getJson(s.vod + '/v4/vod/series/' + series.plutoId + '/seasons?offset=1000&page=1', s.token)).then(r => {
    return (r.seasons || []).map(season => ({
      number: season.number,
      episodes: (season.episodes || []).filter(e => e.stitched && e.stitched.path).map(e => ({
        type: 'episode',
        key: 'ple:' + e._id,
        plutoId: e._id,
        seriesKey: series.key,
        seriesId: series.plutoId,
        seriesName: series.name,
        season: season.number,
        number: e.number,
        title: e.name,
        name: series.name + ' · T' + season.number + ':E' + e.number,
        description: String(e.description || '').slice(0, 300),
        runtime: Math.round((e.duration || 0) / 1000),
        poster: series.poster,
        art: series.art,
        genres: [],
        path: e.stitched.path
      }))
    })).filter(s => s.episodes.length);
  });
}

// URL de reproducción de un episodio (HLS con AES-128 estándar; incluye los anuncios de Pluto).
export function episodeUrl(episode) {
  return plutoSession().then(s => s.stitcher + '/v2' + episode.path + '?' + s.params + '&jwt=' + s.token + '&masterJWTPassthrough=true');
}
