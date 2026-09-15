// API yo'nalishlari: umumiy (/api), foydalanuvchi (/api/me, /api/register), admin (/api/admin/*)
const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const tg = require('./telegram');
const { buildState } = require('./state');
const { fetchTeletype } = require('./teletype');
const league = require('./league');
const backup = require('./backup');
const { httpError } = league;

const adminIds = () => new Set((process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean));

/* ---------- Validatsiya yordamchilari ---------- */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, name, { max = 300, optional = false } = {}) => {
  if (v == null || v === '') { if (optional) return null; throw httpError(400, `${name} kiritilmagan`); }
  if (typeof v !== 'string' || v.length > max) throw httpError(400, `${name} noto‘g‘ri`);
  return v.trim();
};
const int = (v, name, { min = 0, max = 1e6, optional = false } = {}) => {
  if (v == null || v === '') { if (optional) return null; throw httpError(400, `${name} kiritilmagan`); }
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw httpError(400, `${name} noto‘g‘ri`);
  return n;
};
const date = (v, name, opts = {}) => {
  if ((v == null || v === '') && opts.optional) return null;
  if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw httpError(400, `${name} sanasi noto‘g‘ri (YYYY-MM-DD)`);
  return v;
};
const url = (v, name, opts = {}) => {
  const s = str(v, name, { max: 500, ...opts });
  if (s == null) return null;
  if (!/^https:\/\//.test(s)) throw httpError(400, `${name} https:// bilan boshlanishi kerak`);
  return s;
};
// Telegram username: @ siz, 5–32 belgi
const username = v => {
  const s = str(v, 'Username', { max: 40, optional: true });
  if (s == null) return null;
  const u = s.replace(/^@/, '').replace(/^https:\/\/t\.me\//, '');
  if (!/^[A-Za-z0-9_]{4,32}$/.test(u)) throw httpError(400, 'Username noto‘g‘ri (@siz, lotin harf, raqam, _)');
  return u;
};
const pick = (body, keys) => keys.filter(k => Object.hasOwn(body, k));

/* ---------- Auth ---------- */
// Frontend har so'rovda Telegram initData'ni x-telegram-init-data sarlavhasida yuboradi
function auth(req, _res, next) {
  const user = tg.verifyInitData(req.get('x-telegram-init-data'), process.env.BOT_TOKEN);
  if (user) req.tgUser = user;
  // Faqat lokal ishlab chiqish: Telegram'siz brauzerda sinash uchun
  else if (process.env.DEV_USER_ID && process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
    req.tgUser = { id: Number(process.env.DEV_USER_ID), first_name: 'Dev', username: 'dev' };
  }
  next();
}
const requireUser = (req, _res, next) => next(req.tgUser ? undefined : httpError(401, 'Telegram orqali oching'));
const requireAdmin = (req, _res, next) =>
  next(req.tgUser && adminIds().has(String(req.tgUser.id)) ? undefined : httpError(403, 'Faqat adminlar uchun'));

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).then(out => out !== undefined && res.json(out)).catch(next);

const router = express.Router();
router.use(auth);

/* ---------- Umumiy ---------- */
router.get('/state', wrap(async (_req, res) => {
  res.set('cache-control', 'no-store');
  return buildState();
}));

router.get('/me', requireUser, wrap(async req => {
  const { rows: [u] } = await db.query(`SELECT roles, interests, tag, tag_error, registered_at FROM users WHERE tg_id = $1`, [req.tgUser.id]);
  return {
    id: req.tgUser.id,
    registered: Boolean(u && u.registered_at),
    roles: u ? u.roles : [],
    interests: u ? u.interests : [],
    isAdmin: adminIds().has(String(req.tgUser.id)),
  };
}));

const ROLES = ['designer', 'youtuber'];
const INTERESTS = ['feedback', 'inspiration', 'challenges'];

router.post('/register', requireUser, wrap(async req => {
  const roles = [...new Set(req.body.roles || [])];
  const interests = [...new Set(req.body.interests || [])];
  if (!roles.length || roles.some(r => !ROLES.includes(r))) throw httpError(400, 'Rolni tanlang');
  if (!interests.length || interests.some(i => !INTERESTS.includes(i))) throw httpError(400, 'Qiziqishni tanlang');
  const u = req.tgUser;

  await db.query(
    `INSERT INTO users (tg_id, username, first_name, last_name, roles, interests, registered_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now(), now())
     ON CONFLICT (tg_id) DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name, roles = EXCLUDED.roles, interests = EXCLUDED.interests,
       registered_at = COALESCE(users.registered_at, now()), updated_at = now()`,
    [u.id, u.username || null, u.first_name || null, u.last_name || null, roles, interests]);

  // "Muqova dizaynerman" — ligada qatnashish ro'yxatiga kiradi
  if (roles.includes('designer')) {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `ID ${u.id}`;
    const short = (u.first_name || u.username || 'DZN').replace(/[^\p{L}]/gu, '').slice(0, 3).toUpperCase() || 'DZN';
    // Admin oldin qo'lda qo'shgan bo'lsa (o'tgan chellenjlar uchun), yangi yozuv ochmay o'shanga bog'laymiz
    const linked = u.username ? await db.query(
      `UPDATE designers SET tg_id = $1 WHERE tg_id IS NULL AND lower(username) = lower($2)
         AND NOT EXISTS (SELECT 1 FROM designers WHERE tg_id = $1) RETURNING id`, [u.id, u.username]) : { rows: [] };
    if (!linked.rows.length) {
      await db.query(`INSERT INTO designers (tg_id, name, short, username) VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING`, [u.id, name, short, u.username || null]);
    }
  }

  const { tag, error } = await tg.applyTag(u.id, roles);
  await db.query(`UPDATE users SET tag = $1, tag_error = $2 WHERE tg_id = $3`, [error ? null : tag, error, u.id]);
  if (error) console.warn(`[tag] ${u.id}: ${error}`);
  return { ok: true, tag: error ? null : tag };
}));

/* ---------- Admin ---------- */
const admin = express.Router();
admin.use(requireUser, requireAdmin);

admin.get('/overview', wrap(async () => {
  const q = db.query;
  const [users, designers, challenges, results, seasons, matches, posts] = await Promise.all([
    q(`SELECT tg_id, username, first_name, last_name, roles, interests, tag, tag_error, registered_at FROM users ORDER BY registered_at DESC NULLS LAST`),
    q(`SELECT id, tg_id, name, short, username FROM designers ORDER BY name`),
    q(`SELECT id, no, title, date, published FROM challenges ORDER BY no DESC`),
    q(`SELECT challenge_id, place, designer_id, post_url, image_id FROM results ORDER BY challenge_id, place`),
    q(`SELECT * FROM seasons ORDER BY start DESC`),
    q(`SELECT * FROM matches ORDER BY season_id, round, slot`),
    q(`SELECT * FROM sahna_posts ORDER BY no DESC`),
  ]);
  return {
    users: users.rows, designers: designers.rows,
    challenges: challenges.rows.map(c => ({ ...c, results: results.rows.filter(r => r.challenge_id === c.id) })),
    seasons: seasons.rows, matches: matches.rows, sahna: posts.rows,
  };
}));

// Dizaynerlar
admin.post('/designers', wrap(async req => {
  const name = str(req.body.name, 'Ism', { max: 80 });
  const short = (str(req.body.short, 'Qisqa nom', { max: 4, optional: true }) || name.replace(/[^\p{L}]/gu, '').slice(0, 3)).toUpperCase();
  const tgId = int(req.body.tg_id, 'Telegram ID', { max: 1e13, optional: true });
  const { rows: [d] } = await db.query(`INSERT INTO designers (name, short, tg_id, username) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, short, tgId, username(req.body.username)]);
  return d;
}));

admin.patch('/designers/:id', wrap(async req => {
  const id = int(req.params.id, 'ID');
  const sets = [], vals = [];
  for (const k of pick(req.body, ['name', 'short', 'tg_id', 'username'])) {
    const v = k === 'name' ? str(req.body.name, 'Ism', { max: 80 })
      : k === 'short' ? str(req.body.short, 'Qisqa nom', { max: 4 }).toUpperCase()
      : k === 'username' ? username(req.body.username)
      : int(req.body.tg_id, 'Telegram ID', { max: 1e13, optional: true });
    vals.push(v); sets.push(`${k} = $${vals.length}`);
  }
  if (!sets.length) throw httpError(400, 'O‘zgartirish yo‘q');
  vals.push(id);
  const { rows: [d] } = await db.query(`UPDATE designers SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
  if (!d) throw httpError(404, 'Dizayner topilmadi');
  return d;
}));

// Ro'yxatdan o'tgan odamni o'chirish: ro'yxat + guruhdagi tag.
// Dizayner yozuvi natijasi bo'lmasa o'chadi; natijasi bo'lsa liga tarixi uchun qoladi (Telegram'dan uziladi).
admin.delete('/users/:tgId', wrap(async req => {
  const tgId = int(req.params.tgId, 'Telegram ID', { min: 1, max: 1e13 });
  const out = await db.tx(async t => {
    const { rows: [u] } = await t.query(`SELECT tg_id, tag FROM users WHERE tg_id = $1`, [tgId]);
    if (!u) throw httpError(404, 'Foydalanuvchi topilmadi');
    const { rows: [d] } = await t.query(`SELECT id FROM designers WHERE tg_id = $1`, [tgId]);
    let designer = null;
    if (d) {
      const { rows: [{ n }] } = await t.query(
        `SELECT (SELECT count(*) FROM results WHERE designer_id = $1) + (SELECT count(*) FROM matches WHERE $1 IN (a, b, winner)) AS n`, [d.id]);
      if (Number(n) === 0) { await t.query(`DELETE FROM designers WHERE id = $1`, [d.id]); designer = 'deleted'; }
      else designer = 'kept';
    }
    await t.query(`DELETE FROM users WHERE tg_id = $1`, [tgId]); // saqlangan dizaynerda tg_id avtomatik NULL bo'ladi
    return { ok: true, designer, hadTag: Boolean(u.tag) };
  });
  // Tagni olib tashlash (bo'sh tag). Xato bo'lsa ham o'chirish bekor qilinmaydi.
  let tagRemoved = false;
  if (out.hadTag && process.env.GROUP_CHAT_ID) {
    try { await tg.call('setChatMemberTag', { chat_id: process.env.GROUP_CHAT_ID, user_id: tgId, tag: '' }); tagRemoved = true; }
    catch (e) { console.warn(`[tag] ${tgId} olib tashlanmadi: ${e.message}`); }
  }
  return { ...out, tagRemoved };
}));

// Dizaynerni o'chirish — faqat natijasi va jangi bo'lmasa (liga tarixi buzilmasin)
admin.delete('/designers/:id', wrap(async req => {
  const id = int(req.params.id, 'ID', { min: 1 });
  const { rows: [{ n }] } = await db.query(
    `SELECT (SELECT count(*) FROM results WHERE designer_id = $1) + (SELECT count(*) FROM matches WHERE $1 IN (a, b, winner)) AS n`, [id]);
  if (Number(n) > 0) throw httpError(409, 'Dizaynerning natijalari bor — o‘chirib bo‘lmaydi');
  const { rowCount } = await db.query(`DELETE FROM designers WHERE id = $1`, [id]);
  if (!rowCount) throw httpError(404, 'Dizayner topilmadi');
  return { ok: true };
}));

// Ikki dizayner yozuvini birlashtirish: eski (qo'lda qo'shilgan, import) yozuv ro'yxatdan o'tgan odamga bog'lanadi.
// Natijalar va janglar eski yozuvda qoladi (target), ro'yxatdan o'tgan yangi yozuv (source) o'chadi.
admin.post('/designers/:id/merge', wrap(async req => {
  const sourceId = int(req.params.id, 'ID', { min: 1 });          // ro'yxatdan o'tgan (tg_id bor)
  const targetId = int(req.body.target_id, 'Eski yozuv', { min: 1 }); // qo'lda qo'shilgan (tg_id yo'q)
  if (sourceId === targetId) throw httpError(400, 'Bir xil yozuv');
  return db.tx(async t => {
    const { rows } = await t.query(`SELECT * FROM designers WHERE id = ANY($1::int[])`, [[sourceId, targetId]]);
    const source = rows.find(d => d.id === sourceId), target = rows.find(d => d.id === targetId);
    if (!source || !target) throw httpError(404, 'Dizayner topilmadi');
    if (target.tg_id) throw httpError(409, `${target.name} allaqachon Telegram akkauntga bog‘langan`);
    // Ikkalasi bitta chellenjda qatnashgan bo'lsa — yuqoriroq o'rin qoladi
    const { rows: both } = await t.query(
      `SELECT s.challenge_id, s.place AS sp, tr.place AS tp FROM results s JOIN results tr ON tr.challenge_id = s.challenge_id AND tr.designer_id = $2
       WHERE s.designer_id = $1`, [sourceId, targetId]);
    for (const c of both) {
      if (c.sp < c.tp) await t.query(`DELETE FROM results WHERE challenge_id = $1 AND designer_id = $2`, [c.challenge_id, targetId]);
      else await t.query(`DELETE FROM results WHERE challenge_id = $1 AND designer_id = $2`, [c.challenge_id, sourceId]);
    }
    await t.query(`UPDATE results SET designer_id = $2 WHERE designer_id = $1`, [sourceId, targetId]);
    for (const col of ['a', 'b', 'winner']) await t.query(`UPDATE matches SET ${col} = $2 WHERE ${col} = $1`, [sourceId, targetId]);
    await t.query(`DELETE FROM designers WHERE id = $1`, [sourceId]);
    const { rows: [merged] } = await t.query(
      `UPDATE designers SET tg_id = $1, username = COALESCE(username, $2) WHERE id = $3 RETURNING *`, [source.tg_id, source.username, targetId]);
    return merged;
  });
}));

// To'liq zaxira nusxasi (gzip JSON). Tiklash: node scripts/restore.js <fayl>
admin.get('/backup', wrap(async (_req, res) => {
  const dump = await backup.exportAll(db.query);
  const name = `thumbnail-kitchen-${dump.created_at.slice(0, 19).replace(/[:T]/g, '-')}.json.gz`;
  res.set({ 'content-type': 'application/gzip', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' });
  res.send(backup.gzipDump(dump));
}));

admin.get('/backup/summary', wrap(() => backup.summary(db.query)));

// Muqova rasmlari: frontend JPEG'ga siqib yuboradi
admin.post('/images', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '3mb' }), wrap(async req => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw httpError(400, 'Rasm yuborilmadi (image/jpeg, png yoki webp)');
  const id = crypto.randomUUID();
  await db.query(`INSERT INTO images (id, mime, data) VALUES ($1, $2, $3)`, [id, req.get('content-type'), req.body]);
  return { id, url: `/img/${id}` };
}));

// Chellenjlar
admin.post('/challenges', wrap(async req => {
  const { rows: [c] } = await db.query(
    `INSERT INTO challenges (no, title, date) VALUES ($1, $2, $3) RETURNING *`,
    [int(req.body.no, 'Raqam', { min: 1 }), str(req.body.title, 'Nomi', { max: 120 }), date(req.body.date, 'Natija')]);
  return c;
}));

admin.patch('/challenges/:id', wrap(async req => {
  const id = int(req.params.id, 'ID');
  const sets = [], vals = [];
  const conv = {
    no: v => int(v, 'Raqam', { min: 1 }), title: v => str(v, 'Nomi', { max: 120 }),
    date: v => date(v, 'Natija'), published: v => Boolean(v),
  };
  for (const k of pick(req.body, Object.keys(conv))) { vals.push(conv[k](req.body[k])); sets.push(`${k} = $${vals.length}`); }
  if (!sets.length) throw httpError(400, 'O‘zgartirish yo‘q');
  vals.push(id);
  const c = await db.tx(async t => {
    const { rows: [row] } = await t.query(`UPDATE challenges SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
    if (!row) throw httpError(404, 'Chellenj topilmadi');
    if (row.published) await seedActive(t);
    return row;
  });
  return c;
}));

admin.delete('/challenges/:id', wrap(async req => {
  const { rowCount } = await db.query(`DELETE FROM challenges WHERE id = $1`, [int(req.params.id, 'ID')]);
  if (!rowCount) throw httpError(404, 'Chellenj topilmadi');
  return { ok: true };
}));

// Natijalar: 1–5-o'rinlarni to'liq almashtiradi
admin.put('/challenges/:id/results', wrap(async req => {
  const id = int(req.params.id, 'ID');
  const list = Array.isArray(req.body.results) ? req.body.results : null;
  if (!list || list.length > 40) throw httpError(400, 'results: ro‘yxat noto‘g‘ri');
  const rows = list.map((r, i) => ({
    place: int(r.place, `${i + 1}-qator o‘rni`, { min: 1, max: 4 }), // 4 = shef
    designer_id: int(r.designer_id, `${i + 1}-qator dizayneri`, { min: 1 }),
    post_url: url(r.post_url, `${i + 1}-qator havolasi`, { optional: true }),
    image_id: r.image_id ? str(r.image_id, 'Rasm', { max: 36 }) : null,
  }));
  const top = rows.filter(r => r.place <= 3).map(r => r.place);
  if (new Set(top).size !== top.length) throw httpError(400, 'O‘rinlar takrorlangan');
  if (new Set(rows.map(r => r.designer_id)).size !== rows.length) throw httpError(400, 'Bitta dizayner ikki o‘rinda');
  return db.tx(async t => {
    const { rows: [c] } = await t.query(`SELECT published FROM challenges WHERE id = $1`, [id]);
    if (!c) throw httpError(404, 'Chellenj topilmadi');
    await t.query(`DELETE FROM results WHERE challenge_id = $1`, [id]);
    for (const r of rows) {
      await t.query(`INSERT INTO results (challenge_id, place, designer_id, post_url, image_id) VALUES ($1, $2, $3, $4, $5)`,
        [id, r.place, r.designer_id, r.post_url, r.image_id]);
    }
    const seed = c.published ? await seedActive(t) : null;
    return { ok: true, seed };
  });
}));

// Faol mavsumda saralash tugagan bo'lsa 1/8 finalni avtomatik to'ldiradi
async function seedActive(t) {
  const { rows: [s] } = await t.query(`SELECT id FROM seasons WHERE active LIMIT 1`);
  return s ? league.seedIfReady(t.query, s.id) : null;
}

// Mavsumlar
admin.post('/seasons', wrap(async req => {
  const b = req.body;
  const season = {
    label: str(b.label, 'Mavsum nomi', { max: 40 }),
    start: date(b.start, 'Boshlanish'),
    qualify_rounds: int(b.qualify_rounds ?? 12, 'Turlar soni', { min: 1, max: 52 }),
    tour_days: int(b.tour_days ?? 7, 'Tur uzunligi', { min: 1, max: 31 }),
    submit_days: int(b.submit_days ?? 7, 'Topshirish kunlari', { min: 1, max: 31 }),
    break_days: int(b.break_days ?? 14, 'Tanaffus', { min: 0, max: 90 }),
    draw_days: int(b.draw_days ?? 2, 'E’lon kunlari', { min: 0, max: 14 }),
  };
  if (new Date(`${season.start}T00:00:00Z`).getUTCDay() !== 1) throw httpError(400, 'Mavsum dushanba kuni boshlanishi kerak');
  return db.tx(async t => {
    await t.query(`UPDATE seasons SET active = false WHERE active`);
    const { rows: [s] } = await t.query(
      `INSERT INTO seasons (label, start, qualify_rounds, tour_days, submit_days, break_days, draw_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [season.label, season.start, season.qualify_rounds, season.tour_days, season.submit_days, season.break_days, season.draw_days]);
    for (const m of league.matchSchedule(s)) {
      await t.query(`INSERT INTO matches (season_id, round, slot, start, deadline) VALUES ($1, $2, $3, $4, $5)`,
        [s.id, m.round, m.slot, m.start, m.deadline]);
    }
    return s;
  });
}));

// Xato ochilgan mavsumni o'chirish — faqat janglarda hali natija bo'lmasa
admin.delete('/seasons/:id', wrap(async req => {
  const id = int(req.params.id, 'ID');
  return db.tx(async t => {
    const { rows: [s] } = await t.query(`SELECT id FROM seasons WHERE id = $1`, [id]);
    if (!s) throw httpError(404, 'Mavsum topilmadi');
    const { rows: [{ n }] } = await t.query(`SELECT count(*)::int AS n FROM matches WHERE season_id = $1 AND winner IS NOT NULL`, [id]);
    if (n > 0) throw httpError(409, 'Janglarda natijalar bor — mavsumni o‘chirib bo‘lmaydi');
    await t.query(`DELETE FROM seasons WHERE id = $1`, [id]);
    return { ok: true };
  });
}));

admin.post('/seasons/:id/seed', wrap(async req => {
  const id = int(req.params.id, 'ID');
  return db.tx(t => league.seedIfReady(t.query, id, { force: true }));
}));

// Jang: juftlik, sanalar, havola, g'olib
admin.patch('/matches/:id', wrap(async req => {
  const id = int(req.params.id, 'ID');
  const b = req.body;
  return db.tx(async t => {
    const { rows: [m] } = await t.query(`SELECT * FROM matches WHERE id = $1`, [id]);
    if (!m) throw httpError(404, 'Jang topilmadi');
    const sets = [], vals = [];
    const put = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
    if (Object.hasOwn(b, 'a') || Object.hasOwn(b, 'b')) {
      if (m.winner) throw httpError(409, 'G‘olib belgilangan — avval uni bekor qiling');
      if (Object.hasOwn(b, 'a')) put('a', int(b.a, 'A dizayner', { min: 1, optional: true }));
      if (Object.hasOwn(b, 'b')) put('b', int(b.b, 'B dizayner', { min: 1, optional: true }));
    }
    if (Object.hasOwn(b, 'start')) put('start', date(b.start, 'Boshlanish'));
    if (Object.hasOwn(b, 'deadline')) put('deadline', date(b.deadline, 'Dedlayn'));
    if (Object.hasOwn(b, 'post_url')) put('post_url', url(b.post_url, 'Havola', { optional: true }));
    if (sets.length) {
      vals.push(id);
      await t.query(`UPDATE matches SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
    }
    if (Object.hasOwn(b, 'winner')) {
      await league.setWinner(t.query, id, int(b.winner, 'G‘olib', { min: 1, optional: true }), date(b.decided_at, 'Qaror', { optional: true }));
    }
    const { rows: [out] } = await t.query(`SELECT * FROM matches WHERE id = $1`, [id]);
    return out;
  });
}));

// Sahna orti: Teletype havolasidan kartochka
admin.post('/sahna', wrap(async req => {
  const info = await fetchTeletype(str(req.body.url, 'Havola', { max: 500 }));
  const p = { ...info, ...Object.fromEntries(pick(req.body, ['no', 'designer', 'desc', 'date', 'read', 'cover']).map(k => [k, req.body[k]])) };
  const { rows: [row] } = await db.query(
    `INSERT INTO sahna_posts (no, designer, descr, date, read_min, url, cover) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (url) DO UPDATE SET no = EXCLUDED.no, designer = EXCLUDED.designer, descr = EXCLUDED.descr,
       date = EXCLUDED.date, read_min = EXCLUDED.read_min, cover = EXCLUDED.cover RETURNING *`,
    [int(p.no, 'Raqam', { min: 1 }), str(p.designer, 'Dizayner', { max: 80 }), str(p.desc, 'Tavsif', { max: 300, optional: true }) || '',
      date(p.date, 'Sana'), int(p.read, 'O‘qish vaqti', { min: 1, max: 60 }), info.url, url(p.cover, 'Muqova', { optional: true })]);
  return row;
}));

admin.delete('/sahna/:id', wrap(async req => {
  const { rowCount } = await db.query(`DELETE FROM sahna_posts WHERE id = $1`, [int(req.params.id, 'ID')]);
  if (!rowCount) throw httpError(404, 'Maqola topilmadi');
  return { ok: true };
}));

router.use('/admin', admin);

module.exports = { router };
