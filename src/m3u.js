// Parser de listas M3U extendidas, en el formato que publican iptv-org y Free-TV.
// Sin dependencias del DOM: se usa igual en la TV, en el navegador y en los tests de Node.

const ATTR_RE = /([\w-]+)="([^"]*)"/g;
// Letras en círculo que usa Free-TV como marcas: Ⓖ geo-bloqueado, Ⓢ SD, Ⓨ YouTube, Ⓣ Twitch.
const CIRCLED_RE = /[Ⓐ-ⓩ]/g;
const GEO_MARK = 'Ⓖ';

export function parseM3U(text) {
  const lines = String(text || '').split(/\r?\n/);
  const out = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.indexOf('#EXTINF') === 0) {
      cur = parseExtinf(line);
    } else if (line.indexOf('#EXTVLCOPT:') === 0) {
      if (cur) parseVlcOpt(cur, line.slice(11));
    } else if (line.charAt(0) !== '#' && cur) {
      cur.url = line;
      out.push(cur);
      cur = null;
    }
  }
  return out;
}

export function parseExtinf(line) {
  // Los atributos pueden traer comas dentro de comillas; el nombre empieza en la primera coma fuera de ellas.
  let inQuotes = false;
  let comma = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i);
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { comma = i; break; }
  }
  const head = comma >= 0 ? line.slice(0, comma) : line;
  const rawName = comma >= 0 ? line.slice(comma + 1).trim() : '';

  const attrs = {};
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(head))) attrs[m[1].toLowerCase()] = m[2];

  const info = cleanName(rawName || attrs['tvg-name'] || '');
  return {
    name: info.name,
    logo: attrs['tvg-logo'] || '',
    tvgId: attrs['tvg-id'] || '',
    country: (attrs['tvg-country'] || '').toLowerCase(),
    groups: splitGroups(attrs['group-title']),
    quality: info.quality,
    geo: info.geo,
    not247: info.not247,
    referrer: attrs['http-referrer'] || '',
    userAgent: attrs['http-user-agent'] || '',
    url: ''
  };
}

function parseVlcOpt(entry, opt) {
  const m = /^http-(referrer|user-agent)=(.*)$/i.exec(opt);
  if (!m) return;
  if (m[1].toLowerCase() === 'referrer') entry.referrer = m[2];
  else entry.userAgent = m[2];
}

function splitGroups(value) {
  return (value || '').split(';').map(s => s.trim()).filter(Boolean);
}

// "Canal 4 (1080p) [Geo-blocked]" -> { name: "Canal 4", quality: "1080p", geo: true }
export function cleanName(raw) {
  let quality = '';
  let geo = raw.indexOf(GEO_MARK) >= 0;
  let not247 = false;
  const name = raw
    .replace(/\((\d{3,4}p)\)/i, (_, q) => { quality = q.toLowerCase(); return ''; })
    .replace(/\[([^\]]*)\]/g, (_, tag) => {
      const t = tag.toLowerCase();
      if (t.indexOf('geo') >= 0) geo = true;
      if (t.indexOf('24/7') >= 0) not247 = true;
      return '';
    })
    .replace(CIRCLED_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, quality, geo, not247 };
}
