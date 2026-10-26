// Genera los iconos PNG de la app sin dependencias (cuadro redondeado con degradado y botón play).
// Uso: npm run icons
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../public/icons/', import.meta.url);
const SIZES = { 'icon-80.png': 80, 'icon-130.png': 130, 'icon-117.png': 117, 'icon-192.png': 192, 'icon-512.png': 512 };
const ANDROID_RES = new URL('../platforms/android/app/src/main/res/', import.meta.url);
const MIPMAPS = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FROM = [0xff, 0x3b, 0x5c];
const TO = [0x7b, 0x2f, 0xf7];
const SS = 4; // supermuestreo para bordes suaves

function inRoundedRect(x, y, r) {
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function inTriangle(x, y) {
  const a = [0.4, 0.29], b = [0.4, 0.71], c = [0.74, 0.5];
  const sign = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const p = [x, y];
  const d1 = sign(p, a, b), d2 = sign(p, b, c), d3 = sign(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

// banner: rectángulo completo (Google TV recorta las esquinas solo) con el botón play en un cuadro centrado.
function render(width, height, banner) {
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / width;
          const v = (y + (sy + 0.5) / SS) / height;
          if (!banner && !inRoundedRect(u, v, 0.22)) continue;
          const t = (u + v) / 2;
          let c = FROM.map((f, i) => f + (TO[i] - f) * t);
          // En el banner el play ocupa un cuadro de alto completo en el centro.
          const pu = banner ? (u * width - (width - height) / 2) / height : u;
          if (pu >= 0 && pu <= 1 && inTriangle(pu, v)) c = [255, 255, 255];
          r += c[0]; g += c[1]; b += c[2]; a += 255;
        }
      }
      const n = SS * SS;
      const cov = a / n;
      const i = (y * width + x) * 4;
      // Color sin premultiplicar: promedio solo de las submuestras cubiertas.
      const k = a ? 255 / a : 0;
      px[i] = Math.round(r * k); px[i + 1] = Math.round(g * k); px[i + 2] = Math.round(b * k); px[i + 3] = Math.round(cov);
    }
  }
  return px;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size] of Object.entries(SIZES)) {
  writeFileSync(new URL(name, OUT), png(size, size, render(size, size)));
  console.log('icono', name, size + 'px');
}

// Android TV: icono por densidad y banner 320x180 del launcher de Google TV.
for (const [dpi, size] of Object.entries(MIPMAPS)) {
  const dir = new URL('mipmap-' + dpi + '/', ANDROID_RES);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('ic_launcher.png', dir), png(size, size, render(size, size)));
}
const drawable = new URL('drawable-xhdpi/', ANDROID_RES);
mkdirSync(drawable, { recursive: true });
writeFileSync(new URL('banner.png', drawable), png(320, 180, render(320, 180, true)));
console.log('android: iconos mipmap y banner 320x180');
