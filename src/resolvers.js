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

function requestGetText(url, timeoutMs) {
  if (typeof XMLHttpRequest === 'undefined' && typeof fetch !== 'undefined') {
    return fetch(url, { signal: AbortSignal.timeout(timeoutMs || 8000) }).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = timeoutMs || 8000;
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 400) {
          resolve(xhr.responseText);
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

/** Desempaquetador Dean Edwards p,a,c,k,e,d */
export function unpackDeanEdwards(packed) {
  if (!packed || typeof packed !== 'string') return null;
  const match = packed.match(/}\s*\(\s*['"]([\s\S]+?)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([\s\S]+?)['"]\.split\('\|'\)/);
  if (!match) return null;
  let p = match[1];
  const a = parseInt(match[2], 10);
  let c = parseInt(match[3], 10);
  const k = match[4].split('|');
  function e(val) {
    return (val < a ? '' : e(Math.floor(val / a))) + ((val = val % a) > 35 ? String.fromCharCode(val + 29) : val.toString(36));
  }
  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
    }
  }
  return p;
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

/** Resuelve stream de VidHide (HLS .m3u8 maestro desempaquetado) */
export function resolveVidHide(codeOrUrl, timeoutMs) {
  let code = codeOrUrl;
  if (!code) return Promise.reject(new Error('VidHide: código vacío'));
  if (typeof code === 'object') {
    code = code.code || code.url || '';
  }
  if (typeof code === 'string') {
    if (code.indexOf('vidhide:') === 0) code = code.slice(8);
    if (code.indexOf('http') === 0) {
      const m = code.match(/\/v\/([a-zA-Z0-9]+)/);
      if (m) code = m[1];
    }
  }
  if (!code) return Promise.reject(new Error('VidHide: código no encontrado'));

  const now = Date.now();
  if (cache['vh_' + code] && cache['vh_' + code].expiresAt > now) {
    return Promise.resolve(cache['vh_' + code].streamUrl);
  }

  const url = 'https://vidhidepre.com/v/' + code;
  return requestGetText(url, timeoutMs || 6000).then(html => {
    if (!html || html.indexOf('File is no longer available') >= 0) {
      throw new Error('VidHide: archivo no disponible o expirado');
    }
    const packedMatch = html.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]+?\.split\('\|'\)\)\)/);
    if (!packedMatch) {
      throw new Error('VidHide: no se encontró script empaquetado');
    }
    const unpacked = unpackDeanEdwards(packedMatch[0]);
    if (!unpacked) {
      throw new Error('VidHide: fallo al desempaquetar');
    }
    const hls2Match = unpacked.match(/["']hls2["']\s*:\s*["']([^"']+)["']/);
    const m3u8Match = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    const streamUrl = hls2Match ? hls2Match[1] : (m3u8Match ? m3u8Match[0] : null);
    if (!streamUrl) {
      throw new Error('VidHide: no se encontró stream HLS');
    }
    // Token dura ~36h -> cache de 2 horas
    cache['vh_' + code] = { streamUrl: streamUrl, expiresAt: now + 2 * 3600 * 1000 };
    return streamUrl;
  });
}

/** Resuelve stream de Doodstream (MP4 directo con 10 dígitos aleatorios y expiry) */
export function resolveDood(baseWithToken) {
  if (!baseWithToken || typeof baseWithToken !== 'string') return Promise.reject(new Error('Dood: URL vacía'));
  if (baseWithToken.indexOf('/e/') >= 0) {
    return Promise.reject(new Error('Dood: Embed protegido no reproducible'));
  }
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

/** Cifrado ROT13 estándar */
export function rot13(str) {
  if (!str) return '';
  return str.replace(/[a-zA-Z]/g, c => {
    const code = c.charCodeAt(0);
    const base = code <= 90 ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

/** Decodifica el payload ofuscado de VOE (rot13 -> replace -> atob -> charCode - 3 -> reverse -> atob -> json) */
export function decodeVoePayload(encoded) {
  if (!encoded || typeof encoded !== 'string') return null;
  try {
    let s = rot13(encoded);
    s = s.replace(/@(?:\[email protected\])?~@%\?\*~!!#&/g, '_').replace(/_/g, '');
    let s2 = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    let s3 = '';
    for (let i = 0; i < s2.length; i++) {
      s3 += String.fromCharCode(s2.charCodeAt(i) - 3);
    }
    let s4 = s3.split('').reverse().join('');
    let s5 = typeof atob === 'function' ? atob(s4) : Buffer.from(s4, 'base64').toString('binary');
    return JSON.parse(s5);
  } catch (e) {
    return null;
  }
}

/** Resuelve un descriptor de stream individual */
export function resolveSingleDescriptor(target, timeoutMs) {
  if (!target) return Promise.reject(new Error('Destino vacío'));
  if (typeof target === 'object') {
    if (target.type === 'voe' || target.cyberlocker === 'voesx') {
      if (target.hls || target.source) return Promise.resolve(target.hls || target.source);
      if (target.payload) {
        const dec = decodeVoePayload(target.payload);
        if (dec && (dec.source || dec.mp4)) return Promise.resolve(dec.source || dec.mp4);
      }
      if (target.url && (target.url.indexOf('.m3u8') >= 0 || target.url.indexOf('.mp4') >= 0)) {
        return Promise.resolve(target.url);
      }
    }
    if (target.type === 'vidara' || target.cyberlocker === 'vidara') {
      return resolveVidara(target.code || target.filecode, timeoutMs);
    }
    if (target.type === 'vidhide' || target.cyberlocker === 'vidhide') {
      return resolveVidHide(target.code || target.url, timeoutMs);
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
    if (target.indexOf('voe:') === 0) {
      const rest = target.slice(4);
      if (rest.indexOf('http') === 0) return Promise.resolve(rest);
      const dec = decodeVoePayload(rest);
      if (dec && (dec.source || dec.mp4)) return Promise.resolve(dec.source || dec.mp4);
      return Promise.reject(new Error('Payload VOE no válido'));
    }
    if (target.indexOf('vidara:') === 0) return resolveVidara(target.slice(7), timeoutMs);
    if (target.indexOf('vidhide:') === 0) return resolveVidHide(target.slice(8), timeoutMs);
    if (target.indexOf('streamwish:') === 0) return resolveStreamWish(target.slice(11), timeoutMs);
    if (target.indexOf('dood:') === 0) return resolveDood(target.slice(5));
    if (target.indexOf('http://') === 0 || target.indexOf('https://') === 0) {
      if (target.indexOf('voe.sx') >= 0) {
        return Promise.reject(new Error('Servidor embed no reproducible directamente'));
      }
      if (target.indexOf('vidhide') >= 0 || target.indexOf('callistanise') >= 0) {
        return resolveVidHide(target, timeoutMs);
      }
      return Promise.resolve(target);
    }
  }
  return Promise.reject(new Error('Servidor no soportado: ' + JSON.stringify(target)));
}

/** Extrae servidores en vivo para películas encontradas en búsquedas de PoseidonHD */
export function fetchLiveServers(slug, timeoutMs) {
  if (!slug) return Promise.resolve(null);
  const cleanSlug = slug.replace(/^movies\//, '').replace(/^series\//, '');
  const url = 'https://www.poseidonhd2.co/pelicula/' + cleanSlug;
  return requestGetText(url, timeoutMs || 5000).then(html => {
    if (!html) return null;
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    try {
      const data = JSON.parse(match[1]);
      const tm = data.props && data.props.pageProps && data.props.pageProps.thisMovie;
      const vids = (tm && tm.videos) || {};
      const servers = {};
      const langKeys = ['latino', 'spanish', 'english', 'subtitulado'];
      const extractPromises = [];

      for (let i = 0; i < langKeys.length; i++) {
        const lk = langKeys[i];
        const streamList = (vids[lk] || []).slice(0, 4);
        if (!streamList.length) continue;
        const normLang = lk === 'spanish' ? 'castellano' : lk;
        servers[normLang] = [];

        streamList.forEach(s => {
          if (s.result) {
            extractPromises.push(
              requestGetText(s.result, 4000).then(pHtml => {
                const pMatch = pHtml && pHtml.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/);
                const embed = pMatch ? pMatch[1] : null;
                if (!embed) return;
                if (embed.indexOf('vidara.to/e/') >= 0) {
                  servers[normLang].push({ type: 'vidara', code: embed.split('/e/')[1], url: embed, cyberlocker: 'vidara', quality: s.quality || 'HD' });
                } else if (embed.indexOf('vidhide') >= 0 || embed.indexOf('callistanise') >= 0 || embed.indexOf('filelions') >= 0) {
                  const parts = embed.split('/v/');
                  servers[normLang].push({ type: 'vidhide', code: parts[1] || '', url: embed, cyberlocker: 'vidhide', quality: s.quality || 'HD' });
                } else if (embed.indexOf('streamwish') >= 0 || embed.indexOf('strwish') >= 0 || embed.indexOf('wish') >= 0) {
                  const parts = embed.split('/e/');
                  servers[normLang].push({ type: 'streamwish', code: parts[1] || '', url: embed, cyberlocker: 'streamwish', quality: s.quality || 'HD' });
                }
              }).catch(() => {})
            );
          }
        });
      }

      return Promise.all(extractPromises).then(() => servers);
    } catch (e) {
      return null;
    }
  }).catch(() => null);
}

/**
 * Resolutor universal con cascada de servidores:
 * Devuelve un array de URLs funcionales [primaria, respaldo] ordenadas por salud y preferencia.
 */
export function resolvePoseidonUrls(movieOrServers, preferredLang) {
  if (!movieOrServers) return Promise.reject(new Error('No hay contenido'));

  const needsLiveFetch = typeof movieOrServers === 'object' && movieOrServers.slug &&
    (!movieOrServers.servers || Object.keys(movieOrServers.servers).length === 0);

  const getServersPromise = needsLiveFetch
    ? fetchLiveServers(movieOrServers.slug, 5000).then(fetched => {
        if (fetched && Object.keys(fetched).length > 0) {
          movieOrServers.servers = fetched;
        }
        return movieOrServers.servers;
      })
    : Promise.resolve(movieOrServers.servers || (movieOrServers.latino || movieOrServers.spanish ? movieOrServers : null));

  return getServersPromise.then(serversMap => {
    if (serversMap && typeof serversMap === 'object' && Object.keys(serversMap).length > 0) {
      const lang = (preferredLang || 'latino').toLowerCase();
      const primaryList = (serversMap[lang] || serversMap['latino'] || serversMap['castellano'] || serversMap['spanish'] || serversMap['english'] || serversMap['subtitulado'] || []).slice();
      // Priorizar en cascada: 1) VidHide (estable, 36h) -> 2) Vidara -> 3) StreamWish -> 4) Voe -> 5) Dood
      primaryList.sort((a, b) => {
        function getPriority(c) {
          const t = typeof c === 'object'
            ? ((c.type || '') + ' ' + (c.cyberlocker || '') + ' ' + (c.url || '')).toLowerCase()
            : (typeof c === 'string' ? c.toLowerCase() : '');
          if (t.indexOf('vidhide') >= 0 || t.indexOf('callistanise') >= 0) return 0;
          if (t.indexOf('vidara') >= 0) return 1;
          if (t.indexOf('streamwish') >= 0) return 2;
          if (t.indexOf('voe') >= 0) return 3;
          if (t.indexOf('dood') >= 0) return 4;
          return 5;
        }
        return getPriority(a) - getPriority(b);
      });
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
  });
}

export function resolvePoseidon(movieOrServers, preferredLang) {
  return resolvePoseidonUrls(movieOrServers, preferredLang).then(urls => urls[0]);
}
