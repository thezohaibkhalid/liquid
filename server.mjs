import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { storefront } from './src/routes/storefront.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// serve published snapshots (static)
app.use('/snapshots', express.static(path.join(__dirname, 'public', 'snapshots')));

// API/SSR routes (dynamic Liquid rendering)
app.use('/', storefront);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Server error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
