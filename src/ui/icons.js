// Iconos SVG en línea: los emoji no se ven igual (o no se ven) en todos los televisores.
const svg = body => '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">' + body + '</svg>';

export const ICONS = {
  search: svg('<path d="M10 3a7 7 0 015.6 11.2l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z"/>'),
  home: svg('<path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/>'),
  live: svg('<path d="M3 6h18v12H3zM8 2l4 3 4-3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5"/>'),
  movie: svg('<path d="M4 4h16v16H4zM4 8h16M4 16h16M8 4v4M12 4v4M16 4v4M8 16v4M12 16v4M16 16v4" fill="none" stroke="currentColor" stroke-width="2"/>'),
  anime: svg('<path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/><path d="M19 2l.9 2.1L22 5l-2.1.9L19 8l-.9-2.1L16 5l2.1-.9z"/>'),
  // Bandera dominicana (a color, no usa currentColor).
  flag: '<svg viewBox="0 0 24 16" width="100%" height="100%" aria-hidden="true"><rect width="24" height="16" rx="2" fill="#fff"/><rect x="0" y="0" width="10" height="6" fill="#002d62"/><rect x="14" y="0" width="10" height="6" fill="#ce1126"/><rect x="0" y="10" width="10" height="6" fill="#ce1126"/><rect x="14" y="10" width="10" height="6" fill="#002d62"/><circle cx="12" cy="8" r="1.6" fill="#2e7d32"/></svg>',
  star: svg('<path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2 6.1 20.5l1.4-6.6-5-4.5 6.6-.7z"/>'),
  gear: svg('<path d="M12 8.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm8.6 2l-2-.4a6.9 6.9 0 00-.6-1.5l1.1-1.7-1.9-1.9-1.7 1.1c-.5-.3-1-.5-1.5-.6l-.4-2h-2.7l-.4 2c-.5.1-1 .3-1.5.6L7.3 5l-1.9 1.9L6.5 8.6c-.3.5-.5 1-.6 1.5l-2 .4v2.7l2 .4c.1.5.3 1 .6 1.5l-1.1 1.7 1.9 1.9 1.7-1.1c.5.3 1 .5 1.5.6l.4 2h2.7l.4-2c.5-.1 1-.3 1.5-.6l1.7 1.1 1.9-1.9-1.1-1.7c.3-.5.5-1 .6-1.5l2-.4z"/>'),
  play: svg('<path d="M7 4l13 8-13 8z"/>'),
  pause: svg('<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'),
  restart: svg('<path d="M12 4a8 8 0 11-7.4 5h2.2A6 6 0 1012 6v3L7 5l5-4z"/>'),
  prev: svg('<path d="M6 5h2v14H6zM20 5L9 12l11 7z"/>'),
  next: svg('<path d="M16 5h2v14h-2zM4 5l11 7-11 7z"/>'),
  plus: svg('<path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/>'),
  check: svg('<path d="M9 16.2l-4.2-4.2-1.4 1.4L9 19 21 7l-1.4-1.4z"/>')
};

export function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.innerHTML = ICONS[name] || '';
  return span;
}
