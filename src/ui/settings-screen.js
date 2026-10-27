// Ajustes: fuentes activas, filtros, listas propias y mantenimiento.
import { h, clear } from './dom.js';
import { focus } from './focus.js';
import { createKeyboard, handlePhysicalKey } from './keyboard.js';
import { state, saveSettings, clearRecents } from '../store.js';
import { resetHealth, tasteSummary, resetTaste } from '../smart.js';
import { BUILTIN_SOURCES, isSourceOn } from '../sources.js';
import { VOD_SOURCES, isVodSourceOn } from '../vod.js';
import { platform, platformLabel } from '../platform.js';
import { load, storageUsage, profiles, activeProfile, removeProfile } from '../store.js';
import { recentErrors, clearErrors } from '../diag.js';
import { formatClock } from './format.js';

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

    // En modo infantil los ajustes quedan bloqueados: solo se puede salir con el PIN.
    if (app.kidsOn()) {
      section('Modo infantil activado');
      if (activeProfile().kids) list.appendChild(item('Cambiar de perfil', 'Pide el PIN', () => app.push('profiles')));
      else list.appendChild(item('Salir del modo infantil', 'Pide el PIN', () => app.push('pin', { mode: 'unlock' })));
      return;
    }

    section('Perfiles');
    const me = activeProfile();
    list.appendChild(item('Perfil actual: ' + me.name, profiles.list.length > 1 ? 'OK para cambiar de perfil' : 'Solo hay un perfil', () => app.push('profiles')));
    list.appendChild(item('Agregar perfil', 'Para cada persona de la casa (o uno infantil)', () => app.push('profile-new')));
    if (profiles.list.length > 1) {
      list.appendChild(item('Quitar el perfil «' + me.name + '»', 'Borra su Mi lista y su progreso', () => {
        app.menu.open({
          title: '¿Quitar el perfil «' + me.name + '»?',
          subtitle: 'Se borran su Mi lista, lo que dejó a medias y sus gustos.',
          items: [
            { label: 'No, dejarlo', icon: 'check' },
            { label: 'Sí, quitarlo', icon: 'restart', action: () => { removeProfile(me.id); app.toast('Perfil quitado'); app.onProfileRemoved(); } }
          ]
        });
      }));
    }

    if (app.data.update) {
      section('Actualización disponible');
      if (platform === 'android' && app.canSelfUpdate) {
        list.appendChild(item('Actualizar ahora a la ' + app.data.update + ' (tienes ' + __APP_VERSION__ + ')',
          'Se descarga, se comprueba la firma y abre el instalador de Android. Conserva Mi lista y el progreso.', () => app.installUpdate()));
      }
      const how = app.canSelfUpdate ? '' : {
        android: 'Abre Downloader y vuelve a instalar desde edwin042331-hue.github.io/telelibre/TeleLibre.apk',
        tizen: 'Vuelve a instalar TeleLibre-Samsung.wgt con Apps2Samsung',
        webos: 'Vuelve a instalar TeleLibre-LG.ipk con ares-install'
      }[platform] || '';
      if (how) list.appendChild(item('Versión ' + app.data.update + ' (tienes ' + __APP_VERSION__ + ')', how, () => app.toast(how, 8000)));
    }

    section('Familia');
    list.appendChild(item('Modo infantil', 'Solo canales y películas para niños, protegido con PIN', () => app.push('pin', { mode: 'set' })));

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

    section('Tus gustos (la app aprende de lo que ves)');
    const likes = tasteSummary();
    list.appendChild(item('Te gusta', likes.length ? likes.join(' · ') : 'Todavía aprendiendo: mira algo un rato', () => {}));
    list.appendChild(item('Olvidar mis gustos', 'Empezar de cero las recomendaciones', () => { resetTaste(); app.rebuild(); app.toast('Gustos borrados'); screen.refresh(); }));

    section('Apariencia');
    const THEMES = { auto: 'Automático según la hora (claro de día, oscuro de noche)', dark: 'Siempre oscuro', light: 'Siempre claro' };
    const theme = s.theme || 'auto';
    list.appendChild(item('Tema', THEMES[theme], () => {
      const order = ['auto', 'dark', 'light'];
      s.theme = order[(order.indexOf(theme) + 1) % order.length];
      saveSettings();
      app.applyTheme();
      screen.refresh();
    }));

    section('Idioma del contenido');
    list.appendChild(item('Contenido en inglés (Pluto USA, Samsung TV Plus, Roku, películas)', onOff(s.english !== false), () => {
      s.english = s.english === false;
      saveSettings();
      app.reload(false);
    }));

    section('Filtros');
    list.appendChild(item('Ocultar canales geo-bloqueados', onOff(s.hideGeo), () => { s.hideGeo = !s.hideGeo; saveSettings(); app.rebuild(); }));
    list.appendChild(item('Ocultar canales que no transmiten 24/7', onOff(s.hideNot247), () => { s.hideNot247 = !s.hideNot247; saveSettings(); app.rebuild(); }));
    list.appendChild(item('Esconder canales que nunca funcionan en esta TV', onOff(s.hideDead !== false), () => { s.hideDead = s.hideDead === false; saveSettings(); app.rebuild(); }));

    section('Mantenimiento');
    list.appendChild(item('Actualizar canales y películas ahora', 'Descarga las listas de nuevo', () => app.reload(true)));
    const v = load('verified', null);
    list.appendChild(item('Revisión nocturna de canales', v ? v.keys.length + ' canales funcionaron (' + new Date(v.t).toLocaleDateString('es') + ')' : 'Sin datos todavía', () => {}));
    list.appendChild(item('Volver a probar los canales escondidos', 'Olvida lo aprendido sobre canales caídos', () => { resetHealth(); app.rebuild(); app.toast('Listo: se volverán a mostrar todos'); }));
    list.appendChild(item('Borrar canales recientes', state.recents.length + ' guardados', () => { clearRecents(); app.rebuild(); app.toast('Recientes borrados'); }));

    section('Diagnóstico (para soporte)');
    const mb = n => (n / 1048576).toFixed(1) + ' MB';
    const use = storageUsage();
    list.appendChild(item('Versión y equipo', 'TeleLibre ' + __APP_VERSION__ + ' · ' + platformLabel + ' · ' + window.innerWidth + '×' + window.innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x', () => {}));
    list.appendChild(item('Memoria local', mb(use.total) + ' usados (' + mb(use.caches) + ' son cachés que se pueden borrar)', () => {}));
    const failing = Object.keys(app.data.sourceErrors || {});
    list.appendChild(item('Fuentes con problemas', failing.length ? failing.length + ': ' + failing.map(id => app.data.sourceErrors[id]).join(' · ') : 'Ninguna', () => {}));
    const errs = recentErrors();
    list.appendChild(item('Errores recientes', errs.length ? errs.length + ' (OK para borrarlos)' : 'Ninguno', () => { clearErrors(); app.toast('Errores borrados'); screen.refresh(); }));
    errs.slice(0, 8).forEach(e => {
      list.appendChild(item(formatClock(new Date(e.at)) + (e.n > 1 ? ' ×' + e.n : ''), e.m.slice(0, 90) + (e.w ? ' · ' + e.w : ''), () => {}, 'diag-row'));
    });

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
