/**
 * Genera los PNG del sistema de ícono a partir de los SVG de `public/`.
 *
 *   node scripts/generate-icons.mjs
 *
 * Los PNG se commitean; esto es para regenerarlos cuando cambie el signo, no
 * un paso del build.
 *
 * La og-image NO sale de acá: necesita Geist renderizada, así que la produce
 * `scripts/generate-og.mjs` con un navegador de verdad.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Grafito de la marca — el fondo de los íconos. */
const GRAPHITE = { r: 0x14, g: 0x16, b: 0x14, alpha: 1 };

/**
 * Variante de 32px. A ese tamaño el trazo del contorno no sobrevive, así que
 * la cuarta unidad pasa a gris sólido: se conserva "tres iguales y una
 * distinta", que es lo que dice el signo, sin depender de un filete.
 */
const VARIANT_32 = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="7" fill="#141614"/>
  <rect x="5"  y="10" width="4" height="12" rx="1" fill="#84D717"/>
  <rect x="11" y="10" width="4" height="12" rx="1" fill="#84D717"/>
  <rect x="17" y="10" width="4" height="12" rx="1" fill="#84D717"/>
  <rect x="23" y="10" width="4" height="12" rx="1" fill="#3A4038"/>
</svg>`;

async function fromFile(name) {
  return readFile(join(PUBLIC, name));
}

async function render(svg, size, out, { flatten = false } = {}) {
  let pipeline = sharp(Buffer.from(svg), { density: 384 }).resize(size, size);
  // apple-touch-icon no admite transparencia: iOS la rellena de negro y queda
  // un halo alrededor del radio. Se aplana contra el grafito de la marca.
  if (flatten) pipeline = pipeline.flatten({ background: GRAPHITE });
  const buf = await pipeline.png().toBuffer();
  await writeFile(join(PUBLIC, out), buf);
  console.log(`${out.padEnd(24)} ${size}×${size}  ${(buf.length / 1024).toFixed(1)} kB`);
}

const icon = await fromFile('icon.svg');
const maskable = await fromFile('icon-maskable.svg');

await render(VARIANT_32, 32, 'favicon-32.png');
await render(icon, 192, 'icon-192.png');
await render(icon, 512, 'icon-512.png');
await render(maskable, 512, 'icon-maskable-512.png');
await render(icon, 180, 'apple-touch-icon.png', { flatten: true });
