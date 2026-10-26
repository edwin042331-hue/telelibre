// Teclado en pantalla para escribir con el control remoto.
import { h } from './dom.js';

export const LAYOUTS = {
  search: { cols: 7, keys: 'abcdefghijklmnñopqrstuvwxyz0123456789'.split('').concat(['space', 'del', 'clear']) },
  url: { cols: 10, keys: 'abcdefghijklmnopqrstuvwxyz0123456789'.split('').concat([':', '/', '.', '-', '_', '?', '=', '&', '%', '~', 'https://', '.m3u', 'del', 'clear']) }
};

const LABELS = { space: 'Espacio', del: 'Borrar', clear: 'Limpiar' };

// onInput(textoNuevo). Devuelve { el, getValue, setValue, type(char), backspace() }.
export function createKeyboard(layoutName, onInput) {
  const layout = LAYOUTS[layoutName];
  let value = '';
  const el = h('div', { class: 'keyboard kb-' + layoutName });

  function set(v) {
    value = v;
    onInput(value);
  }

  let row = null;
  layout.keys.forEach((k, i) => {
    if (i % layout.cols === 0) { row = h('div', { class: 'kb-row' }); el.appendChild(row); }
    const wide = k.length > 1;
    const key = h('div', { class: 'key focusable' + (wide ? ' wide' : ''), text: LABELS[k] || k });
    key._onEnter = () => {
      if (k === 'del') set(value.slice(0, -1));
      else if (k === 'clear') set('');
      else if (k === 'space') set(value + ' ');
      else set(value + k);
    };
    row.appendChild(key);
  });

  return {
    el,
    getValue: () => value,
    setValue: v => { value = v; },
    type: ch => set(value + ch),
    backspace: () => set(value.slice(0, -1))
  };
}

// Teclado físico (PC, o teclado USB/Bluetooth en la TV). Devuelve true si la tecla se usó.
export function handlePhysicalKey(e, kb) {
  if (e.keyCode === 8) { kb.backspace(); return true; }
  if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { kb.type(e.key.toLowerCase()); return true; }
  return false;
}
