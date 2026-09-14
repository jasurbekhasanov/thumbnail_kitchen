// Guruhda pin qilinadigan xabarlar. Admin topic ichida /pin_chellenj, /pin_sahna yoki /pin_general yozadi —
// bot o'sha topicga shu xabarni joylaydi, pin qiladi, eski nusxasini va buyruqni o'chiradi.
// Matnlarni shu yerda tahrirlang (Telegram HTML: <b>, <i>, <a href="">).

// Mini App havolasi: ?startapp=ch|lg|sh ilovani kerakli bo'limda ochadi.
// MINIAPP_LINK bo'lmasa — botning shaxsiy chatiga (/start ilova tugmasini beradi).
function appLink(section, botUsername) {
  const base = process.env.MINIAPP_LINK;
  if (base) return section ? `${base}${base.includes('?') ? '&' : '?'}startapp=${section}` : base;
  return `https://t.me/${botUsername}?start=${section || 'app'}`;
}

function build(kind, { botUsername }) {
  const app = s => appLink(s, botUsername);
  const sponsor = process.env.SPONSOR_URL || 'https://t.me/khasanov_jasurbek';
  const submit = process.env.SAHNA_SUBMIT_URL || sponsor;

  const templates = {
    chellenj: {
      text: [
        '🏆 <b>Haftalik chellenj</b>',
        '',
        'Har dushanba — yangi brif, yakshanba — dedlayn. Eng yaxshi 5 ta ish ochko oladi va Chempionlar Ligasi jadvalida ko‘tariladi.',
        '',
        'Ilovada: o‘tgan chellenjlar g‘oliblari, joriy tur dedlayni va liga jadvali.',
      ],
      buttons: [[{ text: '🏆 G‘oliblar', url: app('ch') }, { text: '📊 Liga jadvali', url: app('lg') }]],
    },
    sahna: {
      text: [
        '🎬 <b>Sahna orti</b>',
        '',
        'Dizaynerlar muqova ortidagi jarayonni ko‘rsatadi: brif, ilhom, ish jarayoni va asboblar.',
        '',
        'Ishingiz jarayonini hikoya qilib bermoqchimisiz? Ariza qoldiring — maqolani birga tayyorlaymiz.',
      ],
      buttons: [[{ text: '📖 Maqolalarni o‘qish', url: app('sh') }], [{ text: '✍️ Sahna ortida chiqish', url: submit }]],
    },
    general: {
      text: [
        '👋 <b>Thumbnail Kitchen’ga xush kelibsiz</b>',
        '',
        'YouTube muqova dizaynerlari uchun jamoa: fidbek, haftalik chellenjlar va Chempionlar Ligasi.',
        '',
        'Birinchi qadam — ilovani ochib, ro‘yxatdan o‘ting. Guruhda rolingiz ko‘rinadi va ligada qatnasha olasiz.',
      ],
      buttons: [
        [{ text: '🚀 Ilovani ochish', url: app() }],
        [{ text: '🏆 Chellenj', url: app('ch') }, { text: '📊 Liga', url: app('lg') }, { text: '🎬 Sahna orti', url: app('sh') }],
        [{ text: '🤝 Homiy bo‘lish', url: sponsor }],
      ],
    },
  };
  const t = templates[kind];
  if (!t) return null;
  return { text: t.text.join('\n'), reply_markup: { inline_keyboard: t.buttons } };
}

const KINDS = ['chellenj', 'sahna', 'general'];

module.exports = { build, appLink, KINDS };
