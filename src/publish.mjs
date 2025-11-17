import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from './engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '..');
const viewsDir  = path.join(root, 'views');
const outRoot   = path.join(root, 'public', 'snapshots');

/* ---------- helpers ---------- */

/** Allow // and /* *\/ comments in settings.json */
function stripJsonComments(src) {
  const noLine  = src.replace(/(^|\s)\/\/[^\n\r]*/g, '$1');  // // ...
  const noBlock = noLine.replace(/\/\*[^]*?\*\//g, '');      /* ... */
  return noBlock;
}

async function readSettings() {
  const raw = await fs.readFile(path.join(viewsDir, 'settings.json'), 'utf8');
  const clean = stripJsonComments(raw);
  try {
    return JSON.parse(clean);
  } catch (e) {
    const where = (e?.message || '').replace('JSON', 'settings.json');
    throw new Error(`settings.json parse error → ${where}`);
  }
}

/** fail fast with a clear message if a section template is missing */
async function assertTemplateExists(relPath) {
  const candidates = [
    path.join(viewsDir, relPath + '.liquid'),
    path.join(viewsDir, relPath) // in case engine adds extname
  ];
  for (const p of candidates) {
    try { await fs.access(p); return; } catch {}
  }
  throw new Error(`Template not found: ${relPath}.liquid (looked in ${viewsDir})`);
}

/* ---------- rendering ---------- */

/** Render one section (returns HTML string) */
export async function renderSection(section, theme, i18n) {
  const rel = path.join('sections', `${section.type}`);
  await assertTemplateExists(rel);
  return engine.renderFile(rel, { section, theme, i18n });
}

/** Render a full page by rendering/concatenating its sections into the chosen layout */
export async function renderPage(page, settings) {
  const theme  = settings.theme || {};
  const i18n   = { add_to_cart: 'Add to Cart', ...(settings.i18n || {}) };
  const header = settings.globals?.header || { links: [] };
  const footer = settings.globals?.footer || { text: '' };

  // Render all sections concurrently
  const rendered = await Promise.all(
    (page.sections || []).map(async (s) => {
      const html = await renderSection(s, theme, i18n);
      // wrap so your editor can hot-swap a single section by #section-<id>
      return `<div id="section-${s.id}">\n${html}\n</div>`;
    })
  );

  const sectionsHtml = rendered.join('\n');

  // Inline wrapper template that injects the sections into the layout via {{ content }}
  const pageWrapper = `
{% layout "${page.layout}" %}
${sectionsHtml}
`;

  // Render the wrapper string (not file)
  const fullHtml = await engine.parseAndRender(pageWrapper, {
    page_title: page.title,
    theme,
    header,
    footer
  });

  return fullHtml;
}

/** Publish all pages from settings.json into a timestamped snapshot folder */
export async function publish() {
  const settings   = await readSettings();
  const snapshotId = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir     = path.join(outRoot, snapshotId);

  await fs.mkdir(outDir, { recursive: true });

  // Render pages and write files
  for (const page of settings.pages || []) {
    const html = await renderPage(page, settings);
    const dest = path.join(outDir, page.path);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, html, 'utf8');
    console.log('✔ wrote', page.path);
  }

  // Optional: write a small manifest for CDN routers / rollbacks
  const manifest = {
    snapshotId,
    createdAt: new Date().toISOString(),
    pages: (settings.pages || []).map(p => p.path),
    theme: settings.theme?.name || 'unknown'
  };
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log('\nSnapshot ready:', `/snapshots/${snapshotId}/index.html`);
  return snapshotId;
}

/* ---------- run if called directly ---------- */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  publish().catch(err => { console.error(err); process.exit(1); });
}
