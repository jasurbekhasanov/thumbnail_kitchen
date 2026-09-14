// Bazani to'ldirish.
//   npm run seed:sahna — faqat Sahna orti maqolalari (prodda ham ishlatsa bo'ladi, takrorlanmaydi)
//   npm run seed:demo  — demo dizaynerlar, chellenjlar va mavsum (FAQAT lokal sinov uchun)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const db = require('../server/db');
const league = require('../server/league');

function loadDemo() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'data.js'), 'utf8'), ctx);
  return ctx.window.TK_DEMO;
}

async function seedSahna(D) {
  for (const p of D.sahna.posts) {
    await db.query(
      `INSERT INTO sahna_posts (no, designer, descr, date, read_min, url, cover) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (url) DO NOTHING`,
      [p.no, p.designer, p.desc, p.date, p.read, p.url, p.cover]);
  }
  console.log(`Sahna orti: ${D.sahna.posts.length} ta maqola`);
}

async function seedDemo(D) {
  const { rows: [{ n }] } = await db.query(`SELECT count(*)::int AS n FROM designers`);
  if (n > 0) throw new Error('Bazada dizaynerlar bor — demo faqat bo‘sh bazaga yoziladi');

  await db.tx(async t => {
    const ids = {};
    for (const d of D.designers) {
      const { rows: [row] } = await t.query(`INSERT INTO designers (name, short) VALUES ($1, $2) RETURNING id`, [d.name, d.short]);
      ids[d.id] = row.id;
    }
    for (const c of D.challenges) {
      const { rows: [row] } = await t.query(`INSERT INTO challenges (no, title, date, published) VALUES ($1, $2, $3, true) RETURNING id`, [c.no, c.title, c.date]);
      for (const r of c.results) {
        await t.query(`INSERT INTO results (challenge_id, place, designer_id, post_url) VALUES ($1, $2, $3, $4)`, [row.id, r.place, ids[r.designer], r.post]);
      }
    }
    const L = D.league;
    const { rows: [s] } = await t.query(
      `INSERT INTO seasons (label, start, qualify_rounds, tour_days, submit_days, break_days, draw_days) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [L.season, L.start, L.qualifyRounds, L.tourDays, L.submitDays, L.breakDays, L.drawDays]);
    for (const m of league.matchSchedule(s)) {
      const demo = L.rounds.find(r => r.key === m.round).matches[m.slot] || {};
      await t.query(
        `INSERT INTO matches (season_id, round, slot, start, deadline, a, b, winner, decided_at, post_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.id, m.round, m.slot, m.start, m.deadline, ids[demo.a] || null, ids[demo.b] || null, ids[demo.winner] || null,
          demo.winner ? m.deadline : null, demo.post || null]);
    }
  });
  console.log(`Demo: ${D.designers.length} dizayner, ${D.challenges.length} chellenj, 1 mavsum`);
}

(async () => {
  const args = process.argv.slice(2);
  await db.connect();
  const D = loadDemo();
  if (args.includes('--demo')) {
    if (process.env.RAILWAY_ENVIRONMENT) throw new Error('Demo ma’lumotni prod bazaga yozmang');
    await seedDemo(D);
  }
  if (args.includes('--demo') || args.includes('--sahna')) await seedSahna(D);
  await db.close();
})().catch(async e => { console.error(e.message); await db.close(); process.exit(1); });
