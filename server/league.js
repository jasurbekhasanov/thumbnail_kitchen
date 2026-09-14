// Liga qoidalari: ochko, jadval, mavsum taqvimi, setkada keyingi bosqichga o'tish.
// Frontend (public/index.html) ham xuddi shu qoidalar bo'yicha hisoblaydi — o'zgartirsangiz ikkalasini yangilang.

const POINTS = { 1: 3, 2: 2, 3: 1, 4: 0.5, 5: 0.5 };

const ROUNDS = [
  { key: 'r16', name: '1/8 final', size: 8 },
  { key: 'qf', name: 'Chorak final', size: 4 },
  { key: 'sf', name: 'Yarim final', size: 2 },
  { key: 'f', name: 'Final', size: 1 },
];

// 1/8 final juftliklari jadvaldagi o'rin bo'yicha: 1–16, 8–9, 5–12, 4–13 | 3–14, 6–11, 7–10, 2–15
const SEED = [[1, 16], [8, 9], [5, 12], [4, 13], [3, 14], [6, 11], [7, 10], [2, 15]];

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Toshkent vaqti bo'yicha bugungi sana
const todayIso = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);

// Janglar jadvali (UCL kabi B format): saralash tugagach draw_days kun e'lon, keyin
// 1/8 final 2 qismda (4+4), 1 hafta oraliq, chorak final 2 qismda (2+2), yarim final, final.
// Har jangga 1 hafta dedlayn, bosqichlar orasida 1 hafta.
function matchSchedule(season) {
  const s = addDays(season.start, season.qualify_rounds * season.tour_days + season.draw_days);
  const at = (offset) => ({ start: addDays(s, offset), deadline: addDays(s, offset + 6) });
  const out = [];
  for (let slot = 0; slot < 8; slot++) out.push({ round: 'r16', slot, ...at(slot < 4 ? 0 : 7) });
  for (let slot = 0; slot < 4; slot++) out.push({ round: 'qf', slot, ...at(slot < 2 ? 21 : 28) });
  for (let slot = 0; slot < 2; slot++) out.push({ round: 'sf', slot, ...at(42) });
  out.push({ round: 'f', slot: 0, ...at(56) });
  return out;
}

// Mavsumga tegishli, e'lon qilingan chellenjlardan birinchi qualify_rounds tasi — saralash turlari
async function qualifyingChallenges(q, season) {
  const { rows } = await q(
    `SELECT id FROM challenges WHERE published AND date >= $1 ORDER BY date, no LIMIT $2`,
    [season.start, season.qualify_rounds]);
  return rows.map(r => r.id);
}

async function standings(q, season) {
  const ids = await qualifyingChallenges(q, season);
  const { rows: designers } = await q(`SELECT id FROM designers ORDER BY id`);
  const table = new Map(designers.map(d => [d.id, { id: d.id, pts: 0, played: 0, wins: 0, podium: 0 }]));
  if (ids.length) {
    const { rows } = await q(`SELECT designer_id, place FROM results WHERE challenge_id = ANY($1::int[])`, [ids]);
    for (const r of rows) {
      const s = table.get(r.designer_id);
      if (!s) continue;
      s.pts += POINTS[r.place] || 0;
      s.played++;
      if (r.place === 1) s.wins++;
      if (r.place <= 3) s.podium++;
    }
  }
  const list = [...table.values()].sort((a, b) => b.pts - a.pts || b.wins - a.wins || b.podium - a.podium || a.id - b.id);
  return { list, toursDone: ids.length };
}

// Saralash tugagan va 1/8 final hali bo'sh bo'lsa — juftliklarni jadvaldan to'ldiradi.
// force=true: admin qayta to'ldirishni so'rasa (faqat 1/8 finalda hali g'olib bo'lmasa).
async function seedIfReady(q, seasonId, { force = false } = {}) {
  const { rows: [season] } = await q(`SELECT * FROM seasons WHERE id = $1`, [seasonId]);
  if (!season) return { seeded: false, reason: 'Mavsum topilmadi' };
  const { list, toursDone } = await standings(q, season);
  if (toursDone < season.qualify_rounds) return { seeded: false, reason: `Saralash tugamagan: ${toursDone}/${season.qualify_rounds}` };
  const { rows: r16 } = await q(`SELECT * FROM matches WHERE season_id = $1 AND round = 'r16' ORDER BY slot`, [seasonId]);
  if (r16.some(m => m.winner)) return { seeded: false, reason: '1/8 finalda natijalar bor — qayta to‘ldirib bo‘lmaydi' };
  if (!force && r16.some(m => m.a || m.b)) return { seeded: false, reason: 'Juftliklar allaqachon to‘ldirilgan' };
  const top = list.slice(0, season.qualify);
  if (top.length < 16) return { seeded: false, reason: `Dizaynerlar yetarli emas: ${top.length}/16` };
  for (const m of r16) {
    const [ra, rb] = SEED[m.slot];
    await q(`UPDATE matches SET a = $1, b = $2 WHERE id = $3`, [top[ra - 1].id, top[rb - 1].id, m.id]);
  }
  return { seeded: true };
}

// G'olibni belgilash va keyingi bosqichga o'tkazish
async function setWinner(q, matchId, winnerId, decidedAt) {
  const { rows: [m] } = await q(`SELECT * FROM matches WHERE id = $1`, [matchId]);
  if (!m) throw httpError(404, 'Jang topilmadi');
  if (winnerId != null && winnerId !== m.a && winnerId !== m.b) throw httpError(400, 'G‘olib shu jang ishtirokchisi bo‘lishi kerak');
  const idx = ROUNDS.findIndex(r => r.key === m.round);
  const next = ROUNDS[idx + 1];
  let nextMatch = null;
  if (next) {
    ({ rows: [nextMatch] } = await q(`SELECT * FROM matches WHERE season_id = $1 AND round = $2 AND slot = $3`,
      [m.season_id, next.key, Math.floor(m.slot / 2)]));
    if (nextMatch && nextMatch.winner && winnerId !== m.winner) throw httpError(409, `${next.name} jangi allaqachon yakunlangan — avval o‘shani bekor qiling`);
  }
  await q(`UPDATE matches SET winner = $1, decided_at = $2 WHERE id = $3`,
    [winnerId, winnerId == null ? null : (decidedAt || todayIso()), matchId]);
  if (nextMatch) {
    const field = m.slot % 2 === 0 ? 'a' : 'b';
    await q(`UPDATE matches SET ${field} = $1 WHERE id = $2`, [winnerId, nextMatch.id]);
  }
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { POINTS, ROUNDS, SEED, addDays, todayIso, matchSchedule, standings, seedIfReady, setWinner, httpError };
