// Builds the MV3 prototype: bundles extension/src with the shared core,
// draws PNG icons, and zips everything into public/downloads for the demo site.
import { build } from "esbuild";
import { mkdirSync, rmSync, copyFileSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "extension/dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "icons"), { recursive: true });

await build({
  entryPoints: { popup: join(root, "extension/src/popup.ts"), content: join(root, "extension/src/content.ts") },
  outdir: out,
  bundle: true,
  format: "iife",
  target: "chrome116",
  minify: false,
  alias: { "@": join(root, "src") },
  legalComments: "none",
});
copyFileSync(join(root, "extension/manifest.json"), join(out, "manifest.json"));
copyFileSync(join(root, "extension/popup.html"), join(out, "popup.html"));

// --- PNG icons: the ClassPano mark rasterized with 4x4 supersampling ---
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const S = 4, u = size / 32;
  const inRR = (x, y, rx, ry, w, h, r) => {
    if (x < rx || y < ry || x > rx + w || y > ry + h) return false;
    const cx = Math.min(Math.max(x, rx + r), rx + w - r), cy = Math.min(Math.max(y, ry + r), ry + h - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const x = (px + (sx + 0.5) / S) / u, y = (py + (sy + 0.5) / S) / u;
        let col = null;
        if (inRR(x, y, 0, 0, 32, 32, 7)) col = [0, 0, 0];
        if (inRR(x, y, 4, 8, 24, 16, 4.5)) col = [255, 255, 255];
        if (inRR(x, y, 7.5, 12.4, 10, 2.4, 1.2)) col = [0, 0, 0];
        if (inRR(x, y, 7.5, 17.2, 6.5, 2.4, 1.2)) col = [115, 115, 115];
        if ((x - 22.5) ** 2 + (y - 16) ** 2 <= 9) col = [0, 194, 122];
        if (col) { r += col[0]; g += col[1]; b += col[2]; a += 255; }
      }
      const n = S * S, o = py * (size * 4 + 1) + 1 + px * 4, cov = a / n / 255;
      raw[o] = cov ? r / (n * cov) : 0; raw[o + 1] = cov ? g / (n * cov) : 0; raw[o + 2] = cov ? b / (n * cov) : 0; raw[o + 3] = a / n;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
for (const s of [16, 32, 48, 128]) writeFileSync(join(out, `icons/${s}.png`), png(s));

// --- Zip for download ---
const files = {};
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else files[`classpano-sync/${relative(out, p)}`] = readFileSync(p);
});
walk(out);
mkdirSync(join(root, "public/downloads"), { recursive: true });
writeFileSync(join(root, "public/downloads/classpano-sync-extension.zip"), zipSync(files, { level: 9 }));
console.log(`Extension built: ${Object.keys(files).length} files → public/downloads/classpano-sync-extension.zip`);
