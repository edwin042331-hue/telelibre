// Tarjetas: canal en vivo (16:9 con logo) y película (póster 2:3 con barra de progreso).
import { h } from './dom.js';
import { icon } from './icons.js';
import { isFavorite, getProgress } from '../store.js';
import { nowNext } from '../epg.js';

function hash(str) {
  let x = 5381;
  for (let i = 0; i < str.length; i++) x = ((x << 5) + x + str.charCodeAt(i)) | 0;
  return Math.abs(x);
}

// Color de fondo estable por canal, para que el logo no flote sobre gris plano.
export function tintFor(key) {
  return 'hsl(' + (hash(key) % 360) + ', 32%, 20%)';
}

function initials(name) {
  const words = name.replace(/[^\w\sáéíóúñ]/gi, '').split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : name.slice(0, 2)).toUpperCase();
}

// La imagen se carga después (data-src) para no pedir mil logos al abrir la app.
function lazyImage(src, holder) {
  const img = h('img', { 'data-src': src, alt: '' });
  img.onerror = () => holder.classList.remove('has-img');
  img.onload = () => holder.classList.add('img-ready');
  return img;
}

function qualityBadge(q) {
  const n = parseInt(q, 10) || 0;
  if (n >= 2160) return '4K';
  if (n >= 1080) return 'FHD';
  if (n >= 720) return 'HD';
  return '';
}

export function liveCard(ch) {
  const tile = h('div', { class: 'tile' + (ch.logo ? ' has-img' : ''), style: 'background-color:' + tintFor(ch.key) }, [
    h('span', { class: 'initials', text: initials(ch.name) })
  ]);
  if (ch.logo) tile.appendChild(lazyImage(ch.logo, tile));
  const badge = qualityBadge(ch.quality);
  if (badge) tile.appendChild(h('span', { class: 'badge', text: badge }));
  tile.appendChild(h('span', { class: 'live-dot', text: 'EN VIVO' }));
  if (isFavorite(ch.key)) tile.appendChild(icon('star', 'fav-mark'));
  const np = nowNext(ch);
  const card = h('div', { class: 'card live focusable', 'data-key': ch.key }, [
    tile,
    h('div', { class: 'card-name', text: ch.name }),
    np ? h('div', { class: 'card-meta now', text: 'Ahora: ' + np.now.title }) : null
  ]);
  card._item = ch;
  return card;
}

export function movieCard(movie) {
  const poster = h('div', { class: 'poster has-img', style: 'background-color:' + tintFor(movie.key) }, [
    h('span', { class: 'poster-title', text: movie.name })
  ]);
  poster.appendChild(lazyImage(movie.poster, poster));
  if (isFavorite(movie.key)) poster.appendChild(icon('star', 'fav-mark'));
  const p = getProgress(movie.key);
  if (p) poster.appendChild(h('div', { class: 'progress' }, h('div', { class: 'progress-fill', style: 'width:' + Math.round(100 * p.t / p.d) + '%' })));
  const meta = movie.type === 'series' ? (movie.seasons ? movie.seasons + (movie.seasons === 1 ? ' temporada' : ' temporadas') : 'Serie')
    : movie.type === 'episode' ? 'T' + movie.season + ':E' + movie.number + ' · ' + movie.title
    : [movie.year, movie.subs ? 'Subtitulada' : ''].filter(Boolean).join(' · ');
  const card = h('div', { class: 'card movie focusable', 'data-key': movie.key }, [
    poster,
    h('div', { class: 'card-name', text: movie.type === 'episode' ? movie.seriesName : movie.name }),
    h('div', { class: 'card-meta', text: meta })
  ]);
  card._item = movie;
  return card;
}

export function itemCard(item) {
  return item.type === 'movie' || item.type === 'series' || item.type === 'episode' ? movieCard(item) : liveCard(item);
}

export function moreCard(count, kind) {
  const card = h('div', { class: 'card more focusable ' + kind }, [
    h('div', { class: kind === 'movie' ? 'poster' : 'tile' }, [icon('plus', 'more-icon'), h('span', { class: 'more-text', text: 'Ver los ' + count })])
  ]);
  return card;
}

export function loadVisibleImages(scope) {
  const imgs = scope.querySelectorAll('img[data-src]');
  const W = window.innerWidth;
  const H = window.innerHeight;
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const r = img.getBoundingClientRect();
    if (r.right > -W * 0.25 && r.left < W * 1.6 && r.bottom > -H * 0.25 && r.top < H * 1.6) {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    }
  }
}
