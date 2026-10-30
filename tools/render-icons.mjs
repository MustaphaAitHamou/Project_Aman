// Génère les PNG de l'application (icônes, splash, favicon) à partir des SVG sources.
// Usage : node tools/render-icons.mjs
// Prérequis : Playwright et son Chromium disponibles (`npx playwright install chromium` si besoin).
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `require` (et non `import`) pour résoudre aussi une installation globale via NODE_PATH.
const require = createRequire(import.meta.url);

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(root, 'apps/mobile/assets/source');
const outDir = path.join(root, 'apps/mobile/assets/images');

const targets = [
  { src: 'icon.svg', out: 'icon.png', size: 1024 },
  {
    src: 'adaptive-foreground.svg',
    out: 'adaptive-icon-foreground.png',
    size: 1024,
    transparent: true,
  },
  {
    src: 'adaptive-monochrome.svg',
    out: 'adaptive-icon-monochrome.png',
    size: 1024,
    transparent: true,
  },
  { src: 'splash.svg', out: 'splash-icon.png', size: 1024, transparent: true },
  { src: 'icon.svg', out: 'favicon.png', size: 48, rounded: true },
];

const { chromium } = require('playwright');
const browser = await chromium.launch();
try {
  for (const target of targets) {
    const svg = await readFile(path.join(sourceDir, target.src), 'utf8');
    const page = await browser.newPage({ viewport: { width: target.size, height: target.size } });
    const radius = target.rounded ? `${Math.round(target.size * 0.22)}px` : '0';
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">` +
        `<div style="width:${target.size}px;height:${target.size}px;border-radius:${radius};overflow:hidden">` +
        svg.replace('<svg ', `<svg style="width:100%;height:100%;display:block" `) +
        `</div></body></html>`,
    );
    const png = await page.screenshot({
      omitBackground: Boolean(target.transparent || target.rounded),
    });
    await writeFile(path.join(outDir, target.out), png);
    await page.close();
    console.log(`✓ ${target.out} (${target.size}px)`);
  }
} finally {
  await browser.close();
}
