import express from 'express';
import { engine } from '../engine.mjs';
import { menu, i18n } from '../data.mjs';

export const storefront = express.Router();

// Home → renders views/pages/index.liquid
storefront.get('/', async (req, res, next) => {
  try {
    const html = await engine.renderFile('pages/index', {
      page_title: 'TASTIQO — Home',
      menu,
      i18n: i18n.en
    });
    res.type('html').send(html);
  } catch (e) { next(e); }
});

// Menu list → renders views/pages/menu.liquid
storefront.get('/menu', async (req, res, next) => {
  try {
    const html = await engine.renderFile('pages/menu', {
      page_title: 'Menu',
      items: menu,
      i18n: i18n.en
    });
    res.type('html').send(html);
  } catch (e) { next(e); }
});

// Product details → renders views/pages/product.liquid
storefront.get('/product/:id', async (req, res, next) => {
  try {
    const product = menu.find(p => p.id === req.params.id);
    if (!product) return res.status(404).send('Not found');
    const html = await engine.renderFile('pages/product', {
      page_title: product.title,
      product,
      i18n: i18n.en
    });
    res.type('html').send(html);
  } catch (e) { next(e); }
});
