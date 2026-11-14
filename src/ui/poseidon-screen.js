// Pantalla de Películas Edwin: catálogo masivo de estrenos con selector interactivo de géneros
import { h, clear, closest, toArray } from './dom.js';
import { focus } from './focus.js';
import { itemCard, moreCard, loadVisibleImages } from './card.js';
import { itemTags, formatTime, formatClock } from './format.js';
import { getProgress } from '../store.js';
import { nowNext } from '../epg.js';
import { EDWIN_GENRES, buildPoseidonRows, getPoseidonMoviesSync } from '../poseidon.js';
import { createKeyboard, handlePhysicalKey } from './keyboard.js';
import { icon } from './icons.js';

const ROW_LIMIT = 30;

export function createPoseidonScreen(app) {
  const heroBg = h('div', { class: 'hero-bg' });
  const heroArt = h('img', { class: 'hero-art', alt: '' });
  const heroKicker = h('div', { class: 'hero-kicker' });
  const heroTitle = h('h1', { class: 'hero-title' });
  const heroTags = h('div', { class: 'tags' });
  const heroHint = h('div', { class: 'hero-hint' });
  const hero = h('div', { class: 'hero' }, [
    heroBg,
    heroArt,
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-text' }, [heroKicker, heroTitle, heroTags, heroHint])
  ]);

  const genreBar = h('div', { class: 'genre-bar', 'data-scroll': 'x' });
  const rowsEl = h('div', { class: 'rows', 'data-scroll': 'y', 'data-scroll-pad': '0' });
  const empty = h('div', { class: 'empty', text: 'Cargando Películas Edwin…' });

  // Modal / overlay de búsqueda dentro de Películas Edwin
  const searchInputVal = h('input', {
    type: 'text',
    class: 'search-query edwin-native-input focusable',
    placeholder: 'Escribe aquí o con el teclado en pantalla…',
    tabindex: '-1'
  });
  const searchStatus = h('div', { class: 'search-status', text: 'Escribe para filtrar el catálogo de Películas Edwin' });
  const voiceSearchBtn = app.canVoice ? h('div', { class: 'btn primary focusable voice-btn', style: 'margin-bottom: 20px;' }, [
    icon('mic'),
    h('span', { text: 'Hablar con el micrófono' })
  ]) : null;
  const searchBox = h('div', { class: 'edwin-search-box' });
  const searchActions = h('div', { class: 'edwin-search-actions' }, [
    h('div', { class: 'btn primary focusable', text: 'Ver resultados', style: 'margin-top: 15px;' })
  ]);
  const searchModal = h('div', { class: 'edwin-search-modal' }, [
    h('div', { class: 'edwin-search-card' }, [
      h('h2', { class: 'edwin-search-title', text: 'Buscar en Películas Edwin' }),
      voiceSearchBtn,
      searchInputVal,
      searchStatus,
      searchBox,
      searchActions
    ])
  ]);

  const el = h('section', { class: 'screen rows-screen poseidon-screen' }, [
    hero,
    genreBar,
    rowsEl,
    empty,
    searchModal
  ]);

  let activeGenre = 'all';
  let searchQuery = '';
  let heroTimer = null;
  let heroKey = null;
  let searchKeyboard = null;

  function setHero(item, row) {
    if (!item || item.key === heroKey) return;
    heroKey = item.key;
    const isMovie = item.type === 'movie' || item.type === 'series' || item.type === 'episode';
    const art = isMovie ? (item.art || item.poster) : item.logo;
    el.classList.toggle('hero-movie', isMovie);
    heroBg.style.backgroundImage = art ? 'url("' + art.replace(/"/g, '%22') + '")' : 'none';
    if (art) { heroArt.src = art; heroArt.style.display = ''; } else { heroArt.removeAttribute('src'); heroArt.style.display = 'none'; }
    heroKicker.textContent = 'PELÍCULAS EDWIN' + (row ? ' · ' + row.title.toUpperCase() : '');
    heroKicker.className = 'hero-kicker';
    heroTitle.textContent = item.name;
    clear(heroTags);
    itemTags(item).forEach(t => heroTags.appendChild(h('span', { class: 'tag', text: t })));
    const p = isMovie && getProgress(item.key);
    heroHint.textContent = p
      ? 'Te quedaste en ' + formatTime(p.t) + ' de ' + formatTime(p.d) + ' · OK para continuar'
      : (item.quality ? 'Calidad: ' + item.quality + ' · OK para reproducir' : 'OK para ver detalles');
  }

  function renderRow(row) {
    const kind = row.items[0] && row.items[0].type === 'movie' ? 'movie' : 'live';
    const track = h('div', { class: 'track pending ' + kind, 'data-scroll': 'x', 'data-scroll-pad': '60' });
    const rowEl = h('div', { class: 'row', 'data-anchor': '', 'data-row': row.id }, [
      h('h2', { class: 'row-title' }, [row.title, h('span', { class: 'row-count', text: String(row.items.length) })]),
      track
    ]);
    rowEl._row = row;
    return rowEl;
  }

  function fillRow(rowEl) {
    if (!rowEl || !rowEl._row || rowEl._filled) return;
    rowEl._filled = true;
    const row = rowEl._row;
    const track = rowEl.lastChild;
    track.className = track.className.replace(' pending', '');
    row.items.slice(0, ROW_LIMIT).forEach((item, i) => {
      const card = itemCard(item);
      card._row = row;
      card._index = i;
      card._onEnter = () => app.open(item, row.items, i);
      track.appendChild(card);
    });
    if (row.items.length > ROW_LIMIT) {
      const more = moreCard(row.items.length, row.items[0].type === 'movie' ? 'movie' : 'live');
      more._onEnter = () => app.openGrid(row.title, row.items);
      track.appendChild(more);
    }
  }

  function fillAround(rowEl) {
    let up = rowEl;
    let down = rowEl;
    fillRow(rowEl);
    for (let i = 0; i < 3; i++) {
      up = up && up.previousSibling;
      down = down && down.nextSibling;
      fillRow(up);
      fillRow(down);
    }
  }

  if (voiceSearchBtn) {
    voiceSearchBtn._onEnter = () => {
      closeSearchModal();
      app.voiceSearch();
    };
  }

  searchInputVal._onEnter = () => {
    searchInputVal.focus();
    if (app.showKeyboard) app.showKeyboard();
  };

  searchInputVal.addEventListener('input', () => {
    searchQuery = searchInputVal.value;
    if (searchKeyboard) searchKeyboard.setValue(searchQuery);
    searchStatus.textContent = searchQuery ? 'Filtrando por "' + searchQuery + '"' : 'Escribe para filtrar el catálogo';
    render();
  });

  searchInputVal.addEventListener('keydown', e => {
    if (e.keyCode === 13) {
      if (app.hideKeyboard) app.hideKeyboard();
      closeSearchModal();
      render();
      const firstCard = rowsEl.querySelector('.focusable');
      if (firstCard) focus(firstCard);
    }
  });

  const confirmBtn = searchActions.firstChild;
  if (confirmBtn) {
    confirmBtn._onEnter = () => {
      if (app.hideKeyboard) app.hideKeyboard();
      closeSearchModal();
      render();
      const firstCard = rowsEl.querySelector('.focusable');
      if (firstCard) focus(firstCard);
    };
  }

  function openSearchModal() {
    searchModal.classList.add('open');
    searchInputVal.value = searchQuery || '';
    if (!searchKeyboard) {
      searchKeyboard = createKeyboard('search', val => {
        searchQuery = val;
        searchInputVal.value = val;
        searchStatus.textContent = val ? 'Filtrando por "' + val + '"' : 'Escribe para filtrar el catálogo';
        render();
      });
      searchBox.appendChild(searchKeyboard.el);
    } else {
      searchKeyboard.setValue(searchQuery || '');
    }
    const firstKey = searchKeyboard.el.querySelector('.key.focusable');
    if (firstKey) focus(firstKey);
  }

  function closeSearchModal() {
    if (app.hideKeyboard) app.hideKeyboard();
    searchModal.classList.remove('open');
  }

  function buildGenrePills() {
    clear(genreBar);

    // Botón de búsqueda rápida
    const searchPill = h('div', { class: 'genre-pill genre-search focusable', tabindex: '-1' }, [
      icon('search'),
      h('span', { text: searchQuery ? 'Buscar: "' + searchQuery + '"' : 'Buscar' })
    ]);
    searchPill._onEnter = openSearchModal;
    genreBar.appendChild(searchPill);

    EDWIN_GENRES.forEach(g => {
      const isActive = (g.id === activeGenre && !searchQuery);
      const pill = h('div', {
        class: 'genre-pill focusable' + (isActive ? ' active' : ''),
        'data-genre': g.id,
        tabindex: '-1'
      }, [
        h('span', { text: g.label })
      ]);

      pill._onEnter = () => {
        searchQuery = '';
        activeGenre = g.id;
        buildGenrePills();
        render();
        const firstCard = rowsEl.querySelector('.focusable');
        if (firstCard) focus(firstCard);
      };

      genreBar.appendChild(pill);
    });
  }

  function render() {
    buildGenrePills();
    const rows = buildPoseidonRows(getPoseidonMoviesSync(), activeGenre, searchQuery);
    clear(rowsEl);
    rows.forEach(r => rowsEl.appendChild(renderRow(r)));
    el.classList.toggle('is-empty', !rows.length);
    fillAround(rowsEl.firstChild);
    heroKey = null;
    const first = rows[0] && rows[0].items[0];
    setHero(first, rows[0]);
  }

  const screen = {
    name: 'poseidon',
    el,
    lastFocus: null,
    dirty: true,
    mount() {
      if (screen.dirty) {
        render();
        screen.dirty = false;
      }
    },
    firstFocus() {
      return rowsEl.querySelector('.focusable') || genreBar.querySelector('.genre-pill.active') || genreBar.querySelector('.focusable');
    },
    candidates(current, dir) {
      if (searchModal.classList.contains('open')) {
        return toArray(searchModal.querySelectorAll('.focusable'));
      }

      // Si el foco está en la barra de géneros
      if (genreBar.contains(current)) {
        if (dir === 'left' || dir === 'right') {
          return toArray(genreBar.querySelectorAll('.genre-pill.focusable'));
        }
        if (dir === 'down') {
          const firstRow = rowsEl.firstChild;
          if (firstRow) {
            fillAround(firstRow);
            if (firstRow._last && firstRow.contains(firstRow._last)) return [firstRow._last];
            return toArray(firstRow.querySelectorAll('.focusable'));
          }
        }
        return [];
      }

      // Si el foco está en una fila de películas
      const rowEl = closest(current, '.row');
      if (!rowEl) return null;
      if (dir === 'left' || dir === 'right') {
        return toArray(rowEl.querySelectorAll('.focusable'));
      }

      if (dir === 'up') {
        const prev = rowEl.previousSibling;
        if (!prev) {
          // Si estamos en la primera fila y presionamos arriba -> ir a la barra de géneros
          const activePill = genreBar.querySelector('.genre-pill.active') || genreBar.querySelector('.genre-pill.focusable');
          return activePill ? [activePill] : toArray(genreBar.querySelectorAll('.genre-pill.focusable'));
        }
        fillAround(prev);
        if (prev._last && prev.contains(prev._last)) return [prev._last];
        return toArray(prev.querySelectorAll('.focusable'));
      }

      if (dir === 'down') {
        const next = rowEl.nextSibling;
        if (!next) return [];
        fillAround(next);
        if (next._last && next.contains(next._last)) return [next._last];
        return toArray(next.querySelectorAll('.focusable'));
      }

      return null;
    },
    onFocus(elFocused) {
      if (genreBar.contains(elFocused)) {
        // Asegurar que la píldora enfocada quede centrada en pantalla
        if (typeof elFocused.scrollIntoView === 'function') {
          try { elFocused.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (e) {}
        }
        return;
      }

      const rowEl = closest(elFocused, '.row');
      if (rowEl) {
        rowEl._last = elFocused;
        fillAround(rowEl);
      }
      loadVisibleImages(el);
      if (!elFocused._item) return;
      clearTimeout(heroTimer);
      heroTimer = setTimeout(() => setHero(elFocused._item, elFocused._row), 140);
    },
    onAction(action) {
      if (searchModal.classList.contains('open')) {
        if (action === 'back') {
          closeSearchModal();
          const searchPill = genreBar.querySelector('.genre-search');
          if (searchPill) focus(searchPill);
          return true;
        }
      }
      return false;
    },
    isSearching() {
      return searchModal.classList.contains('open');
    },
    setQuery(text) {
      searchQuery = text;
      if (searchInputVal) searchInputVal.value = text;
      if (searchKeyboard) searchKeyboard.setValue(text);
      closeSearchModal();
      render();
      const first = rowsEl.querySelector('.focusable');
      if (first) focus(first);
    },
    onRawKey(e) {
      if (searchModal.classList.contains('open') && searchKeyboard) {
        return handlePhysicalKey(e, searchKeyboard);
      }
      return false;
    },
    afterShow() {
      loadVisibleImages(el);
    },
    focusKey(key) {
      toArray(rowsEl.childNodes).forEach(fillRow);
      const card = toArray(rowsEl.querySelectorAll('.focusable')).filter(c => c._item && c._item.key === key)[0];
      if (card) focus(card);
    }
  };

  return screen;
}
