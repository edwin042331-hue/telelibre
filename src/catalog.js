// Convierte entradas M3U de varias fuentes en un catálogo único y arma las filas de la pantalla de inicio.
// Puro (sin DOM) para poder probarlo en Node.

export const CATEGORIES = [
  ['news', 'Noticias'],
  ['sports', 'Deportes'],
  ['movies', 'Películas'],
  ['series', 'Series'],
  ['novelas', 'Novelas'],
  ['crime', 'Crimen e investigación'],
  ['kids', 'Infantil'],
  ['anime', 'Anime'],
  ['music', 'Música'],
  ['entertainment', 'Entretenimiento'],
  ['documentary', 'Documentales y cultura'],
  ['lifestyle', 'Estilo de vida'],
  ['family', 'Familia'],
  ['plex', 'Plex · canales 24/7'],
  ['general', 'Canales generales'],
  ['classic', 'Clásicos'],
  ['business', 'Negocios'],
  ['weather', 'El tiempo'],
  ['legislative', 'Gobierno y legislativo'],
  ['religious', 'Religiosos'],
  ['shop', 'Compras'],
  ['other', 'Otros']
];

const CATEGORY_LABEL = {};
CATEGORIES.forEach(c => { CATEGORY_LABEL[c[0]] = c[1]; });

export function categoryLabel(key) {
  return CATEGORY_LABEL[key] || CATEGORY_LABEL.other;
}

// iptv-org trae ~30 categorías en inglés; se agrupan para que la pantalla no tenga 30 filas.
const ALIASES = {
  animation: 'kids', kids: 'kids',
  comedy: 'entertainment', entertainment: 'entertainment',
  culture: 'documentary', documentary: 'documentary', education: 'documentary', science: 'documentary',
  cooking: 'lifestyle', lifestyle: 'lifestyle', travel: 'lifestyle', outdoor: 'lifestyle', relax: 'lifestyle', auto: 'lifestyle',
  news: 'news', sports: 'sports', movies: 'movies', series: 'series', music: 'music', family: 'family',
  general: 'general', classic: 'classic', business: 'business', weather: 'weather',
  legislative: 'legislative', religious: 'religious', shop: 'shop',
  // Pluto TV / Samsung TV Plus en español e inglés.
  'películas': 'movies', 'cine': 'movies', 'curiosidad': 'documentary', 'documentales': 'documentary', 'zona paranormal': 'documentary',
  'anime & gaming': 'anime', 'niños': 'kids', 'reality': 'entertainment', 'competencia': 'entertainment', 'south park': 'entertainment',
  'novelas': 'novelas', 'telenovela': 'novelas', 'telenovelas': 'novelas', 'música': 'music', 'música & ambiente': 'music',
  'deportes': 'sports', 'deporte': 'sports', 'comedia': 'entertainment', 'retro': 'classic', 'noticias': 'news',
  'estilo de vida': 'lifestyle', 'viajes y cocina': 'lifestyle', 'entretenimiento': 'entertainment', 'investigación': 'crime',
  'crimen': 'crime', 'true crime': 'crime', 'teen': 'series', 'serie': 'series',
  // Pluto USA, Samsung TV Plus USA y Roku (en inglés).
  'anime': 'anime', 'drama': 'series', 'action & drama': 'series', 'sci-fi': 'series', 'sci-fi & horror': 'series', 'romance': 'series',
  'news + opinion': 'news', 'news & opinion': 'news', 'local news': 'news', 'national news': 'news',
  'sports & outdoors': 'sports', 'motor sports': 'sports', 'auto & motorsports': 'sports', 'pro wrestling': 'sports', 'bowling': 'sports', '3x3 basketball': 'sports',
  'home & food': 'lifestyle', 'home + food': 'lifestyle', 'lifestyle & pop culture': 'lifestyle', 'health': 'lifestyle', 'home improvement': 'lifestyle',
  'reality tv': 'entertainment', 'reality competition': 'entertainment', 'competition reality': 'entertainment', 'game shows': 'entertainment',
  'game show': 'entertainment', 'daytime + game shows': 'entertainment', 'tv & entertainment': 'entertainment', 'gaming & tech': 'entertainment', 'card games': 'entertainment',
  'nature, history & science': 'documentary', 'history + science': 'documentary', 'animals + nature': 'documentary', 'animals': 'documentary',
  'educational': 'documentary', 'environment': 'documentary', 'paranormal': 'documentary', 'art': 'documentary',
  'crime': 'crime', 'crime drama': 'crime', 'law': 'crime', 'western & classic tv': 'classic', 'classic tv': 'classic', 'westerns': 'classic',
  'ambiance': 'music', 'music videos': 'music', 'animated': 'kids', 'children-music': 'kids', 'faith & family': 'religious',
  'auction': 'shop', 'shopping': 'shop', 'halloween hits': 'movies', 'latino': 'general', 'en español': 'general'
};

// Grupos en español dentro de listas en inglés (Samsung TV Plus "Latino", Pluto USA "En Español").
const SPANISH_GROUPS = { 'latino': true, 'en español': true };

const HIDDEN_GROUPS = { xxx: true };

// Free-TV agrupa casi todo por país; solo estos grupos son temáticos.
const FREETV_GROUPS = {
  'news': 'news', 'news (es)': 'news', 'documentaries (en)': 'documentary', 'music (en)': 'music',
  'vod movies (en)': 'movies', 'weather': 'weather', 'business': 'business'
};

export const COUNTRY_NAMES = {
  do: 'República Dominicana', es: 'España', mx: 'México', ar: 'Argentina', co: 'Colombia', ve: 'Venezuela',
  cl: 'Chile', pe: 'Perú', ec: 'Ecuador', bo: 'Bolivia', py: 'Paraguay', uy: 'Uruguay', cr: 'Costa Rica',
  pa: 'Panamá', gt: 'Guatemala', hn: 'Honduras', sv: 'El Salvador', ni: 'Nicaragua', cu: 'Cuba',
  pr: 'Puerto Rico', us: 'Estados Unidos', gq: 'Guinea Ecuatorial', ad: 'Andorra', br: 'Brasil',
  ca: 'Canadá', fr: 'Francia', it: 'Italia', uk: 'Reino Unido', gb: 'Reino Unido', de: 'Alemania',
  pt: 'Portugal', ht: 'Haití', jm: 'Jamaica', tt: 'Trinidad y Tobago', int: 'Internacional'
};

// Solo estos países tienen fila propia: la app es para público hispano (los demás siguen en las categorías).
const ROW_COUNTRIES = ['es', 'mx', 'ar', 'co', 've', 'cl', 'pe', 'ec', 'bo', 'py', 'uy', 'cr', 'pa', 'gt', 'hn', 'sv', 'ni', 'cu', 'pr', 'us'];

export function countryName(code) {
  return COUNTRY_NAMES[code] || (code ? code.toUpperCase() : '');
}

const UNPLAYABLE_RE = /(youtube\.com|youtu\.be|twitch\.tv|dailymotion\.com\/video)/i;

export function isPlayableUrl(url) {
  return /^https?:\/\//i.test(url) && !UNPLAYABLE_RE.test(url);
}

// Series y canales de anime conocidos (Pluto, Samsung TV Plus, Roku, iptv-org). Se busca por nombre porque
// ninguna lista tiene una categoría "anime" confiable.
const ANIME_RE = /\b(anime|naruto|boruto|one piece|dragon ball|pok[eé]mon|yu-?gi-?oh|crunchyroll|hidive|sailor moon|gundam|hunter x hunter|inuyasha|saint seiya|caballeros del zod[ií]aco|beyblade|digimon|retrocrush|toonami|death note|captain tsubasa|super campeones|sh[oō]nen|mazinger|otaku)\b/i;

export function isAnimeName(name) {
  return ANIME_RE.test(name);
}

function countryOf(entry, source) {
  const m = /\.([a-z]{2})(?:@|$)/i.exec(entry.tvgId);
  if (m) return m[1].toLowerCase();
  return entry.country || source.country || '';
}

// Devuelve null si la entrada no debe mostrarse (adultos, YouTube, fuera del filtro de la fuente).
export function toChannel(entry, source) {
  const groups = entry.groups;
  if (source.groupFilter && !groups.some(g => source.groupFilter.indexOf(g) >= 0)) return null;
  const lower = groups.map(g => g.toLowerCase());
  if (lower.some(g => HIDDEN_GROUPS[g])) return null;
  if (!entry.name || !isPlayableUrl(entry.url)) return null;
  const anime = isAnimeName(entry.name);
  if (source.animeOnly && !anime) return null;

  const cats = [];
  lower.forEach(g => {
    const k = source.groupMode === 'freetv' ? (FREETV_GROUPS[g] || 'general')
      : source.groupMode === 'none' ? source.category
      : (ALIASES[g] || 'other');
    if (cats.indexOf(k) < 0) cats.push(k);
  });
  if (!cats.length) cats.push(source.category || 'other');
  // "anime" solo por nombre: el grupo "Anime & Gaming" de Pluto mezcla e-sports y videojuegos.
  const animeAt = cats.indexOf('anime');
  if (animeAt >= 0 && !anime) cats.splice(animeAt, 1, 'entertainment');
  if (anime && cats.indexOf('anime') < 0) cats.unshift('anime');
  if (cats.length > 1 && cats.indexOf('other') >= 0) cats.splice(cats.indexOf('other'), 1);

  const country = countryOf(entry, source);
  return {
    key: entry.tvgId ? 'id:' + entry.tvgId.toLowerCase() : 'u:' + entry.url,
    name: entry.name,
    logo: entry.logo,
    country,
    cats: cats.filter((c, i) => cats.indexOf(c) === i),
    quality: entry.quality,
    geo: entry.geo,
    not247: entry.not247,
    urls: [entry.url],
    src: source.id,
    lang: lower.some(g => SPANISH_GROUPS[g]) ? 'es' : languageOf(entry.name, country, source)
  };
}

const SPANISH_COUNTRIES = ['do', 'es', 'mx', 'ar', 'co', 've', 'cl', 'pe', 'ec', 'bo', 'py', 'uy', 'cr', 'pa', 'gt', 'hn', 'sv', 'ni', 'cu', 'pr', 'gq'];
const ENGLISH_COUNTRIES = ['us', 'ca', 'uk', 'gb', 'au', 'ie', 'nz'];

// 'es' | 'en' | 'other'. Las listas multilingües (cine 24/7, anime) se clasifican por país;
// 'other' (portugués, alemán…) no tiene fila propia pero sigue apareciendo en la búsqueda.
function languageOf(name, country, source) {
  if (/espa[nñ]ol|latino|castellano/i.test(name)) return 'es';
  // Variantes regionales de Pluto ("Naruto Brazil", "One Piece FR") llevan tvg-id de EE. UU. pero no son en inglés.
  if (/\b(brazil|br|germany|deutsch\w*|fr|france|italia|acao|portugu[eê]s)\b/i.test(name)) return 'other';
  if (source.lang !== 'multi') return source.lang || 'es';
  if (SPANISH_COUNTRIES.indexOf(country) >= 0) return 'es';
  if (ENGLISH_COUNTRIES.indexOf(country) >= 0) return 'en';
  return 'other';
}

// Une las listas: el mismo tvg-id en varias calidades/fuentes queda como un canal con URLs alternativas,
// que el reproductor prueba en orden si la primera falla.
export function mergeChannels(lists) {
  const byKey = {};
  const byUrl = {};
  const out = [];
  lists.forEach(list => list.forEach(ch => {
    const url = ch.urls[0];
    const existing = byUrl[url] || byKey[ch.key];
    if (existing) {
      if (existing.urls.indexOf(url) < 0) existing.urls.push(url);
      byUrl[url] = existing;
      ch.cats.forEach(c => { if (existing.cats.indexOf(c) < 0) existing.cats.push(c); });
      if (existing.cats.length > 1) existing.cats = existing.cats.filter(c => c !== 'other');
      // Solo queda marcado como geo-bloqueado / no 24-7 si todas sus URLs lo están.
      existing.geo = existing.geo && ch.geo;
      existing.not247 = existing.not247 && ch.not247;
      if (!existing.logo) existing.logo = ch.logo;
      if (!existing.country) existing.country = ch.country;
      return;
    }
    const copy = Object.assign({}, ch, { urls: ch.urls.slice(), cats: ch.cats.slice() });
    byKey[copy.key] = copy;
    byUrl[url] = copy;
    out.push(copy);
  }));
  return out;
}

// httpsOnly: en la versión web (https) el navegador bloquea streams http por contenido mixto.
export function applyFilters(channels, opts) {
  const out = [];
  channels.forEach(ch => {
    if (opts.hideGeo && ch.geo) return;
    if (opts.hideNot247 && ch.not247) return;
    if (opts.httpsOnly) {
      const urls = ch.urls.filter(u => u.indexOf('https://') === 0);
      if (!urls.length) return;
      if (urls.length !== ch.urls.length) ch = Object.assign({}, ch, { urls });
    }
    out.push(ch);
  });
  return out;
}

function qualityRank(q) {
  return parseInt(q, 10) || 0;
}

export function sortChannels(list) {
  return list.slice().sort((a, b) => {
    const logo = (b.logo ? 1 : 0) - (a.logo ? 1 : 0);
    if (logo) return logo;
    const q = qualityRank(b.quality) - qualityRank(a.quality);
    if (q) return q;
    const an = a.name.toLowerCase();
    const bn = b.name.toLowerCase();
    return an < bn ? -1 : an > bn ? 1 : 0;
  });
}

// Copia liviana para favoritos/recientes/progreso (sirve para canales y películas).
export function snapshot(item) {
  const out = {};
  for (const k in item) if (item.hasOwnProperty(k) && k.charAt(0) !== '_') out[k] = item[k];
  return out;
}

export function indexByKey(channels) {
  const map = {};
  channels.forEach(ch => { map[ch.key] = ch; });
  return map;
}

// Los favoritos y recientes se guardan como foto del canal; si sigue en el catálogo se usa la versión fresca
// (las URLs de iptv-org cambian a menudo).
export function resolveSaved(saved, byKey) {
  return saved.map(s => byKey[s.key] || s);
}

// Filas de TV en vivo: RD primero, luego categorías y países con suficientes canales.
export function buildRows(channels) {
  const rows = [];
  const dominican = channels.filter(c => c.country === 'do');
  if (dominican.length) rows.push({ id: 'country:do', title: 'Hecho en RD', items: sortChannels(dominican) });

  CATEGORIES.forEach(c => {
    const items = channels.filter(ch => ch.cats.indexOf(c[0]) >= 0);
    if (items.length >= 3) rows.push({ id: 'cat:' + c[0], title: c[1], items: sortChannels(items) });
  });

  const counts = {};
  channels.forEach(ch => { if (ROW_COUNTRIES.indexOf(ch.country) >= 0) counts[ch.country] = (counts[ch.country] || 0) + 1; });
  Object.keys(counts)
    .filter(code => counts[code] >= 8)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 12)
    .forEach(code => {
      rows.push({ id: 'country:' + code, title: 'Desde ' + countryName(code), items: sortChannels(channels.filter(ch => ch.country === code)) });
    });
  return rows;
}

// TV en inglés: mismas categorías pero en filas propias, para no mezclarlas con las de español.
export function buildEnglishRows(channels) {
  const rows = [];
  CATEGORIES.forEach(c => {
    const items = channels.filter(ch => ch.cats.indexOf(c[0]) >= 0);
    if (items.length >= 3) rows.push({ id: 'en:cat:' + c[0], title: c[1] + ' · en inglés', items: sortChannels(items) });
  });
  return rows;
}

export function normalizeText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function searchChannels(channels, query, limit) {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored = [];
  channels.forEach(ch => {
    const name = normalizeText(ch.name);
    const hay = name + ' ' + normalizeText(countryName(ch.country)) + ' ' + normalizeText(ch.cats.map(categoryLabel).join(' '));
    for (let i = 0; i < tokens.length; i++) if (hay.indexOf(tokens[i]) < 0) return;
    const score = name.indexOf(tokens[0]) === 0 ? 0 : name.indexOf(tokens[0]) >= 0 ? 1 : 2;
    scored.push({ ch, score });
  });
  scored.sort((a, b) => a.score - b.score || (a.ch.name < b.ch.name ? -1 : 1));
  return scored.slice(0, limit || 60).map(s => s.ch);
}
