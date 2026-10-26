// XHR en vez de fetch: los webOS 3.x (Chromium 38) no tienen fetch y core-js no lo polyfillea.
export function getText(url, timeoutMs) {
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
