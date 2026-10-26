// Genera los iconos PNG de la app sin dependencias (cuadro redondeado con degradado y botón play).
// Uso: npm run icons
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../public/icons/', import.meta.url);
const SIZES = { 'icon-80.png': 80, 'icon-130.png': 130, 'icon-117.png': 117, 'icon-192.png': 192, 'icon-512.png': 512 };
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

function render(size) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          if (!inRoundedRect(u, v, 0.22)) continue;
          const t = (u + v) / 2;
          let c = FROM.map((f, i) => f + (TO[i] - f) * t);
          if (inTriangle(u, v)) c = [255, 255, 255];
          r += c[0]; g += c[1]; b += c[2]; a += 255;
        }
      }
      const n = SS * SS;
      const cov = a / n;
      const i = (y * size + x) * 4;
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

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size] of Object.entries(SIZES)) {
  writeFileSync(new URL(name, OUT), png(size, render(size)));
  console.log('icono', name, size + 'px');
}
