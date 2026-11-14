// Ficha de película: póster, datos, sinopsis y acciones (Reanudar / Desde el inicio / Mi lista).
import { h, clear } from './dom.js';
import { icon } from './icons.js';
import { focus } from './focus.js';
import { itemTags, formatTime } from './format.js';
import { getProgress, isFavorite, toggleFavorite } from '../store.js';
import { resolveMovie } from '../vod.js';

export function createDetailScreen(app) {
  const bg = h('div', { class: 'detail-bg' });
  const poster = h('img', { class: 'detail-poster', alt: '' });
  const title = h('h1', { class: 'detail-title' });
  const tags = h('div', { class: 'tags' });
  const desc = h('p', { class: 'detail-desc' });
  const progressBar = h('div', { class: 'progress big' }, h('div', { class: 'progress-fill' }));
  const progressText = h('div', { class: 'detail-progress-text' });
  const actions = h('div', { class: 'actions' });
  const el = h('section', { class: 'screen detail-screen' }, [
    bg, h('div', { class: 'detail-shade' }),
    h('div', { class: 'detail-body' }, [poster, h('div', { class: 'detail-info' }, [title, tags, progressBar, progressText, actions, desc])])
  ]);

  let movie = null;
  let list = [];
  let index = 0;
  let resolved = null;
  let token = 0;
  let selectedLang = 'latino';

  function getAvailableLangs() {
    if (!movie) return [];
    if (Array.isArray(movie.languages) && movie.languages.length > 0) return movie.languages;
    if (movie.servers && typeof movie.servers === 'object') return Object.keys(movie.servers);
    return [];
  }

  function formatLangLabel(lang) {
    if (lang === 'latino') return 'Audio: Latino';
    if (lang === 'castellano' || lang === 'spanish') return 'Audio: Castellano';
    if (lang === 'english') return 'Audio: Inglés';
    if (lang === 'subtitulado') return 'Audio: Subtitulado';
    return 'Audio: ' + lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  function button(iconName, label, onEnter, primary) {
    const b = h('div', { class: 'btn focusable' + (primary ? ' primary' : '') }, [icon(iconName), h('span', { text: label })]);
    b._onEnter = onEnter;
    return b;
  }

  function renderActions() {
    clear(actions);
    const hasStream = (movie.src !== 'poseidon') || (
      (movie.servers && Object.keys(movie.servers).some(k => Array.isArray(movie.servers[k]) && movie.servers[k].length > 0)) ||
      (movie.stream && movie.stream.length > 5) ||
      (movie.url && movie.url.length > 5)
    );

    if (!hasStream) {
      actions.appendChild(button('clock', 'Próximamente en Poseidon', () => {
        app.toast('PoseidonHD aún no ha publicado enlaces de video para este título.');
      }, true));
    } else {
      const p = getProgress(movie.key);
      const play = start => app.playMovie(movie, list, index, resolved, start, selectedLang);
      const main = p ? button('play', 'Reanudar ' + formatTime(p.t), () => play(p.t), true) : button('play', 'Ver ahora', () => play(0), true);
      actions.appendChild(main);
      if (p) actions.appendChild(button('restart', 'Desde el inicio', () => play(0)));
    }

    const langs = getAvailableLangs();
    if (langs.length > 1) {
      if (langs.indexOf(selectedLang) < 0) selectedLang = langs[0];
      actions.appendChild(button('globe', formatLangLabel(selectedLang), () => {
        const nextIdx = (langs.indexOf(selectedLang) + 1) % langs.length;
        selectedLang = langs[nextIdx];
        app.toast('Audio: ' + formatLangLabel(selectedLang).replace('Audio: ', ''));
        renderActions();
        focus(actions.children[actions.children.length - 2] || actions.firstChild);
      }));
    }

    const fav = isFavorite(movie.key);
    actions.appendChild(button(fav ? 'check' : 'plus', fav ? 'En Mi lista' : 'Mi lista', () => {
      app.toast(toggleFavorite(movie) ? 'Agregada a Mi lista' : 'Quitada de Mi lista');
      app.markDirty();
      renderActions();
      focus(actions.lastChild);
    }));
    progressBar.style.display = p ? '' : 'none';
    progressText.textContent = p ? 'Quedan ' + formatTime(p.d - p.t) : '';
    if (p) progressBar.firstChild.style.width = Math.round(100 * p.t / p.d) + '%';
    screen.lastFocus = null;
  }

  const screen = {
    name: 'detail',
    el,
    lastFocus: null,
    mount(params) {
      movie = params.item;
      list = params.list || [movie];
      index = params.index || 0;
      resolved = null;
      const available = getAvailableLangs();
      selectedLang = available.length > 0 ? available[0] : 'latino';
      const my = ++token;
      bg.style.backgroundImage = 'url("' + (movie.art || movie.poster) + '")';
      poster.src = movie.poster;
      title.textContent = movie.name;
      clear(tags);
      itemTags(movie).forEach(t => tags.appendChild(h('span', { class: 'tag', text: t })));
      renderActions();
      // Poseidon: catálogo de estrenos HD con sinopsis precargada.
      if (movie.src === 'poseidon') {
        resolved = null;
        desc.textContent = movie.overview || movie.summary || 'Estreno cinematográfico en alta definición.';
        return;
      }
      // Película del catálogo de la API de Pluto: la URL se arma con la sesión al reproducir.
      if (movie.path) {
        resolved = null;
        desc.textContent = movie.summary || 'Película gratuita con anuncios, cortesía de Pluto TV.';
        return;
      }
      // Pluto (lista M3U) ya trae la URL de reproducción; Internet Archive necesita consultar la ficha.
      if (movie.direct) {
        resolved = { urls: movie.urls, subtitles: [], description: '', duration: 0 };
        desc.textContent = 'Película gratuita con anuncios, cortesía de Pluto TV.';
        return;
      }
      desc.textContent = 'Cargando sinopsis…';
      // La ficha completa (MP4, subtítulos, sinopsis) se pide al abrir, no en la carga inicial.
      resolveMovie(movie).then(r => {
        if (my !== token) return;
        resolved = r;
        desc.textContent = r.description ? r.description.slice(0, 600) + (r.description.length > 600 ? '…' : '') : '';
        if (!r.urls.length) desc.textContent = 'Esta película no tiene un video compatible en este momento.';
      }, () => {
        if (my === token) desc.textContent = '';
      });
    },
    // Al volver del reproductor se actualiza el botón "Reanudar".
    refresh() {
      if (movie) renderActions();
    },
    firstFocus() {
      return actions.firstChild;
    }
  };
  return screen;
}
