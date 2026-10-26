// Películas bajo demanda desde Internet Archive (dominio público / licencias libres).
// MP4 con duración conocida: permite pausar, adelantar y reanudar donde se quedó.
import { getText } from './net.js';
import { load, save } from './store.js';
import { parseM3U } from './m3u.js';

const SEARCH = 'https://archive.org/advancedsearch.php';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const FIELDS = ['identifier', 'title', 'year', 'subject', 'runtime'];
const NO_ADULT = ' AND -subject:(erotic OR erotica OR sexploitation OR adult OR porn OR xxx OR sexy OR softcore OR nudity)';
const FEATURE_FILMS = 'collection:(feature_films) AND mediatype:(movies)';

const PLUTO_VOD = 'https://raw.githubusercontent.com/OwnerPlugins/pluto-tv-m3u/main/pluto-vod-';

// kind 'ia': búsqueda en Internet Archive (MP4). kind 'pluto': lista M3U de películas bajo demanda de Pluto TV (HLS).
// Las URLs de Pluto llevan un token de 24 h atado al país y la lista pesa ~1.5 MB: no se guardan en caché.
// Películas en inglés con subtítulos en español (VOSE): suelen venir quemados en la imagen, así se ven en cualquier TV.
const SUBTITLED = FEATURE_FILMS + ' AND (title:(VOSE OR subtitulada OR subtitulado OR subtitulos) OR subject:(VOSE OR subtitulada OR subtitulado OR subtitulos) OR (title:(spanish) AND title:(subtitles)))';

export const VOD_SOURCES = [
  { id: 'pluto-vod-do', kind: 'pluto', name: 'Pluto TV · Películas (República Dominicana)', url: PLUTO_VOD + 'DO.m3u', noCache: true },
  { id: 'ia-es', kind: 'ia', name: 'Internet Archive · Cine en español', query: FEATURE_FILMS + ' AND language:(spa OR Spanish)' + NO_ADULT, rows: 600 },
  { id: 'ia-subs', kind: 'ia', name: 'Internet Archive · Subtituladas al español', query: SUBTITLED + NO_ADULT, rows: 400, lang: 'en', subs: true, anyGenre: true },
  { id: 'pluto-vod-us', kind: 'pluto', name: 'Pluto TV · Movies (inglés)', url: PLUTO_VOD + 'US.m3u', noCache: true, lang: 'en' },
  { id: 'ia-classics', kind: 'ia', name: 'Internet Archive · Clásicos de Hollywood (inglés)', query: FEATURE_FILMS + ' AND language:(eng OR English)' + NO_ADULT, rows: 300, lang: 'en' },
  { id: 'pluto-vod-mx', kind: 'pluto', name: 'Pluto TV · Películas (México)', url: PLUTO_VOD + 'MX.m3u', noCache: true, defaultOff: true }
];

// Las subtituladas al español se quedan aunque se apague "Contenido en inglés": están pensadas para quien habla español.
export function isVodSourceOn(source, settings) {
  if (source.lang === 'en' && !source.subs && settings.english === false) return false;
  const v = settings.sources[source.id];
  return v == null ? !source.defaultOff : v;
}

export const GENRES = [
  ['accion', 'Acción'],
  ['clasico', 'Clásicos del cine'],
  ['anime', 'Anime'], ['comedia', 'Comedia'], ['drama', 'Drama'], ['terror', 'Terror'],
  ['suspenso', 'Suspenso y misterio'], ['crimen', 'Crimen y cine negro'], ['western', 'Western'],
  ['aventura', 'Aventura'], ['romance', 'Romance'], ['musical', 'Musicales y rancheras'],
  ['scifi', 'Ciencia ficción'], ['guerra', 'Bélicas'], ['historia', 'Historia'],
  ['animacion', 'Animación'], ['familia', 'Para toda la familia'], ['documental', 'Documentales']
];

const GENRE_LABEL = {};
GENRES.forEach(g => { GENRE_LABEL[g[0]] = g[1]; });

export function genreLabel(key) {
  return GENRE_LABEL[key] || key;
}

// Las etiquetas de Internet Archive son libres (mezclan inglés, español y nombres de actores).
const SUBJECT_GENRE = {
  'drama': 'drama', 'comedia': 'comedia', 'comedy': 'comedia', 'terror': 'terror', 'horror': 'terror',
  'suspenso': 'suspenso', 'suspense': 'suspenso', 'thriller': 'suspenso', 'mistery': 'suspenso', 'mystery': 'suspenso', 'misterio': 'suspenso',
  'action': 'accion', 'acción': 'accion', 'accion': 'accion', 'adventure': 'aventura', 'aventura': 'aventura', 'aventuras': 'aventura',
  'western': 'western', 'oeste': 'western', 'westerns': 'western', 'ciencia ficcion': 'scifi', 'ciencia ficción': 'scifi',
  'science fiction': 'scifi', 'sci-fi': 'scifi', 'romance': 'romance', 'romántica': 'romance', 'romantica': 'romance',
  'musical': 'musical', 'ranchera': 'musical', 'crime': 'crimen', 'crimen': 'crimen', 'policial': 'crimen',
  'film noir': 'crimen', 'cine negro': 'crimen', 'noir': 'crimen', 'narco film': 'crimen', 'narcocine': 'crimen', 'narco cine': 'crimen',
  'documental': 'documental', 'documentary': 'documental', 'war': 'guerra', 'guerra': 'guerra', 'bélica': 'guerra',
  'historico': 'historia', 'histórico': 'historia', 'history': 'historia', 'animación': 'animacion', 'animacion': 'animacion',
  'animation': 'animacion', 'cartoon': 'animacion', 'cartoons': 'animacion', 'infantil': 'familia', 'family': 'familia', 'familia': 'familia'
};

// group-title de Pluto VOD ("Cine Acción", "Adrenalina Freezone"...).
const PLUTO_GENRE = {
  'cine acción': 'accion', 'adrenalina freezone': 'accion', 'cine comedia': 'comedia', 'cine crimen': 'crimen',
  'cine animado': 'animacion', 'cine clásico': 'clasico', 'cine anime': 'anime', 'anime shōnen 少年': 'anime',
  'cine documental': 'documental', 'ciencia y tecnología': 'documental', 'aventura y rescate': 'aventura',
  'cine drama': 'drama', 'cine terror': 'terror', 'cine suspenso': 'suspenso', 'cine romance': 'romance',
  'cine western': 'western', 'cine familiar': 'familia', 'cine ciencia ficción': 'scifi'
};

function guessPlutoGenre(group) {
  const g = group.toLowerCase();
  if (PLUTO_GENRE[g]) return PLUTO_GENRE[g];
  if (g.indexOf('anime') >= 0) return 'anime';
  const word = g.replace(/^cine\s+/, '');
  return SUBJECT_GENRE[word] || null;
}

// Pluto USA agrupa por década o sello ("'80s Movies", "A24"): eso se usa como colección para armar filas.
const PLUTO_COLLECTIONS = {
  "'70s movies": 'Cine de los 70', "'80s movies": 'Cine de los 80', "'90s movies": 'Cine de los 90',
  "'00s movies": 'Cine de los 2000', 'a24': 'A24 · cine independiente'
};

export function plutoMovie(entry, source) {
  const m = /\/episode\/([0-9a-f]{24})\//i.exec(entry.url);
  if (!m || !entry.name || TITLE_BLOCK_RE.test(entry.name)) return null;
  const genres = [];
  entry.groups.forEach(gr => { const k = guessPlutoGenre(gr); if (k && genres.indexOf(k) < 0) genres.push(k); });
  const group = (entry.groups[0] || '').toLowerCase();
  const img = 'https://images.pluto.tv/episodes/' + m[1] + '/poster.jpg';
  return {
    type: 'movie',
    key: 'pluto:' + m[1],
    name: entry.name,
    year: '',
    genres,
    regions: [],
    collection: PLUTO_COLLECTIONS[group] || '',
    runtime: 0,
    subs: false,
    lang: group.indexOf('español') >= 0 ? 'es' : (source.lang || 'es'),
    // El póster original pesa ~750 KB; Pluto lo redimensiona con ?w=.
    direct: true,
    poster: img + '?w=300',
    art: img + '?w=900',
    urls: [entry.url],
    src: source.id
  };
}

const SUBJECT_REGION = {
  'cine argentino': 'argentino', 'clasico argentino': 'argentino', 'clásico argentino': 'argentino',
  'mexican cinema': 'mexicano', 'mexican film': 'mexicano', 'cine mexicano': 'mexicano', 'mexploitation': 'mexicano',
  'ranchera': 'mexicano', 'cine español': 'espanol', 'cine espanol': 'espanol', 'spanish cinema': 'espanol'
};

export const REGIONS = [['mexicano', 'Cine mexicano'], ['argentino', 'Cine argentino'], ['espanol', 'Cine español']];

// Segunda barrera contra contenido adulto: material subido sin etiquetas de género.
const TITLE_BLOCK_RE = /(sexuel|erotic|er[oó]tic|pleasure|porn|xxx|desnud|nude|sexy|colegialas|playboy|hentai)/i;

function subjectsOf(doc) {
  return [].concat(doc.subject || []).join(';').toLowerCase().split(/[;,]/).map(s => s.trim()).filter(Boolean);
}

export function parseRuntime(raw) {
  if (!raw) return 0;
  const s = String(raw);
  const hms = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(s.trim());
  if (hms) {
    if (hms[3] != null) return +hms[1] * 3600 + +hms[2] * 60 + +hms[3];
    // "1:27" es h:mm (ninguna película dura 1 minuto); "67:16" es mm:ss.
    return +hms[1] <= 4 ? +hms[1] * 3600 + +hms[2] * 60 : +hms[1] * 60 + +hms[2];
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 60);
}

// "1959 - Anatomy of a Murder - Anatomía de un asesinato - VOSE" -> título limpio, año y si es subtitulada.
export function cleanTitle(raw) {
  let subs = false;
  let year = '';
  const title = String(raw || '')
    .replace(/^\s*(\d{4})\s*-\s*/, (_, y) => { year = y; return ''; })
    .replace(/\(?(with |w\/ ?)spanish subtit\w*\)?/i, () => { subs = true; return ''; })
    .replace(/\[?VOS ?castellano\]?|\bsubtitulad[ao]\b|\bVOSE\b|\bsubt[ií]tulos( en espa[nñ]ol)?\b/gi, () => { subs = true; return ''; })
    .replace(/\(\s*\d{4}\s*\)/, '')
    .replace(/\(\s*\)|\[\s*\]/g, '')
    .replace(/(\s*-\s*)+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { title, subs, year };
}

// Etiquetas compuestas ("Film noir tardío", "Horror;Thriller") que no coinciden exacto con el diccionario.
const GENRE_HINTS = [['noir', 'crimen'], ['horror', 'terror'], ['terror', 'terror'], ['thriller', 'suspenso'], ['comed', 'comedia'],
  ['western', 'western'], ['drama', 'drama'], ['romanc', 'romance'], ['world war', 'guerra'], ['guerra', 'guerra'], ['sci-fi', 'scifi'],
  ['science fiction', 'scifi'], ['animat', 'animacion'], ['document', 'documental'], ['crime', 'crimen'], ['mystery', 'suspenso']];

function genreOf(subject) {
  if (SUBJECT_GENRE[subject]) return SUBJECT_GENRE[subject];
  for (let i = 0; i < GENRE_HINTS.length; i++) if (subject.indexOf(GENRE_HINTS[i][0]) >= 0) return GENRE_HINTS[i][1];
  return null;
}

// null = descartada (sin género reconocible o título sospechoso).
export function toMovie(doc, source) {
  const subjects = subjectsOf(doc);
  const genres = [];
  const regions = [];
  subjects.forEach(s => {
    const g = genreOf(s);
    if (g && genres.indexOf(g) < 0) genres.push(g);
    const r = SUBJECT_REGION[s];
    if (r && regions.indexOf(r) < 0) regions.push(r);
  });
  if (!genres.length && !regions.length && !source.anyGenre) return null;
  const rawTitle = String(Array.isArray(doc.title) ? doc.title[0] : doc.title);
  // En la fuente de subtituladas, las que solo traen subtítulos en inglés no sirven.
  if (source.subs && /english subtit/i.test(rawTitle) && !/spanish|español|espanol|vose/i.test(rawTitle)) return null;
  const t = cleanTitle(rawTitle);
  if (!t.title || TITLE_BLOCK_RE.test(t.title)) return null;
  const year = parseInt(doc.year || t.year, 10);
  return {
    type: 'movie',
    key: 'ia:' + doc.identifier,
    iaId: doc.identifier,
    name: t.title,
    year: isNaN(year) ? '' : String(year),
    genres,
    regions,
    runtime: parseRuntime(doc.runtime),
    subs: t.subs || !!source.subs,
    lang: source.lang || 'es',
    poster: 'https://archive.org/services/img/' + encodeURIComponent(doc.identifier),
    src: source.id
  };
}

function searchUrl(query, rows) {
  const params = ['q=' + encodeURIComponent(query), 'rows=' + rows, 'page=1', 'output=json', 'sort[]=downloads+desc']
    .concat(FIELDS.map(f => 'fl[]=' + f));
  return SEARCH + '?' + params.join('&');
}

function parseSource(source, text) {
  if (source.kind === 'pluto') return parseM3U(text).map(e => plutoMovie(e, source)).filter(Boolean);
  return JSON.parse(text).response.docs.map(d => toMovie(d, source)).filter(Boolean);
}

function fetchSource(source, force) {
  const cached = source.noCache ? null : load('vod:' + source.id, null);
  if (!force && cached && Date.now() - cached.t < CACHE_TTL) return Promise.resolve({ source, movies: cached.movies, fromCache: true });
  const url = source.kind === 'pluto' ? source.url : searchUrl(source.query, source.rows);
  return getText(url, 30000).then(text => {
    const movies = parseSource(source, text);
    if (!source.noCache) save('vod:' + source.id, { t: Date.now(), movies });
    return { source, movies, fromCache: false };
  }, err => {
    if (cached) return { source, movies: cached.movies, fromCache: true, stale: true, error: err.message };
    return { source, movies: [], error: err.message };
  });
}

export function loadMovies(settings, opts) {
  const sources = VOD_SOURCES.filter(s => isVodSourceOn(s, settings));
  return Promise.all(sources.map(s => fetchSource(s, opts && opts.force).then(r => {
    if (opts && opts.onProgress) opts.onProgress(r);
    return r;
  }))).then(results => {
    const seen = {};
    const movies = [];
    results.forEach(r => r.movies.forEach(m => { if (!seen[m.key]) { seen[m.key] = true; movies.push(m); } }));
    return { results, movies };
  });
}

// Búsqueda en todo el archivo (no solo lo descargado al iniciar).
export function searchArchive(query) {
  const term = query.replace(/[^\w\sáéíóúñü]/gi, ' ').trim();
  if (term.length < 3) return Promise.resolve([]);
  const q = FEATURE_FILMS + ' AND title:(' + term + ')' + NO_ADULT;
  return getText(searchUrl(q, 40), 15000).then(text => {
    const src = { id: 'ia-search' };
    return JSON.parse(text).response.docs.map(d => toMovie(d, src)).filter(Boolean);
  });
}

// Elige el MP4 a reproducir: el h.264 original si existe, si no la versión ligera de 512Kb.
// También devuelve subtítulos .vtt (los .srt no los soporta <track>).
export function resolveMovie(movie) {
  return getText('https://archive.org/metadata/' + encodeURIComponent(movie.iaId), 20000).then(text => {
    const meta = JSON.parse(text);
    const files = meta.files || [];
    const base = 'https://archive.org/download/' + encodeURIComponent(movie.iaId) + '/';
    const mp4s = files.filter(f => /\.mp4$/i.test(f.name));
    const rank = f => (/h\.264/i.test(f.format) ? 3 : /mpeg4/i.test(f.format) ? 2 : 1) * 10000 + Math.min(parseInt(f.height, 10) || 0, 1080);
    mp4s.sort((a, b) => rank(b) - rank(a));
    const urls = mp4s.map(f => base + f.name.split('/').map(encodeURIComponent).join('/'));
    const vtt = files.filter(f => /\.vtt$/i.test(f.name)).map(f => ({ url: base + encodeURIComponent(f.name), label: /eng|english/i.test(f.name) ? 'English' : 'Español' }));
    const m = meta.metadata || {};
    let desc = Array.isArray(m.description) ? m.description[0] : (m.description || '');
    desc = String(desc).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const length = mp4s.length ? parseFloat(mp4s[0].length) : 0;
    return { urls, subtitles: vtt, description: desc, duration: isNaN(length) ? movie.runtime : Math.round(length) };
  });
}

function isFrom(prefix) {
  return m => m.key.indexOf(prefix) === 0;
}

// Orden: lo nuevo en español, subtituladas, cine por país y género; al final, la sección en inglés.
export function buildMovieRows(movies) {
  const rows = [];
  const es = movies.filter(m => m.lang === 'es');
  const en = movies.filter(m => m.lang === 'en');
  const subtitled = movies.filter(m => m.subs);
  const pluto = es.filter(isFrom('pluto:'));
  const archive = es.filter(isFrom('ia:'));
  if (pluto.length) rows.push({ id: 'mv:pluto', title: 'Estrenos gratis en Pluto TV', items: pluto.slice(0, 60) });
  if (subtitled.length >= 4) rows.push({ id: 'mv:subs', title: 'Subtituladas al español', items: subtitled });
  if (archive.length) rows.push({ id: 'mv:top', title: 'Joyas del cine en español', items: archive.slice(0, 40) });
  REGIONS.forEach(r => {
    const items = es.filter(m => m.regions.indexOf(r[0]) >= 0);
    if (items.length >= 4) rows.push({ id: 'mv:r:' + r[0], title: r[1], items });
  });
  GENRES.forEach(g => {
    const items = es.filter(m => m.genres.indexOf(g[0]) >= 0);
    if (items.length >= 4) rows.push({ id: 'mv:g:' + g[0], title: g[1], items });
  });

  const enPluto = en.filter(isFrom('pluto:'));
  if (enPluto.length) rows.push({ id: 'mv:en:new', title: 'Movies · en inglés', items: enPluto.filter(m => m.genres.indexOf('anime') < 0).slice(0, 60) });
  Object.keys(PLUTO_COLLECTIONS).forEach(k => {
    const label = PLUTO_COLLECTIONS[k];
    const items = en.filter(m => m.collection === label);
    if (items.length >= 4) rows.push({ id: 'mv:en:c:' + k, title: label + ' (inglés)', items });
  });
  const classics = en.filter(m => m.src === 'ia-classics');
  if (classics.length) rows.push({ id: 'mv:classics', title: 'Clásicos de Hollywood (inglés)', items: classics });
  return rows;
}

// Sección Anime: películas en español primero, luego en inglés.
export function buildAnimeMovieRows(movies) {
  const anime = movies.filter(m => m.genres.indexOf('anime') >= 0);
  const rows = [];
  const es = anime.filter(m => m.lang === 'es');
  const en = anime.filter(m => m.lang !== 'es');
  if (es.length) rows.push({ id: 'an:mv:es', title: 'Películas de anime en español', items: es });
  if (en.length) rows.push({ id: 'an:mv:en', title: 'Anime movies · en inglés', items: en });
  return rows;
}
