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

  const templates = {
    chellenj: {
      text: [
        '🏆 <b>Thumbnail Kitchen chellenjlari</b>',
        '',
        'Haftalik topshiriqlarda qatnashing, mahoratingizni sinang va Chempionlar Ligasi jadvalida yuqorilang.',
        '',
        'Topshiriqlar, ishtirokchilar ishlari, g‘oliblar va liga jadvali – barchasi bir joyda.',
      ],
      buttons: [[{ text: '🏆 Chellenjlarni ko‘rish', url: app('ch') }]],
    },
    sahna: {
      text: [
        '🎬 <b>Sahna ortiga qarang</b>',
        '',
        'Muqova qanday yaratiladi?',
        '',
        'Dizaynerlar o‘z jarayonini bo‘lishadi: brifdan boshlab, g‘oya va ilhom manbalarigacha, ish jarayoni va ishlatilgan instrumentlargacha.',
      ],
      buttons: [[{ text: '📖 Maqolalarni o‘qish', url: app('sh') }]],
    },
    general: {
      text: [
        '👋 <b>Thumbnail Kitchen’ga xush kelibsiz!</b>',
        '',
        'Guruh imkoniyatlaridan to‘liq foydalanish uchun qisqa ro‘yxatdan o‘ting. Atigi 2 ta savol, bir daqiqa vaqt oladi.',
        '',
        'Ro‘yxatdan o‘tgach, guruhda rolingiz ko‘rinadi. Agar muqova dizayneri bo‘lsangiz, Chempionlar Ligasida ham qatnasha olasiz.',
      ],
      buttons: [[{ text: '✍️ Ro‘yxatdan o‘tish', url: app() }]],
    },
  };
  const t = templates[kind];
  if (!t) return null;
  return { text: t.text.join('\n'), reply_markup: { inline_keyboard: t.buttons } };
}

const KINDS = ['chellenj', 'sahna', 'general'];

module.exports = { build, appLink, KINDS };
