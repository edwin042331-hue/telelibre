// Apartado "República Dominicana": todos los canales dominicanos ordenados como los busca un dominicano.
import { normalizeText, sortChannels } from './catalog.js';
import { nowNext, guideId } from './epg.js';
import { rankByHealth } from './smart.js';

// Los canales grandes, en el orden del dial dominicano.
const BIG = [
  'teleantillas', 'telemicro', 'certv', 'canal 4', 'antena 7', 'antena latina', 'color vision', 'telesistema',
  'telecentro', 'digital 15', 'telefuturo', 'teleuniverso', 'cdn', 'supercanal', 'rnn', 'teleradio america',
  'coral', 'telemedios', 'teleunion', 'ntn', 'tele7', 'mega tv', 'vtv', 'telecanal'
];

function bigRank(ch) {
  // Palabras completas: "canal 4" no debe coincidir con "Canal 49".
  const n = ' ' + normalizeText(ch.name).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  for (let i = 0; i < BIG.length; i++) if (n.indexOf(' ' + BIG[i] + ' ') >= 0) return i;
  return -1;
}

function alphabetical(list) {
  return list.slice().sort((a, b) => {
    const x = normalizeText(a.name);
    const y = normalizeText(b.name);
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

// Canales con programación, los grandes primero y sin duplicar la misma guía (Antena 7 / Antena 7 HD).
export function guideChannels(channels) {
  const seen = {};
  return channels
    .filter(c => c.country === 'do' && guideId(c))
    .sort((a, b) => {
      const ra = bigRank(a);
      const rb = bigRank(b);
      return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb) || (parseInt(b.quality, 10) || 0) - (parseInt(a.quality, 10) || 0);
    })
    .filter(c => {
      const id = guideId(c);
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
}

export function buildDominicanRows(channels) {
  const rd = channels.filter(c => c.country === 'do');
  if (!rd.length) return [];
  const rows = [];

  const big = rd.filter(c => bigRank(c) >= 0).sort((a, b) => bigRank(a) - bigRank(b) || (parseInt(b.quality, 10) || 0) - (parseInt(a.quality, 10) || 0));
  if (big.length) rows.push({ id: 'rd:big', title: 'Los grandes de RD', items: rankByHealth(big) });

  const live = rd.filter(c => nowNext(c));
  if (live.length) rows.push({ id: 'rd:now', title: 'Ahora en la TV dominicana', items: live });

  const byCat = [
    ['news', 'Noticias de RD'], ['sports', 'Deportes'], ['entertainment', 'Entretenimiento y variedades'],
    ['music', 'Música dominicana'], ['kids', 'Infantil'], ['religious', 'Cristianos y religiosos'], ['general', 'Generales y regionales']
  ];
  byCat.forEach(c => {
    const items = rd.filter(ch => ch.cats.indexOf(c[0]) >= 0);
    if (items.length >= 3) rows.push({ id: 'rd:' + c[0], title: c[1], items: rankByHealth(sortChannels(items)) });
  });

  rows.push({ id: 'rd:all', title: 'Todos los canales de RD (A-Z)', items: alphabetical(rd) });
  return rows;
}
