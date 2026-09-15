// Zaxira nusxasini bazaga tiklash.
//   node scripts/restore.js backup.json.gz            — DATABASE_URL yoki lokal PGlite (.pglite) ga, baza bo'sh bo'lishi kerak
//   PGLITE_DIR=/tmp/check node scripts/restore.js f   — alohida lokal bazaga sinab tiklash
//   ... --wipe                                         — mavjud ma'lumotni o'chirib tiklash (EHTIYOT)
const fs = require('fs');
const db = require('../server/db');
const backup = require('../server/backup');

(async () => {
  const file = process.argv[2];
  if (!file) throw new Error('Fayl ko‘rsatilmagan');
  const wipe = process.argv.includes('--wipe');
  if (wipe && process.env.RAILWAY_ENVIRONMENT && !process.argv.includes('--yes-really')) throw new Error('Prod bazani o‘chirish uchun --yes-really kerak');
  const dump = backup.gunzipDump(fs.readFileSync(file));
  await db.connect();
  await db.tx(t => backup.importAll(t.query, dump, { wipe }));
  const got = await backup.summary(db.query);
  const expected = Object.fromEntries(backup.TABLES.map(t => [t, dump.tables[t].length]));
  const bad = backup.TABLES.filter(t => got[t] !== expected[t]);
  console.log(`Nusxa: ${dump.created_at}`);
  console.table(backup.TABLES.map(t => ({ jadval: t, nusxada: expected[t], tiklandi: got[t] })));
  console.log(bad.length ? `XATO: ${bad.join(', ')} mos emas` : `✓ Hammasi mos. Muqovalar: ${(got.image_bytes / 1048576).toFixed(1)} MB`);
  await db.close();
  if (bad.length) process.exit(1);
})().catch(async e => { console.error('XATO:', e.message); await db.close(); process.exit(1); });
