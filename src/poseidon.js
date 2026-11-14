// Catálogo y filas para la sección Poseidon (Estrenos de Cine HD y CAM)
import { getText } from './net.js';
import { state } from './store.js';

// Normaliza las propiedades para asegurar compatibilidad total con el motor de filas y fichas
export function formatPoseidonMovie(m) {
  const poster = m.poster || m.img || '';
  const art = m.art || poster;
  const overview = m.overview || m.summary || '';
  const runtime = m.runtime || m.duration || 7200;
  const isSeries = m.type === 'series';
  return Object.assign({}, m, {
    key: m.key,
    type: isSeries ? 'series' : 'movie',
    name: m.name,
    year: m.year,
    quality: (m.quality || 'HD').toUpperCase(),
    runtime,
    duration: runtime,
    genres: Array.isArray(m.genres) ? m.genres : [],
    regions: Array.isArray(m.regions) ? m.regions : [],
    subs: !!m.subs,
    languages: Array.isArray(m.languages) ? m.languages : ['latino'],
    servers: m.servers || {},
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
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "SMerlbgLRKm6r",
          "url": "https://vidara.to/e/SMerlbgLRKm6r",
          "cyberlocker": "vidara",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "ar5trq9zafd4",
          "url": "https://streamwish.to/e/ar5trq9zafd4",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/5dljl10wp9jz",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        }
      ]
    },
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
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "vaNz9a0XMWDQw",
          "url": "https://vidara.to/e/vaNz9a0XMWDQw",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ykyrzrq6u6gx",
          "url": "https://streamwish.to/e/ykyrzrq6u6gx",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/amaowggb0lpf",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "sDHArCVY2ie4y",
          "url": "https://vidara.to/e/sDHArCVY2ie4y",
          "cyberlocker": "vidara",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "ork8phpus011",
          "url": "https://streamwish.to/e/ork8phpus011",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/sc2nosxrwlv3",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        }
      ]
    },
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
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "me2pyEd1ngnIm",
          "url": "https://vidara.to/e/me2pyEd1ngnIm",
          "cyberlocker": "vidara",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "5tm6e9qnpd19",
          "url": "https://streamwish.to/e/5tm6e9qnpd19",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/1jab8pun22c5",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        }
      ]
    },
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
    "languages": [
      "castellano"
    ],
    "servers": {
      "castellano": [
        {
          "type": "vidara",
          "code": "BTEFRenphqMbL",
          "url": "https://vidara.to/e/BTEFRenphqMbL",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "y7erwv5aujvr",
          "url": "https://streamwish.to/e/y7erwv5aujvr",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/brh3t3sdjt4z",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "4Y2q4yZDtxGWw",
          "url": "https://vidara.to/e/4Y2q4yZDtxGWw",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "80whngibhku3",
          "url": "https://streamwish.to/e/80whngibhku3",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/03uh9iyvrmum",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "key": "poseidon:1543469",
    "type": "movie",
    "name": "Heartland",
    "year": 2026,
    "quality": "HD",
    "runtime": 6840,
    "duration": 6840,
    "genres": [
      "suspenso",
      "musical"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "CeSGqP3MrY2Bw",
          "url": "https://vidara.to/e/CeSGqP3MrY2Bw",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ujvpi58vxe7a",
          "url": "https://streamwish.to/e/ujvpi58vxe7a",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/dq671mp0pp3a",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/zhxlzxBlO1sWB1rPn7RmAoeQ2na.jpg",
    "art": "https://image.tmdb.org/t/p/original/psTMZj8gvsfYVfvd7FZCHH4xL6P.jpg",
    "img": "https://image.tmdb.org/t/p/original/zhxlzxBlO1sWB1rPn7RmAoeQ2na.jpg",
    "overview": "La antigua estrella del country Misty Jones sale de su retiro de 20 años para investigar la desaparición de su sobrina, Charlie Heart, una prometedora cantante, y acaba enfrentándose tanto a su propio pasado como al lado más turbio de Nashville. Su búsqueda la lleva a descubrir una ciudad donde nadie, ni siquiera ella, es quien parece ser.",
    "summary": "La antigua estrella del country Misty Jones sale de su retiro de 20 años para investigar la desaparición de su sobrina, Charlie Heart, una prometedora cantante, y acaba enfrentándose tanto a su propio pasado como al lado más turbio de Nashville. Su búsqueda la lleva a descubrir una ciudad donde nadie, ni siquiera ella, es quien parece ser.",
    "src": "poseidon",
    "stream": "vidara:CeSGqP3MrY2Bw",
    "url": "vidara:CeSGqP3MrY2Bw",
    "lang": "es"
  },
  {
    "key": "poseidon:1379486",
    "type": "movie",
    "name": "La Psicópata",
    "year": 2026,
    "quality": "CAM",
    "runtime": 6120,
    "duration": 6120,
    "genres": [
      "terror",
      "suspenso"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "cpTwBSBRAqI6i",
          "url": "https://vidara.to/e/cpTwBSBRAqI6i",
          "cyberlocker": "vidara",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "nnrfyko2oj5d",
          "url": "https://streamwish.to/e/nnrfyko2oj5d",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/rrgiq508rjdy",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/eknMIThHWZCxMzDAcUDk4rK2Wpc.jpg",
    "art": "https://image.tmdb.org/t/p/original/84Sh7J9uvMjqEqEyRsKXaiSBcjP.jpg",
    "img": "https://image.tmdb.org/t/p/original/eknMIThHWZCxMzDAcUDk4rK2Wpc.jpg",
    "overview": "Winifred Notty, una joven institutriz que llega a la remota Ensor House para hacerse cargo de la educación de los hijos de una familia adinerada. Sin embargo, detrás de su aparente compostura se esconde una personalidad profundamente perturbadora. A medida que se instala en la mansión y comienza a formar parte de la rutina familiar, sus impulsos más oscuros empiezan a salir a la superficie, convirtiendo ese hogar en el escenario de una historia inquietante.",
    "summary": "Winifred Notty, una joven institutriz que llega a la remota Ensor House para hacerse cargo de la educación de los hijos de una familia adinerada. Sin embargo, detrás de su aparente compostura se esconde una personalidad profundamente perturbadora. A medida que se instala en la mansión y comienza a formar parte de la rutina familiar, sus impulsos más oscuros empiezan a salir a la superficie, convirtiendo ese hogar en el escenario de una historia inquietante.",
    "src": "poseidon",
    "stream": "vidara:cpTwBSBRAqI6i",
    "url": "vidara:cpTwBSBRAqI6i",
    "lang": "es"
  },
  {
    "key": "poseidon:1368337",
    "type": "movie",
    "name": "La Odisea",
    "year": 2026,
    "quality": "HD",
    "runtime": 10380,
    "duration": 10380,
    "genres": [
      "aventura",
      "accion",
      "scifi"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "bfilp8ihdad4",
          "url": "https://streamwish.to/e/bfilp8ihdad4",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        }
      ],
      "english": [
        {
          "type": "vidara",
          "code": "pc0B3zGPie4rC",
          "url": "https://vidara.to/e/pc0B3zGPie4rC",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ztfrmjdemdui",
          "url": "https://streamwish.to/e/ztfrmjdemdui",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/0vodm6ek7p2k",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/sRxbUe5FB25Gde0e2FnwwSckpXb.jpg",
    "art": "https://image.tmdb.org/t/p/original/iDiTY1wA35YWzTmXLTtqaxtN6tc.jpg",
    "img": "https://image.tmdb.org/t/p/original/sRxbUe5FB25Gde0e2FnwwSckpXb.jpg",
    "overview": "Odiseo, el legendario rey de Ítaca, emprende un largo y peligroso viaje de regreso a casa tras la guerra de Troya. A lo largo de su travesía, se ve obligado a enfrentarse a los caprichos de los dioses, a monstruos mitológicos y a pruebas que ponen a prueba su astucia y su humanidad hasta el límite.",
    "summary": "Odiseo, el legendario rey de Ítaca, emprende un largo y peligroso viaje de regreso a casa tras la guerra de Troya. A lo largo de su travesía, se ve obligado a enfrentarse a los caprichos de los dioses, a monstruos mitológicos y a pruebas que ponen a prueba su astucia y su humanidad hasta el límite.",
    "src": "poseidon",
    "stream": "streamwish:bfilp8ihdad4",
    "url": "streamwish:bfilp8ihdad4",
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
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "oxsn0s6ts3vn",
          "url": "https://streamwish.to/e/oxsn0s6ts3vn",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/tx2rfc5r7pdq",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "z1vtuitpmcjf",
          "url": "https://streamwish.to/e/z1vtuitpmcjf",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/megrxcd0otql",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "key": "poseidon:1469342",
    "type": "movie",
    "name": "Su propio infierno",
    "year": 2026,
    "quality": "HD",
    "runtime": 6600,
    "duration": 6600,
    "genres": [
      "suspenso",
      "terror"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "zj5gq694sayn",
          "url": "https://streamwish.to/e/zj5gq694sayn",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/hazwv0n2yxy4",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        }
      ],
      "english": [
        {
          "type": "vidara",
          "code": "hv9RkFQzXYTJ1",
          "url": "https://vidara.to/e/hv9RkFQzXYTJ1",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "dpgewthfg3bx",
          "url": "https://streamwish.to/e/dpgewthfg3bx",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/kbesya88boet",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/xFXoPwN8zRtC0ayA6UKmCK11Isy.jpg",
    "art": "https://image.tmdb.org/t/p/original/hS4FcOM5y71FurkBQgDLTBxmWZh.jpg",
    "img": "https://image.tmdb.org/t/p/original/xFXoPwN8zRtC0ayA6UKmCK11Isy.jpg",
    "overview": "Cuando una misteriosa niebla envuelve una metrópolis futurista, liberando a una entidad letal y escurridiza, una joven atormentada busca a su padre. Su búsqueda se cruza con la de un soldado estadounidense que emprende una angustiosa odisea para rescatar a su hija del infierno.",
    "summary": "Cuando una misteriosa niebla envuelve una metrópolis futurista, liberando a una entidad letal y escurridiza, una joven atormentada busca a su padre. Su búsqueda se cruza con la de un soldado estadounidense que emprende una angustiosa odisea para rescatar a su hija del infierno.",
    "src": "poseidon",
    "stream": "streamwish:zj5gq694sayn",
    "url": "streamwish:zj5gq694sayn",
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
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "HWGsagq9GNHqZ",
          "url": "https://vidara.to/e/HWGsagq9GNHqZ",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "s6n748zzx8m2",
          "url": "https://streamwish.to/e/s6n748zzx8m2",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/x6dsouz0y8ob",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "vmjeg1pshdi0",
          "url": "https://streamwish.to/e/vmjeg1pshdi0",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/h7v7l7ctem9u",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "subs": true,
    "languages": [
      "latino",
      "castellano",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "3HK3aORmlWLQy",
          "url": "https://vidara.to/e/3HK3aORmlWLQy",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "0xksw09dxzas",
          "url": "https://streamwish.to/e/0xksw09dxzas",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/t3gbwip3qxdi",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "castellano": [
        {
          "type": "streamwish",
          "code": "5puzbzyavety",
          "url": "https://streamwish.to/e/5puzbzyavety",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/0keim2vp2e29",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "79uysjexkjp0",
          "url": "https://streamwish.to/e/79uysjexkjp0",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/r4ezyzhu6557",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "81xmw1ffstbp",
          "url": "https://streamwish.to/e/81xmw1ffstbp",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/ulr1x417gu27",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "ws8zxlxdsu9c",
          "url": "https://streamwish.to/e/ws8zxlxdsu9c",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/bzfza7ewntfo",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "key": "poseidon:1184941",
    "type": "movie",
    "name": "Blue Heron",
    "year": 2026,
    "quality": "HD",
    "runtime": 5460,
    "duration": 5460,
    "genres": [
      "drama"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "Df4HHnCaZwKnj",
          "url": "https://vidara.to/e/Df4HHnCaZwKnj",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "1jdo55z5c9yz",
          "url": "https://streamwish.to/e/1jdo55z5c9yz",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/8m595vsw7khu",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/8qy2dbkyeLj0Jh2lUPLCNTHMmxy.jpg",
    "art": "https://image.tmdb.org/t/p/original/t62n8FPCo4kJZYnsxkcLojgThJF.jpg",
    "img": "https://image.tmdb.org/t/p/original/8qy2dbkyeLj0Jh2lUPLCNTHMmxy.jpg",
    "overview": "A finales de los años 90, Sasha, de ocho años, y su familia de inmigrantes húngaros se mudan a una nueva casa en la isla de Vancouver. Su nuevo comienzo se ve interrumpido por el comportamiento cada vez más peligroso de Jeremy, el hijo mayor de la familia.",
    "summary": "A finales de los años 90, Sasha, de ocho años, y su familia de inmigrantes húngaros se mudan a una nueva casa en la isla de Vancouver. Su nuevo comienzo se ve interrumpido por el comportamiento cada vez más peligroso de Jeremy, el hijo mayor de la familia.",
    "src": "poseidon",
    "stream": "vidara:Df4HHnCaZwKnj",
    "url": "vidara:Df4HHnCaZwKnj",
    "lang": "es"
  },
  {
    "key": "poseidon:969681",
    "type": "movie",
    "name": "Spider-Man: Un nuevo día",
    "year": 2026,
    "quality": "HD",
    "runtime": 8700,
    "duration": 8700,
    "genres": [
      "scifi",
      "accion",
      "aventura"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "latino",
      "castellano",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "bxv60pjdnzpx",
          "url": "https://streamwish.to/e/bxv60pjdnzpx",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/icwfr77d0hr0",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "castellano": [
        {
          "type": "streamwish",
          "code": "ce9agtfrmc4j",
          "url": "https://streamwish.to/e/ce9agtfrmc4j",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/8dr6pco620ru",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "pbt3yzyizxig",
          "url": "https://streamwish.to/e/pbt3yzyizxig",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/rwelnvqm4uoy",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/fBFjaDWfNslvrs6bJjknmG27wOS.jpg",
    "art": "https://image.tmdb.org/t/p/original/dzeCorl61ZdxbzfnciUkrc8JSZj.jpg",
    "img": "https://image.tmdb.org/t/p/original/fBFjaDWfNslvrs6bJjknmG27wOS.jpg",
    "overview": "A medida qué Spider-Man está en la cima de su carrera protegiendo la ciudad de Nueva York, una serie de crímenes inusuales lo arrastran a una red de misterios más grande de lo que jamás haya enfrentado.",
    "summary": "A medida qué Spider-Man está en la cima de su carrera protegiendo la ciudad de Nueva York, una serie de crímenes inusuales lo arrastran a una red de misterios más grande de lo que jamás haya enfrentado.",
    "src": "poseidon",
    "stream": "streamwish:bxv60pjdnzpx",
    "url": "streamwish:bxv60pjdnzpx",
    "lang": "es"
  },
  {
    "key": "poseidon:1462861",
    "type": "movie",
    "name": "Spider Island",
    "year": 2026,
    "quality": "HD",
    "runtime": 6300,
    "duration": 6300,
    "genres": [
      "comedia",
      "terror"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "streamwish",
          "code": "w8k7io03hw0t",
          "url": "https://streamwish.to/e/w8k7io03hw0t",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/lssvah5cibyn",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/eKw6aF7oNEaTnVvN396Q1is9R1n.jpg",
    "art": "https://image.tmdb.org/t/p/original/gZt1KXQRawEg3CTqzTamXYkniT4.jpg",
    "img": "https://image.tmdb.org/t/p/original/eKw6aF7oNEaTnVvN396Q1is9R1n.jpg",
    "overview": "A group of social media influencers go to the launch of a new hotel on a tropical island, where they find deadly spiders.",
    "summary": "A group of social media influencers go to the launch of a new hotel on a tropical island, where they find deadly spiders.",
    "src": "poseidon",
    "stream": "streamwish:w8k7io03hw0t",
    "url": "streamwish:w8k7io03hw0t",
    "lang": "es"
  },
  {
    "key": "poseidon:569094",
    "type": "movie",
    "name": "Spider-Man: A través del Spider-Verso",
    "year": 2023,
    "quality": "HD",
    "runtime": 8400,
    "duration": 8400,
    "genres": [
      "animacion",
      "accion",
      "aventura",
      "scifi"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "2nw3kl9ygrhz",
          "url": "https://streamwish.to/e/2nw3kl9ygrhz",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/csltbfgd03rd",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "z7kj99r5l3dr",
          "url": "https://streamwish.to/e/z7kj99r5l3dr",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/rks3keqfauni",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/rXhgHQmtjTIQOEDU8E2TbUFMjWM.jpg",
    "art": "https://image.tmdb.org/t/p/original/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg",
    "img": "https://image.tmdb.org/t/p/original/rXhgHQmtjTIQOEDU8E2TbUFMjWM.jpg",
    "overview": "Después de reunirse con Gwen Stacy, Miles Morales, el amigable Spider-Man del vecindario de tiempo completo de Brooklyn, es catapultado a través del Multiverso, donde se encuentra con un equipo de Spider-People encargado de proteger su existencia. Pero cuando los héroes chocan sobre cómo manejar una nueva amenaza, Miles se enfrenta a las otras arañas y debe redefinir lo que significa ser un héroe para poder salvar a las personas que más ama.",
    "summary": "Después de reunirse con Gwen Stacy, Miles Morales, el amigable Spider-Man del vecindario de tiempo completo de Brooklyn, es catapultado a través del Multiverso, donde se encuentra con un equipo de Spider-People encargado de proteger su existencia. Pero cuando los héroes chocan sobre cómo manejar una nueva amenaza, Miles se enfrenta a las otras arañas y debe redefinir lo que significa ser un héroe para poder salvar a las personas que más ama.",
    "src": "poseidon",
    "stream": "streamwish:2nw3kl9ygrhz",
    "url": "streamwish:2nw3kl9ygrhz",
    "lang": "es"
  },
  {
    "key": "poseidon:634649",
    "type": "movie",
    "name": "Spider-Man: Sin camino a casa",
    "year": 2021,
    "quality": "HD",
    "runtime": 8880,
    "duration": 8880,
    "genres": [
      "accion",
      "aventura",
      "scifi"
    ],
    "regions": [],
    "subs": false,
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "5aetniduaifo",
          "url": "https://streamwish.to/e/5aetniduaifo",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/5q9ucqy2dv68",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/9OGkKMnYgSc0TzSIErcOOiKllrK.jpg",
    "art": "https://image.tmdb.org/t/p/original/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg",
    "img": "https://image.tmdb.org/t/p/original/9OGkKMnYgSc0TzSIErcOOiKllrK.jpg",
    "overview": "Peter Parker es desenmascarado y ya no puede separar su vida normal de los altos riesgos de ser un súper héroe. Cuando pide ayuda al Doctor Strange para recuperar su secreto, el hechizo crea un agujero en su mundo, liberando a los villanos más poderosos que han luchado con cualquier Spider-Man, en cualquier universo. Ahora Peter debe de superar su reto más grande, que no solo alterara su propio futuro pero el del multiverso, forzándolo a descubrir lo que realmente significa ser Spider-Man.",
    "summary": "Peter Parker es desenmascarado y ya no puede separar su vida normal de los altos riesgos de ser un súper héroe. Cuando pide ayuda al Doctor Strange para recuperar su secreto, el hechizo crea un agujero en su mundo, liberando a los villanos más poderosos que han luchado con cualquier Spider-Man, en cualquier universo. Ahora Peter debe de superar su reto más grande, que no solo alterara su propio futuro pero el del multiverso, forzándolo a descubrir lo que realmente significa ser Spider-Man.",
    "src": "poseidon",
    "stream": "streamwish:5aetniduaifo",
    "url": "streamwish:5aetniduaifo",
    "lang": "es"
  },
  {
    "key": "poseidon:324857",
    "type": "movie",
    "name": "Spider-Man: Un nuevo universo",
    "year": 2018,
    "quality": "HD",
    "runtime": 7020,
    "duration": 7020,
    "genres": [
      "animacion",
      "accion",
      "aventura",
      "scifi"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "latino",
      "castellano",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "streamwish",
          "code": "mw77czxchtq9",
          "url": "https://streamwish.to/e/mw77czxchtq9",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/xlktsht4r8td",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "castellano": [
        {
          "type": "streamwish",
          "code": "itwdpatvzzkx",
          "url": "https://streamwish.to/e/itwdpatvzzkx",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/kxzqyz453l0o",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "streamwish",
          "code": "woswdtfbf0ll",
          "url": "https://streamwish.to/e/woswdtfbf0ll",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/pp3q39rggagh",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/9l9exwzYsEtSbtuLHJQoNQVQGp7.jpg",
    "art": "https://image.tmdb.org/t/p/original/1ntePsIqeklfmrQJqZPncCydsqY.jpg",
    "img": "https://image.tmdb.org/t/p/original/9l9exwzYsEtSbtuLHJQoNQVQGp7.jpg",
    "overview": "En un universo paralelo donde Peter Parker ha muerto, un jóven de secundaria llamado Miles Morales es el nuevo Spider-Man. Sin embargo, cuando el líder mafioso Wilson Fisk (a.k.a Kingpin) construye el \"Super Colisionador\" trae a una versión alternativa de Peter Parker que tratará de enseñarle a Miles como ser un mejor Spider-Man. Pero no será el único Spider Man en entrar a este universo, 4 versiones alternas de Spidey aparecerán y buscarán regresar a su universo antes de que toda la realidad colapse.",
    "summary": "En un universo paralelo donde Peter Parker ha muerto, un jóven de secundaria llamado Miles Morales es el nuevo Spider-Man. Sin embargo, cuando el líder mafioso Wilson Fisk (a.k.a Kingpin) construye el \"Super Colisionador\" trae a una versión alternativa de Peter Parker que tratará de enseñarle a Miles como ser un mejor Spider-Man. Pero no será el único Spider Man en entrar a este universo, 4 versiones alternas de Spidey aparecerán y buscarán regresar a su universo antes de que toda la realidad colapse.",
    "src": "poseidon",
    "stream": "streamwish:mw77czxchtq9",
    "url": "streamwish:mw77czxchtq9",
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
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "VrmkS6hu9g5mA",
          "url": "https://vidara.to/e/VrmkS6hu9g5mA",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "cnfugbs6prym",
          "url": "https://streamwish.to/e/cnfugbs6prym",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/n03treoqqqqq",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "streamwish",
          "code": "m7qqk8ebb0so",
          "url": "https://streamwish.to/e/m7qqk8ebb0so",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/je895a45ffj9",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
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
    "key": "poseidon:1599301",
    "type": "movie",
    "name": "A Fighting Legacy",
    "year": 2025,
    "quality": "HD",
    "runtime": 4440,
    "duration": 4440,
    "genres": [
      "accion"
    ],
    "regions": [],
    "subs": true,
    "languages": [
      "english"
    ],
    "servers": {
      "english": [
        {
          "type": "vidara",
          "code": "TSCHheC8bOTAA",
          "url": "https://vidara.to/e/TSCHheC8bOTAA",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "b2qqgxqp273r",
          "url": "https://streamwish.to/e/b2qqgxqp273r",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/dl7mumxgwvax",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/BVaY7tLXbk2xXP5EagoFkYE1GT.jpg",
    "art": "https://image.tmdb.org/t/p/original/BVaY7tLXbk2xXP5EagoFkYE1GT.jpg",
    "img": "https://image.tmdb.org/t/p/original/BVaY7tLXbk2xXP5EagoFkYE1GT.jpg",
    "overview": "«A Fighting Legacy» explora cómo un arte marcial tailandés con 700 años de historia se arraigó en el Medio Oeste de Estados Unidos, siguiendo los pasos del pionero que lo llevó a este país y de la comunidad que se formó en torno al mayor evento de combate del hemisferio occidental.",
    "summary": "«A Fighting Legacy» explora cómo un arte marcial tailandés con 700 años de historia se arraigó en el Medio Oeste de Estados Unidos, siguiendo los pasos del pionero que lo llevó a este país y de la comunidad que se formó en torno al mayor evento de combate del hemisferio occidental.",
    "src": "poseidon",
    "stream": "vidara:TSCHheC8bOTAA",
    "url": "vidara:TSCHheC8bOTAA",
    "lang": "es"
  },
  {
    "key": "poseidon:1721329",
    "type": "movie",
    "name": "Paranorías: Los Archivos Perdidos Del Dr. Romanoski",
    "year": 2025,
    "quality": "HD",
    "runtime": 3720,
    "duration": 3720,
    "genres": [
      "comedia"
    ],
    "regions": [],
    "subs": false,
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "sr30CK6OTt3iI",
          "url": "https://vidara.to/e/sr30CK6OTt3iI",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "s3fsi5y3wpyd",
          "url": "https://streamwish.to/e/s3fsi5y3wpyd",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/v8t90xe9eull",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/bkkuY8klQN75CbOeFAUgXL197Fq.jpg",
    "art": "https://image.tmdb.org/t/p/original/bkkuY8klQN75CbOeFAUgXL197Fq.jpg",
    "img": "https://image.tmdb.org/t/p/original/bkkuY8klQN75CbOeFAUgXL197Fq.jpg",
    "overview": "Mientras investiga en un hospital psiquiátrico, el Dr. Romanoski se topa con un misterioso archivo que lo lleva al límite de la razón y a lo profundo del reino de las paranorías.",
    "summary": "Mientras investiga en un hospital psiquiátrico, el Dr. Romanoski se topa con un misterioso archivo que lo lleva al límite de la razón y a lo profundo del reino de las paranorías.",
    "src": "poseidon",
    "stream": "vidara:sr30CK6OTt3iI",
    "url": "vidara:sr30CK6OTt3iI",
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
    "subs": true,
    "languages": [
      "latino",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "vidara",
          "code": "La6CA8XvLM7Fn",
          "url": "https://vidara.to/e/La6CA8XvLM7Fn",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "eayxenileriw",
          "url": "https://streamwish.to/e/eayxenileriw",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/tjrqoln7vzzm",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "vidara",
          "code": "vZ5KPgfS6inPK",
          "url": "https://vidara.to/e/vZ5KPgfS6inPK",
          "cyberlocker": "vidara",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "f46cqbs66xzd",
          "url": "https://streamwish.to/e/f46cqbs66xzd",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/i2u8k400e8be",
          "cyberlocker": "doodstream",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/uImKVUa0IGSC670QhcWadT5Eh9p.jpg",
    "art": "https://image.tmdb.org/t/p/original/o1jOMbNjDjkUZorJ8LxDjSJIrRg.jpg",
    "img": "https://image.tmdb.org/t/p/original/uImKVUa0IGSC670QhcWadT5Eh9p.jpg",
    "overview": "When his daughter vanishes from a Hollywood jazz club, a detective must battle mobsters, starlets, and his own demons to unearth the sinister truth lurking behind LA's neon lights.",
    "summary": "When his daughter vanishes from a Hollywood jazz club, a detective must battle mobsters, starlets, and his own demons to unearth the sinister truth lurking behind LA's neon lights.",
    "src": "poseidon",
    "stream": "vidara:La6CA8XvLM7Fn",
    "url": "vidara:La6CA8XvLM7Fn",
    "lang": "es"
  }
];

let cachedMovies = null;

// Carga el catálogo de Poseidon (remoto si existe, o inicial local)
export function loadPoseidonCatalog() {
  if (cachedMovies) return Promise.resolve(cachedMovies);
  const REMOTE_URL = 'https://edwin042331-hue.github.io/telelibre/poseidon.json';

  return getText(REMOTE_URL + '?t=' + Date.now(), 6000)
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

  // Fila 1: Todos los estrenos de cine
  const moviesOnly = list.filter(m => m.type !== 'series');
  rows.push({
    id: 'ps:estrenos',
    title: '🔱 Todos los Estrenos de Cine (' + (moviesOnly.length || list.length) + ')',
    items: moviesOnly.length ? moviesOnly : list
  });

  // Fila 2: Estrenos 2026 (Gran catálogo masivo 2026)
  const y2026 = list.filter(m => m.year === 2026 && m.type !== 'series');
  if (y2026.length >= 2) {
    rows.push({
      id: 'ps:y2026',
      title: '📅 Estrenos 2026 (' + y2026.length + ')',
      items: y2026
    });
  }

  // Fila 3: Series Poseidon (Temporadas y Episodios completos)
  const seriesList = list.filter(m => m.type === 'series');
  if (seriesList.length >= 1) {
    rows.push({
      id: 'ps:series',
      title: '📺 Series Poseidon (' + seriesList.length + ')',
      items: seriesList
    });
  }

  // Fila 4: Sagas y Superhéroes (Spider-Man, Avengers, Batman, Deadpool)
  const sagas = list.filter(m => {
    const n = (m.name || '').toLowerCase();
    return n.indexOf('spider') >= 0 || n.indexOf('hombre araña') >= 0 || n.indexOf('avenger') >= 0 ||
           n.indexOf('vengador') >= 0 || n.indexOf('batman') >= 0 || n.indexOf('deadpool') >= 0;
  });
  if (sagas.length >= 2) {
    rows.push({
      id: 'ps:sagas',
      title: '🕷️ Sagas y Superhéroes (' + sagas.length + ')',
      items: sagas
    });
  }

  // Fila 5: Lo Mejor de 2025
  const y2025 = list.filter(m => m.year === 2025 && m.type !== 'series');
  if (y2025.length >= 2) {
    rows.push({
      id: 'ps:y2025',
      title: '📅 Lo Mejor de 2025',
      items: y2025
    });
  }

  // Fila 6: Estrenos 2024
  const y2024 = list.filter(m => m.year === 2024 && m.type !== 'series');
  if (y2024.length >= 2) {
    rows.push({
      id: 'ps:y2024',
      title: '🎬 Estrenos 2024',
      items: y2024
    });
  }

  // Fila 7: Disponibles en HD 1080p
  const hd = list.filter(m => (m.quality || '').toUpperCase() === 'HD' && m.type !== 'series');
  if (hd.length >= 2) {
    rows.push({
      id: 'ps:hd',
      title: '💎 Disponibles en HD 1080p',
      items: hd
    });
  }

  // Fila 8: Directo del Cine (CAM)
  const cam = list.filter(m => (m.quality || '').toUpperCase() === 'CAM' && m.type !== 'series');
  if (cam.length >= 2) {
    rows.push({
      id: 'ps:cam',
      title: '🎟️ Directo del Cine (CAM)',
      items: cam
    });
  }

  // Fila 9: Acción y Aventura
  const accion = list.filter(m => ((m.genres || []).indexOf('accion') >= 0 || (m.genres || []).indexOf('aventura') >= 0) && m.type !== 'series');
  if (accion.length >= 2) {
    rows.push({
      id: 'ps:accion',
      title: '💥 Acción y Aventura',
      items: accion
    });
  }

  // Fila 10: Terror y Suspenso
  const terror = list.filter(m => ((m.genres || []).indexOf('terror') >= 0 || (m.genres || []).indexOf('suspenso') >= 0) && m.type !== 'series');
  if (terror.length >= 2) {
    rows.push({
      id: 'ps:terror',
      title: '👻 Terror y Suspenso',
      items: terror
    });
  }

  // Fila 11: Ciencia Ficción y Fantasía
  const scifi = list.filter(m => (m.genres || []).indexOf('scifi') >= 0 && m.type !== 'series');
  if (scifi.length >= 2) {
    rows.push({
      id: 'ps:scifi',
      title: '🚀 Ciencia Ficción y Fantasía',
      items: scifi
    });
  }

  // Fila 12: Comedia y Humor
  const comedia = list.filter(m => (m.genres || []).indexOf('comedia') >= 0 && m.type !== 'series');
  if (comedia.length >= 2) {
    rows.push({
      id: 'ps:comedia',
      title: '😂 Comedia y Humor',
      items: comedia
    });
  }

  // Fila 13: Animación y Familiar
  const familia = list.filter(m => ((m.genres || []).indexOf('animacion') >= 0 || (m.genres || []).indexOf('familia') >= 0) && m.type !== 'series');
  if (familia.length >= 2) {
    rows.push({
      id: 'ps:familia',
      title: '👨‍👩‍👧 Animación y Familiar',
      items: familia
    });
  }

  // Fila 14: Drama y Crimen
  const drama = list.filter(m => ((m.genres || []).indexOf('drama') >= 0 || (m.genres || []).indexOf('crimen') >= 0) && m.type !== 'series');
  if (drama.length >= 2) {
    rows.push({
      id: 'ps:drama',
      title: '🎭 Drama y Crimen',
      items: drama
    });
  }

  return rows;
}
