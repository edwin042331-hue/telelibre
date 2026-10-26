import { countryName, categoryLabel } from '../catalog.js';
import { genreLabel } from '../vod.js';

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

export function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
}

export function formatDuration(sec) {
  const m = Math.round((sec || 0) / 60);
  if (!m) return '';
  return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
}

// 12 horas, como se usa en RD: "9:05 p. m."
export function formatClock(d) {
  const h = d.getHours();
  return (h % 12 || 12) + ':' + pad(d.getMinutes()) + (h < 12 ? ' a. m.' : ' p. m.');
}

// Etiquetas cortas que se muestran como "chips" en el panel superior y en el detalle.
export function itemTags(item) {
  if (item.type === 'movie') {
    return [item.year, formatDuration(item.runtime)].concat(item.genres.slice(0, 3).map(genreLabel))
      .concat(item.subs ? ['Subtitulada'] : []).concat(item.lang === 'en' ? ['Inglés'] : []).filter(Boolean);
  }
  return [countryName(item.country)].concat(item.cats.filter(c => c !== 'other').slice(0, 2).map(categoryLabel))
    .concat(item.quality ? [item.quality.toUpperCase()] : []).concat(item.not247 ? ['No 24/7'] : []).filter(Boolean);
}
