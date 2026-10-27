// PIN de 4 dígitos con el control (modo infantil). Modos:
// - 'set': pide el PIN dos veces y lo guarda (activa el modo infantil).
// - 'unlock': pide el PIN guardado para salir del modo infantil.
import { h, clear } from './dom.js';
import { focus } from './focus.js';
import { state, saveSettings } from '../store.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
const LABELS = { del: 'Borrar', ok: 'Listo' };

export function createPinScreen(app) {
  const title = h('h1', { class: 'screen-title' });
  const hint = h('p', { class: 'hint' });
  const dots = h('div', { class: 'pin-dots' });
  const pad = h('div', { class: 'pin-pad' });
  const el = h('section', { class: 'screen pin-screen' }, [title, hint, dots, pad]);

  // 'set': crea PIN y activa el modo infantil · 'set-only': solo crea el PIN (perfil infantil nuevo)
  // 'unlock': pide el PIN; si hay onSuccess lo llama (salir de un perfil infantil), si no apaga el modo infantil.
  let mode = 'set';
  let onSuccess = null;
  let value = '';
  let first = '';

  function paint() {
    clear(dots);
    for (let i = 0; i < 4; i++) dots.appendChild(h('span', { class: 'pin-dot' + (i < value.length ? ' on' : '') }));
  }

  function fail(msg) {
    value = '';
    paint();
    app.toast(msg);
  }

  function submit() {
    if (value.length < 4) { app.toast('El PIN tiene 4 números'); return; }
    if (mode === 'unlock') {
      if (!state.settings.kids || value !== state.settings.kids.pin) { fail('PIN incorrecto'); return; }
      if (onSuccess) { const cb = onSuccess; onSuccess = null; cb(); return; }
      state.settings.kids.on = false;
      saveSettings();
      app.toast('Modo infantil desactivado');
      app.onKidsChanged();
      return;
    }
    if (!first) {
      first = value;
      value = '';
      title.textContent = 'Repite el PIN';
      paint();
      return;
    }
    if (value !== first) { first = ''; title.textContent = 'Crea un PIN de 4 números'; fail('No coinciden, empieza de nuevo'); return; }
    if (mode === 'set-only') {
      state.settings.kids = { on: !!(state.settings.kids && state.settings.kids.on), pin: value };
      saveSettings();
      app.toast('PIN guardado: se pedirá para salir del perfil infantil');
      app.pop();
      return;
    }
    state.settings.kids = { on: true, pin: value };
    saveSettings();
    app.toast('Modo infantil activado');
    app.onKidsChanged();
  }

  function press(k) {
    if (k === 'del') value = value.slice(0, -1);
    else if (k === 'ok') { submit(); return; }
    else if (value.length < 4) value += k;
    paint();
    if (value.length === 4) submit();
  }

  KEYS.forEach((k, i) => {
    if (i % 3 === 0) pad.appendChild(h('div', { class: 'kb-row' }));
    const key = h('div', { class: 'key focusable' + (k.length > 1 ? ' wide' : ''), text: LABELS[k] || k });
    key._onEnter = () => press(k);
    pad.lastChild.appendChild(key);
  });

  return {
    name: 'pin',
    el,
    lastFocus: null,
    mount(params) {
      mode = params.mode || 'set';
      onSuccess = params.onSuccess || null;
      value = '';
      first = '';
      title.textContent = mode === 'unlock' ? (onSuccess ? 'PIN para cambiar de perfil' : 'PIN para salir del modo infantil') : 'Crea un PIN de 4 números';
      hint.textContent = mode === 'unlock'
        ? 'Escribe el PIN con los números del control o con las teclas de la pantalla.'
        : 'Con el modo infantil solo se ven canales y películas para niños. Para salir se pide este PIN.';
      paint();
    },
    firstFocus() {
      return pad.querySelector('.focusable');
    },
    // Números del control remoto o del teclado.
    onRawKey(e) {
      const d = e.keyCode >= 48 && e.keyCode <= 57 ? String(e.keyCode - 48) : e.keyCode >= 96 && e.keyCode <= 105 ? String(e.keyCode - 96) : null;
      if (d === null) return false;
      press(d);
      return true;
    },
    afterShow() {
      focus(pad.querySelector('.focusable'));
    }
  };
}
