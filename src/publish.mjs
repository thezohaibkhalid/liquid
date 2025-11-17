import fs from 'fs/promises';
import path from 'path';
import { engine } from './engine.mjs';
import { menu, i18n } from './data.mjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(__dirname, '..', 'public', 'snapshots');

const pages = [
  { name: 'index',   data: { page_title: 'TASTIQO — Home', menu, i18n: i18n.en }, path: 'index.html' },
  { name: 'menu',    data: { page_title: 'Menu', items: menu, i18n: i18n.en },    path: 'menu/index.html' },
  ...menu.map(p => ({
    name: 'product',
    data: { page_title: p.title, product: p, i18n: i18n.en },
    path: `product/${p.id}/index.html`
  }))
];

const snapshotId = new Date().toISOString().replace(/[:.]/g,'-');
const outDir = path.join(outRoot, snapshotId);

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  for (const p of pages) {
    const html = await engine.renderFile(`pages/${p.name}`, p.data);
    const full = path.join(outDir, p.path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, html, 'utf8');
    console.log('✔ wrote', p.path);
  }
  console.log('\nSnapshot ready:', `/snapshots/${snapshotId}/index.html`);
}

main().catch(err => { console.error(err); process.exit(1); });
