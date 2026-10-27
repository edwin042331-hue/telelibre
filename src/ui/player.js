// Reproductor a pantalla completa para canales en vivo (HLS) y películas (MP4).
import { h, clear } from './dom.js';
import { icon } from './icons.js';
import { isTV } from '../platform.js';
import { pushRecent, saveProgress, toggleFavorite, isFavorite } from '../store.js';
import { formatTime, formatClock, itemTags } from './format.js';
import { recordPlayback, isDead, learnFrom } from '../smart.js';
import { nowNext } from '../epg.js';

const LIVE_TIMEOUT = 20000;
const MOVIE_TIMEOUT = 30000;
const OSD_HIDE = 5000;
const SAVE_EVERY = 5000;

// Casi todo lo que está en vivo es HLS aunque la URL no termine en .m3u8 (Plex, jmp2.uk, redirecciones):
// solo se trata como archivo directo lo que claramente lo es.
function isHlsUrl(url) {
  return !/\.(mp4|m4v|webm|mkv|mov|mp3|aac|ogg)(\?|$)/i.test(url);
}

// Orden de intentos: en la TV, el reproductor nativo (aceleración por hardware) y luego hls.js;
// en el navegador de PC al revés, porque Chrome no suele reproducir HLS nativo.
function attemptsFor(urls) {
  const out = [];
  urls.forEach(url => {
    if (!isHlsUrl(url)) out.push({ url, engine: 'native' });
    else if (isTV) out.push({ url, engine: 'native' }, { url, engine: 'hls' });
    else out.push({ url, engine: 'hls' }, { url, engine: 'native' });
  });
  return out;
}

let hlsModule = null;
function loadHls() {
  if (!hlsModule) hlsModule = import('hls.js/light').then(m => m.default || m);
  return hlsModule;
}

export function createPlayer(app) {
  const video = h('video', { class: 'video', preload: 'auto' });
  const spinner = h('div', { class: 'spinner' });
  const errorBox = h('div', { class: 'player-error' });
  const stateIcon = h('div', { class: 'state-icon' });
  const logo = h('img', { class: 'osd-logo', alt: '' });
  const title = h('div', { class: 'osd-title' });
  const sub = h('div', { class: 'osd-sub' });
  const clock = h('div', { class: 'osd-clock' });
  const fill = h('div', { class: 'seek-fill' });
  const knob = h('div', { class: 'seek-knob' });
  const tCur = h('span', { class: 't-cur' });
  const tDur = h('span', { class: 't-dur' });
  const timeline = h('div', { class: 'timeline' }, [tCur, h('div', { class: 'seek' }, [fill, knob]), tDur]);
  const liveBar = h('div', { class: 'live-bar' });
  const hints = h('div', { class: 'osd-hints' });
  const osd = h('div', { class: 'osd' }, [
    h('div', { class: 'osd-top' }, [logo, h('div', { class: 'osd-heading' }, [title, sub]), clock]),
    h('div', { class: 'osd-bottom' }, [timeline, liveBar, hints])
  ]);
  // Tarjeta de "siguiente episodio" al terminar uno.
  const nextTitle = h('div', { class: 'next-title' });
  const nextCount = h('div', { class: 'next-count' });
  const nextUp = h('div', { class: 'next-up' }, [h('div', { class: 'next-kicker', text: 'SIGUIENTE EPISODIO' }), nextTitle, nextCount, h('div', { class: 'next-hint', text: 'OK: verlo ya  ·  Atrás: salir' })]);
  // Lista de canales dentro del reproductor (◀ en vivo), como en el cable.
  const chTitle = h('div', { class: 'chlist-title' });
  const chRows = h('div', { class: 'chlist-rows' });
  const chList = h('div', { class: 'chlist' }, [chTitle, chRows, h('div', { class: 'chlist-hint', text: '▲ ▼ elegir · OK ver · ▶ o Atrás cerrar' })]);
  // Número de canal que se está marcando ("Canal 2_").
  const numBox = h('div', { class: 'num-box' });
  const ui = h('div', { class: 'player-ui' }, [spinner, stateIcon, errorBox, osd, nextUp, chList, numBox]);
  const el = h('div', { class: 'player' }, [video, ui]);

  let open = false;
  let mode = 'live';
  let list = [];
  let index = 0;
  let item = null;
  let attempts = [];
  let attempt = 0;
  let token = 0;
  let hls = null;
  let watchdog = null;
  let osdTimer = null;
  let lastSave = 0;
  let startAt = 0;
  let subtitlesOn = true;
  // Momento en que empezó a verse el contenido actual (para aprender gustos por tiempo visto).
  let watchedSince = 0;

  function learn() {
    if (watchedSince && item) learnFrom(item, (Date.now() - watchedSince) / 1000);
    watchedSince = 0;
  }
  // Adelantar/retroceder acumulado: varias pulsaciones mueven la marca y se aplica al soltar.
  let seekTarget = null;
  let seekPresses = 0;
  let seekTimer = null;

  // Al cambiar de estado (cargando → reproduciendo…) se conservan las capas abiertas: barra, lista de canales y número.
  function setState(s) {
    const keep = ['osd-on', 'chlist-on', 'num-on'].filter(c => el.classList.contains(c));
    el.className = 'player open ' + mode + ' ' + s + (keep.length ? ' ' + keep.join(' ') : '');
  }

  function showOsd(sticky) {
    el.classList.add('osd-on');
    clock.textContent = formatClock(new Date());
    clearTimeout(osdTimer);
    if (!sticky) osdTimer = setTimeout(() => { if (!video.paused || mode === 'live') el.classList.remove('osd-on'); }, OSD_HIDE);
  }

  function renderInfo() {
    const isMovie = mode === 'movie';
    const art = isMovie ? item.poster : item.logo;
    if (art) { logo.src = art; logo.style.display = ''; } else logo.style.display = 'none';
    title.textContent = (isFavorite(item.key) ? '★ ' : '') + item.name;
    const np = !isMovie && nowNext(item);
    sub.textContent = np
      ? 'Ahora: ' + np.now.title + ' (hasta las ' + formatClock(new Date(np.now.stop)) + ')' + (np.next ? ' · Después: ' + np.next.title : '')
      : itemTags(item).join(' · ');
    liveBar.textContent = isMovie ? '' : '● EN VIVO · ' + (index + 1) + ' de ' + list.length;
    // "Mantén OK" sirve con cualquier control (el de la TCL no tiene botones de colores).
    hints.textContent = isMovie
      ? 'OK pausa · ◀ ▶ retroceder / adelantar · Mantén OK: opciones · Atrás salir'
      : '▲ ▼ cambiar canal · ◀ lista de canales · Mantén OK: opciones · Atrás salir';
  }

  function clearTimers() {
    clearTimeout(watchdog);
    clearTimeout(seekTimer);
    seekTarget = null;
  }

  function teardown() {
    clearTimers();
    if (hls) { try { hls.destroy(); } catch (e) { /* ya destruido */ } hls = null; }
    try { video.pause(); } catch (e) { /* sin video */ }
    video.removeAttribute('src');
    while (video.firstChild) video.removeChild(video.firstChild);
    try { video.load(); } catch (e) { /* algunos TV fallan al recargar vacío */ }
  }

  function fail() {
    if (attempt + 1 < attempts.length) { attempt++; startAttempt(); return; }
    if (mode === 'live') recordPlayback(item.key, false);
    teardown();
    setState('error');
    errorBox.textContent = mode === 'movie'
      ? 'No se pudo reproducir esta película ahora. Prueba más tarde o elige otra.'
      : 'Este canal no está disponible ahora (la emisora lo cambió o lo limita por país). Usa ▲ ▼ para probar otro.';
    showOsd(true);
  }

  function startAttempt() {
    teardown();
    const my = ++token;
    const a = attempts[attempt];
    setState('loading');
    watchdog = setTimeout(() => { if (my === token) fail(); }, mode === 'movie' ? MOVIE_TIMEOUT : LIVE_TIMEOUT);

    if (mode === 'movie' && item._subtitles && item._subtitles.length) {
      // crossorigin solo con subtítulos: muchos streams en vivo no envían CORS y fallarían con él.
      video.setAttribute('crossorigin', 'anonymous');
      item._subtitles.forEach((s, i) => {
        video.appendChild(h('track', { kind: 'subtitles', src: s.url, label: s.label, srclang: s.label === 'English' ? 'en' : 'es', default: i === 0 ? true : null }));
      });
    } else {
      video.removeAttribute('crossorigin');
    }

    if (a.engine === 'native') {
      video.src = a.url;
      const p = video.play();
      if (p && p.catch) p.catch(() => { /* el evento error decide */ });
      return;
    }
    loadHls().then(Hls => {
      if (my !== token) return;
      if (!Hls.isSupported()) { fail(); return; }
      hls = new Hls({ enableWorker: true, manifestLoadingTimeOut: 12000, fragLoadingTimeOut: 20000, backBufferLength: 30 });
      let recovered = false;
      hls.on(Hls.Events.ERROR, (evt, data) => {
        if (my !== token || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return; }
        fail();
      });
      hls.loadSource(a.url);
      hls.attachMedia(video);
      const p = video.play();
      if (p && p.catch) p.catch(() => { /* esperar MANIFEST_PARSED */ });
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (my === token) video.play(); });
    }, () => fail());
  }

  video.addEventListener('playing', () => {
    if (!watchedSince) watchedSince = Date.now();
    clearTimeout(watchdog);
    setState('playing');
    if (mode === 'live') { pushRecent(item); recordPlayback(item.key, true); }
  });
  video.addEventListener('waiting', () => { if (open) el.classList.add('loading'); });
  video.addEventListener('pause', () => {
    if (!open || el.classList.contains('error')) return;
    persist();
    stateIcon.innerHTML = '';
    stateIcon.appendChild(icon('pause'));
    el.classList.add('paused');
    showOsd(true);
  });
  video.addEventListener('play', () => el.classList.remove('paused'));
  video.addEventListener('error', () => { if (open && video.getAttribute('src')) fail(); });
  video.addEventListener('loadedmetadata', () => {
    if (mode === 'movie' && startAt > 0 && startAt < video.duration - 10) {
      try { video.currentTime = startAt; } catch (e) { /* se reintenta en canplay */ }
    }
    if (video.textTracks) for (let i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = subtitlesOn && i === 0 ? 'showing' : 'hidden';
    renderInfo();
  });
  video.addEventListener('timeupdate', () => {
    if (mode !== 'movie') return;
    if (seekTarget == null) updateTimeline(video.currentTime);
    if (Date.now() - lastSave > SAVE_EVERY) persist();
  });
  // nextFn/nextLabel: lo que sigue al terminar (episodios). Cuenta regresiva de 10 s, OK para adelantarla.
  let nextFn = null;
  let nextLabel = '';
  let nextTimer = null;
  let nextLeft = 0;

  function cancelNext() {
    clearInterval(nextTimer);
    nextTimer = null;
    el.classList.remove('next-on');
  }

  function goNext() {
    const fn = nextFn;
    cancelNext();
    persist();
    learn();
    if (fn) fn();
  }

  function showNext() {
    nextLeft = 10;
    nextTitle.textContent = nextLabel;
    nextCount.textContent = 'Empieza en ' + nextLeft + ' s';
    el.classList.add('next-on');
    nextTimer = setInterval(() => {
      nextLeft--;
      nextCount.textContent = 'Empieza en ' + nextLeft + ' s';
      if (nextLeft <= 0) goNext();
    }, 1000);
  }

  video.addEventListener('ended', () => {
    persist();
    if (mode !== 'movie') return;
    if (nextFn) showNext(); else close();
  });

  function duration() {
    const d = video.duration;
    return isFinite(d) && d > 0 ? d : (item && item.runtime) || 0;
  }

  function updateTimeline(t) {
    const d = duration();
    const pct = d ? Math.min(100, 100 * t / d) : 0;
    fill.style.width = pct + '%';
    knob.style.left = pct + '%';
    tCur.textContent = formatTime(t);
    tDur.textContent = '-' + formatTime(Math.max(0, d - t));
  }

  // Guarda la posición para "Continuar viendo" (también se llama al pausar, salir o apagar la TV).
  function persist() {
    if (mode !== 'movie' || !item || !video.currentTime) return;
    lastSave = Date.now();
    saveProgress(item, video.currentTime, duration());
  }

  function seekBy(dir, step) {
    if (mode !== 'movie' || el.classList.contains('error')) return;
    if (seekTarget == null) { seekTarget = video.currentTime; seekPresses = 0; }
    seekPresses++;
    const s = step || (seekPresses > 8 ? 60 : seekPresses > 3 ? 30 : 10);
    seekTarget = Math.max(0, Math.min(duration() - 2, seekTarget + dir * s));
    updateTimeline(seekTarget);
    el.classList.add('seeking');
    showOsd();
    clearTimeout(seekTimer);
    seekTimer = setTimeout(() => {
      try { video.currentTime = seekTarget; } catch (e) { /* stream sin seek */ }
      seekTarget = null;
      el.classList.remove('seeking');
      persist();
    }, 700);
  }

  function togglePause() {
    if (mode !== 'movie') { showOsd(); return; }
    if (video.paused) { video.play(); showOsd(); } else video.pause();
  }

  function toggleSubtitles() {
    const tracks = video.textTracks;
    if (!tracks || !tracks.length) return;
    subtitlesOn = !subtitlesOn;
    for (let i = 0; i < tracks.length; i++) tracks[i].mode = subtitlesOn && i === 0 ? 'showing' : 'hidden';
    app.toast(subtitlesOn ? 'Subtítulos activados' : 'Subtítulos desactivados');
  }

  let prevIndex = -1;

  // Ir directo a un canal de la lista (lista de canales, número, canal anterior).
  function tune(i) {
    if (mode !== 'live' || i < 0 || i >= list.length || i === index) return;
    learn();
    prevIndex = index;
    index = i;
    item = list[index];
    attempts = attemptsFor(item.urls);
    attempt = 0;
    renderInfo();
    showOsd();
    startAttempt();
  }

  // ---- Lista de canales ----
  let chSel = 0;
  function chOpen() { return el.classList.contains('chlist-on'); }
  function paintList() {
    clear(chRows);
    chTitle.textContent = 'Canales · ' + (index + 1) + ' de ' + list.length;
    // Solo se dibujan 8 filas alrededor de la selección: la lista puede tener cientos de canales.
    const from = Math.max(0, Math.min(chSel - 3, list.length - 8));
    for (let i = from; i < Math.min(list.length, from + 8); i++) {
      const ch = list[i];
      const np = nowNext(ch);
      chRows.appendChild(h('div', { class: 'chrow' + (i === chSel ? ' sel' : '') + (i === index ? ' current' : '') }, [
        h('span', { class: 'chrow-num', text: String(i + 1) }),
        ch.logo ? h('img', { class: 'chrow-logo', src: ch.logo, alt: '' }) : h('span', { class: 'chrow-logo' }),
        h('span', { class: 'chrow-text' }, [h('span', { class: 'chrow-name', text: ch.name }), np ? h('span', { class: 'chrow-now', text: 'Ahora: ' + np.now.title }) : null])
      ]));
    }
  }
  function openList() {
    if (mode !== 'live') return;
    chSel = index;
    paintList();
    el.classList.add('chlist-on');
    el.classList.remove('osd-on');
  }
  function closeList() { el.classList.remove('chlist-on'); }

  // ---- Marcar número de canal ----
  let numBuf = '';
  let numTimer = null;
  function typeDigit(d) {
    if (mode !== 'live') return;
    numBuf = (numBuf + d).slice(-4);
    numBox.textContent = 'Canal ' + numBuf + '_';
    el.classList.add('num-on');
    clearTimeout(numTimer);
    numTimer = setTimeout(() => {
      el.classList.remove('num-on');
      const n = parseInt(numBuf, 10);
      numBuf = '';
      if (n >= 1 && n <= list.length) tune(n - 1); else app.toast('No hay canal ' + n + ' en esta lista (tiene ' + list.length + ')');
    }, 1300);
  }

  function zap(delta) {
    if (mode !== 'live' || list.length < 2) return;
    learn();
    prevIndex = index;
    // Salta los canales que nunca han funcionado en esta TV.
    let tries = 0;
    do { index = (index + delta + list.length) % list.length; } while (isDead(list[index].key) && ++tries < list.length);
    item = list[index];
    attempts = attemptsFor(item.urls);
    attempt = 0;
    renderInfo();
    showOsd();
    startAttempt();
  }

  function close() {
    if (!open) return;
    cancelNext();
    persist();
    learn();
    teardown();
    open = false;
    token++;
    el.className = 'player';
    app.onPlayerClosed(item);
  }

  function start(newMode, newList, newIndex, opts) {
    mode = newMode;
    list = newList;
    index = newIndex;
    item = list[index];
    startAt = (opts && opts.startAt) || 0;
    attempts = attemptsFor(item._urls || item.urls || []);
    attempt = 0;
    open = true;
    errorBox.textContent = '';
    updateTimeline(startAt);
    renderInfo();
    showOsd();
    if (!attempts.length) { fail(); return; }
    startAttempt();
  }

  return {
    el,
    ui,
    isOpen: () => open,
    playLive(items, i) { start('live', items, i); },
    // resolved: { urls, subtitles, duration } de Internet Archive.
    // opts.next: función que reproduce lo siguiente; opts.nextLabel: texto de la tarjeta ("T1:E6 · Episodio 6").
    playMovie(movie, resolved, startAt, opts) {
      cancelNext();
      nextFn = opts && opts.next || null;
      nextLabel = opts && opts.nextLabel || '';
      // Campos con "_" no se guardan en el progreso (URLs con token que caducan).
      const m = Object.assign({}, movie, { _urls: resolved.urls, _subtitles: resolved.subtitles, runtime: resolved.duration || movie.runtime });
      start('movie', [m], 0, { startAt });
    },
    persist,
    // La TV pasa la app a segundo plano o se apaga: guardar y pausar (requisito de Samsung y LG).
    onHidden() {
      if (!open) return;
      persist();
      learn();
      try { video.pause(); } catch (e) { /* sin video */ }
    },
    // Opciones de "mantener OK" dentro del reproductor.
    menuOptions() {
      const fav = isFavorite(item.key);
      const tracks = video.textTracks && video.textTracks.length;
      const items = mode === 'live' ? [
        { label: 'Lista de canales', icon: 'live', action: openList },
        prevIndex >= 0 && list[prevIndex] ? { label: 'Canal anterior: ' + list[prevIndex].name, icon: 'prev', action: () => tune(prevIndex) } : null,
        { label: fav ? 'Quitar de Mi lista' : 'Agregar a Mi lista', icon: fav ? 'check' : 'plus', action: () => this.onAction('red') },
        { label: 'Salir del canal', icon: 'home', action: close }
      ] : [
        { label: video.paused ? 'Seguir viendo' : 'Pausa', icon: video.paused ? 'play' : 'pause', action: togglePause },
        tracks ? { label: subtitlesOn ? 'Quitar subtítulos' : 'Poner subtítulos', icon: 'check', action: toggleSubtitles } : null,
        { label: 'Volver al inicio de la película', icon: 'restart', action: () => { try { video.currentTime = 0; } catch (e) { /* sin seek */ } } },
        { label: fav ? 'Quitar de Mi lista' : 'Agregar a Mi lista', icon: fav ? 'check' : 'plus', action: () => this.onAction('red') },
        { label: 'Salir', icon: 'home', action: close }
      ];
      return { title: item.name, items };
    },
    onAction(action) {
      // Lista de canales abierta: se queda con las flechas.
      if (chOpen()) {
        if (action === 'up') { chSel = (chSel - 1 + list.length) % list.length; paintList(); }
        else if (action === 'down') { chSel = (chSel + 1) % list.length; paintList(); }
        else if (action === 'enter') { closeList(); tune(chSel); }
        else if (action === 'right' || action === 'back' || action === 'left') closeList();
        return;
      }
      if (/^d[0-9]$/.test(action)) { typeDigit(action.slice(1)); return; }
      if (action === 'recall') { if (prevIndex >= 0) tune(prevIndex); return; }
      if (action === 'info') { showOsd(); return; }
      if (nextTimer) {
        if (action === 'enter' || action === 'playpause') { goNext(); return; }
        if (action === 'back' || action === 'stop') { close(); return; }
        return;
      }
      if (action === 'back' || action === 'stop') { close(); return; }
      if (action === 'up' || action === 'chup') { if (mode === 'live') zap(1); else showOsd(); return; }
      if (action === 'down' || action === 'chdown') { if (mode === 'live') zap(-1); else showOsd(); return; }
      if (action === 'left') { if (mode === 'live') openList(); else seekBy(-1); return; }
      if (action === 'right') { seekBy(1); return; }
      if (action === 'rw') { seekBy(-1, 60); return; }
      if (action === 'ff') { seekBy(1, 60); return; }
      if (action === 'enter' || action === 'playpause') { togglePause(); return; }
      if (action === 'green') { toggleSubtitles(); return; }
      if (action === 'red') {
        app.toast(toggleFavorite(item) ? 'Agregado a Mi lista' : 'Quitado de Mi lista');
        app.markDirty();
        renderInfo();
        showOsd();
        return;
      }
      showOsd();
    }
  };
}
