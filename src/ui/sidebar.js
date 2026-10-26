// Menú lateral: compacto con iconos; se expande con etiquetas cuando recibe el foco (como Netflix en TV).
import { h } from './dom.js';
import { icon } from './icons.js';

export const NAV = [
  ['search', 'search', 'Buscar'],
  ['home', 'home', 'Inicio'],
  ['rd', 'flag', 'República Dominicana'],
  ['live', 'live', 'TV en vivo'],
  ['movies', 'movie', 'Películas'],
  ['anime', 'anime', 'Anime'],
  ['mylist', 'star', 'Mi lista'],
  ['settings', 'gear', 'Ajustes']
];

export function createSidebar(onSelect) {
  const items = {};
  const nav = h('nav', { class: 'sidebar' }, [h('div', { class: 'brand' }, [h('span', { class: 'brand-mark', text: 'T' }), h('span', { class: 'brand-name', text: 'TeleLibre' })])]);
  NAV.forEach(n => {
    const item = h('div', { class: 'nav-item focusable', 'data-nav': n[0] }, [icon(n[1]), h('span', { class: 'nav-label', text: n[2] })]);
    item._onEnter = () => onSelect(n[0]);
    items[n[0]] = item;
    nav.appendChild(item);
  });
  return {
    el: nav,
    item: id => items[id],
    setActive(id) {
      for (const k in items) items[k].classList.toggle('active', k === id);
    },
    activeItem() {
      for (const k in items) if (items[k].classList.contains('active')) return items[k];
      return items.home;
    },
    expand(on) {
      nav.classList.toggle('expanded', on);
    }
  };
}
