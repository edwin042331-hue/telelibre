// Mini helpers de DOM compatibles con Chromium 38 (sin Element.closest ni NodeList.forEach).

export function h(tag, props, children) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

export function append(el, child) {
  if (child == null || child === false) return;
  if (Array.isArray(child)) child.forEach(c => append(el, c));
  else el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function matches(el, sel) {
  const fn = el.matches || el.webkitMatchesSelector;
  return fn.call(el, sel);
}

export function closest(el, sel) {
  while (el && el.nodeType === 1) {
    if (matches(el, sel)) return el;
    el = el.parentNode;
  }
  return null;
}

export function toArray(list) {
  return Array.prototype.slice.call(list);
}

export function isAttached(el) {
  return !!el && document.body.contains(el);
}
