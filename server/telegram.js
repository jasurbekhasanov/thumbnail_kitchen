// Telegram: Mini App imzosini tekshirish, Bot API chaqiruvlari, webhook.
const crypto = require('crypto');

const cfg = () => ({
  token: process.env.BOT_TOKEN,
  appUrl: (process.env.APP_URL || '').replace(/\/$/, ''),
  groupId: process.env.GROUP_CHAT_ID,
  miniAppLink: process.env.MINIAPP_LINK, // https://t.me/<bot>/<app> — guruhdagi tugma uchun
  webhookSecret: process.env.WEBHOOK_SECRET,
});

/* Mini App initData imzosini tekshirish (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
   Busiz istalgan odam boshqa birovning nomidan ro'yxatdan o'ta yoki admin bo'la olardi. */
function verifyInitData(initData, botToken, maxAgeSec = 24 * 3600) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;
  try {
    return JSON.parse(params.get('user'));
  } catch {
    return null;
  }
}

async function call(method, body) {
  const { token } = cfg();
  if (!token) throw new Error('BOT_TOKEN o‘rnatilmagan');
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!json.ok) throw new Error(json.description || 'Telegram xatosi');
  return json.result;
}

// Rol -> guruhdagi tag (Telegram cheklovi: 16 belgigacha, emoji yo'q)
function tagForRoles(roles) {
  const d = roles.includes('designer');
  const y = roles.includes('youtuber');
  if (d && y) return 'Dizayner/YouTube';
  if (d) return 'Muqova dizayner';
  if (y) return 'YouTuber';
  return '';
}

// Guruhda tag qo'yadi. Xato bo'lsa, sababini qaytaradi (ro'yxatdan o'tish baribir saqlanadi).
async function applyTag(userId, roles) {
  const { groupId, token } = cfg();
  const tag = tagForRoles(roles);
  if (!token || !groupId) return { tag, error: 'GROUP_CHAT_ID yoki BOT_TOKEN o‘rnatilmagan' };
  try {
    const member = await call('getChatMember', { chat_id: groupId, user_id: userId });
    if (['left', 'kicked'].includes(member.status)) return { tag, error: 'Foydalanuvchi guruhda emas' };
    // Telegram adminlar va guruh egasiga tag qo'yishga ruxsat bermaydi
    if (['administrator', 'creator'].includes(member.status)) return { tag, error: 'Guruh adminiga tag qo‘yib bo‘lmaydi' };
    await call('setChatMemberTag', { chat_id: groupId, user_id: userId, tag });
    return { tag, error: null };
  } catch (e) {
    return { tag, error: e.message };
  }
}

// Webhook'ga kelgan yangilanishlar
async function handleUpdate(update) {
  const { appUrl, groupId, miniAppLink } = cfg();
  const msg = update.message;
  if (!msg) return;

  if (msg.chat.type === 'private' && /^\/start\b/.test(msg.text || '')) {
    if (!appUrl) return;
    await call('sendMessage', {
      chat_id: msg.chat.id,
      text: 'Thumbnail Kitchen — chellenj g‘oliblari, Chempionlar Ligasi va Sahna orti.',
      reply_markup: { inline_keyboard: [[{ text: 'Ilovani ochish', web_app: { url: appUrl } }]] },
    });
    return;
  }

  // Guruhga yangi a'zo qo'shilganda ro'yxatdan o'tishga taklif (guruhda web_app tugmasi ishlamaydi, shuning uchun havola)
  if (msg.new_chat_members && groupId && String(msg.chat.id) === String(groupId) && miniAppLink) {
    const people = msg.new_chat_members.filter(u => !u.is_bot);
    if (!people.length) return;
    const names = people.map(u => u.first_name).join(', ');
    await call('sendMessage', {
      chat_id: msg.chat.id,
      text: `Xush kelibsiz, ${names}! Guruhdan to‘liq foydalanish uchun ro‘yxatdan o‘ting.`,
      reply_markup: { inline_keyboard: [[{ text: 'Ro‘yxatdan o‘tish', url: miniAppLink }]] },
    });
  }
}

// Server ishga tushganda webhook va menyu tugmasini sozlaydi
async function setup() {
  const { token, appUrl, webhookSecret } = cfg();
  if (!token || !appUrl) {
    console.log('[bot] BOT_TOKEN yoki APP_URL yo‘q — webhook sozlanmadi');
    return;
  }
  if (!webhookSecret) console.warn('[bot] WEBHOOK_SECRET yo‘q — webhook himoyasiz');
  try {
    await call('setWebhook', {
      url: `${appUrl}/telegram/webhook`,
      secret_token: webhookSecret || undefined,
      allowed_updates: ['message'],
    });
    await call('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Ilova', web_app: { url: appUrl } } });
    console.log('[bot] webhook va menyu tugmasi sozlandi');
  } catch (e) {
    console.error('[bot] sozlashda xato:', e.message);
  }
}

module.exports = { cfg, verifyInitData, call, tagForRoles, applyTag, handleUpdate, setup };
