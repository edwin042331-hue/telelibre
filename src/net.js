// XHR para webOS 3.x (Chromium 38 sin fetch nativo) y fetch en entornos modernos / Node.js
export function getText(url, timeoutMs) {
  if (typeof XMLHttpRequest === 'undefined' && typeof fetch !== 'undefined') {
    return fetch(url, { signal: AbortSignal.timeout(timeoutMs || 20000) }).then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = timeoutMs || 20000;
    xhr.onload = () => {
      // status 0 con contenido ocurre al leer archivos locales en apps empaquetadas.
      if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) resolve(xhr.responseText);
      else reject(new Error('HTTP ' + xhr.status));
    };
    xhr.onerror = () => reject(new Error('sin conexión'));
    xhr.ontimeout = () => reject(new Error('tiempo agotado'));
    xhr.send();
  });
}
