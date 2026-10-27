// "¿Quién está viendo?" (al abrir, si hay más de un perfil) y creación de perfiles.
import { h, clear } from './dom.js';
import { icon } from './icons.js';
import { createKeyboard, handlePhysicalKey } from './keyboard.js';
import { profiles, COLORS, addProfile, state } from '../store.js';

function initial(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export function avatar(p, big) {
  return h('div', { class: 'avatar' + (big ? ' big' : ''), style: 'background:' + COLORS[p.color % COLORS.length] }, [
    h('span', { text: initial(p.name) }),
    p.kids ? h('span', { class: 'avatar-kids', text: 'NIÑOS' }) : null
  ]);
}

export function createProfilesScreen(app) {
  const row = h('div', { class: 'profiles-row' });
  const el = h('section', { class: 'screen profiles-screen' }, [
    h('h1', { class: 'profiles-title', text: '¿Quién está viendo?' }),
    row,
    h('p', { class: 'profiles-hint', text: 'Cada perfil tiene su propia Mi lista, lo que dejó a medias y sus recomendaciones.' })
  ]);

  function render() {
    clear(row);
    profiles.list.forEach(p => {
      const card = h('div', { class: 'profile focusable' + (p.id === profiles.active ? ' current' : '') }, [avatar(p, true), h('div', { class: 'profile-name', text: p.name })]);
      card._onEnter = () => app.chooseProfile(p.id);
      row.appendChild(card);
    });
    if (profiles.list.length < 6) {
      const add = h('div', { class: 'profile focusable add' }, [h('div', { class: 'avatar big add' }, icon('plus')), h('div', { class: 'profile-name', text: 'Agregar perfil' })]);
      add._onEnter = () => app.push('profile-new');
      row.appendChild(add);
    }
  }

  const screen = {
    name: 'profiles',
    el,
    lastFocus: null,
    mount() { render(); screen.lastFocus = null; },
    firstFocus() {
      const cur = row.querySelector('.profile.current');
      return cur || row.querySelector('.focusable');
    },
    // Aquí no se abre el menú lateral.
    onEdge(dir) { return dir === 'left'; },
    onAction(action) {
      if (action === 'back') { app.profilesBack(); return true; }
      return false;
    }
  };
  return screen;
}

export function createNewProfileScreen(app) {
  const value = h('div', { class: 'search-query' });
  const kb = createKeyboard('search', v => { value.textContent = v || ' '; value.classList.toggle('placeholder', !v); });
  let kids = false;
  const kidsBtn = h('div', { class: 'btn focusable' }, h('span'));
  const create = h('div', { class: 'btn primary focusable' }, [icon('check'), h('span', { text: 'Crear perfil' })]);
  const el = h('section', { class: 'screen addlist-screen newprofile-screen' }, [
    h('h1', { class: 'screen-title', text: 'Nuevo perfil' }),
    h('p', { class: 'hint', text: 'Escribe el nombre con el teclado en pantalla.' }),
    value, kb.el, h('div', { class: 'actions' }, [kidsBtn, create])
  ]);

  function paintKids() {
    kidsBtn.lastChild.textContent = kids ? 'Perfil infantil: Sí' : 'Perfil infantil: No';
    kidsBtn.classList.toggle('primary', kids);
  }
  kidsBtn._onEnter = () => { kids = !kids; paintKids(); };
  create._onEnter = () => {
    const name = kb.getValue().trim();
    if (!name) { app.toast('Escribe un nombre'); return; }
    // Un perfil infantil necesita PIN para poder salir de él: si no hay, se crea primero.
    if (kids && !(state.settings.kids && state.settings.kids.pin)) app.toast('Crea un PIN para el perfil infantil');
    const p = addProfile(name.charAt(0).toUpperCase() + name.slice(1), kids);
    app.toast('Perfil «' + p.name + '» creado');
    app.pop();
    if (kids && !(state.settings.kids && state.settings.kids.pin)) app.push('pin', { mode: 'set-only' });
  };

  return {
    name: 'profile-new',
    el,
    lastFocus: null,
    mount() { kb.setValue(''); value.textContent = ' '; value.classList.add('placeholder'); kids = false; paintKids(); },
    firstFocus() { return kb.el.querySelector('.focusable'); },
    onRawKey(e) { return handlePhysicalKey(e, kb); }
  };
}
