// Menú emergente (diálogo) que funciona con cualquier control: se abre manteniendo OK (o con la tecla Menú)
// y también se usa para avisos con botones (recordatorios). Va por encima de todo, incluso del reproductor.
import { h, clear } from './dom.js';
import { icon } from './icons.js';

export function createMenu() {
  const title = h('div', { class: 'menu-title' });
  const subtitle = h('div', { class: 'menu-subtitle' });
  const list = h('div', { class: 'menu-list' });
  const box = h('div', { class: 'menu-box' }, [title, subtitle, list]);
  const ui = h('div', { class: 'menu-ui' }, box);
  const el = h('div', { class: 'menu-layer' }, ui);

  let items = [];
  let index = 0;
  let onClose = null;
  let timer = null;

  function paint() {
    for (let i = 0; i < list.childNodes.length; i++) list.childNodes[i].classList.toggle('focused', i === index);
  }

  function close() {
    clearTimeout(timer);
    el.classList.remove('open');
    const cb = onClose;
    onClose = null;
    if (cb) cb();
  }

  const menu = {
    el,
    ui,
    isOpen: () => el.classList.contains('open'),
    // opts: { title, subtitle, items: [{ label, icon, action }], onClose, timeout (ms, se cierra solo) }
    open(opts) {
      clearTimeout(timer);
      items = opts.items.filter(Boolean);
      index = 0;
      onClose = opts.onClose || null;
      title.textContent = opts.title || '';
      subtitle.textContent = opts.subtitle || '';
      subtitle.style.display = opts.subtitle ? '' : 'none';
      clear(list);
      items.forEach(it => list.appendChild(h('div', { class: 'menu-item' }, [it.icon ? icon(it.icon) : null, h('span', { text: it.label })])));
      paint();
      el.classList.add('open');
      if (opts.timeout) timer = setTimeout(close, opts.timeout);
    },
    close,
    // Devuelve true siempre: mientras el menú está abierto, se queda con todas las teclas.
    onAction(action) {
      if (action === 'up') { index = (index - 1 + items.length) % items.length; paint(); }
      else if (action === 'down') { index = (index + 1) % items.length; paint(); }
      else if (action === 'enter') { const it = items[index]; close(); if (it && it.action) it.action(); }
      else if (action === 'back' || action === 'left' || action === 'menu') close();
      return true;
    }
  };
  return menu;
}
