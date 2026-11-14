// Resolutores de streams de video (Vidara, StreamWish, Doodstream, etc.).
// Diseñado con XHR para máxima compatibilidad con webOS 3 / Tizen 3 (Chromium 38-47).

const cache = {};

function requestPostJson(url, data, headers, timeoutMs) {
  if (typeof XMLHttpRequest === 'undefined' && typeof fetch !== 'undefined') {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(timeoutMs || 8000)
    }).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.timeout = timeoutMs || 8000;
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (headers) {
        for (const k in headers) {
          // Filtrar cabeceras prohibidas por la especificación W3C de XMLHttpRequest
          const lk = k.toLowerCase();
          if (lk !== 'referer' && lk !== 'user-agent' && lk !== 'host' && lk !== 'origin') {
            xhr.setRequestHeader(k, headers[k]);
          }
        }
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
      xhr.timeout = timeoutMs || 8000;
      if (headers) {
        for (const k in headers) {
          const lk = k.toLowerCase();
          if (lk !== 'referer' && lk !== 'user-agent' && lk !== 'host' && lk !== 'origin') {
            xhr.setRequestHeader(k, headers[k]);
          }
        }
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
export function resolveVidara(filecode, timeoutMs) {
  const now = Date.now();
  if (cache[filecode] && cache[filecode].expiresAt > now) {
    return Promise.resolve(cache[filecode].streamUrl);
  }
  return requestPostJson('https://vidara.to/api/stream', {
    filecode: filecode,
    device: 'web',
    codecs: []
  }, null, timeoutMs || 6000).then(res => {
    const stream = res && res.streaming_url;
    if (!stream) throw new Error('Vidara: No se encontró URL de stream');
    // Token dura ~8h -> cache de 4 horas
    cache[filecode] = { streamUrl: stream, expiresAt: now + 4 * 3600 * 1000 };
    return stream;
  });
}

/** Resuelve stream de StreamWish (MP4 directo) */
export function resolveStreamWish(codeOrParam, timeoutMs) {
  const now = Date.now();
  if (cache[codeOrParam] && cache[codeOrParam].expiresAt > now) {
    return Promise.resolve(cache[codeOrParam].streamUrl);
  }
  return requestGetRedirect('https://vsembed.com/api/download/get?s=' + encodeURIComponent(codeOrParam) + '&t=720p', null, timeoutMs || 6000).then(stream => {
    // Token dura ~1h -> cache de 30 minutos
    cache[codeOrParam] = { streamUrl: stream, expiresAt: now + 30 * 60 * 1000 };
    return stream;
  });
}

/** Resuelve stream de Doodstream (MP4 directo con 10 dígitos aleatorios y expiry) */
export function resolveDood(baseWithToken) {
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

/** Resuelve un descriptor de stream individual */
export function resolveSingleDescriptor(target, timeoutMs) {
  if (!target) return Promise.reject(new Error('Destino vacío'));
  if (typeof target === 'object') {
    if (target.type === 'vidara' || target.cyberlocker === 'vidara') {
      return resolveVidara(target.code || target.filecode, timeoutMs);
    }
    if (target.type === 'streamwish' || target.cyberlocker === 'streamwish') {
      return resolveStreamWish(target.code, timeoutMs);
    }
    if (target.type === 'dood' || target.cyberlocker === 'doodstream') {
      return resolveDood(target.url || target.code);
    }
    if (target.url) return resolveSingleDescriptor(target.url, timeoutMs);
  }
  if (typeof target === 'string') {
    if (target.indexOf('vidara:') === 0) return resolveVidara(target.slice(7), timeoutMs);
    if (target.indexOf('streamwish:') === 0) return resolveStreamWish(target.slice(11), timeoutMs);
    if (target.indexOf('dood:') === 0) return resolveDood(target.slice(5));
    if (target.indexOf('http://') === 0 || target.indexOf('https://') === 0) {
      if (target.indexOf('voe.sx') >= 0 || target.indexOf('vidhide') >= 0) {
        return Promise.reject(new Error('Servidor embed no reproducible directamente'));
      }
      return Promise.resolve(target);
    }
  }
  return Promise.reject(new Error('Servidor no soportado: ' + JSON.stringify(target)));
}

/**
 * Resolutor universal con cascada de servidores:
 * Si el servidor 1 falla o demora, pasa automáticamente al servidor 2 y 3.
 */
export function resolvePoseidon(movieOrServers, preferredLang) {
  if (!movieOrServers) return Promise.reject(new Error('No hay contenido'));

  // Si tiene mapa de servidores multi-idioma (ej: movie.servers = { latino: [...], spanish: [...] })
  const serversMap = movieOrServers.servers || (movieOrServers.latino || movieOrServers.spanish ? movieOrServers : null);
  if (serversMap && typeof serversMap === 'object') {
    const lang = (preferredLang || 'latino').toLowerCase();
    const list = serversMap[lang] || serversMap['latino'] || serversMap['castellano'] || serversMap['spanish'] || serversMap['english'] || serversMap['subtitulado'] || [];
    if (Array.isArray(list) && list.length > 0) {
      // Cascada secuencial con timeout rápido por intento (3.8 segundos)
      let p = Promise.reject(new Error('Sin servidor inicial'));
      list.forEach(candidate => {
        p = p.catch(() => resolveSingleDescriptor(candidate, 3800));
      });
      return p.catch(() => {
        // Si falló el idioma preferido, probar cualquier otro idioma disponible
        const otherLangs = Object.keys(serversMap).filter(k => k !== lang);
        let fallbackP = Promise.reject(new Error('Probando idiomas alternativos'));
        otherLangs.forEach(altKey => {
          const altList = serversMap[altKey] || [];
          altList.forEach(cand => {
            fallbackP = fallbackP.catch(() => resolveSingleDescriptor(cand, 3800));
          });
        });
        return fallbackP;
      }).catch(() => {
        // Último recurso: si tiene stream o url directo
        const direct = movieOrServers.stream || movieOrServers.url;
        if (direct) return resolveSingleDescriptor(direct, 4500);
        return Promise.reject(new Error('Ningún servidor respondió'));
      });
    }
  }

  // Si es un movie normal con string stream o url
  const target = (typeof movieOrServers === 'object' ? (movieOrServers.stream || movieOrServers.url) : movieOrServers) || '';
  return resolveSingleDescriptor(target);
}
