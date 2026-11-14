// Catálogo y filas para la sección Poseidon (Estrenos de Cine HD y CAM)
import { getText } from './net.js';
import { state } from './store.js';

// Normaliza las propiedades para asegurar compatibilidad total con el motor de filas y fichas
export function formatPoseidonMovie(m) {
  const poster = m.poster || m.img || '';
  const art = m.art || poster;
  const overview = m.overview || m.summary || '';
  const runtime = m.runtime || m.duration || 7200;
  return Object.assign({}, m, {
    key: m.key,
    type: 'movie',
    name: m.name,
    year: m.year,
    quality: (m.quality || 'HD').toUpperCase(),
    runtime,
    duration: runtime,
    genres: Array.isArray(m.genres) ? m.genres : [],
    regions: Array.isArray(m.regions) ? m.regions : [],
    subs: !!m.subs,
    poster,
    art,
    img: poster,
    overview,
    summary: overview,
    src: 'poseidon',
    stream: m.stream || m.url || '',
    url: m.url || m.stream || '',
    lang: m.lang || 'es'
  });
}

// Catálogo base de estrenos con servidores reales y calidades verificadas (HD / CAM)
export const INITIAL_POSEIDON_MOVIES = [
  {
    "key": "poseidon:1567605",
    "type": "movie",
    "name": "Ebenezer: Los fantasmas de Navidad",
    "year": 2026,
    "quality": "CAM",
    "runtime": 6900,
    "duration": 6900,
    "genres": [
      "scifi",
      "comedia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/743rqTOaOxUCUVut7fyaf94MuMk.jpg",
    "art": "https://image.tmdb.org/t/p/original/bF6nvHAt2jU7PnkOI4cnaUF2DZn.jpg",
    "img": "https://image.tmdb.org/t/p/original/743rqTOaOxUCUVut7fyaf94MuMk.jpg",
    "overview": "Una emocionante historia de fantasmas ambientada en el Londres de Dickens, que sigue el viaje sobrenatural de un hombre para enfrentar su pasado, presente y futuro mientras lucha por una segunda oportunidad de redención.",
    "summary": "Una emocionante historia de fantasmas ambientada en el Londres de Dickens, que sigue el viaje sobrenatural de un hombre para enfrentar su pasado, presente y futuro mientras lucha por una segunda oportunidad de redención.",
    "src": "poseidon",
    "stream": "vidara:sDHArCVY2ie4y",
    "url": "vidara:sDHArCVY2ie4y",
    "lang": "es"
  },
  {
    "key": "poseidon:134375",
    "type": "movie",
    "name": "Mi pobre angelito 5",
    "year": 2012,
    "quality": "HD",
    "runtime": 5400,
    "duration": 5400,
    "genres": [
      "comedia",
      "familia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/noVIXTcEr9JAbBi5AedRAfO4l0S.jpg",
    "art": "https://image.tmdb.org/t/p/original/4ydw24y7Wd0UJZOrd2FuRFqkfs.jpg",
    "img": "https://image.tmdb.org/t/p/original/noVIXTcEr9JAbBi5AedRAfO4l0S.jpg",
    "overview": "Finn Baxter y su familia se mudan de California a Maine a su nueva casa. Finn está aterrorizado y cree que la casa está embrujada. Mientras que instala trampas para coger al \"fantasma\", sus padres se quedan varados en la ciudad y Finn se quedá solo en casa con su hermana. Lo que no esperaban, es que su casa se convierte en el objetivo de tres ladrones en busca de un botín especial.",
    "summary": "Finn Baxter y su familia se mudan de California a Maine a su nueva casa. Finn está aterrorizado y cree que la casa está embrujada. Mientras que instala trampas para coger al \"fantasma\", sus padres se quedan varados en la ciudad y Finn se quedá solo en casa con su hermana. Lo que no esperaban, es que su casa se convierte en el objetivo de tres ladrones en busca de un botín especial.",
    "src": "poseidon",
    "stream": "vidara:unoF8h4gi0I4D",
    "url": "vidara:unoF8h4gi0I4D",
    "lang": "es"
  },
  {
    "key": "poseidon:12536",
    "type": "movie",
    "name": "Mi pobre angelito 4",
    "year": 2002,
    "quality": "HD",
    "runtime": 5040,
    "duration": 5040,
    "genres": [
      "comedia",
      "familia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/A1tJw4mZbkiZDxJfU8I3XiMJS9p.jpg",
    "art": "https://image.tmdb.org/t/p/original/171wf8HVXZAIScPf9zJyrXpxgRB.jpg",
    "img": "https://image.tmdb.org/t/p/original/A1tJw4mZbkiZDxJfU8I3XiMJS9p.jpg",
    "overview": "Después del reciente divorcio de sus padres, Kevin decide pasar la Navidad en casa de Natalie, la nueva novia de su padre, una casa equipada con la más moderna tecnología. Con la ayuda de esta tecnología y haciendo uso de su habitual ingenio, Kevin deberá hacer frente a unos ladrones, además de intentar conseguir que sus progenitores se reconcilien. Nueva entrega de la popular saga de \"Solo en casa\", que en esta ocasión, y tras perder progresivamente calidad y taquilla en las anteriores, ya se hizo directamente para la televisión y el mercado de video.",
    "summary": "Después del reciente divorcio de sus padres, Kevin decide pasar la Navidad en casa de Natalie, la nueva novia de su padre, una casa equipada con la más moderna tecnología. Con la ayuda de esta tecnología y haciendo uso de su habitual ingenio, Kevin deberá hacer frente a unos ladrones, además de intentar conseguir que sus progenitores se reconcilien. Nueva entrega de la popular saga de \"Solo en casa\", que en esta ocasión, y tras perder progresivamente calidad y taquilla en las anteriores, ya se hizo directamente para la televisión y el mercado de video.",
    "src": "poseidon",
    "stream": "vidara:lZuthnoB0koYL",
    "url": "vidara:lZuthnoB0koYL",
    "lang": "es"
  },
  {
    "key": "poseidon:1381273",
    "type": "movie",
    "name": "Tigre De Papel",
    "year": 2026,
    "quality": "CAM",
    "runtime": 6900,
    "duration": 6900,
    "genres": [
      "crimen",
      "drama",
      "suspenso"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/p6oLmq5KmuWY6uRXBQBL2q30jia.jpg",
    "art": "https://image.tmdb.org/t/p/original/wg4Qr8ppCXDgCEgupW9lNsUijF7.jpg",
    "img": "https://image.tmdb.org/t/p/original/p6oLmq5KmuWY6uRXBQBL2q30jia.jpg",
    "overview": "Dos hermanos persiguen el sueño americano, pero se ven envueltos en una peligrosa trama de la mafia rusa que aterroriza a su familia, poniendo a prueba su vínculo a medida que la traición se hace posible.",
    "summary": "Dos hermanos persiguen el sueño americano, pero se ven envueltos en una peligrosa trama de la mafia rusa que aterroriza a su familia, poniendo a prueba su vínculo a medida que la traición se hace posible.",
    "src": "poseidon",
    "stream": "vidara:me2pyEd1ngnIm",
    "url": "vidara:me2pyEd1ngnIm",
    "lang": "es"
  },
  {
    "key": "poseidon:1231623",
    "type": "movie",
    "name": "A Christmas Castle Proposal: A Royal in Paradise II",
    "year": 2024,
    "quality": "HD",
    "runtime": 4980,
    "duration": 4980,
    "genres": [
      "romance",
      "comedia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/f1vhK5Lz3N7OIETraPjnTqZtZkN.jpg",
    "art": "https://image.tmdb.org/t/p/original/5fTOeA4qulMp0sjwzuKsgl1ihoV.jpg",
    "img": "https://image.tmdb.org/t/p/original/f1vhK5Lz3N7OIETraPjnTqZtZkN.jpg",
    "overview": "Despite busy schedules causing distance, Olivia and Prince Alexander travel to Torovia for Christmas with his family. Clashing cultures between their families lead to various mishaps.",
    "summary": "Despite busy schedules causing distance, Olivia and Prince Alexander travel to Torovia for Christmas with his family. Clashing cultures between their families lead to various mishaps.",
    "src": "poseidon",
    "stream": "vidara:bU8yq3BpPf4ia",
    "url": "vidara:bU8yq3BpPf4ia",
    "lang": "es"
  },
  {
    "key": "poseidon:1406492",
    "type": "movie",
    "name": "La venganza del Charro Negro",
    "year": 2026,
    "quality": "CAM",
    "runtime": 5640,
    "duration": 5640,
    "genres": [
      "animacion",
      "scifi",
      "familia",
      "terror"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/in3F0moyJ5EDpwRmXRFV9UVac1B.jpg",
    "art": "https://image.tmdb.org/t/p/original/hWiWUU8GydzJkapzmBL6JMV7J6n.jpg",
    "img": "https://image.tmdb.org/t/p/original/in3F0moyJ5EDpwRmXRFV9UVac1B.jpg",
    "overview": "Después de varios años, el temible Charro Negro regresa con un nuevo propósito: vengarse de Leo San Juan y cobrar una deuda que ha quedado pendiente. Para lograrlo, liberará a algunas de las criaturas y leyendas sobrenaturales que Leo ha enfrentado a lo largo de sus aventuras, obligándolo a reencontrarse con sus antiguos enemigos. Pero esta vez, el Charro Negro tiene un objetivo mucho más personal: su hermano, Nando. Mientras las leyendas se desatan y el peligro crece, Leo deberá proteger a su hermano y reunir nuevamente a sus amigos para descubrir el verdadero plan del Charro Negro. En una aventura que llevará al grupo al límite, Leo tendrá que enfrentarse una vez más a las criaturas de su pasado y descubrir que, para derrotar al Charro Negro, no solo tendrá que demostrar su valentía, sino luchar por aquello que más quiere.",
    "summary": "Después de varios años, el temible Charro Negro regresa con un nuevo propósito: vengarse de Leo San Juan y cobrar una deuda que ha quedado pendiente. Para lograrlo, liberará a algunas de las criaturas y leyendas sobrenaturales que Leo ha enfrentado a lo largo de sus aventuras, obligándolo a reencontrarse con sus antiguos enemigos. Pero esta vez, el Charro Negro tiene un objetivo mucho más personal: su hermano, Nando. Mientras las leyendas se desatan y el peligro crece, Leo deberá proteger a su hermano y reunir nuevamente a sus amigos para descubrir el verdadero plan del Charro Negro. En una aventura que llevará al grupo al límite, Leo tendrá que enfrentarse una vez más a las criaturas de su pasado y descubrir que, para derrotar al Charro Negro, no solo tendrá que demostrar su valentía, sino luchar por aquello que más quiere.",
    "src": "poseidon",
    "stream": "vidara:SMerlbgLRKm6r",
    "url": "vidara:SMerlbgLRKm6r",
    "lang": "es"
  },
  {
    "key": "poseidon:1757324",
    "type": "movie",
    "name": "Insecta",
    "year": 2026,
    "quality": "HD",
    "runtime": 5040,
    "duration": 5040,
    "genres": [
      "terror"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/qTnP6MKVuhPeSnpU4hl2I9uwmzK.jpg",
    "art": "https://image.tmdb.org/t/p/original/tvpnFUro88R1AA3Nal3YsQoKnSZ.jpg",
    "img": "https://image.tmdb.org/t/p/original/qTnP6MKVuhPeSnpU4hl2I9uwmzK.jpg",
    "overview": "Al regresar a una finca aislada para despedirse de su padre moribundo, una escritora de terror descubre que el monstruoso insecto imaginario que la atormentó en su infancia acaso sea más real de lo que pensaba.",
    "summary": "Al regresar a una finca aislada para despedirse de su padre moribundo, una escritora de terror descubre que el monstruoso insecto imaginario que la atormentó en su infancia acaso sea más real de lo que pensaba.",
    "src": "poseidon",
    "stream": "vidara:4Y2q4yZDtxGWw",
    "url": "vidara:4Y2q4yZDtxGWw",
    "lang": "es"
  },
  {
    "key": "poseidon:1050981",
    "type": "movie",
    "name": "Ser Heumann",
    "year": 2026,
    "quality": "HD",
    "runtime": 7620,
    "duration": 7620,
    "genres": [
      "drama",
      "historia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/bFw3y0v6xl24qxG36ve1ZjNnufo.jpg",
    "art": "https://image.tmdb.org/t/p/original/25aB8RXP4mfQLFRSuEEhk0d0sTC.jpg",
    "img": "https://image.tmdb.org/t/p/original/bFw3y0v6xl24qxG36ve1ZjNnufo.jpg",
    "overview": "La valiente Judy Heumann convierte su indignación en revolución. En 1977, manifestantes por los derechos de las personas con discapacidad y ella levantaron la voz: El sistema es el que está roto, nosotros no.",
    "summary": "La valiente Judy Heumann convierte su indignación en revolución. En 1977, manifestantes por los derechos de las personas con discapacidad y ella levantaron la voz: El sistema es el que está roto, nosotros no.",
    "src": "poseidon",
    "stream": "vidara:BTEFRenphqMbL",
    "url": "vidara:BTEFRenphqMbL",
    "lang": "es"
  },
  {
    "key": "poseidon:1780407",
    "type": "movie",
    "name": "Snoopy presenta: 12 días de Snoopy",
    "year": 2026,
    "quality": "HD",
    "runtime": 1980,
    "duration": 1980,
    "genres": [
      "animacion",
      "familia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/bC0Rb0Mls2b493O3ic2IypUFo57.jpg",
    "art": "https://image.tmdb.org/t/p/original/AkcxwZUldIwD6JSUknmzEgeoN4.jpg",
    "img": "https://image.tmdb.org/t/p/original/bC0Rb0Mls2b493O3ic2IypUFo57.jpg",
    "overview": "Ansioso por salir de la lista negra de Santa, Snoopy se esfuerza por ser el beagle más amable del pueblo.",
    "summary": "Ansioso por salir de la lista negra de Santa, Snoopy se esfuerza por ser el beagle más amable del pueblo.",
    "src": "poseidon",
    "stream": "vidara:vaNz9a0XMWDQw",
    "url": "vidara:vaNz9a0XMWDQw",
    "lang": "es"
  },
  {
    "key": "poseidon:1397485",
    "type": "movie",
    "name": "Chicas como chicas",
    "year": 2026,
    "quality": "HD",
    "runtime": 5700,
    "duration": 5700,
    "genres": [
      "romance",
      "drama"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/xSqTUmD1gABnhQ0ciT735y1IVlF.jpg",
    "art": "https://image.tmdb.org/t/p/original/hSdK33Mjsdfb8TpoUTI3A3OE3RO.jpg",
    "img": "https://image.tmdb.org/t/p/original/xSqTUmD1gABnhQ0ciT735y1IVlF.jpg",
    "overview": "Coley, una joven de 17 años del rural Oregón, enfrenta la intimidad tras la muerte de su madre. Conocer a Sonya despierta nuevos sentimientos, pero las dudas sobre sí misma dificultan su conexión.",
    "summary": "Coley, una joven de 17 años del rural Oregón, enfrenta la intimidad tras la muerte de su madre. Conocer a Sonya despierta nuevos sentimientos, pero las dudas sobre sí misma dificultan su conexión.",
    "src": "poseidon",
    "stream": "vidara:HWGsagq9GNHqZ",
    "url": "vidara:HWGsagq9GNHqZ",
    "lang": "es"
  },
  {
    "key": "poseidon:1513319",
    "type": "movie",
    "name": "Hollywood Grit",
    "year": 2025,
    "quality": "HD",
    "runtime": 6120,
    "duration": 6120,
    "genres": [
      "accion",
      "suspenso"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/uImKVUa0IGSC670QhcWadT5Eh9p.jpg",
    "art": "https://image.tmdb.org/t/p/original/o1jOMbNjDjkUZorJ8LxDjSJIrRg.jpg",
    "img": "https://image.tmdb.org/t/p/original/uImKVUa0IGSC670QhcWadT5Eh9p.jpg",
    "overview": "When his daughter vanishes from a Hollywood jazz club, a detective must battle mobsters, starlets, and his own demons to unearth the sinister truth lurking behind LA's neon lights.",
    "summary": "When his daughter vanishes from a Hollywood jazz club, a detective must battle mobsters, starlets, and his own demons to unearth the sinister truth lurking behind LA's neon lights.",
    "src": "poseidon",
    "stream": "vidara:La6CA8XvLM7Fn",
    "url": "vidara:La6CA8XvLM7Fn",
    "lang": "es"
  },
  {
    "key": "poseidon:1447053",
    "type": "movie",
    "name": "Яга на нашу голову",
    "year": 2025,
    "quality": "HD",
    "runtime": 5400,
    "duration": 5400,
    "genres": [
      "scifi",
      "familia",
      "comedia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/j3z0cawV5kaxVuTqKkKeWOqAvCS.jpg",
    "art": "https://image.tmdb.org/t/p/original/fHxjM3gWpC7BfEuPUr30RjyemBi.jpg",
    "img": "https://image.tmdb.org/t/p/original/j3z0cawV5kaxVuTqKkKeWOqAvCS.jpg",
    "overview": "Father Frost decides to send Yaga to be re-educated by Petya, a boy who has his own problems - he wants to reconcile his parents before the New Year. Petya's parents spend more time working than they do with their family, and Petya wants to fix this situation before the New Year.",
    "summary": "Father Frost decides to send Yaga to be re-educated by Petya, a boy who has his own problems - he wants to reconcile his parents before the New Year. Petya's parents spend more time working than they do with their family, and Petya wants to fix this situation before the New Year.",
    "src": "poseidon",
    "stream": "vidara:VrmkS6hu9g5mA",
    "url": "vidara:VrmkS6hu9g5mA",
    "lang": "es"
  },
  {
    "key": "poseidon:1518204",
    "type": "movie",
    "name": "Allen",
    "year": 2026,
    "quality": "HD",
    "runtime": 6300,
    "duration": 6300,
    "genres": [
      "scifi",
      "aventura",
      "comedia",
      "familia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/alhhrpj1PSAn5bfz4Os1k7Bweoj.jpg",
    "art": "https://image.tmdb.org/t/p/original/51fGmBW7WjyJouP9TjIcxRpCUNk.jpg",
    "img": "https://image.tmdb.org/t/p/original/alhhrpj1PSAn5bfz4Os1k7Bweoj.jpg",
    "overview": "El mejor amigo de la infancia de Petey, un extraterrestre llamado Allen, desapareció sin despedirse. Dos décadas más tarde, Allen regresa con un secreto que podría cambiar el mundo, lo que obliga a Petey a madurar de una vez por todas y ayudar a salvarlo.",
    "summary": "El mejor amigo de la infancia de Petey, un extraterrestre llamado Allen, desapareció sin despedirse. Dos décadas más tarde, Allen regresa con un secreto que podría cambiar el mundo, lo que obliga a Petey a madurar de una vez por todas y ayudar a salvarlo.",
    "src": "poseidon",
    "stream": "streamwish:81xmw1ffstbp",
    "url": "streamwish:81xmw1ffstbp",
    "lang": "es"
  },
  {
    "key": "poseidon:1564004",
    "type": "movie",
    "name": "Rodeo Christmas Romance",
    "year": 2025,
    "quality": "HD",
    "runtime": 5220,
    "duration": 5220,
    "genres": [
      "romance"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/mP9JtC1d3gySB7Lqw8lKUYOTNg1.jpg",
    "art": "https://image.tmdb.org/t/p/original/vSxmN8c7fLeWq209UfYJNvEiWf8.jpg",
    "img": "https://image.tmdb.org/t/p/original/mP9JtC1d3gySB7Lqw8lKUYOTNg1.jpg",
    "overview": "When fiercely independent equestrian Emma finds herself ranch-sitting for a friend while caring for her injured horse over Christmas, she clashes with brooding veteran Noal — only to discover that the magic of the season may be what they need to heal their hearts.",
    "summary": "When fiercely independent equestrian Emma finds herself ranch-sitting for a friend while caring for her injured horse over Christmas, she clashes with brooding veteran Noal — only to discover that the magic of the season may be what they need to heal their hearts.",
    "src": "poseidon",
    "stream": "streamwish:m7qqk8ebb0so",
    "url": "streamwish:m7qqk8ebb0so",
    "lang": "es"
  },
  {
    "key": "poseidon:1757174",
    "type": "movie",
    "name": "Bara till jul",
    "year": 2026,
    "quality": "HD",
    "runtime": 6180,
    "duration": 6180,
    "genres": [
      "romance",
      "comedia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/xKhsKS0VY21uHXTBk5Wyrx9VfPZ.jpg",
    "art": "https://image.tmdb.org/t/p/original/4BsOLok9WaTTTcSpmoMtCLERScS.jpg",
    "img": "https://image.tmdb.org/t/p/original/xKhsKS0VY21uHXTBk5Wyrx9VfPZ.jpg",
    "overview": "Dos hermanas que son como la noche y el día se ven obligadas a intercambiar sus vidas unas semanas antes de Navidad. En su nuevo entorno, ambas lidian con lo que han hecho hasta ahora y encuentran el amor donde menos se lo esperan.",
    "summary": "Dos hermanas que son como la noche y el día se ven obligadas a intercambiar sus vidas unas semanas antes de Navidad. En su nuevo entorno, ambas lidian con lo que han hecho hasta ahora y encuentran el amor donde menos se lo esperan.",
    "src": "poseidon",
    "stream": "vidara:3HK3aORmlWLQy",
    "url": "vidara:3HK3aORmlWLQy",
    "lang": "es"
  },
  {
    "key": "poseidon:1616687",
    "type": "movie",
    "name": "Serangan Balik",
    "year": 2026,
    "quality": "HD",
    "runtime": 8220,
    "duration": 8220,
    "genres": [
      "accion",
      "crimen",
      "suspenso"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/6cHYHIv2tcUAZsyzUi5Hcwa1IAB.jpg",
    "art": "https://image.tmdb.org/t/p/original/umxN2kMcUm6VoxSOdcEcQoXuC4q.jpg",
    "img": "https://image.tmdb.org/t/p/original/6cHYHIv2tcUAZsyzUi5Hcwa1IAB.jpg",
    "overview": "Un exsoldado y sus nietos luchan contra despiadados criminales en un pueblo aislado. Si quieren sobrevivir, también deben enfrentarse a sus miedos y a los remordimientos.",
    "summary": "Un exsoldado y sus nietos luchan contra despiadados criminales en un pueblo aislado. Si quieren sobrevivir, también deben enfrentarse a sus miedos y a los remordimientos.",
    "src": "poseidon",
    "stream": "streamwish:oxsn0s6ts3vn",
    "url": "streamwish:oxsn0s6ts3vn",
    "lang": "es"
  },
  {
    "key": "poseidon:348898",
    "type": "movie",
    "name": "Marshall's Miracle",
    "year": 2015,
    "quality": "HD",
    "runtime": 5400,
    "duration": 5400,
    "genres": [
      "familia"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/dXOWIURPHNtRogxmv44oTE9zVa8.jpg",
    "art": "https://image.tmdb.org/t/p/original/phwfJWLQnsDAkkeDMP6ncFBRQQT.jpg",
    "img": "https://image.tmdb.org/t/p/original/dXOWIURPHNtRogxmv44oTE9zVa8.jpg",
    "overview": "A 13-year-old boy becomes the target of bullies at his new school and is feeling hopeless, until he finds Marshall being caged up by a dog-hoarder in deplorable conditions. Finn knows he must rescue Marshall, but he has been abused by the other dogs and needs to see the vet right away. The bond of friendship is immediate.",
    "summary": "A 13-year-old boy becomes the target of bullies at his new school and is feeling hopeless, until he finds Marshall being caged up by a dog-hoarder in deplorable conditions. Finn knows he must rescue Marshall, but he has been abused by the other dogs and needs to see the vet right away. The bond of friendship is immediate.",
    "src": "poseidon",
    "stream": "vidara:mK702aRdi2RbU",
    "url": "vidara:mK702aRdi2RbU",
    "lang": "es"
  },
  {
    "key": "poseidon:41215",
    "type": "movie",
    "name": "Black Death: Viaje al infierno",
    "year": 2010,
    "quality": "HD",
    "runtime": 6120,
    "duration": 6120,
    "genres": [
      "drama",
      "historia",
      "terror"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/qVsREYL5aKtbHixFaV3tvpNB7D8.jpg",
    "art": "https://image.tmdb.org/t/p/original/dQhVu7ZSgvgAuYAEoD9mXvqpp1.jpg",
    "img": "https://image.tmdb.org/t/p/original/qVsREYL5aKtbHixFaV3tvpNB7D8.jpg",
    "overview": "A mediados del siglo XIV, Inglaterra se ve asolada por la terrible Peste Negra. En un mundo apocalíptico, dominado por las supersticiones, el joven monje Osmund recibe el encargo de conducir a Ulric, un temible caballero, y a su grupo de mercenarios a un pueblo próximo a un pantano, en el que, según los rumores, los muertos vuelven a la vida.",
    "summary": "A mediados del siglo XIV, Inglaterra se ve asolada por la terrible Peste Negra. En un mundo apocalíptico, dominado por las supersticiones, el joven monje Osmund recibe el encargo de conducir a Ulric, un temible caballero, y a su grupo de mercenarios a un pueblo próximo a un pantano, en el que, según los rumores, los muertos vuelven a la vida.",
    "src": "poseidon",
    "stream": "streamwish:heamhneo694c",
    "url": "streamwish:heamhneo694c",
    "lang": "es"
  },
  {
    "key": "poseidon:56135",
    "type": "movie",
    "name": "Al filo de la navaja",
    "year": 1946,
    "quality": "HD",
    "runtime": 8700,
    "duration": 8700,
    "genres": [
      "drama",
      "romance"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/20z9Ib3p2TUQR4IhptmWW1nmeSv.jpg",
    "art": "https://image.tmdb.org/t/p/original/7P319Zq0RwYsAHmSjLndcOSW9kl.jpg",
    "img": "https://image.tmdb.org/t/p/original/20z9Ib3p2TUQR4IhptmWW1nmeSv.jpg",
    "overview": "Los horrores de la guerra hacen que Larry Darrell (Tyrone Power) lo abandone todo, incluso a los que han formado parte de su vida. Cuando, tras la guerra, regresa a su patria, las dificultades para adaptarse de nuevo a la sociedad lo empujan a emprender un largo viaje en busca de la verdad y la paz espiritual que lo llevará desde los sórdidos barrios de París hasta las nevadas cumbres del Himalaya. Adaptación de la célebre novela de Somerset Maugham.",
    "summary": "Los horrores de la guerra hacen que Larry Darrell (Tyrone Power) lo abandone todo, incluso a los que han formado parte de su vida. Cuando, tras la guerra, regresa a su patria, las dificultades para adaptarse de nuevo a la sociedad lo empujan a emprender un largo viaje en busca de la verdad y la paz espiritual que lo llevará desde los sórdidos barrios de París hasta las nevadas cumbres del Himalaya. Adaptación de la célebre novela de Somerset Maugham.",
    "src": "poseidon",
    "stream": "vidara:p4OpCHfpYXRzV",
    "url": "vidara:p4OpCHfpYXRzV",
    "lang": "es"
  },
  {
    "key": "poseidon:9674",
    "type": "movie",
    "name": "El Aro 0: Nacimiento",
    "year": 2000,
    "quality": "HD",
    "runtime": 5940,
    "duration": 5940,
    "genres": [
      "terror",
      "suspenso",
      "drama"
    ],
    "regions": [],
    "subs": false,
    "poster": "https://image.tmdb.org/t/p/original/x0ZrQmfBHgF0VA8en7K6tpnDGIT.jpg",
    "art": "https://image.tmdb.org/t/p/original/noRX8VyyAFK1tt0DQSq5qy1tE10.jpg",
    "img": "https://image.tmdb.org/t/p/original/x0ZrQmfBHgF0VA8en7K6tpnDGIT.jpg",
    "overview": "Los miembros de una compañía de teatro son presa del poder demoníaco del nuevo compañero. De la serie japonesa \"Ring\".",
    "summary": "Los miembros de una compañía de teatro son presa del poder demoníaco del nuevo compañero. De la serie japonesa \"Ring\".",
    "src": "poseidon",
    "stream": "vidara:kgacLpLTCJXhw",
    "url": "vidara:kgacLpLTCJXhw",
    "lang": "es"
  }
];

let cachedMovies = null;

// Carga el catálogo de Poseidon (remoto si existe, o inicial local)
export function loadPoseidonCatalog() {
  if (cachedMovies) return Promise.resolve(cachedMovies);
  const REMOTE_URL = 'https://edwin042331-hue.github.io/telelibre/poseidon.json';

  return getText(REMOTE_URL + '?t=' + Date.now(), 2000)
    .then(text => {
      try {
        const remote = JSON.parse(text);
        if (Array.isArray(remote) && remote.length) {
          cachedMovies = remote.map(formatPoseidonMovie);
          return cachedMovies;
        }
      } catch (e) { /* fallback a local */ }
      cachedMovies = INITIAL_POSEIDON_MOVIES.map(formatPoseidonMovie);
      return cachedMovies;
    })
    .catch(() => {
      cachedMovies = INITIAL_POSEIDON_MOVIES.map(formatPoseidonMovie);
      return cachedMovies;
    });
}

export function getPoseidonMoviesSync() {
  if (!cachedMovies) cachedMovies = INITIAL_POSEIDON_MOVIES.map(formatPoseidonMovie);
  return cachedMovies;
}

// Organiza las películas en filas temáticas por AÑO y por GÉNERO
export function buildPoseidonRows(movies) {
  if (state.settings && state.settings.sources && state.settings.sources['poseidon'] === false) {
    return [];
  }
  const list = movies || getPoseidonMoviesSync();
  const rows = [];

  // Fila 1: Todos los estrenos disponibles
  rows.push({
    id: 'ps:estrenos',
    title: '🔱 Todos los Estrenos de Cine (' + list.length + ')',
    items: list
  });

  // Fila 2: Estrenos 2026
  const y2026 = list.filter(m => m.year === 2026);
  if (y2026.length >= 2) {
    rows.push({
      id: 'ps:y2026',
      title: '📅 Estrenos 2026',
      items: y2026
    });
  }

  // Fila 3: Lo Mejor de 2025
  const y2025 = list.filter(m => m.year === 2025);
  if (y2025.length >= 2) {
    rows.push({
      id: 'ps:y2025',
      title: '📅 Lo Mejor de 2025',
      items: y2025
    });
  }

  // Fila 4: Estrenos 2024
  const y2024 = list.filter(m => m.year === 2024);
  if (y2024.length >= 2) {
    rows.push({
      id: 'ps:y2024',
      title: '🎬 Estrenos 2024',
      items: y2024
    });
  }

  // Fila 5: Disponibles en HD 1080p
  const hd = list.filter(m => (m.quality || '').toUpperCase() === 'HD');
  if (hd.length >= 2) {
    rows.push({
      id: 'ps:hd',
      title: '💎 Disponibles en HD 1080p',
      items: hd
    });
  }

  // Fila 6: Directo del Cine (CAM)
  const cam = list.filter(m => (m.quality || '').toUpperCase() === 'CAM');
  if (cam.length >= 2) {
    rows.push({
      id: 'ps:cam',
      title: '🎟️ Directo del Cine (CAM)',
      items: cam
    });
  }

  // Fila 7: Acción y Aventura
  const accion = list.filter(m => (m.genres || []).indexOf('accion') >= 0 || (m.genres || []).indexOf('aventura') >= 0);
  if (accion.length >= 2) {
    rows.push({
      id: 'ps:accion',
      title: '💥 Acción y Aventura',
      items: accion
    });
  }

  // Fila 8: Terror y Suspenso
  const terror = list.filter(m => (m.genres || []).indexOf('terror') >= 0 || (m.genres || []).indexOf('suspenso') >= 0);
  if (terror.length >= 2) {
    rows.push({
      id: 'ps:terror',
      title: '👻 Terror y Suspenso',
      items: terror
    });
  }

  // Fila 9: Ciencia Ficción y Fantasía
  const scifi = list.filter(m => (m.genres || []).indexOf('scifi') >= 0);
  if (scifi.length >= 2) {
    rows.push({
      id: 'ps:scifi',
      title: '🚀 Ciencia Ficción y Fantasía',
      items: scifi
    });
  }

  // Fila 10: Comedia y Humor
  const comedia = list.filter(m => (m.genres || []).indexOf('comedia') >= 0);
  if (comedia.length >= 2) {
    rows.push({
      id: 'ps:comedia',
      title: '😂 Comedia y Humor',
      items: comedia
    });
  }

  // Fila 11: Animación y Familiar
  const familia = list.filter(m => (m.genres || []).indexOf('animacion') >= 0 || (m.genres || []).indexOf('familia') >= 0);
  if (familia.length >= 2) {
    rows.push({
      id: 'ps:familia',
      title: '👨‍👩‍👧 Animación y Familiar',
      items: familia
    });
  }

  // Fila 12: Drama y Crimen
  const drama = list.filter(m => (m.genres || []).indexOf('drama') >= 0 || (m.genres || []).indexOf('crimen') >= 0);
  if (drama.length >= 2) {
    rows.push({
      id: 'ps:drama',
      title: '🎭 Drama y Crimen',
      items: drama
    });
  }

  return rows;
}
