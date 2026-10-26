// Ajustes: fuentes activas, filtros, listas propias y mantenimiento.
import { h, clear } from './dom.js';
import { focus } from './focus.js';
import { createKeyboard, handlePhysicalKey } from './keyboard.js';
import { state, saveSettings, clearRecents } from '../store.js';
import { BUILTIN_SOURCES, isSourceOn } from '../sources.js';
import { VOD_SOURCES, isVodSourceOn } from '../vod.js';
import { platformLabel } from '../platform.js';

function item(label, value, onEnter, extraClass) {
  const valueEl = h('span', { class: 'setting-value', text: value });
  const row = h('div', { class: 'setting focusable' + (extraClass ? ' ' + extraClass : '') }, [h('span', { class: 'setting-label', text: label }), valueEl]);
  row._onEnter = onEnter;
  return row;
}

export function createSettingsScreen(app) {
  const list = h('div', { class: 'settings-list' });
  const scroller = h('div', { class: 'settings-scroll', 'data-scroll': 'y', 'data-scroll-pad': '200' }, list);
  const el = h('section', { class: 'screen settings-screen' }, [h('h1', { class: 'screen-title', text: 'Ajustes' }), scroller]);

  function onOff(v) {
    return v ? 'Activado' : 'Desactivado';
  }

  function section(title) {
    list.appendChild(h('h2', { class: 'settings-section', text: title }));
  }

  function render(focusIndex) {
    clear(list);
    const s = state.settings;
    const stats = app.data.stats;

    section('Fuentes de TV en vivo (comunidad GitHub)');
    BUILTIN_SOURCES.forEach(src => {
      const on = isSourceOn(src, s);
      const n = stats[src.id];
      list.appendChild(item(src.name, onOff(on) + (on && n != null ? ' · ' + n + ' canales' : ''), () => {
        s.sources[src.id] = !on;
        saveSettings();
        app.reload(false);
      }));
    });
    s.custom.forEach(c => {
      const n = stats[c.id];
      list.appendChild(item('Mi lista · ' + c.name, onOff(c.enabled) + (c.enabled && n != null ? ' · ' + n + ' canales' : '') + ' (OK: activar · Rojo: quitar)', () => {
        c.enabled = !c.enabled;
        saveSettings();
        app.reload(false);
      }, 'custom-source')).__custom = c;
    });
    list.appendChild(item('Agregar lista M3U propia', 'Pega o escribe la URL', () => app.push('addlist')));

    section('Películas');
    VOD_SOURCES.forEach(src => {
      const on = isVodSourceOn(src, s);
      const n = stats[src.id];
      list.appendChild(item(src.name, onOff(on) + (on && n != null ? ' · ' + n + ' películas' : ''), () => {
        s.sources[src.id] = !on;
        saveSettings();
        app.reload(false);
      }));
    });

    section('Idioma del contenido');
    list.appendChild(item('Contenido en inglés (Pluto USA, Samsung TV Plus, Roku, películas)', onOff(s.english !== false), () => {
      s.english = s.english === false;
      saveSettings();
      app.reload(false);
    }));

    section('Filtros');
    list.appendChild(item('Ocultar canales geo-bloqueados', onOff(s.hideGeo), () => { s.hideGeo = !s.hideGeo; saveSettings(); app.rebuild(); }));
    list.appendChild(item('Ocultar canales que no transmiten 24/7', onOff(s.hideNot247), () => { s.hideNot247 = !s.hideNot247; saveSettings(); app.rebuild(); }));

    section('Mantenimiento');
    list.appendChild(item('Actualizar canales y películas ahora', 'Descarga las listas de nuevo', () => app.reload(true)));
    list.appendChild(item('Borrar canales recientes', state.recents.length + ' guardados', () => { clearRecents(); app.rebuild(); app.toast('Recientes borrados'); }));

    section('Acerca de');
    list.appendChild(h('p', { class: 'about', text:
      'TeleLibre ' + __APP_VERSION__ + ' · ' + platformLabel + '. No aloja ningún contenido: reproduce listas públicas de iptv-org, Free-TV ' +
      'y películas de dominio público de Internet Archive. Si un canal no carga, suele ser que la emisora lo cambió o lo restringe por país.' +
      (app.data.httpsHidden ? ' En la versión web se ocultan ' + app.data.httpsHidden + ' canales http que el navegador bloquea; en la app de la TV sí aparecen.' : '')
    }));

    const focusables = list.querySelectorAll('.focusable');
    if (focusIndex != null && focusables.length) focus(focusables[Math.min(focusIndex, focusables.length - 1)]);
  }

  const screen = {
    name: 'settings',
    el,
    lastFocus: null,
    mount() { render(); },
    refresh() {
      const all = list.querySelectorAll('.focusable');
      let idx = null;
      for (let i = 0; i < all.length; i++) if (all[i].classList.contains('focused')) idx = i;
      render(idx);
    },
    firstFocus() { return list.querySelector('.focusable'); },
    onAction(action, current) {
      if (action === 'red' && current && current.__custom) {
        state.settings.custom = state.settings.custom.filter(c => c !== current.__custom);
        saveSettings();
        app.toast('Lista eliminada');
        app.reload(false);
        return true;
      }
      return false;
    }
  };
  return screen;
}

export function createAddListScreen(app) {
  const value = h('div', { class: 'search-query url-value' });
  const kb = createKeyboard('url', v => { value.textContent = v || ' '; });
  const save = h('div', { class: 'btn primary focusable' }, h('span', { text: 'Guardar lista' }));
  const el = h('section', { class: 'screen addlist-screen' }, [
    h('h1', { class: 'screen-title', text: 'Agregar lista M3U' }),
    h('p', { class: 'hint', text: 'Escribe la dirección de una lista M3U pública (por ejemplo, de iptv-org para otro país). Con teclado físico puedes escribir directo.' }),
    value, kb.el, h('div', { class: 'actions' }, save)
  ]);

  save._onEnter = () => {
    const url = kb.getValue().trim();
    if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(url)) { app.toast('Esa dirección no parece válida'); return; }
    let name = url.replace(/^https?:\/\//i, '').split('/')[0];
    const file = url.split('/').pop();
    if (file) name += ' · ' + file;
    state.settings.custom.push({ id: 'custom-' + Date.now(), name, url, enabled: true });
    saveSettings();
    kb.setValue('');
    value.textContent = ' ';
    app.toast('Lista agregada, cargando canales…');
    app.pop();
    app.reload(false);
  };

  return {
    name: 'addlist',
    el,
    lastFocus: null,
    mount() { kb.setValue('https://'); value.textContent = 'https://'; },
    firstFocus() { return kb.el.querySelector('.focusable'); },
    onRawKey(e) {
      return handlePhysicalKey(e, kb);
    },
    // Ctrl+V en la PC (o pegar desde un teclado conectado a la TV).
    onPaste(text) {
      kb.setValue(text.trim());
      value.textContent = text.trim() || ' ';
    }
  };
}
