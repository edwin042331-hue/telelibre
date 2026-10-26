// Navegación espacial para control remoto: decide a qué elemento .focusable ir según la flecha.
// Usa centros de los rectángulos, así el zoom del elemento enfocado no altera la decisión.
import { toArray, closest } from './dom.js';

let current = null;
const listeners = [];

export function getFocused() {
  return current;
}

export function onFocusChange(fn) {
  listeners.push(fn);
}

// opts.noScroll: al pasar el puntero (Magic Remote de LG) no se desplaza la fila bajo el cursor.
export function focus(el, opts) {
  if (!el) return false;
  if (current && current !== el) current.classList.remove('focused');
  current = el;
  el.classList.add('focused');
  if (!(opts && opts.noScroll)) ensureVisible(el);
  for (let i = 0; i < listeners.length; i++) listeners[i](el);
  return true;
}

export function focusables(scope) {
  return toArray(scope.querySelectorAll('.focusable')).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
}

function center(r) {
  return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
}

export function findNext(from, dir, candidates) {
  const r = from.getBoundingClientRect();
  const c = center(r);
  const horizontal = dir === 'left' || dir === 'right';
  const forward = dir === 'right' || dir === 'down';
  const scored = [];

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const bc = center(b);
    if (horizontal) {
      // Izquierda/derecha solo se mueve dentro de la misma "línea" visual.
      if (b.bottom <= r.top + 1 || b.top >= r.bottom - 1) continue;
      const d = forward ? bc.x - c.x : c.x - bc.x;
      if (d <= 1) continue;
      scored.push({ el, p: d + 2 * Math.abs(bc.y - c.y), s: 0 });
    } else {
      const d = forward ? bc.y - c.y : c.y - bc.y;
      if (d <= 1) continue;
      scored.push({ el, p: d, s: Math.abs(bc.x - c.x) });
    }
  }
  if (!scored.length) return null;

  // Arriba/abajo: primero la fila más cercana, y dentro de ella el elemento más alineado.
  let minP = Infinity;
  scored.forEach(x => { if (x.p < minP) minP = x.p; });
  const band = horizontal ? 0 : Math.max(12, r.height * 0.3);
  let best = null;
  scored.forEach(x => {
    if (x.p > minP + band) return;
    if (!best || x.s < best.s || (x.s === best.s && x.p < best.p)) best = x;
  });
  return best.el;
}

export function move(dir, scope, candidates) {
  if (!current) return false;
  const next = findNext(current, dir, candidates || focusables(scope));
  return next ? focus(next) : false;
}

// data-scroll="x": fila horizontal (el elemento queda al inicio, estilo Netflix).
// data-scroll="y": columna vertical; si hay un ancestro [data-anchor] (una fila), se alinea esa fila.
export function ensureVisible(el) {
  let node = el.parentNode;
  while (node && node.nodeType === 1) {
    const mode = node.getAttribute('data-scroll');
    if (mode === 'x') {
      const pad = parseInt(node.getAttribute('data-scroll-pad') || '0', 10);
      node.scrollLeft = Math.max(0, el.offsetLeft - pad);
    } else if (mode === 'y') {
      const pad = parseInt(node.getAttribute('data-scroll-pad') || '0', 10);
      const anchor = closest(el, '[data-anchor]');
      const target = anchor && node.contains(anchor) && anchor !== node ? anchor : el;
      node.scrollTop = Math.max(0, target.offsetTop - pad);
    }
    node = node.parentNode;
  }
}
