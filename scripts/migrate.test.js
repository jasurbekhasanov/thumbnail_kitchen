// Eski bazadagi natijalar (1–5-o'rin) yangi modelga (1–3 + sheflar) to'g'ri o'tishini tekshiradi
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('results migratsiyasi: 5-o‘rin → shef, ma’lumot yo‘qolmaydi, qayta ishga tushirish xavfsiz', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  // Eski sxema (prod'dagi hozirgi holat)
  await db.exec(`
    CREATE TABLE designers (id SERIAL PRIMARY KEY, tg_id BIGINT UNIQUE, name TEXT NOT NULL, short TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE images (id UUID PRIMARY KEY, mime TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE challenges (id SERIAL PRIMARY KEY, no INT NOT NULL UNIQUE, title TEXT NOT NULL, date DATE NOT NULL, published BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE results (challenge_id INT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE, place INT NOT NULL CHECK (place BETWEEN 1 AND 5),
      designer_id INT NOT NULL REFERENCES designers(id), post_url TEXT, image_id UUID REFERENCES images(id),
      PRIMARY KEY (challenge_id, place), UNIQUE (challenge_id, designer_id));
    INSERT INTO designers (name, short) SELECT 'D' || g, 'D' FROM generate_series(1, 5) g;
    INSERT INTO challenges (no, title, date, published) VALUES (1, 'Eski', '2026-08-01', true);
    INSERT INTO results (challenge_id, place, designer_id, post_url) SELECT 1, g, g, 'https://t.me/x/' || g FROM generate_series(1, 5) g;
  `);
  const schema = fs.readFileSync(path.join(__dirname, '..', 'server', 'schema.sql'), 'utf8');
  await db.exec(schema);
  await db.exec(schema); // ikkinchi marta ham xatosiz

  const { rows } = await db.query(`SELECT place, designer_id, post_url FROM results ORDER BY designer_id`);
  assert.deepEqual(rows.map(r => r.place), [1, 2, 3, 4, 4]);
  assert.equal(rows[4].post_url, 'https://t.me/x/5', 'havola saqlandi');
  // Endi uchinchi shef qo'shsa bo'ladi, lekin ikkinchi 1-o'rin — yo'q
  await db.query(`INSERT INTO designers (name, short) VALUES ('D6', 'D')`);
  await db.query(`INSERT INTO results (challenge_id, place, designer_id) VALUES (1, 4, 6)`);
  await assert.rejects(db.query(`INSERT INTO designers (name, short) VALUES ('D7', 'D'); `).then(() => db.query(`INSERT INTO results (challenge_id, place, designer_id) VALUES (1, 1, 7)`)));
  await assert.rejects(db.query(`INSERT INTO results (challenge_id, place, designer_id) VALUES (1, 4, 6)`), 'bitta dizayner ikki marta');
  await assert.rejects(db.query(`INSERT INTO results (challenge_id, place, designer_id) VALUES (1, 5, 2)`));
  await db.close();
});
