/**
 * Genera `public/og-image.png` (1200×630).
 *
 *   npm i -D playwright && node scripts/generate-og.mjs
 *
 * Va con navegador y no con sharp porque la pieza es tipográfica: necesita
 * Geist realmente cargada y con el mismo quiebre de peso que la marca en la
 * app. Rasterizar un SVG con texto daría una fuente sustituta.
 *
 * Playwright no queda como dependencia: esto se corre a mano cuando cambia la
 * marca, no en cada build.
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og-image.png');

/** Geist variable, embebida como data URI para no depender de la red. */
const fontPath = join(ROOT, 'node_modules', '@fontsource-variable', 'geist', 'files', 'geist-latin-wght-normal.woff2');
const font = (await readFile(fontPath)).toString('base64');

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Geist Variable';
    src: url(data:font/woff2;base64,${font}) format('woff2-variations');
    font-weight: 100 900;
  }
  html, body { margin: 0; padding: 0; }
  body {
    width: 1200px; height: 630px;
    display: grid; place-items: center;
    background: #141614;
    font-family: 'Geist Variable', system-ui, sans-serif;
  }
  .wordmark {
    display: inline-flex; align-items: baseline;
    font-size: 148px; letter-spacing: -0.03em; line-height: 1;
  }
  .al    { font-weight: 400; color: #9BA197; }
  .fallo { font-weight: 500; color: #F1F2EC; }
</style>
<div class="wordmark"><span class="al">al</span><span class="fallo">fallo</span></div>`;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? undefined,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();

console.log('og-image.png          1200×630');
