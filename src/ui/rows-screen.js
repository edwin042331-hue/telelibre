// Pantalla de filas horizontales con panel superior (Inicio, TV en vivo, Películas).
import { h, clear, closest, toArray } from './dom.js';
import { focus } from './focus.js';
import { itemCard, moreCard, loadVisibleImages } from './card.js';
import { itemTags, formatTime } from './format.js';
import { getProgress } from '../store.js';

const ROW_LIMIT = 30;

export function createRowsScreen(app, name, getRows, emptyText) {
  const heroBg = h('div', { class: 'hero-bg' });
  const heroArt = h('img', { class: 'hero-art', alt: '' });
  const heroKicker = h('div', { class: 'hero-kicker' });
  const heroTitle = h('h1', { class: 'hero-title' });
  const heroTags = h('div', { class: 'tags' });
  const heroHint = h('div', { class: 'hero-hint' });
  const hero = h('div', { class: 'hero' }, [heroBg, heroArt, h('div', { class: 'hero-shade' }), h('div', { class: 'hero-text' }, [heroKicker, heroTitle, heroTags, heroHint])]);
  const rowsEl = h('div', { class: 'rows', 'data-scroll': 'y', 'data-scroll-pad': '0' });
  const empty = h('div', { class: 'empty', text: emptyText || '' });
  const el = h('section', { class: 'screen rows-screen' }, [hero, rowsEl, empty]);

  let heroTimer = null;
  let heroKey = null;

  function setHero(item, row) {
    if (!item || item.key === heroKey) return;
    heroKey = item.key;
    const isMovie = item.type === 'movie';
    const art = isMovie ? (item.art || item.poster) : item.logo;
    el.classList.toggle('hero-movie', isMovie);
    heroBg.style.backgroundImage = art ? 'url("' + art.replace(/"/g, '%22') + '")' : 'none';
    if (art) { heroArt.src = art; heroArt.style.display = ''; } else { heroArt.removeAttribute('src'); heroArt.style.display = 'none'; }
    heroKicker.textContent = isMovie ? 'PELÍCULA' + (row ? ' · ' + row.title.toUpperCase() : '') : '● EN VIVO' + (row ? ' · ' + row.title.toUpperCase() : '');
    heroKicker.className = 'hero-kicker' + (isMovie ? '' : ' live');
    heroTitle.textContent = item.name;
    clear(heroTags);
    itemTags(item).forEach(t => heroTags.appendChild(h('span', { class: 'tag', text: t })));
    const p = isMovie && getProgress(item.key);
    heroHint.textContent = isMovie
      ? (p ? 'Te quedaste en ' + formatTime(p.t) + ' de ' + formatTime(p.d) + ' · OK para continuar' : 'OK para ver detalles')
      : 'OK para ver · ● Rojo para Mi lista';
  }

  function renderRow(row) {
    const track = h('div', { class: 'track', 'data-scroll': 'x', 'data-scroll-pad': '60' });
    row.items.slice(0, ROW_LIMIT).forEach((item, i) => {
      const card = itemCard(item);
      card._row = row;
      card._index = i;
      card._onEnter = () => app.open(item, row.items, i);
      track.appendChild(card);
    });
    if (row.items.length > ROW_LIMIT) {
      const more = moreCard(row.items.length, row.items[0].type === 'movie' ? 'movie' : 'live');
      more._onEnter = () => app.openGrid(row.title, row.items);
      track.appendChild(more);
    }
    return h('div', { class: 'row', 'data-anchor': '', 'data-row': row.id }, [
      h('h2', { class: 'row-title' }, [row.title, h('span', { class: 'row-count', text: String(row.items.length) })]),
      track
    ]);
  }

  // Vuelve a pintar conservando la fila y el elemento enfocados (por ejemplo, tras salir del reproductor).
  function render() {
    const prev = screen.lastFocus;
    const prevRow = prev && prev._row ? prev._row.id : null;
    const prevKey = prev && prev._item ? prev._item.key : null;
    const rows = getRows();
    clear(rowsEl);
    rows.forEach(r => rowsEl.appendChild(renderRow(r)));
    el.classList.toggle('is-empty', !rows.length);
    screen.lastFocus = null;
    if (prevRow) {
      const rowEl = rowsEl.querySelector('[data-row="' + prevRow + '"]');
      const cards = rowEl ? toArray(rowEl.querySelectorAll('.focusable')) : [];
      screen.lastFocus = cards.filter(c => c._item && c._item.key === prevKey)[0] || cards[0] || null;
    }
    heroKey = null;
    const first = rows[0] && rows[0].items[0];
    setHero(screen.lastFocus && screen.lastFocus._item ? screen.lastFocus._item : first, rows[0]);
  }

  const screen = {
    name,
    el,
    lastFocus: null,
    dirty: true,
    mount() {
      if (screen.dirty) { render(); screen.dirty = false; }
    },
    firstFocus() {
      return rowsEl.querySelector('.focusable');
    },
    // Arriba/abajo salta de fila recordando la última tarjeta de cada fila; izquierda/derecha se queda en la fila.
    candidates(current, dir) {
      const rowEl = closest(current, '.row');
      if (!rowEl) return null;
      if (dir === 'left' || dir === 'right') return toArray(rowEl.querySelectorAll('.focusable'));
      const target = dir === 'down' ? rowEl.nextSibling : rowEl.previousSibling;
      if (!target) return [];
      if (target._last && target.contains(target._last)) return [target._last];
      return toArray(target.querySelectorAll('.focusable'));
    },
    onFocus(elFocused) {
      const rowEl = closest(elFocused, '.row');
      if (rowEl) rowEl._last = elFocused;
      loadVisibleImages(el);
      if (!elFocused._item) return;
      clearTimeout(heroTimer);
      // Pequeña espera: al recorrer rápido con el control no se repinta el panel en cada paso.
      heroTimer = setTimeout(() => setHero(elFocused._item, elFocused._row), 140);
    },
    afterShow() {
      loadVisibleImages(el);
    },
    focusKey(key) {
      const card = toArray(rowsEl.querySelectorAll('.focusable')).filter(c => c._item && c._item.key === key)[0];
      if (card) focus(card);
    }
  };
  return screen;
}
