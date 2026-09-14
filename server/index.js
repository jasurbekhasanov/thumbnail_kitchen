// Thumbnail Kitchen — server: Mini App (public/), API, Telegram webhook, muqova rasmlari.
const path = require('path');
const express = require('express');
const db = require('./db');
const tg = require('./telegram');
const { router } = require('./routes');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '200kb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, db: db.kind }));

  app.use('/api', router);

  // Telegram webhook — secret_token sarlavhasi bilan himoyalangan
  app.post('/telegram/webhook', (req, res) => {
    const secret = process.env.WEBHOOK_SECRET;
    if (secret && req.get('x-telegram-bot-api-secret-token') !== secret) return res.sendStatus(401);
    res.sendStatus(200); // Telegram'ni kuttirmaymiz
    tg.handleUpdate(req.body).catch(e => console.error('[bot] update xatosi:', e.message));
  });

  // Muqovalar o'zgarmaydi (har yuklash yangi id), shuning uchun uzoq keshlanadi
  app.get('/img/:id', async (req, res, next) => {
    if (!/^[0-9a-f-]{36}$/.test(req.params.id)) return res.sendStatus(404);
    try {
      const { rows: [img] } = await db.query(`SELECT mime, data FROM images WHERE id = $1`, [req.params.id]);
      if (!img) return res.sendStatus(404);
      res.set({ 'content-type': img.mime, 'cache-control': 'public, max-age=31536000, immutable' });
      res.send(Buffer.from(img.data));
    } catch (e) { next(e); }
  });

  app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

  // Xatolar: {error} JSON
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.type === 'entity.too.large' ? 413 : err.code === '23505' ? 409 : err.code === '23503' ? 400 : 500);
    if (status >= 500) console.error(err);
    const message = err.code === '23505' ? 'Bunday yozuv allaqachon bor'
      : err.code === '23503' ? 'Bog‘langan yozuv topilmadi'
      : status >= 500 ? 'Server xatosi' : err.message;
    res.status(status).json({ error: message });
  });

  return app;
}

async function main() {
  await db.connect();
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Thumbnail Kitchen: http://localhost:${port} (baza: ${db.kind})`));
  tg.setup();
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { createApp };
