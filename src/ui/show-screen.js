// Ficha de una serie de Pluto: información, "Continuar T1:E5", temporadas a la izquierda y episodios a la derecha.
import { h, clear, closest } from './dom.js';
import { icon } from './icons.js';
import { focus } from './focus.js';
import { formatTime, formatDuration } from './format.js';
import { getProgress, isWatched, lastEpisodeOf, isFavorite, toggleFavorite } from '../store.js';
import { loadSeasons } from '../pluto.js';

export function createShowScreen(app) {
  const bg = h('div', { class: 'detail-bg' });
  const poster = h('img', { class: 'show-poster', alt: '' });
  const title = h('h1', { class: 'show-title' });
  const tags = h('div', { class: 'tags' });
  const summary = h('p', { class: 'show-summary' });
  const actions = h('div', { class: 'actions' });
  const seasonsEl = h('div', { class: 'show-seasons' });
  const episodesEl = h('div', { class: 'show-episodes' });
  const episodesScroll = h('div', { class: 'show-episodes-scroll', 'data-scroll': 'y', 'data-scroll-pad': '10' }, episodesEl);
  const status = h('div', { class: 'show-status' });
  const el = h('section', { class: 'screen show-screen' }, [
    bg, h('div', { class: 'detail-shade' }),
    h('div', { class: 'show-top' }, [poster, h('div', { class: 'show-info' }, [title, tags, summary, actions])]),
    h('div', { class: 'show-bottom' }, [seasonsEl, episodesScroll, status])
  ]);

  let series = null;
  let seasons = [];
  let current = 0;
  let token = 0;
  let resumeKey = null;
  let autoplay = false;

  function button(iconName, label, onEnter, primary) {
    const b = h('div', { class: 'btn focusable' + (primary ? ' primary' : '') }, [icon(iconName), h('span', { text: label })]);
    b._onEnter = onEnter;
    return b;
  }

  // Todos los episodios en orden (para "siguiente episodio" entre temporadas).
  function allEpisodes() {
    return seasons.reduce((acc, s) => acc.concat(s.episodes), []);
  }

  function play(ep, startAt) {
    const list = allEpisodes();
    app.playEpisode(ep, list, list.indexOf(ep), startAt);
  }

  // Siguiente episodio sin ver después del último terminado; si no hay historial, el primero.
  function nextUnwatched() {
    const list = allEpisodes();
    let lastDone = -1;
    list.forEach((e, i) => { if (isWatched(e.key)) lastDone = i; });
    return list[lastDone + 1] || list[0];
  }

  function renderActions() {
    clear(actions);
    if (!seasons.length) return;
    const last = lastEpisodeOf(series.key);
    const lastEp = last && allEpisodes().filter(e => e.key === last.item.key)[0];
    if (lastEp) {
      actions.appendChild(button('play', 'Continuar T' + lastEp.season + ':E' + lastEp.number + '  ·  ' + formatTime(last.t), () => play(lastEp, last.t), true));
    } else {
      const ep = nextUnwatched();
      actions.appendChild(button('play', (isWatched(allEpisodes()[0].key) ? 'Ver ' : 'Empezar ') + 'T' + ep.season + ':E' + ep.number, () => play(ep, 0), true));
    }
    const fav = isFavorite(series.key);
    actions.appendChild(button(fav ? 'check' : 'plus', fav ? 'En Mi lista' : 'Mi lista', () => {
      app.toast(toggleFavorite(series) ? 'Serie agregada a Mi lista' : 'Quitada de Mi lista');
      app.markDirty();
      renderActions();
      focus(actions.lastChild);
    }));
  }

  function renderSeasons() {
    clear(seasonsEl);
    seasons.forEach((s, i) => {
      const b = h('div', { class: 'season focusable' + (i === current ? ' current' : ''), text: 'Temporada ' + s.number });
      b._onEnter = () => { current = i; renderSeasons(); renderEpisodes(); focus(seasonsEl.childNodes[i]); };
      seasonsEl.appendChild(b);
    });
  }

  function renderEpisodes() {
    clear(episodesEl);
    const season = seasons[current];
    if (!season) return;
    season.episodes.forEach(ep => {
      const p = getProgress(ep.key);
      const done = isWatched(ep.key);
      const row = h('div', { class: 'ep focusable' + (done ? ' watched' : '') }, [
        h('div', { class: 'ep-num', text: String(ep.number) }),
        h('div', { class: 'ep-body' }, [
          h('div', { class: 'ep-title', text: ep.title }),
          h('div', { class: 'ep-meta', text: [formatDuration(ep.runtime), done ? '✓ Visto' : p ? 'Vas en ' + formatTime(p.t) : ''].filter(Boolean).join('  ·  ') }),
          h('div', { class: 'ep-desc', text: ep.description }),
          p ? h('div', { class: 'progress' }, h('div', { class: 'progress-fill', style: 'width:' + Math.round(100 * p.t / p.d) + '%' })) : null
        ])
      ]);
      row._item = ep;
      row._onEnter = () => play(ep, p ? p.t : 0);
      episodesEl.appendChild(row);
    });
  }

  function load() {
    const my = ++token;
    status.textContent = 'Cargando episodios…';
    loadSeasons(series).then(list => {
      if (my !== token) return;
      seasons = list;
      status.textContent = list.length ? '' : 'Esta serie no tiene episodios disponibles ahora.';
      // Abrir en la temporada del episodio a continuar (o del pedido desde "Continuar viendo").
      const last = lastEpisodeOf(series.key);
      const target = resumeKey || (last && last.item.key);
      current = 0;
      seasons.forEach((s, i) => { if (s.episodes.some(e => e.key === target)) current = i; });
      renderActions();
      renderSeasons();
      renderEpisodes();
      focus(actions.firstChild || seasonsEl.firstChild);
      // Abierto desde "Seguir viendo" de Google TV: arrancar ese episodio donde quedó.
      if (autoplay) {
        autoplay = false;
        const ep = allEpisodes().filter(e => e.key === target)[0];
        const p = ep && getProgress(ep.key);
        if (ep) play(ep, p ? p.t : 0);
      }
    }, err => {
      if (my !== token) return;
      status.textContent = 'No se pudo cargar la serie (' + err.message + '). Las series de Pluto funcionan en la app instalada en la TV.';
    });
  }

  const screen = {
    name: 'show',
    el,
    lastFocus: null,
    mount(params) {
      series = params.series;
      resumeKey = params.resumeKey || null;
      autoplay = !!params.autoplay;
      seasons = [];
      bg.style.backgroundImage = 'url("' + (series.art || series.poster) + '")';
      poster.src = series.poster;
      title.textContent = series.name;
      clear(tags);
      [series.genre, series.seasons ? series.seasons + (series.seasons === 1 ? ' temporada' : ' temporadas') : '', 'Pluto TV · gratis con anuncios']
        .filter(Boolean).forEach(t => tags.appendChild(h('span', { class: 'tag', text: t })));
      summary.textContent = series.summary || '';
      clear(actions);
      clear(seasonsEl);
      clear(episodesEl);
      screen.lastFocus = null;
      load();
    },
    // Al volver del reproductor: progreso, ✓ y "Continuar" al día, sin perder la temporada.
    refresh() {
      if (!seasons.length) return;
      const focused = screen.lastFocus;
      const epKey = focused && focused._item ? focused._item.key : null;
      renderActions();
      renderEpisodes();
      screen.lastFocus = null;
      if (epKey) {
        const rows = episodesEl.childNodes;
        for (let i = 0; i < rows.length; i++) if (rows[i]._item.key === epKey) screen.lastFocus = rows[i];
      }
    },
    firstFocus() {
      return actions.firstChild || seasonsEl.firstChild || null;
    },
    // Desde temporadas, ▶ entra a los episodios aunque no estén alineados.
    onEdge(dir, cur) {
      if (dir === 'right' && closest(cur, '.show-seasons') && episodesEl.firstChild) { focus(episodesEl.firstChild); return true; }
      if (dir === 'left' && closest(cur, '.show-episodes') && seasonsEl.childNodes[current]) { focus(seasonsEl.childNodes[current]); return true; }
      return false;
    }
  };
  return screen;
}
