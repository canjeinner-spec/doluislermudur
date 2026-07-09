/* Generates ASTERA's icon / adaptive-icon / splash PNGs procedurally so the
 * repo stays asset-light. Draws the near-black cinematic base, a warm ambient
 * bloom and a copper rounded-tile mark with a play glyph. Run: node scripts/gen-assets.js */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Rounded-rect signed coverage (1 inside, 0 outside, soft edge).
function roundedRectCoverage(x, y, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(x - cx) - (halfW - r);
  const dy = Math.abs(y - cy) - (halfH - r);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  const dist = outside + inside - r;
  return Math.max(0, Math.min(1, 0.5 - dist));
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function render(size, { transparentBg = false, tileScale = 0.5 } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const half = size * tileScale * 0.5;
  const radius = half * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Base background with a warm bloom toward the upper-center.
      const gx = (x - cx) / size;
      const gy = (y - cy * 0.7) / size;
      const glow = Math.max(0, 1 - Math.hypot(gx, gy) * 2.1);
      let r = lerp(9, 58, glow * 0.7);
      let g = lerp(9, 34, glow * 0.7);
      let b = lerp(9, 20, glow * 0.7);
      let a = transparentBg ? 0 : 255;

      // Copper tile with vertical gradient.
      const cov = roundedRectCoverage(x, y, cx, cy, half, half, radius);
      if (cov > 0) {
        const t = (y - (cy - half)) / (half * 2);
        const tr = lerp(230, 150, t);
        const tg = lerp(150, 78, t);
        const tb = lerp(90, 48, t);
        r = lerp(r, tr, cov);
        g = lerp(g, tg, cov);
        b = lerp(b, tb, cov);
        a = lerp(a, 255, cov);
      }

      // Play triangle glyph, nudged right for optical centering.
      const triSize = half * 0.62;
      const ox = cx - triSize * 0.32 + size * 0.02;
      const inTri = pointInTriangle(
        x, y,
        ox, cy - triSize * 0.55,
        ox, cy + triSize * 0.55,
        ox + triSize * 0.95, cy
      );
      if (inTri && cov > 0.5) {
        r = lerp(r, 20, 0.92);
        g = lerp(g, 14, 0.92);
        b = lerp(b, 10, 0.92);
      }

      buf[i] = clamp(r);
      buf[i + 1] = clamp(g);
      buf[i + 2] = clamp(b);
      buf[i + 3] = clamp(a);
    }
  }
  return buf;
}

function encodePng(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
    return Buffer.concat([len, t, data, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'icon.png', size: 1024, opts: {} },
  { name: 'adaptive-icon.png', size: 1024, opts: { transparentBg: true, tileScale: 0.62 } },
  { name: 'splash.png', size: 1024, opts: { tileScale: 0.34 } },
  { name: 'favicon.png', size: 96, opts: {} },
];

for (const t of targets) {
  const rgba = render(t.size, t.opts);
  fs.writeFileSync(path.join(outDir, t.name), encodePng(t.size, rgba));
  console.log('wrote', t.name, `${t.size}x${t.size}`);
}
