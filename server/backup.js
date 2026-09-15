// Bazaning to'liq nusxasi (jadvallar + muqovalar) va uni tiklash.
// Railway'dagi Postgres tashqaridan yopiq, pg_dump yo'q — shuning uchun ilova darajasida.
const zlib = require('zlib');

const VERSION = 1;

// Tashqi kalitlar tartibida: tiklashda otasi bolasidan oldin yoziladi
const TABLES = ['users', 'designers', 'images', 'challenges', 'results', 'seasons', 'matches', 'sahna_posts', 'bot_pins'];
// SERIAL ustunli jadvallar — tiklagach sanagich eng katta id'dan davom etsin
const SERIAL = ['designers', 'challenges', 'seasons', 'matches', 'sahna_posts'];

async function exportAll(q) {
  const tables = {};
  for (const t of TABLES) {
    const { rows } = await q(`SELECT * FROM ${t}`);
    tables[t] = t === 'images'
      ? rows.map(r => ({ ...r, data: Buffer.from(r.data).toString('base64') }))
      : rows;
  }
  return { app: 'thumbnail-kitchen', version: VERSION, created_at: new Date().toISOString(), tables };
}

const gzipDump = dump => zlib.gzipSync(Buffer.from(JSON.stringify(dump)));
const gunzipDump = buf => JSON.parse(zlib.gunzipSync(buf).toString('utf8'));

// Nusxani bo'sh (yoki tozalanadigan) bazaga yozadi. tx ichida chaqiring.
async function importAll(q, dump, { wipe = false } = {}) {
  if (dump.app !== 'thumbnail-kitchen' || dump.version !== VERSION) throw new Error('Nusxa formati mos emas');
  if (wipe) await q(`TRUNCATE ${[...TABLES].reverse().join(', ')} RESTART IDENTITY CASCADE`);
  else {
    for (const t of TABLES) {
      const { rows: [{ n }] } = await q(`SELECT count(*)::int AS n FROM ${t}`);
      if (n > 0) throw new Error(`${t} jadvali bo‘sh emas — tiklash faqat bo‘sh bazaga (yoki wipe bilan)`);
    }
  }
  for (const t of TABLES) {
    for (const row of dump.tables[t] || []) {
      const cols = Object.keys(row);
      const vals = cols.map(c => (t === 'images' && c === 'data' ? Buffer.from(row[c], 'base64') : row[c]));
      await q(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`, vals);
    }
  }
  for (const t of SERIAL) {
    await q(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT max(id) FROM ${t}), 0) + 1, false)`);
  }
}

// Solishtirish uchun: har jadvaldagi yozuvlar soni va muqovalar hajmi
async function summary(q) {
  const out = {};
  for (const t of TABLES) out[t] = (await q(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
  out.image_bytes = Number((await q(`SELECT COALESCE(sum(length(data)), 0)::bigint AS s FROM images`)).rows[0].s);
  return out;
}

module.exports = { exportAll, importAll, summary, gzipDump, gunzipDump, TABLES };
