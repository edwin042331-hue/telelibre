// Búsqueda: canales y películas ya cargados al instante, y luego todo Internet Archive.
import { h, clear, closest } from './dom.js';
import { focus } from './focus.js';
import { createKeyboard, handlePhysicalKey } from './keyboard.js';
import { itemCard, loadVisibleImages } from './card.js';
import { searchChannels, normalizeText } from '../catalog.js';
import { searchArchive } from '../vod.js';

export function createSearchScreen(app) {
  const query = h('div', { class: 'search-query' });
  const status = h('div', { class: 'search-status', text: 'Escribe el nombre de un canal o película' });
  const results = h('div', { class: 'grid results' });
  const resultsScroll = h('div', { class: 'grid-scroll', 'data-scroll': 'y', 'data-scroll-pad': '20' }, results);
  let timer = null;
  let remoteTimer = null;
  let token = 0;

  const kb = createKeyboard('search', value => {
    query.textContent = value || ' ';
    query.classList.toggle('placeholder', !value);
    clearTimeout(timer);
    timer = setTimeout(() => run(value), 220);
  });

  const el = h('section', { class: 'screen search-screen' }, [
    h('div', { class: 'search-left' }, [h('h1', { class: 'screen-title', text: 'Buscar' }), query, kb.el]),
    h('div', { class: 'search-right' }, [status, resultsScroll])
  ]);

  function show(items) {
    clear(results);
    items.forEach((item, i) => {
      const card = itemCard(item);
      card._onEnter = () => app.open(item, items, i);
      results.appendChild(card);
    });
    loadVisibleImages(el);
  }

  function searchMovies(q) {
    const tokens = normalizeText(q).split(/\s+/).filter(Boolean);
    return (app.data.visibleMovies || app.data.movies).filter(m => {
      const name = normalizeText(m.name);
      return tokens.every(t => name.indexOf(t) >= 0);
    }).slice(0, 30);
  }

  function searchSeries(q) {
    const tokens = normalizeText(q).split(/\s+/).filter(Boolean);
    return (app.data.seriesAll || []).filter(s => {
      const name = normalizeText(s.name);
      return tokens.every(t => name.indexOf(t) >= 0);
    }).slice(0, 20);
  }

  function run(q) {
    const my = ++token;
    clearTimeout(remoteTimer);
    if (!q.trim()) { show([]); status.textContent = 'Escribe el nombre de un canal o película'; return; }
    const local = searchMovies(q).concat(searchSeries(q), searchChannels(app.data.channels, q, 40));
    show(local);
    status.textContent = local.length ? local.length + ' resultados' : 'Buscando en Internet Archive…';
    if (app.kidsOn()) return;
    remoteTimer = setTimeout(() => {
      searchArchive(q).then(found => {
        if (my !== token) return;
        const seen = {};
        local.forEach(i => { seen[i.key] = true; });
        const extra = found.filter(m => !seen[m.key]);
        if (!extra.length) { if (!local.length) status.textContent = 'Sin resultados para "' + q + '"'; return; }
        const all = local.concat(extra);
        // Si el usuario está navegando los resultados no se le mueve el foco: solo se agregan al final.
        extra.forEach((item, j) => {
          const card = itemCard(item);
          card._onEnter = () => app.open(item, all, local.length + j);
          results.appendChild(card);
        });
        status.textContent = all.length + ' resultados (incluye Internet Archive)';
        loadVisibleImages(el);
      }, () => {
        if (my === token && !local.length) status.textContent = 'Sin resultados (Internet Archive no respondió)';
      });
    }, 600);
  }

  const screen = {
    name: 'search',
    el,
    lastFocus: null,
    mount() {
      query.textContent = kb.getValue() || ' ';
      query.classList.toggle('placeholder', !kb.getValue());
    },
    firstFocus() {
      return kb.el.querySelector('.focusable');
    },
    onRawKey(e) {
      return handlePhysicalKey(e, kb);
    },
    // Si no hay nada a la derecha alineado, saltar igual a los resultados (y volver al teclado desde ellos).
    onEdge(dir, current) {
      if (dir === 'right' && closest(current, '.keyboard') && results.firstChild) { focus(results.firstChild); return true; }
      if (dir === 'left' && closest(current, '.results')) { focus(kb.el.querySelector('.focusable')); return true; }
      return false;
    },
    onFocus() {
      loadVisibleImages(el);
    }
  };
  return screen;
}
