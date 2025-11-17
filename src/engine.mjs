import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewsRoot = path.resolve(__dirname, '..', 'views');

export const engine = new Liquid({
  root: [
    viewsRoot,
    path.join(viewsRoot, 'snippets'),
    path.join(viewsRoot, 'layouts'),
    path.join(viewsRoot, 'pages')
  ],
  extname: '.liquid',
  cache: process.env.NODE_ENV === 'production'
});

// Filters (money, i18n)
engine.registerFilter('money', (v, cur='PKR', locale='en-PK') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(Number(v||0))
);
engine.registerFilter('t', (key, dict={}) => dict[key] ?? key);
