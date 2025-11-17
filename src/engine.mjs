import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const viewsRoot  = path.resolve(__dirname, '..', 'views');

/**
 * Liquid engine
 * - root includes the whole /views tree so "sections/*", "layouts/*", etc. resolve.
 * - cache enabled in production.
 */
export const engine = new Liquid({
  root: [
    viewsRoot,                                 // lets 'sections/*' resolve directly
    path.join(viewsRoot, 'snippets'),
    path.join(viewsRoot, 'layouts'),
    path.join(viewsRoot, 'pages')
  ],
  extname: '.liquid',
  cache: process.env.NODE_ENV === 'production'
});

/* ---------------- Filters ---------------- */

engine.registerFilter('money', (v, cur = 'PKR', locale = 'en-PK') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: cur })
    .format(Number(v ?? 0))
);

engine.registerFilter('date_fmt', (value, locale = 'en-PK', opts = {}) => {
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit', ...opts }).format(d);
  } catch { return String(value ?? ''); }
});

engine.registerFilter('json', (v) => {
  try { return JSON.stringify(v); } catch { return 'null'; }
});

engine.registerFilter('t', (key, dict = {}) => dict?.[key] ?? key);

engine.registerFilter('url_encode', (v = '') => encodeURIComponent(String(v)));
