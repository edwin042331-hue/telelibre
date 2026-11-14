// Catálogo y filas para la sección Poseidon (Estrenos de Cine HD)
import { getText } from './net.js';
import { state } from './store.js';

// Catálogo base de estrenos con posters en alta resolución y servidores configurados
export const INITIAL_POSEIDON_MOVIES = [
  {
    key: 'poseidon:deadpool-wolverine',
    type: 'movie',
    name: 'Deadpool & Wolverine',
    year: 2024,
    runtime: 7620,
    genres: ['accion', 'comedia', 'scifi'],
    img: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    overview: 'Un apático Wade Wilson se afana en la vida civil dejando atrás sus días como Deadpool. Pero cuando su mundo natal se enfrenta a una amenaza inminente, debe volver a calzarse el traje junto a un reticente Wolverine.',
    src: 'poseidon',
    stream: 'vidara:sDHArCVY2ie4y',
    url: 'vidara:sDHArCVY2ie4y',
    lang: 'es'
  },
  {
    key: 'poseidon:intensamente-2',
    type: 'movie',
    name: 'Intensa-Mente 2 (Inside Out 2)',
    year: 2024,
    runtime: 5760,
    genres: ['animacion', 'familia', 'comedia'],
    img: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    overview: 'Riley entra en la adolescencia y el cuartel general sufre una repentina reforma para dar cabida a una nueva emoción inesperada: Ansiedad, junto a Envidia, Ennui y Vergüenza.',
    src: 'poseidon',
    stream: 'streamwish:xfk8e',
    url: 'streamwish:xfk8e',
    lang: 'es'
  },
  {
    key: 'poseidon:dune-2',
    type: 'movie',
    name: 'Dune: Parte Dos',
    year: 2024,
    runtime: 9960,
    genres: ['scifi', 'aventura', 'drama'],
    img: 'https://image.tmdb.org/t/p/w500/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg',
    overview: 'Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia, enfrentándose a una elección entre el amor de su vida y el destino del universo.',
    src: 'poseidon',
    stream: 'vidara:sDHArCVY2ie4y',
    url: 'vidara:sDHArCVY2ie4y',
    lang: 'es'
  },
  {
    key: 'poseidon:gladiador-2',
    type: 'movie',
    name: 'Gladiador II',
    year: 2024,
    runtime: 8880,
    genres: ['accion', 'drama', 'historia'],
    img: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    overview: 'Años después de presenciar la muerte de Máximo a manos de su tío, Lucio debe entrar en el Coliseo tras ser conquistado su hogar por los tiránicos emperadores de Roma.',
    src: 'poseidon',
    stream: 'streamwish:xfk8e',
    url: 'streamwish:xfk8e',
    lang: 'es'
  },
  {
    key: 'poseidon:alien-romulus',
    type: 'movie',
    name: 'Alien: Romulus',
    year: 2024,
    runtime: 7140,
    genres: ['terror', 'scifi', 'suspenso'],
    img: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
    overview: 'Mientras exploran en las profundidades de una estación espacial abandonada, un grupo de jóvenes colonizadores espaciales se encuentra cara a cara con la forma de vida más aterradora del universo.',
    src: 'poseidon',
    stream: 'vidara:sDHArCVY2ie4y',
    url: 'vidara:sDHArCVY2ie4y',
    lang: 'es'
  },
  {
    key: 'poseidon:godzilla-kong',
    type: 'movie',
    name: 'Godzilla y Kong: El nuevo imperio',
    year: 2024,
    runtime: 6900,
    genres: ['accion', 'scifi', 'aventura'],
    img: 'https://image.tmdb.org/t/p/w500/bQ2ywkchCe02uqVo2LsgxTmTXsp.jpg',
    overview: 'Una colosal aventura que enfrenta al todopoderoso Kong y al temible Godzilla contra una colosal amenaza desconocida oculta dentro de nuestro mundo.',
    src: 'poseidon',
    stream: 'streamwish:xfk8e',
    url: 'streamwish:xfk8e',
    lang: 'es'
  },
  {
    key: 'poseidon:bad-boys-4',
    type: 'movie',
    name: 'Bad Boys: Hasta la muerte',
    year: 2024,
    runtime: 6900,
    genres: ['accion', 'comedia', 'crimen'],
    img: 'https://image.tmdb.org/t/p/w500/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg',
    overview: 'Los policías favoritos del mundo están de vuelta con su icónica mezcla de acción y comedia escandalosa, pero esta vez con un giro: los mejores de Miami están huyendo.',
    src: 'poseidon',
    stream: 'vidara:sDHArCVY2ie4y',
    url: 'vidara:sDHArCVY2ie4y',
    lang: 'es'
  },
  {
    key: 'poseidon:beetlejuice-2',
    type: 'movie',
    name: 'Beetlejuice Beetlejuice',
    year: 2024,
    runtime: 6240,
    genres: ['comedia', 'terror', 'familia'],
    img: 'https://image.tmdb.org/t/p/w500/kKg7jpqnOTyx9Ng0467TeD2vZeF.jpg',
    overview: 'Tras una inesperada tragedia familiar, tres generaciones de la familia Deetz regresan a su hogar en Winter River cuando el portal al Más Allá se abre accidentalmente.',
    src: 'poseidon',
    stream: 'vidara:sDHArCVY2ie4y',
    url: 'vidara:sDHArCVY2ie4y',
    lang: 'es'
  },
  {
    key: 'poseidon:transformers-one',
    type: 'movie',
    name: 'Transformers Uno',
    year: 2024,
    runtime: 6240,
    genres: ['animacion', 'scifi', 'accion'],
    img: 'https://image.tmdb.org/t/p/w500/i8QWv7uP1T3lP9iFh9B3K4wJ4rF.jpg',
    overview: 'La historia jamás contada del origen de Optimus Prime y Megatron, quienes pasaron de ser hermanos de armas a enemigos jurados que cambiaron el destino de Cybertron.',
    src: 'poseidon',
    stream: 'streamwish:xfk8e',
    url: 'streamwish:xfk8e',
    lang: 'es'
  },
  {
    key: 'poseidon:kung-fu-panda-4',
    type: 'movie',
    name: 'Kung Fu Panda 4',
    year: 2024,
    runtime: 5640,
    genres: ['animacion', 'familia', 'accion', 'comedia'],
    img: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
    overview: 'Po se prepara para convertirse en el líder espiritual del Valle de la Paz, pero necesita encontrar y entrenar a un nuevo Guerrero Dragón mientras enfrenta a la Camaleona.',
    src: 'poseidon',
    stream: 'vidara:sDHArCVY2ie4y',
    url: 'vidara:sDHArCVY2ie4y',
    lang: 'es'
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
          cachedMovies = remote.map(m => Object.assign({ type: 'movie', src: 'poseidon', lang: 'es' }, m));
          return cachedMovies;
        }
      } catch (e) { /* fallback a local */ }
      cachedMovies = INITIAL_POSEIDON_MOVIES;
      return cachedMovies;
    })
    .catch(() => {
      cachedMovies = INITIAL_POSEIDON_MOVIES;
      return cachedMovies;
    });
}

export function getPoseidonMoviesSync() {
  return cachedMovies || INITIAL_POSEIDON_MOVIES;
}

// Organiza las películas en filas temáticas para la pantalla
export function buildPoseidonRows(movies) {
  if (state.settings && state.settings.sources && state.settings.sources['poseidon'] === false) {
    return [];
  }
  const list = movies || getPoseidonMoviesSync();
  const rows = [];

  // Fila 1: Estrenos más destacados
  rows.push({
    id: 'ps:estrenos',
    title: '🔱 Estrenos de Cine HD',
    items: list
  });

  // Fila 2: Acción y Aventura
  const accion = list.filter(m => m.genres.indexOf('accion') >= 0 || m.genres.indexOf('aventura') >= 0);
  if (accion.length >= 2) {
    rows.push({
      id: 'ps:accion',
      title: 'Acción y Aventura',
      items: accion
    });
  }

  // Fila 3: Ciencia Ficción y Fantasía
  const scifi = list.filter(m => m.genres.indexOf('scifi') >= 0);
  if (scifi.length >= 2) {
    rows.push({
      id: 'ps:scifi',
      title: 'Ciencia Ficción',
      items: scifi
    });
  }

  // Fila 4: Terror y Suspenso
  const terror = list.filter(m => m.genres.indexOf('terror') >= 0 || m.genres.indexOf('suspenso') >= 0);
  if (terror.length >= 2) {
    rows.push({
      id: 'ps:terror',
      title: 'Terror y Suspenso',
      items: terror
    });
  }

  // Fila 5: Comedia y Animación Familiar
  const familia = list.filter(m => m.genres.indexOf('animacion') >= 0 || m.genres.indexOf('familia') >= 0 || m.genres.indexOf('comedia') >= 0);
  if (familia.length >= 2) {
    rows.push({
      id: 'ps:familia',
      title: 'Comedia y Familiar',
      items: familia
    });
  }

  return rows;
}
