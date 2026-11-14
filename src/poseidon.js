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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/x7r3lhae39hr",
          "cyberlocker": "voesx",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/sc2nosxrwlv3",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "ork8phpus011",
          "url": "https://streamwish.to/e/ork8phpus011",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/x7r3lhae39hr",
    "url": "https://voe.sx/e/x7r3lhae39hr",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/wd8do1wzukp0",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/brh3t3sdjt4z",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "y7erwv5aujvr",
          "url": "https://streamwish.to/e/y7erwv5aujvr",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/wd8do1wzukp0",
    "url": "https://voe.sx/e/wd8do1wzukp0",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/1tn4xw8kyziz",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/tx2rfc5r7pdq",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "oxsn0s6ts3vn",
          "url": "https://streamwish.to/e/oxsn0s6ts3vn",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/9uwlaowkcoo8",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/megrxcd0otql",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "z1vtuitpmcjf",
          "url": "https://streamwish.to/e/z1vtuitpmcjf",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/1tn4xw8kyziz",
    "url": "https://voe.sx/e/1tn4xw8kyziz",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/gyaawhvbtj8c",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/03uh9iyvrmum",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "80whngibhku3",
          "url": "https://streamwish.to/e/80whngibhku3",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/gyaawhvbtj8c",
    "url": "https://voe.sx/e/gyaawhvbtj8c",
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
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/gdpcuxtll4wl",
          "cyberlocker": "voesx",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/5dljl10wp9jz",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "ar5trq9zafd4",
          "url": "https://streamwish.to/e/ar5trq9zafd4",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/gdpcuxtll4wl",
    "url": "https://voe.sx/e/gdpcuxtll4wl",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/gkxbq94hmrhl",
          "cyberlocker": "voesx",
          "quality": "CAM"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/1jab8pun22c5",
          "cyberlocker": "doodstream",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "5tm6e9qnpd19",
          "url": "https://streamwish.to/e/5tm6e9qnpd19",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/gkxbq94hmrhl",
    "url": "https://voe.sx/e/gkxbq94hmrhl",
    "lang": "es"
  },
  {
    "key": "poseidon:1610820",
    "type": "movie",
    "name": "Les Mariages de Saint Antoine",
    "year": 2026,
    "quality": "HD",
    "runtime": 7140,
    "duration": 7140,
    "genres": [
      "comedia",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/tj0har4ngir6",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/liiq4xotf7gs",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "4p57181z7asd",
          "url": "https://streamwish.to/e/4p57181z7asd",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/5mnKcKiskKCFYWQoGH1l8yLymDK.jpg",
    "art": "https://image.tmdb.org/t/p/original/hILmNUH51sXpkLXd9ecEUCljU1q.jpg",
    "img": "https://image.tmdb.org/t/p/original/5mnKcKiskKCFYWQoGH1l8yLymDK.jpg",
    "overview": "Las tradicionales bodas de San Antonio de Lisboa han tocado fondo. Al menos, eso es lo que cree Stardust, una importante multinacional francesa a punto de hacerse cargo del evento. Carmo y Valentim, dos empleados del Ayuntamiento de Lisboa que llevan más de 25 años organizando las celebraciones, reciben un duro ultimátum: reinventar el evento y convertirlo en un éxito moderno, o perder sus puestos de trabajo.",
    "summary": "Las tradicionales bodas de San Antonio de Lisboa han tocado fondo. Al menos, eso es lo que cree Stardust, una importante multinacional francesa a punto de hacerse cargo del evento. Carmo y Valentim, dos empleados del Ayuntamiento de Lisboa que llevan más de 25 años organizando las celebraciones, reciben un duro ultimátum: reinventar el evento y convertirlo en un éxito moderno, o perder sus puestos de trabajo.",
    "src": "poseidon",
    "stream": "https://voe.sx/e/tj0har4ngir6",
    "url": "https://voe.sx/e/tj0har4ngir6",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/qyhvsi3ovbxs",
          "cyberlocker": "voesx",
          "quality": "CAM"
        },
        {
          "type": "streamwish",
          "code": "bfilp8ihdad4",
          "url": "https://streamwish.to/e/bfilp8ihdad4",
          "cyberlocker": "streamwish",
          "quality": "CAM"
        },
        {
          "type": "direct",
          "code": "",
          "url": "https://vidhidepro.com/v/noeew9rv9kzn",
          "cyberlocker": "vidhide",
          "quality": "CAM"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/usommnnjtdla",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/0vodm6ek7p2k",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ztfrmjdemdui",
          "url": "https://streamwish.to/e/ztfrmjdemdui",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/qyhvsi3ovbxs",
    "url": "https://voe.sx/e/qyhvsi3ovbxs",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/rjiez2tzsqbv",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/t3gbwip3qxdi",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "0xksw09dxzas",
          "url": "https://streamwish.to/e/0xksw09dxzas",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "castellano": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/em2dyjp2iqjb",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/0keim2vp2e29",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "5puzbzyavety",
          "url": "https://streamwish.to/e/5puzbzyavety",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/wylvvgtzcuzm",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/r4ezyzhu6557",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "79uysjexkjp0",
          "url": "https://streamwish.to/e/79uysjexkjp0",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/rjiez2tzsqbv",
    "url": "https://voe.sx/e/rjiez2tzsqbv",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/o44mlukgwj3c",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/ulr1x417gu27",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "81xmw1ffstbp",
          "url": "https://streamwish.to/e/81xmw1ffstbp",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/mwmcvdusgrsh",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ws8zxlxdsu9c",
          "url": "https://streamwish.to/e/ws8zxlxdsu9c",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/o44mlukgwj3c",
    "url": "https://voe.sx/e/o44mlukgwj3c",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/p3hdfwaedizv",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ykyrzrq6u6gx",
          "url": "https://streamwish.to/e/ykyrzrq6u6gx",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/p3hdfwaedizv",
    "url": "https://voe.sx/e/p3hdfwaedizv",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/aqaprzs9ncj9",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/x6dsouz0y8ob",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "s6n748zzx8m2",
          "url": "https://streamwish.to/e/s6n748zzx8m2",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/tjcrgpef7s76",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/h7v7l7ctem9u",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "vmjeg1pshdi0",
          "url": "https://streamwish.to/e/vmjeg1pshdi0",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/aqaprzs9ncj9",
    "url": "https://voe.sx/e/aqaprzs9ncj9",
    "lang": "es"
  },
  {
    "key": "poseidon:1238735",
    "type": "movie",
    "name": "The Floaters",
    "year": 2026,
    "quality": "HD",
    "runtime": 6120,
    "duration": 6120,
    "genres": [
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/lhvwq83jid0h",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/do3r2zo16qjp",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "4m3hd1ux3fwf",
          "url": "https://streamwish.to/e/4m3hd1ux3fwf",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/6VHAOIOO4MJXv19EtW5WFVRWztH.jpg",
    "art": "https://image.tmdb.org/t/p/original/p6VH952NTR5ZkZ8GZ2HAE2R3EoR.jpg",
    "img": "https://image.tmdb.org/t/p/original/6VHAOIOO4MJXv19EtW5WFVRWztH.jpg",
    "overview": "Struggling musician Nomi accepts a last-resort job from her overachiever best friend Mara: mentoring misfit campers, the “Floaters,” at their childhood Jewish summer camp. As the camp struggles to survive amidst competition with a longtime rival, Nomi, the Floaters, and Mara must overcome their differences to bring the community together and save the camp.",
    "summary": "Struggling musician Nomi accepts a last-resort job from her overachiever best friend Mara: mentoring misfit campers, the “Floaters,” at their childhood Jewish summer camp. As the camp struggles to survive amidst competition with a longtime rival, Nomi, the Floaters, and Mara must overcome their differences to bring the community together and save the camp.",
    "src": "poseidon",
    "stream": "https://voe.sx/e/lhvwq83jid0h",
    "url": "https://voe.sx/e/lhvwq83jid0h",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/er6b4bcenkjv",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/8m595vsw7khu",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "1jdo55z5c9yz",
          "url": "https://streamwish.to/e/1jdo55z5c9yz",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/er6b4bcenkjv",
    "url": "https://voe.sx/e/er6b4bcenkjv",
    "lang": "es"
  },
  {
    "key": "poseidon:1263337",
    "type": "movie",
    "name": "El corazón de la bestia",
    "year": 2026,
    "quality": "HD",
    "runtime": 6060,
    "duration": 6060,
    "genres": [
      "aventura",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/wjg3ha8nh2oe",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/8mn65jrsfs32",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "zeju9laqdp33",
          "url": "https://streamwish.to/e/zeju9laqdp33",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/grlsxprwy1p6",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/7pqdqjw6zx82",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ltab5rc4c44g",
          "url": "https://streamwish.to/e/ltab5rc4c44g",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/kVDHPDggier9ciMc8Xglinq1jWv.jpg",
    "art": "https://image.tmdb.org/t/p/original/kpqsljPQtWqPKJBTAEtoXtQZ9Ko.jpg",
    "img": "https://image.tmdb.org/t/p/original/kVDHPDggier9ciMc8Xglinq1jWv.jpg",
    "overview": "Tras un terrible accidente aéreo, el oficial de las Fuerzas Especiales James Belmont y su perro de combate, Odin, quedan varados en lo profundo de la naturaleza salvaje de Alaska. Juntos, se ven obligados a librar una brutal lucha por la supervivencia contra los elementos.",
    "summary": "Tras un terrible accidente aéreo, el oficial de las Fuerzas Especiales James Belmont y su perro de combate, Odin, quedan varados en lo profundo de la naturaleza salvaje de Alaska. Juntos, se ven obligados a librar una brutal lucha por la supervivencia contra los elementos.",
    "src": "poseidon",
    "stream": "https://voe.sx/e/wjg3ha8nh2oe",
    "url": "https://voe.sx/e/wjg3ha8nh2oe",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/fkx3upiscohy",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/icwfr77d0hr0",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "bxv60pjdnzpx",
          "url": "https://streamwish.to/e/bxv60pjdnzpx",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "castellano": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/02q2q2ocegmo",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/8dr6pco620ru",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "ce9agtfrmc4j",
          "url": "https://streamwish.to/e/ce9agtfrmc4j",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/lfpjfxwaxbil",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/rwelnvqm4uoy",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "pbt3yzyizxig",
          "url": "https://streamwish.to/e/pbt3yzyizxig",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/fkx3upiscohy",
    "url": "https://voe.sx/e/fkx3upiscohy",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/me7poa7a3cga",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/csltbfgd03rd",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "2nw3kl9ygrhz",
          "url": "https://streamwish.to/e/2nw3kl9ygrhz",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/nihceuq6rxvd",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/rks3keqfauni",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "z7kj99r5l3dr",
          "url": "https://streamwish.to/e/z7kj99r5l3dr",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/me7poa7a3cga",
    "url": "https://voe.sx/e/me7poa7a3cga",
    "lang": "es"
  },
  {
    "key": "poseidon:558",
    "type": "movie",
    "name": "El hombre araña 2",
    "year": 2004,
    "quality": "HD",
    "runtime": 7620,
    "duration": 7620,
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/uvnhcfr0oj3l",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "61jwwcf6z1qe",
          "url": "https://streamwish.to/e/61jwwcf6z1qe",
          "cyberlocker": "streamwish",
          "quality": "HD"
        },
        {
          "type": "direct",
          "code": "",
          "url": "https://filelions.to/v/b9kr5q3rvnkw",
          "cyberlocker": "vidhide",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/p9R3lUNzpHnivyGpKwEPUNGdmmH.jpg",
    "art": "https://image.tmdb.org/t/p/original/8G6HCS82vNxgg5wp7oBDSk32XpF.jpg",
    "img": "https://image.tmdb.org/t/p/original/p9R3lUNzpHnivyGpKwEPUNGdmmH.jpg",
    "overview": "Peter Parker se ve acosado por problemas en su fallida vida personal mientras lucha contra un brillante científico llamado Doctor Otto Octavius.",
    "summary": "Peter Parker se ve acosado por problemas en su fallida vida personal mientras lucha contra un brillante científico llamado Doctor Otto Octavius.",
    "src": "poseidon",
    "stream": "https://voe.sx/e/uvnhcfr0oj3l",
    "url": "https://voe.sx/e/uvnhcfr0oj3l",
    "lang": "es"
  },
  {
    "key": "poseidon:559",
    "type": "movie",
    "name": "El hombre araña 3",
    "year": 2007,
    "quality": "HD",
    "runtime": 8340,
    "duration": 8340,
    "genres": [
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/mev0nhfd9frk",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/u36dzyc6p8d7",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "tcd8uhnd2ety",
          "url": "https://streamwish.to/e/tcd8uhnd2ety",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/swwzsrdrtic0",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/xg383i63bi7d",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "8gsyyp96ip75",
          "url": "https://streamwish.to/e/8gsyyp96ip75",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/yqQRaD0uBWKLvSVe6LuMveb0ZLv.jpg",
    "art": "https://image.tmdb.org/t/p/original/FfAU0PUs8AJkMU2VbkVNFtRXR4.jpg",
    "img": "https://image.tmdb.org/t/p/original/yqQRaD0uBWKLvSVe6LuMveb0ZLv.jpg",
    "overview": "Una extraña entidad negra de otro mundo se vincula con Peter Parker y le provoca confusión interna mientras lucha contra nuevos villanos, tentaciones y venganza.",
    "summary": "Una extraña entidad negra de otro mundo se vincula con Peter Parker y le provoca confusión interna mientras lucha contra nuevos villanos, tentaciones y venganza.",
    "src": "poseidon",
    "stream": "https://voe.sx/e/mev0nhfd9frk",
    "url": "https://voe.sx/e/mev0nhfd9frk",
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
    "subs": true,
    "languages": [
      "latino",
      "castellano",
      "english"
    ],
    "servers": {
      "latino": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/vgpqdd63yuxf",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/5q9ucqy2dv68",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "5aetniduaifo",
          "url": "https://streamwish.to/e/5aetniduaifo",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ],
      "castellano": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/6y3gah5iovxw",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "direct",
          "code": "",
          "url": "https://streamtape.com/e/yGA4QD6W1kU19Gv",
          "cyberlocker": "streamtape",
          "quality": "HD"
        },
        {
          "type": "direct",
          "code": "",
          "url": "https://waaw.to/f/KXUsYuSMqA9y",
          "cyberlocker": "netu",
          "quality": "HD"
        }
      ],
      "english": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/ssqr3y426ojb",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "direct",
          "code": "",
          "url": "https://streamtape.com/e/q9WVrD9mgpFzmeW",
          "cyberlocker": "streamtape",
          "quality": "HD"
        },
        {
          "type": "direct",
          "code": "",
          "url": "https://waaw.to/f/vCbGDqoH8DPx",
          "cyberlocker": "netu",
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
    "stream": "https://voe.sx/e/vgpqdd63yuxf",
    "url": "https://voe.sx/e/vgpqdd63yuxf",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/m52t1erv2kbg",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/je895a45ffj9",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "m7qqk8ebb0so",
          "url": "https://streamwish.to/e/m7qqk8ebb0so",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/m52t1erv2kbg",
    "url": "https://voe.sx/e/m52t1erv2kbg",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/c2nwylqowzjp",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/n03treoqqqqq",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "cnfugbs6prym",
          "url": "https://streamwish.to/e/cnfugbs6prym",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/c2nwylqowzjp",
    "url": "https://voe.sx/e/c2nwylqowzjp",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/vy7gvc5pg9gb",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/dl7mumxgwvax",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "b2qqgxqp273r",
          "url": "https://streamwish.to/e/b2qqgxqp273r",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/vy7gvc5pg9gb",
    "url": "https://voe.sx/e/vy7gvc5pg9gb",
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
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/jw8t8clxwnni",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/v8t90xe9eull",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "s3fsi5y3wpyd",
          "url": "https://streamwish.to/e/s3fsi5y3wpyd",
          "cyberlocker": "streamwish",
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
    "stream": "https://voe.sx/e/jw8t8clxwnni",
    "url": "https://voe.sx/e/jw8t8clxwnni",
    "lang": "es"
  },
  {
    "key": "poseidon:1231695",
    "type": "movie",
    "name": "A metros de distancia",
    "year": 2025,
    "quality": "HD",
    "runtime": 5340,
    "duration": 5340,
    "genres": [
      "comedia",
      "aventura",
      "drama"
    ],
    "regions": [],
    "subs": false,
    "languages": [
      "latino"
    ],
    "servers": {
      "latino": [
        {
          "type": "voe",
          "code": "",
          "url": "https://voe.sx/e/pk9sx0otd6o6",
          "cyberlocker": "voesx",
          "quality": "HD"
        },
        {
          "type": "dood",
          "code": "",
          "url": "https://doodstream.com/e/q4k119vncvrz",
          "cyberlocker": "doodstream",
          "quality": "HD"
        },
        {
          "type": "streamwish",
          "code": "6lted51qnewa",
          "url": "https://streamwish.to/e/6lted51qnewa",
          "cyberlocker": "streamwish",
          "quality": "HD"
        }
      ]
    },
    "poster": "https://image.tmdb.org/t/p/original/A3tEYeLijo1PWXZLTckVSM05YVX.jpg",
    "art": "https://image.tmdb.org/t/p/original/r5IbY1krzmv3YqW1DKzru9BJIjI.jpg",
    "img": "https://image.tmdb.org/t/p/original/A3tEYeLijo1PWXZLTckVSM05YVX.jpg",
    "overview": "Santiago, un joven de 20 años que utiliza una aplicación de citas móviles en busca de encuentros efímeros. Su búsqueda revela la soledad que subyace bajo la cultura moderna de las citas.",
    "summary": "Santiago, un joven de 20 años que utiliza una aplicación de citas móviles en busca de encuentros efímeros. Su búsqueda revela la soledad que subyace bajo la cultura moderna de las citas.",
    "src": "poseidon",
    "stream": "https://voe.sx/e/pk9sx0otd6o6",
    "url": "https://voe.sx/e/pk9sx0otd6o6",
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
