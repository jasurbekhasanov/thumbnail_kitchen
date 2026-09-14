// Ilova uchun umumiy holat. Shakli public/data.js dagi TK_DEMO bilan bir xil — frontend ikkalasini bir xil o'qiydi.
const db = require('./db');
const { POINTS, ROUNDS } = require('./league');

const did = id => (id == null ? undefined : String(id));

async function buildState() {
  const q = db.query;
  const [{ rows: designers }, { rows: challenges }, { rows: results }, { rows: [season] }, { rows: posts }] = await Promise.all([
    q(`SELECT id, name, short FROM designers ORDER BY id`),
    q(`SELECT id, no, title, date FROM challenges WHERE published ORDER BY no DESC`),
    q(`SELECT r.challenge_id, r.place, r.designer_id, r.post_url, r.image_id
         FROM results r JOIN challenges c ON c.id = r.challenge_id WHERE c.published ORDER BY r.place`),
    q(`SELECT * FROM seasons WHERE active ORDER BY start DESC LIMIT 1`),
    q(`SELECT no, designer, descr, date, read_min, url, cover FROM sahna_posts ORDER BY no DESC`),
  ]);

  const byChallenge = new Map();
  for (const r of results) {
    if (!byChallenge.has(r.challenge_id)) byChallenge.set(r.challenge_id, []);
    byChallenge.get(r.challenge_id).push({
      place: r.place,
      designer: did(r.designer_id),
      post: r.post_url || undefined,
      thumb: r.image_id ? `/img/${r.image_id}` : undefined,
    });
  }

  let league = null;
  if (season) {
    const { rows: matches } = await q(`SELECT * FROM matches WHERE season_id = $1 ORDER BY slot`, [season.id]);
    const final = matches.find(m => m.round === 'f');
    league = {
      id: season.id,
      title: season.title,
      season: season.label,
      start: season.start,
      end: final ? final.deadline : season.start,
      qualify: season.qualify,
      qualifyRounds: season.qualify_rounds,
      tourDays: season.tour_days,
      submitDays: season.submit_days,
      breakDays: season.break_days,
      drawDays: season.draw_days,
      rounds: ROUNDS.map(r => ({
        key: r.key,
        name: r.name,
        matches: matches.filter(m => m.round === r.key).map(m => ({
          id: m.id,
          a: did(m.a), b: did(m.b), winner: did(m.winner),
          start: m.start, deadline: m.deadline,
          decidedAt: m.decided_at || undefined,
          post: m.post_url || undefined,
        })),
      })),
    };
  }

  return {
    sponsorUrl: process.env.SPONSOR_URL || 'https://t.me/khasanov_jasurbek',
    sahna: {
      blog: 'https://teletype.in/@thumbnail_kitchen',
      submitUrl: process.env.SAHNA_SUBMIT_URL || process.env.SPONSOR_URL || 'https://t.me/khasanov_jasurbek',
      posts: posts.map(p => ({ no: p.no, designer: p.designer, desc: p.descr, date: p.date, read: p.read_min, url: p.url, cover: p.cover })),
    },
    points: POINTS,
    designers: designers.map(d => ({ id: did(d.id), name: d.name, short: d.short })),
    challenges: challenges.map(c => ({ no: c.no, title: c.title, date: c.date, results: byChallenge.get(c.id) || [] })),
    league,
  };
}

module.exports = { buildState };
