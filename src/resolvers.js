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
  if (typeof XMLHttpRequest === 'undefined' && typeof fetch !== 'undefined') {
    return fetch(url, {
      method: 'GET',
      headers: headers || {},
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs || 8000)
    }).then(r => {
      if (r.url && r.url !== url) return r.url;
      if (r.ok) return r.url || url;
      throw new Error('HTTP ' + r.status);
    });
  }
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

/** Comprueba si el stream HLS y sus segmentos están disponibles y no truncados */
export function checkStreamHealth(url, timeoutMs) {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  if (url.indexOf('97bf1') < 0 && url.indexOf('vidara') < 0) return Promise.resolve(true);
  if (typeof fetch === 'undefined') return Promise.resolve(true);

  const base = url.substring(0, url.lastIndexOf('/') + 1);
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs || 2500) })
    .then(r => r.ok ? r.text() : '')
    .then(txt => {
      if (!txt || typeof txt !== 'string') return false;
      const subline = txt.split('\n').find(l => l.indexOf('.m3u8') >= 0);
      if (!subline) return true;
      return fetch(base + subline.trim(), { signal: AbortSignal.timeout(timeoutMs || 2500) })
        .then(sr => sr.ok ? sr.text() : '')
        .then(subtxt => {
          if (!subtxt) return false;
          const segline = subtxt.split('\n').find(l => l && l.charAt(0) !== '#');
          if (!segline) return true;
          return fetch(base + segline.trim(), { signal: AbortSignal.timeout(timeoutMs || 2500) })
            .then(segr => {
              const cr = segr.headers.get('content-range');
              const cl = parseInt(segr.headers.get('content-length') || '0', 10);
              if (cr && cl === 1024 && cr.indexOf('/') >= 0 && cr.indexOf('/1024') < 0) {
                return false;
              }
              return segr.status >= 200 && segr.status < 400;
            }).catch(() => false);
        }).catch(() => false);
    })
    .catch(() => false);
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
 * Devuelve un array de URLs funcionales [primaria, respaldo] ordenadas por salud y preferencia.
 */
export function resolvePoseidonUrls(movieOrServers, preferredLang) {
  if (!movieOrServers) return Promise.reject(new Error('No hay contenido'));

  const serversMap = movieOrServers.servers || (movieOrServers.latino || movieOrServers.spanish ? movieOrServers : null);
  if (serversMap && typeof serversMap === 'object') {
    const lang = (preferredLang || 'latino').toLowerCase();
    const primaryList = serversMap[lang] || serversMap['latino'] || serversMap['castellano'] || serversMap['spanish'] || serversMap['english'] || serversMap['subtitulado'] || [];
    const otherLangs = Object.keys(serversMap).filter(k => k !== lang);

    let p = Promise.reject(new Error('Sin servidor inicial'));
    primaryList.forEach(candidate => {
      p = p.catch(() => resolveSingleDescriptor(candidate, 3800));
    });

    return p.then(primaryUrl => {
      const altCandidates = [];
      otherLangs.forEach(altKey => {
        const altList = serversMap[altKey] || [];
        if (altList.length > 0) altCandidates.push(altList[0]);
      });
      if (!altCandidates.length) return [primaryUrl];

      let altP = Promise.reject(new Error('Sin alt'));
      altCandidates.forEach(cand => {
        altP = altP.catch(() => resolveSingleDescriptor(cand, 2500));
      });
      return altP.then(altUrl => {
        return (altUrl && altUrl !== primaryUrl) ? [primaryUrl, altUrl] : [primaryUrl];
      }).catch(() => [primaryUrl]);
    }).catch(() => {
      let fallbackP = Promise.reject(new Error('Probando idiomas alternativos'));
      otherLangs.forEach(altKey => {
        const altList = serversMap[altKey] || [];
        altList.forEach(cand => {
          fallbackP = fallbackP.catch(() => resolveSingleDescriptor(cand, 3800));
        });
      });
      return fallbackP.then(fallbackUrl => [fallbackUrl]);
    }).catch(() => {
      const direct = movieOrServers.stream || movieOrServers.url;
      if (direct) return resolveSingleDescriptor(direct, 4500).then(u => [u]);
      return Promise.reject(new Error('Ningún servidor respondió'));
    });
  }

  const target = (typeof movieOrServers === 'object' ? (movieOrServers.stream || movieOrServers.url) : movieOrServers) || '';
  return resolveSingleDescriptor(target).then(u => [u]);
}

export function resolvePoseidon(movieOrServers, preferredLang) {
  return resolvePoseidonUrls(movieOrServers, preferredLang).then(urls => urls[0]);
}
