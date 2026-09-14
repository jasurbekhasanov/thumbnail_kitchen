// Server oqimini xotiradagi bazada tekshiradi: npm test
process.env.PGLITE_DIR = 'memory://';
process.env.BOT_TOKEN = '123456:TEST_TOKEN';
process.env.ADMIN_IDS = '1000';
delete process.env.DATABASE_URL;
delete process.env.GROUP_CHAT_ID;
delete process.env.DEV_USER_ID;

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const db = require('../server/db');
const { createApp } = require('../server/index');

// Telegram kabi imzolangan initData yasash
function initData(user, token = process.env.BOT_TOKEN, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams({ auth_date: String(authDate), query_id: 'q', user: JSON.stringify(user) });
  const dcs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  params.set('hash', crypto.createHmac('sha256', secret).update(dcs).digest('hex'));
  return params.toString();
}

const ADMIN = { id: 1000, first_name: 'Jasurbek' };
const USER = { id: 2000, first_name: 'Siroj', last_name: 'Rustamov', username: 'siroj' };

let base, server;
const api = async (method, path, { user, body, raw, type } = {}) => {
  const headers = {};
  if (user) headers['x-telegram-init-data'] = typeof user === 'string' ? user : initData(user);
  if (body) headers['content-type'] = 'application/json';
  if (raw) headers['content-type'] = type;
  const res = await fetch(base + path, { method, headers, body: raw || (body && JSON.stringify(body)) });
  const ct = res.headers.get('content-type') || '';
  return { status: res.status, body: ct.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()) };
};

test.before(async () => {
  await db.connect();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { server.close(); await db.close(); });

test('bo‘sh bazada holat', async () => {
  const r = await api('GET', '/api/state');
  assert.equal(r.status, 200);
  assert.equal(r.body.league, null);
  assert.deepEqual(r.body.challenges, []);
});

test('imzo tekshiruvi', async () => {
  assert.equal((await api('GET', '/api/me')).status, 401);
  assert.equal((await api('GET', '/api/me', { user: initData(USER, '999:WRONG') })).status, 401);
  const old = Math.floor(Date.now() / 1000) - 3 * 24 * 3600;
  assert.equal((await api('GET', '/api/me', { user: initData(USER, undefined, old) })).status, 401, 'eskirgan initData');
  const tampered = initData(USER).replace('Siroj', 'Admin');
  assert.equal((await api('GET', '/api/me', { user: tampered })).status, 401, 'o‘zgartirilgan initData');
});

test('ro‘yxatdan o‘tish', async () => {
  let me = await api('GET', '/api/me', { user: USER });
  assert.equal(me.body.registered, false);
  assert.equal((await api('POST', '/api/register', { user: USER, body: { roles: ['hacker'], interests: ['feedback'] } })).status, 400);
  const r = await api('POST', '/api/register', { user: USER, body: { roles: ['designer', 'youtuber'], interests: ['challenges'] } });
  assert.equal(r.status, 200);
  me = await api('GET', '/api/me', { user: USER });
  assert.equal(me.body.registered, true);
  assert.equal(me.body.isAdmin, false);
  // Qayta ro'yxatdan o'tish dizaynerni takrorlamaydi
  await api('POST', '/api/register', { user: USER, body: { roles: ['designer'], interests: ['feedback'] } });
  const { rows } = await db.query(`SELECT name, short FROM designers WHERE tg_id = $1`, [USER.id]);
  assert.deepEqual(rows, [{ name: 'Siroj Rustamov', short: 'SIR' }]);
  const { rows: [u] } = await db.query(`SELECT tag_error FROM users WHERE tg_id = $1`, [USER.id]);
  assert.match(u.tag_error, /GROUP_CHAT_ID/);
});

test('admin huquqi', async () => {
  assert.equal((await api('GET', '/api/admin/overview', { user: USER })).status, 403);
  assert.equal((await api('GET', '/api/admin/overview', { user: ADMIN })).status, 200);
});

test('mavsum: 12 tur → 1/8 final avtomatik, g‘olib keyingi bosqichga', async () => {
  const post = (path, body) => api('POST', path, { user: ADMIN, body });

  assert.equal((await post('/api/admin/seasons', { label: '2026', start: '2026-07-07' })).status, 400, 'seshanba — rad');
  const draft = (await post('/api/admin/seasons', { label: 'xato', start: '2026-06-01' })).body;
  assert.equal((await api('DELETE', `/api/admin/seasons/${draft.id}`, { user: ADMIN })).status, 200, 'natijasiz mavsum o‘chadi');
  const season = (await post('/api/admin/seasons', { label: '2026', start: '2026-07-06' })).body;

  // Jami 17 dizayner (1 tasi ro'yxatdan o'tgan)
  const designers = [];
  for (let i = 1; i <= 16; i++) designers.push((await post('/api/admin/designers', { name: `Dizayner ${i}` })).body.id);

  // 12 tur: i-dizayner doim bir xil o'rinlarda — jadval tartibi aniq bo'lsin
  let seed;
  for (let t = 0; t < 12; t++) {
    const c = (await post('/api/admin/challenges', { no: t + 1, title: `Tur ${t + 1}`, date: `2026-07-${String(6 + t * 2).padStart(2, '0')}` })).body;
    const group = t % 3; // har turda boshqa 5 kishi ochko oladi
    const results = [0, 1, 2, 3, 4].map(p => ({ place: p + 1, designer_id: designers[group * 5 + p] }));
    const put = await api('PUT', `/api/admin/challenges/${c.id}/results`, { user: ADMIN, body: { results } });
    assert.equal(put.status, 200, JSON.stringify(put.body));
    seed = (await api('PATCH', `/api/admin/challenges/${c.id}`, { user: ADMIN, body: { published: true } })).status;
  }
  assert.equal(seed, 200);

  const state = (await api('GET', '/api/state')).body;
  assert.equal(state.challenges.length, 12);
  assert.deepEqual(state.league.rounds.map(r => r.matches.length), [8, 4, 2, 1]);
  const r16 = state.league.rounds[0].matches;
  assert.ok(r16.every(m => m.a && m.b), '1/8 final to‘ldirildi');
  assert.equal(r16[0].start, '2026-09-30');
  assert.equal(state.league.end, '2026-12-01');
  // 1-o'rin (Dizayner 1: 4 marta 3 ochko) 16-o'ringa qarshi
  assert.equal(r16[0].a, String(designers[0]));

  // Dublikat o'rin rad etiladi
  const bad = await api('PUT', `/api/admin/challenges/1/results`, { user: ADMIN, body: { results: [{ place: 1, designer_id: designers[0] }, { place: 1, designer_id: designers[1] }] } });
  assert.equal(bad.status, 400);

  // G'olib → chorak finalga
  const m0 = r16[0], m1 = r16[1];
  assert.equal((await api('PATCH', `/api/admin/matches/${m0.id}`, { user: ADMIN, body: { winner: Number(m1.a) } })).status, 400, 'begona g‘olib');
  await api('PATCH', `/api/admin/matches/${m0.id}`, { user: ADMIN, body: { winner: Number(m0.a) } });
  await api('PATCH', `/api/admin/matches/${m1.id}`, { user: ADMIN, body: { winner: Number(m1.b) } });
  let qf = (await api('GET', '/api/state')).body.league.rounds[1].matches[0];
  assert.equal(qf.a, m0.a);
  assert.equal(qf.b, m1.b);

  // Chorak final hal bo'lgach, 1/8 natijasini o'zgartirib bo'lmaydi
  await api('PATCH', `/api/admin/matches/${qf.id}`, { user: ADMIN, body: { winner: Number(qf.a) } });
  assert.equal((await api('PATCH', `/api/admin/matches/${m0.id}`, { user: ADMIN, body: { winner: Number(m0.b) } })).status, 409);
  assert.equal((await api('DELETE', `/api/admin/seasons/${season.id}`, { user: ADMIN })).status, 409, 'natijali mavsum o‘chmaydi');
  // Qayta to'ldirish ham rad — natijalar bor
  assert.equal((await post(`/api/admin/seasons/${season.id}/seed`)).body.seeded, false);
});

test('muqova yuklash', async () => {
  const png = Buffer.from('89504e470d0a1a0a', 'hex');
  const up = await api('POST', '/api/admin/images', { user: ADMIN, raw: png, type: 'image/png' });
  assert.equal(up.status, 200);
  const img = await api('GET', up.body.url);
  assert.equal(img.status, 200);
  assert.deepEqual(img.body, png);
  assert.equal((await api('POST', '/api/admin/images', { user: USER, raw: png, type: 'image/png' })).status, 403);
});

test('Sahna: faqat teletype.in', async () => {
  const r = await api('POST', '/api/admin/sahna', { user: ADMIN, body: { url: 'https://evil.example/x' } });
  assert.equal(r.status, 400);
});

test('qo‘lda qo‘shilgan dizayner ro‘yxatdan o‘tganda bog‘lanadi', async () => {
  const made = await api('POST', '/api/admin/designers', { user: ADMIN, body: { name: 'Komron', username: '@Komron_design' } });
  assert.equal(made.status, 200);
  assert.equal(made.body.username, 'Komron_design');
  assert.equal((await api('POST', '/api/admin/designers', { user: ADMIN, body: { name: 'X', username: 'komron_design' } })).status, 409, 'username takrorlanmaydi');
  assert.equal((await api('POST', '/api/admin/designers', { user: ADMIN, body: { name: 'Y', username: 'bad name!' } })).status, 400);

  const KOMRON = { id: 3000, first_name: 'Komron', last_name: 'Aliyev', username: 'komron_DESIGN' };
  await api('POST', '/api/register', { user: KOMRON, body: { roles: ['designer'], interests: ['challenges'] } });
  const { rows } = await db.query(`SELECT id, tg_id, name FROM designers WHERE lower(username) = 'komron_design'`);
  assert.equal(rows.length, 1, 'dublikat yo‘q');
  assert.equal(rows[0].id, made.body.id, 'o‘sha yozuvga bog‘landi');
  assert.equal(rows[0].tg_id, KOMRON.id);
  assert.equal(rows[0].name, 'Komron', 'admin kiritgan ism saqlanadi');
});

test('pin xabarlari: tugmalar bo‘limga olib boradi', () => {
  const pins = require('../server/pins');
  process.env.MINIAPP_LINK = 'https://t.me/thumbnailkitchen_bot/app';
  const ch = pins.build('chellenj', { botUsername: 'thumbnailkitchen_bot' });
  assert.match(ch.text, /chellenjlari/);
  for (const k of pins.KINDS) assert.equal(pins.build(k, { botUsername: 'b' }).reply_markup.inline_keyboard.flat().length, 1, `${k}: bitta tugma`);
  assert.equal(ch.reply_markup.inline_keyboard[0][0].url, 'https://t.me/thumbnailkitchen_bot/app?startapp=ch');
  const g = pins.build('general', { botUsername: 'thumbnailkitchen_bot' });
  assert.equal(g.reply_markup.inline_keyboard[0][0].url, 'https://t.me/thumbnailkitchen_bot/app');
  delete process.env.MINIAPP_LINK;
  assert.equal(pins.build('sahna', { botUsername: 'thumbnailkitchen_bot' }).reply_markup.inline_keyboard[0][0].url, 'https://t.me/thumbnailkitchen_bot?start=sh');
  assert.equal(pins.build('nope', {}), null);
  // Har bir tugma matni Telegram cheklovidan oshmasin, havola https bo'lsin
  for (const k of pins.KINDS) for (const row of pins.build(k, { botUsername: 'b' }).reply_markup.inline_keyboard) for (const b of row) assert.match(b.url, /^https:\/\//);
});

test('ro‘yxatdan o‘tgan odamni o‘chirish', async () => {
  const NEW = { id: 4000, first_name: 'Test', username: 'test_user4000' };
  await api('POST', '/api/register', { user: NEW, body: { roles: ['designer'], interests: ['feedback'] } });
  assert.equal((await api('DELETE', `/api/admin/users/${NEW.id}`, { user: USER })).status, 403, 'admin emas');
  const del = await api('DELETE', `/api/admin/users/${NEW.id}`, { user: ADMIN });
  assert.equal(del.status, 200);
  assert.equal(del.body.designer, 'deleted', 'natijasiz dizayner o‘chadi');
  assert.equal((await api('GET', '/api/me', { user: NEW })).body.registered, false, 'qayta ro‘yxatdan o‘tishi kerak');
  assert.equal((await api('DELETE', `/api/admin/users/${NEW.id}`, { user: ADMIN })).status, 404);

  // Natijasi bor dizayner: yozuv va ochkolar qoladi, Telegram'dan uziladi
  const { rows: [d] } = await db.query(`SELECT id FROM designers WHERE tg_id = $1`, [USER.id]);
  const c = (await api('POST', '/api/admin/challenges', { user: ADMIN, body: { no: 99, title: 'O‘chirish testi', date: '2026-08-01' } })).body;
  await api('PUT', `/api/admin/challenges/${c.id}/results`, { user: ADMIN, body: { results: [{ place: 1, designer_id: d.id }] } });
  const kept = await api('DELETE', `/api/admin/users/${USER.id}`, { user: ADMIN });
  assert.equal(kept.body.designer, 'kept');
  const { rows: [after] } = await db.query(`SELECT tg_id, name FROM designers WHERE id = $1`, [d.id]);
  assert.equal(after.tg_id, null);
  assert.equal(after.name, 'Siroj Rustamov');
  const { rows: res } = await db.query(`SELECT 1 FROM results WHERE designer_id = $1`, [d.id]);
  assert.equal(res.length, 1, 'natija saqlandi');
});
