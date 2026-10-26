// Cuadrícula completa de una fila ("Ver todos") o de Mi lista. Pinta por páginas para no trabar la TV.
import { h, clear } from './dom.js';
import { itemCard, loadVisibleImages } from './card.js';

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
  }

  const screen = {
    name: 'grid',
    el,
    lastFocus: null,
    mount(params) {
      items = params.items || [];
      title.textContent = params.title || '';
      count.textContent = items.length ? items.length + (items.length === 1 ? ' título' : ' títulos') : '';
      empty.textContent = params.emptyText || 'No hay nada aquí todavía.';
      el.classList.toggle('is-empty', !items.length);
      clear(grid);
      rendered = 0;
      screen.lastFocus = null;
      renderMore();
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
