// Baza ulanishi. DATABASE_URL bo'lsa — haqiqiy Postgres (Railway).
// Bo'lmasa — lokal ishlab chiqish uchun PGlite (Node ichidagi Postgres, .pglite papkasida saqlanadi).
const fs = require('fs');
const path = require('path');

const DATE_OID = 1082; // DATE ustunlari 'YYYY-MM-DD' satr bo'lib qaytsin, JS Date'ga aylanmasin (vaqt zonasi xatolari)
const INT8_OID = 20;   // BIGINT (Telegram ID) — oddiy son bo'lsin: satr/BigInt JSON'da muammo qiladi
const parsers = { [DATE_OID]: v => v, [INT8_OID]: v => Number(v) };

let impl;

async function connect() {
  if (impl) return impl;
  if (process.env.DATABASE_URL) {
    const pg = require('pg');
    for (const [oid, fn] of Object.entries(parsers)) pg.types.setTypeParser(Number(oid), fn);
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
    impl = {
      kind: 'postgres',
      query: (text, params) => pool.query(text, params),
      exec: text => pool.query(text),
      async tx(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const out = await fn({ query: (t, p) => client.query(t, p) });
          await client.query('COMMIT');
          return out;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  } else {
    if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL o‘rnatilmagan');
    const { PGlite } = await import('@electric-sql/pglite');
    const dir = process.env.PGLITE_DIR || path.join(__dirname, '..', '.pglite');
    const db = dir === 'memory://' ? new PGlite({ parsers }) : new PGlite(dir, { parsers });
    await db.waitReady;
    impl = {
      kind: 'pglite',
      query: (text, params) => db.query(text, params),
      exec: text => db.exec(text),
      tx: fn => db.transaction(t => fn({ query: (q, p) => t.query(q, p) })),
      close: () => db.close(),
    };
  }
  await impl.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return impl;
}

const db = {
  connect,
  query: (t, p) => impl.query(t, p),
  tx: fn => impl.tx(fn),
  get kind() { return impl && impl.kind; },
  close: () => impl && impl.close(),
};

module.exports = db;
