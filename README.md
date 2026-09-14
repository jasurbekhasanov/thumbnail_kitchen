# Thumbnail Kitchen — Telegram Mini App

Chellenj g‘oliblari, Chempionlar Ligasi va Sahna orti. Node.js (Express) + Postgres, Railway'da.

```
public/          Mini App (index.html, demo ma'lumot data.js, logolar)
server/
  index.js       server: statik fayllar, API, webhook, /img
  routes.js      /api/state, /api/me, /api/register, /api/admin/*
  league.js      ochko, jadval, janglar jadvali, setkada o'tish
  telegram.js    initData imzosi, Bot API, tag, webhook
  teletype.js    Teletype maqolasidan kartochka
  state.js       ilova uchun umumiy holat
  schema.sql     baza sxemasi (har ishga tushganda qo'llanadi)
scripts/
  seed.js        demo / Sahna orti ma'lumotlari
  smoke.test.js  oqim testlari
```

## Lokal ishga tushirish

Postgres shart emas — `DATABASE_URL` bo‘lmasa, PGlite (`.pglite/` papkasi) ishlatiladi.

```bash
npm install
npm run seed:demo
DEV_USER_ID=1000 ADMIN_IDS=1000 PORT=3100 npm run dev
npm test
```

`http://localhost:3100` — serverdagi ma’lumot, `?demo=1` — `data.js` dagi demo.

## Railway'ga joylash

1. **Loyiha:** Railway → New Project → *Deploy from GitHub repo* (yoki `railway up`).
2. **Baza:** loyiha ichida *+ New → Database → PostgreSQL*.
3. **Domen:** servis → Settings → Networking → *Generate Domain*.
4. **Variables** (`.env.example` ga qarang):
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `BOT_TOKEN`, `APP_URL` (3-qadamdagi domen), `ADMIN_IDS`, `GROUP_CHAT_ID`, `WEBHOOK_SECRET`, `NODE_ENV=production`
5. Deploy tugagach server o‘zi webhook va bot menyusidagi “Ilova” tugmasini sozlaydi (loglarda `[bot] webhook va menyu tugmasi sozlandi`).
6. **Sahna orti maqolalari** birinchi ishga tushishda `public/data.js` dan avtomatik yoziladi (jadval bo‘sh bo‘lsa).

## Telegram sozlamalari

- **Bot guruhda admin** bo‘lishi va **“Manage tags”** (`can_manage_tags`) huquqi berilishi kerak.
- Guruh sozlamalarida a’zolarning o‘z tagini o‘zgartirishini o‘chiring.
- Guruh adminlari va egasiga Telegram tag qo‘yishga ruxsat bermaydi — ular ro‘yxatdan o‘tsa ham tagsiz qoladi.
- `GROUP_CHAT_ID`: `BOT_TOKEN` qo‘yilgach, guruhda `/chatid` deb yozing — bot guruh ID'sini qaytaradi.
- Guruhdagi “Ro‘yxatdan o‘tish” tugmasi uchun BotFather → `/newapp` bilan Mini App yarating va havolani `MINIAPP_LINK` ga yozing.

## Guruhdagi pin xabarlari

Admin (`ADMIN_IDS`) kerakli topic ichida buyruq yozadi — bot tugmali xabarni o‘sha topicga joylaydi va pin qiladi:

| Buyruq | Xabar | Tugmalar |
|---|---|---|
| `/pin_chellenj` | Haftalik chellenj | G‘oliblar, Liga jadvali |
| `/pin_sahna` | Sahna orti | Maqolalar, Ariza |
| `/pin_general` | Xush kelibsiz | Ilova, Chellenj, Liga, Sahna orti, Homiy |

- Buyruq xabari o‘chiriladi. Qayta yozilsa, eski pin o‘chib yangisi qo‘yiladi — matnni o‘zgartirgach shunchaki qayta yuboring.
- Matnlar `server/pins.js` da.
- Botga **Pin messages** va **Delete messages** huquqlari kerak. Xato bo‘lsa, sababi adminning shaxsiy chatiga keladi.
- Tugmalar ilovani kerakli bo‘limda ochishi uchun BotFather → `/newapp` bilan Mini App yarating va havolani `MINIAPP_LINK` ga yozing. Busiz tugmalar bot chatiga olib boradi (u yerdan “Ilovani ochish”).

## Admin API

Hammasi `x-telegram-init-data` sarlavhasi bilan, faqat `ADMIN_IDS` dagilar uchun.

| So‘rov | Vazifasi |
|---|---|
| `GET /api/admin/overview` | hamma ma’lumot (foydalanuvchilar, tag xatolari bilan) |
| `POST /api/admin/designers` | dizayner qo‘shish `{name, short?, tg_id?}` |
| `POST /api/admin/images` | muqova yuklash (image/jpeg body) → `{id, url}` |
| `POST /api/admin/challenges` | chellenj `{no, title, date}` |
| `PUT /api/admin/challenges/:id/results` | 1–5-o‘rinlar `{results: [{place, designer_id, post_url?, image_id?}]}` |
| `PATCH /api/admin/challenges/:id` | `{published: true}` — ilovada ko‘rinadi |
| `POST /api/admin/seasons` | mavsum `{label, start}` (dushanba) — 15 ta jang sanalari avtomatik |
| `PATCH /api/admin/matches/:id` | juftlik, sanalar, havola yoki `{winner}` — g‘olib keyingi bosqichga o‘tadi |
| `POST /api/admin/seasons/:id/seed` | 1/8 finalni jadvaldan qayta to‘ldirish |
| `POST /api/admin/sahna` | `{url}` — Teletype maqolasidan kartochka |

12-tur natijalari e’lon qilinganda 1/8 final juftliklari jadvaldan avtomatik to‘ldiriladi.
