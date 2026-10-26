// Diagnóstico: guarda los últimos errores de la app (también los de promesas) para verlos en
// Ajustes → Diagnóstico. En Android TV además salen en `adb logcat` (etiqueta "chromium").
import { load, save } from './store.js';

const MAX = 15;
let errors = load('diag', []);

function push(message, where) {
  const text = String(message || 'error desconocido').slice(0, 200);
  // El mismo error repetido (por ejemplo, en cada tecla) cuenta una vez.
  if (errors[0] && errors[0].m === text) { errors[0].n = (errors[0].n || 1) + 1; errors[0].at = Date.now(); }
  else errors.unshift({ m: text, w: where || '', at: Date.now(), n: 1 });
  errors = errors.slice(0, MAX);
  save('diag', errors);
}

export function installErrorCapture() {
  window.addEventListener('error', e => {
    // Imágenes o streams que no cargan no son errores de la app.
    if (e.target && e.target !== window) return;
    push(e.message, (e.filename || '').split('/').pop() + ':' + (e.lineno || 0));
  }, true);
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason;
    push(r && r.message ? r.message : String(r), 'promesa');
  });
}

export function recordError(message, where) {
  push(message, where);
}

export function recentErrors() {
  return errors.slice();
}

export function clearErrors() {
  errors = [];
  save('diag', errors);
}
