// Cuadrícula completa de una fila ("Ver todos") o de Mi lista. Pinta por páginas para no trabar la TV.
import { h, clear } from './dom.js';
import { itemCard, loadVisibleImages } from './card.js';
import { focus } from './focus.js';

const PAGE = 48;

export function createGridScreen(app) {
  const title = h('h1', { class: 'screen-title' });
  const count = h('span', { class: 'screen-count' });
  const grid = h('div', { class: 'grid' });
  const scroller = h('div', { class: 'grid-scroll', 'data-scroll': 'y', 'data-scroll-pad': '40' }, grid);
  const empty = h('div', { class: 'empty' });
  const el = h('section', { class: 'screen grid-screen' }, [h('div', { class: 'screen-head' }, [title, count]), scroller, empty]);

  let items = [];
  let rendered = 0;
  let loadPage = null;
  let page = 1;
  let totalPages = 1;
  let loading = false;
  let requestId = 0;

  function pageCard(label, target) {
    const card = h('div', { class: 'card more focusable movie' }, [
      h('div', { class: 'poster' }, h('span', { class: 'more-text', text: label }))
    ]);
    card._onEnter = () => showPage(target);
    grid.appendChild(card);
  }

  function renderMore() {
    const end = Math.min(items.length, rendered + PAGE);
    for (let i = rendered; i < end; i++) {
      const item = items[i];
      const card = itemCard(item);
      const index = i;
      card._index = i;
      card._onEnter = () => app.open(item, items, index);
      grid.appendChild(card);
    }
    rendered = end;
    if (loadPage && rendered === items.length && page < totalPages) pageCard('Siguiente ▶', page + 1);
  }

  function showPage(next) {
    if (!loadPage || loading || next < 1 || next > totalPages) return;
    loading = true;
    const id = ++requestId;
    count.textContent = 'Cargando página ' + next + '…';
    loadPage(next).then(result => {
      if (id !== requestId) return;
      loading = false;
      page = result.page;
      totalPages = result.totalPages;
      items = result.items;
      count.textContent = 'Página ' + page + ' de ' + totalPages + ' · ' + items.length + ' títulos';
      clear(grid);
      rendered = 0;
      scroller.scrollTop = 0;
      if (page > 1) pageCard('◀ Anterior', page - 1);
      renderMore();
      empty.textContent = 'No hay títulos en esta página.';
      el.classList.toggle('is-empty', !items.length);
      screen.lastFocus = grid.querySelector('.card.movie:not(.more)') || grid.querySelector('.focusable');
      if (el.classList.contains('active') && screen.lastFocus) focus(screen.lastFocus);
      loadVisibleImages(el);
    }).catch(() => {
      if (id !== requestId) return;
      loading = false;
      count.textContent = items.length ? 'Página ' + page + ' de ' + totalPages : '';
      if (!items.length) {
        empty.textContent = 'No se pudo cargar el catálogo. Pulsa OK para reintentar.';
        el.classList.add('is-empty');
        clear(grid);
        pageCard('Reintentar', next);
        if (el.classList.contains('active')) focus(grid.firstChild);
      } else {
        app.toast('No se pudo cargar la página. Intenta de nuevo.');
      }
    });
  }

  const screen = {
    name: 'grid',
    el,
    lastFocus: null,
    mount(params) {
      requestId++;
      loading = false;
      loadPage = params.loadPage || null;
      page = 1;
      totalPages = loadPage ? 10000 : 1;
      items = params.items || [];
      title.textContent = params.title || '';
      count.textContent = loadPage ? '' : items.length ? items.length + (items.length === 1 ? ' título' : ' títulos') : '';
      empty.textContent = loadPage ? 'Cargando catálogo…' : params.emptyText || 'No hay nada aquí todavía.';
      el.classList.toggle('is-empty', !items.length);
      clear(grid);
      rendered = 0;
      screen.lastFocus = null;
      if (loadPage) showPage(1);
      else renderMore();
    },
    firstFocus() {
      return grid.querySelector('.focusable');
    },
    onFocus(card) {
      if (card._index >= rendered - 12 && rendered < items.length) renderMore();
      loadVisibleImages(el);
    },
    afterShow() {
      loadVisibleImages(el);
    }
  };
  return screen;
}
