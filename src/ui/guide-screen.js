// Guía de programación en cuadrícula (estilo cable) de los canales dominicanos: 5 horas desde la media hora actual.
// OK en lo que está pasando = verlo; OK en un programa futuro = poner/quitar recordatorio.
import { h, clear, toArray } from './dom.js';
import { icon } from './icons.js';
import { loadVisibleImages } from './card.js';
import { formatClock } from './format.js';
import { programsFor } from '../epg.js';
import { guideChannels } from '../dominican.js';
import { hasReminder, toggleReminder } from '../reminders.js';

const SPAN_MIN = 300;
const TIMELINE_W = 1260;
const PX_PER_MIN = TIMELINE_W / SPAN_MIN;

function hhmm(ms) {
  return formatClock(new Date(ms)).replace(' a. m.', ' a.m.').replace(' p. m.', ' p.m.');
}

export function createGuideScreen(app) {
  const ruler = h('div', { class: 'guide-ruler' });
  const rows = h('div', { class: 'guide-rows', 'data-scroll': 'y', 'data-scroll-pad': '140' });
  const empty = h('div', { class: 'empty', text: 'La guía de programación todavía no ha cargado. Funciona en la app instalada en la TV; vuelve a entrar en unos segundos.' });
  const el = h('section', { class: 'screen guide-screen' }, [
    h('div', { class: 'screen-head' }, [h('h1', { class: 'screen-title', text: 'Guía de programación' }), h('span', { class: 'screen-count', text: 'República Dominicana' })]),
    h('div', { class: 'guide-head' }, [h('div', { class: 'guide-corner', text: 'OK: ver · OK en lo que viene: recordatorio' }), ruler]),
    rows,
    empty
  ]);

  let windowStart = 0;

  function x(ms) {
    return Math.round((ms - windowStart) / 60000 * PX_PER_MIN);
  }

  function render() {
    const now = Date.now();
    const d = new Date(now);
    d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
    windowStart = d.getTime();
    const windowEnd = windowStart + SPAN_MIN * 60000;

    clear(ruler);
    for (let t = windowStart; t < windowEnd; t += 30 * 60000) {
      ruler.appendChild(h('span', { class: 'guide-tick', style: 'left:' + x(t) + 'px', text: hhmm(t) }));
    }
    ruler.appendChild(h('span', { class: 'guide-now', style: 'left:' + x(now) + 'px' }));

    clear(rows);
    const channels = guideChannels(app.data.channels);
    el.classList.toggle('is-empty', !channels.length);
    channels.forEach((ch, i) => {
      const cell = h('div', { class: 'guide-channel focusable' }, [
        ch.logo ? h('img', { 'data-src': ch.logo, alt: '' }) : null,
        h('span', { text: ch.name })
      ]);
      cell._item = ch;
      cell._onEnter = () => app.open(ch, channels, i);
      const line = h('div', { class: 'guide-line' }, h('span', { class: 'guide-now', style: 'left:' + x(now) + 'px' }));
      programsFor(ch, windowStart, windowEnd).forEach(p => {
        const left = Math.max(0, x(p.start));
        // Nunca más ancho que su franja (si no, un programa de 5 min tapa al siguiente).
        const width = Math.min(TIMELINE_W, x(p.stop)) - left - 6;
        if (width < 12) return;
        const live = p.start <= now && now < p.stop;
        const block = h('div', {
          class: 'prog focusable' + (live ? ' live' : '') + (width < 90 ? ' tiny' : '') + (hasReminder(ch.key, p.start) ? ' reminded' : ''),
          style: 'left:' + left + 'px;width:' + width + 'px'
        }, [
          h('span', { class: 'prog-title', text: p.title }),
          h('span', { class: 'prog-time', text: hhmm(p.start) + ' – ' + hhmm(p.stop) }),
          icon('bell', 'prog-bell')
        ]);
        block._item = ch;
        block._onEnter = () => {
          if (p.start <= Date.now()) { app.open(ch, channels, i); return; }
          const on = toggleReminder(ch, p);
          block.classList.toggle('reminded', on);
          app.toast(on ? 'Te aviso cuando empiece «' + p.title + '» (' + hhmm(p.start) + ')' : 'Recordatorio quitado');
        };
        line.appendChild(block);
      });
      rows.appendChild(h('div', { class: 'guide-row', 'data-anchor': '' }, [cell, line]));
    });
  }

  const screen = {
    name: 'guide',
    el,
    lastFocus: null,
    mount() {
      render();
      screen.lastFocus = null;
    },
    firstFocus() {
      // Arranca en lo que está pasando ahora en el primer canal.
      const live = rows.querySelector('.prog.live');
      return live || rows.querySelector('.focusable');
    },
    onFocus() {
      loadVisibleImages(el);
    },
    afterShow() {
      loadVisibleImages(el);
    },
    refresh() {
      const keep = screen.lastFocus;
      const idx = keep ? toArray(rows.querySelectorAll('.focusable')).indexOf(keep) : -1;
      render();
      const all = rows.querySelectorAll('.focusable');
      screen.lastFocus = idx >= 0 && all[idx] ? all[idx] : null;
    }
  };
  return screen;
}
