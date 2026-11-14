// Resolutores de streams de video (Vidara, StreamWish, Doodstream).
// Diseñado con XHR para máxima compatibilidad con webOS 3 / Tizen 3 (Chromium 38-47).

const cache = {};

function requestPostJson(url, data, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.timeout = timeoutMs || 12000;
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (headers) {
        for (const k in headers) xhr.setRequestHeader(k, headers[k]);
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Respuesta no válida del servidor'));
          }
        } else {
          reject(new Error('HTTP ' + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error('Sin conexión con el servidor'));
      xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado'));
      xhr.send(JSON.stringify(data));
    } catch (e) {
      reject(e);
    }
  });
}

function requestGetRedirect(url, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = timeoutMs || 12000;
      if (headers) {
        for (const k in headers) xhr.setRequestHeader(k, headers[k]);
      }
      xhr.onload = () => {
        if (xhr.responseURL && xhr.responseURL !== url) {
          resolve(xhr.responseURL);
        } else if (xhr.status >= 200 && xhr.status < 400) {
          resolve(xhr.responseURL || url);
        } else {
          reject(new Error('HTTP ' + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error('Sin conexión con el servidor'));
      xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado'));
      xhr.send();
    } catch (e) {
      reject(e);
    }
  });
}

/** Resuelve stream de Vidara (HLS .m3u8 maestro) */
export function resolveVidara(filecode) {
  const now = Date.now();
  if (cache[filecode] && cache[filecode].expiresAt > now) {
    return Promise.resolve(cache[filecode].streamUrl);
  }
  return requestPostJson('https://vidara.to/api/stream', {
    filecode: filecode,
    device: 'web',
    codecs: []
  }, {
    Referer: 'https://vidara.to/'
  }).then(res => {
    const stream = res && res.streaming_url;
    if (!stream) throw new Error('Vidara: No se encontró URL de stream');
    // Token dura ~8h -> cache de 4 horas
    cache[filecode] = { streamUrl: stream, expiresAt: now + 4 * 3600 * 1000 };
    return stream;
  });
}

/** Resuelve stream de StreamWish (MP4 directo) */
export function resolveStreamWish(codeOrParam) {
  const now = Date.now();
  if (cache[codeOrParam] && cache[codeOrParam].expiresAt > now) {
    return Promise.resolve(cache[codeOrParam].streamUrl);
  }
  return requestGetRedirect('https://vsembed.com/api/download/get?s=' + encodeURIComponent(codeOrParam) + '&t=720p', {
    Referer: 'https://vsembed.com/'
  }).then(stream => {
    // Token dura ~1h -> cache de 30 minutos
    cache[codeOrParam] = { streamUrl: stream, expiresAt: now + 30 * 60 * 1000 };
    return stream;
  });
}

/** Resuelve stream de Doodstream (MP4 directo con 10 dígitos aleatorios y expiry) */
export function resolveDood(baseWithToken) {
  // baseWithToken puede ser: "https://dp602xo.cloudatacdn.com/.../cjqqf1vjsv~?token=XYZ"
  // Genera los 10 dígitos aleatorios requeridos por la CDN
  const rnd = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const expiry = Date.now();
  
  if (baseWithToken.indexOf('?') >= 0) {
    const parts = baseWithToken.split('?');
    const base = parts[0];
    const query = parts[1];
    return Promise.resolve(base + rnd + '?' + query + '&expiry=' + expiry);
  }
  return Promise.resolve(baseWithToken + rnd + '?expiry=' + expiry);
}

/** Resolutor universal para cualquier película o stream */
export function resolvePoseidon(movie) {
  if (!movie) return Promise.reject(new Error('No hay película'));
  const target = (typeof movie === 'object' ? (movie.stream || movie.url) : movie) || '';

  if (target.indexOf('vidara:') === 0) {
    return resolveVidara(target.slice(7));
  }
  if (target.indexOf('streamwish:') === 0) {
    return resolveStreamWish(target.slice(11));
  }
  if (target.indexOf('dood:') === 0) {
    return resolveDood(target.slice(5));
  }
  if (target.indexOf('http://') === 0 || target.indexOf('https://') === 0) {
    return Promise.resolve(target);
  }
  return Promise.reject(new Error('Servidor no soportado: ' + target));
}
