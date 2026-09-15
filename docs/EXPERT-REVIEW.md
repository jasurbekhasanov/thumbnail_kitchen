# Thumbnail Kitchen Mini App — mutaxassis ko‘rigi uchun hujjat

**Holati:** 2026-yil 15-sentabr · **Muallif:** Jasurbek Hasanov (Thumbnail Kitchen)

Bu hujjat Telegram Mini App loyihasini mustaqil ko‘rib chiqish uchun tayyorlangan. Maqsad — mahsulot, liga qoidalari, dizayn, kod va ishga tushirish bo‘yicha zaif joylarni topish va yaxshilash takliflarini olish.

Hujjatni oxirigacha o‘qish shart emas: **§1** va **§9** ko‘rik uchun yetarli, qolgan bo‘limlar kontekst va tafsilotlar uchun.

---

## Mundarija

1. [Qisqacha](#1-qisqacha)
2. [Kirish va manbalar](#2-kirish-va-manbalar)
3. [Foydalanuvchi uchun funksiyalar](#3-foydalanuvchi-uchun-funksiyalar)
4. [Chempionlar Ligasi qoidalari](#4-chempionlar-ligasi-qoidalari)
5. [Admin panel va bot](#5-admin-panel-va-bot)
6. [Qabul qilingan qarorlar va sabablari](#6-qabul-qilingan-qarorlar-va-sabablari)
7. [Texnik arxitektura](#7-texnik-arxitektura)
8. [Ma’lum cheklovlar va xavflar](#8-malum-cheklovlar-va-xavflar)
9. [Mutaxassisga savollar](#9-mutaxassisga-savollar)
10. [Lokal ishga tushirish](#10-lokal-ishga-tushirish)
11. [Fidbek shabloni](#11-fidbek-shabloni)

---

## 1. Qisqacha

**Thumbnail Kitchen** — o‘zbek tilidagi YouTube muqova (thumbnail) dizaynerlari hamjamiyati. Telegram forum-guruhi ko‘rinishida ishlaydi. Guruhda har hafta haqiqiy yoki soxta mijoz uchun brif beriladi, dizaynerlar ish topshiradi, adminlar baholab g‘oliblarni e’lon qiladi.

**Mini App nima uchun kerak:**
- Guruhga qo‘shilganlarni **ro‘yxatdan o‘tkazish** va rolini (muqova dizayner / YouTuber) guruhda **tag** sifatida ko‘rsatish.
- Chellenj **g‘oliblarini** bitta joyda, muqovalari bilan ko‘rsatish.
- Yil davomida ochko yig‘ilib, top 16 yakkama-yakka jang qiladigan **Chempionlar Ligasi**ni yuritish.
- **Sahna orti** — dizaynerlar ish jarayoni haqidagi maqolalar (Teletype’da) uchun vitrina.

**Hozirgi holat:**
- Prod’da ishlayapti. Sinov guruhida bot, ro‘yxatdan o‘tish, tag qo‘yish va pin xabarlari tekshirilgan.
- Guruhdagi o‘tgan **9 ta chellenj** (49 g‘olib, muqovalari bilan) import qilingan.
- **Liga mavsumi hali ochilmagan** — liga qismi faqat demo ma’lumot va avtomatik testlarda sinalgan, haqiqiy mavsumda emas.
- Asosiy guruhga hali ulanmagan.

**Referenslar:**
- Chellenj ko‘rinishi — [thumbnails101.com/challenges](https://thumbnails101.com/challenges)
- Liga — Sofascore’dagi UEFA Chempionlar Ligasi sahifasi
- Sahna orti — [unlayered.design](https://www.unlayered.design/)

---

## 2. Kirish va manbalar

| Nima | Qayerda |
|---|---|
| Kod (ochiq) | https://github.com/jasurbekhasanov/thumbnail_kitchen |
| Prod ilova (brauzerda) | https://thumbnail-kitchen-production.up.railway.app |
| Demo ma’lumot bilan | https://thumbnail-kitchen-production.up.railway.app/?demo=1 |
| Bot | @thumbnailkitchen_bot |
| Sahna orti maqolalari | https://teletype.in/@thumbnail_kitchen |

**Eslatmalar:**
- Brauzerda ochilganda Telegram imzosi bo‘lmaydi: ro‘yxatdan o‘tish va admin panel ko‘rinmaydi, faqat ochiq ma’lumot chiqadi.
- **To‘liq rejim uchun botni Telegram ichida oching** (menyudagi “Ilova” tugmasi).
- `?demo=1` — liga to‘liq to‘ldirilgan demo holat. Demo’da qo‘shimcha: `&phase=knockout` (janglar bosqichi), `&phase=break` (tanaffus).
- Admin panelni ko‘rish uchun Telegram ID’ingiz `ADMIN_IDS` ga qo‘shilishi kerak. Yoki uni **lokal ishga tushiring** (§10) — u yerda Telegram’siz admin sifatida kirasiz.

---

## 3. Foydalanuvchi uchun funksiyalar

Ilova tepasida uchta bo‘lim bor: **Chellenj · Liga · Sahna orti**. Sarlavhada logo va “Homiy bo‘lish” tugmasi, adminlarga qo‘shimcha “Admin” tugmasi.

### 3.1. Ro‘yxatdan o‘tish
Ilova birinchi ochilganda ikki savol chiqadi (bir nechta variant tanlash mumkin):
1. **Rol:** Muqova dizayner / YouTuber
2. **Qiziqish:** Dizayn fidbeklari / Muqova ilhomlari / Haftalik chellenjlar

Saqlanganda:
- Foydalanuvchi bazaga yoziladi.
- Guruhda Telegram **tag** qo‘yiladi: `Muqova dizayner`, `YouTuber` yoki `Dizayner/YouTube`. Telegram cheklovi: 16 belgi, emoji yo‘q.
- “Muqova dizayner” tanlaganlar ligaga qatnashuvchilar ro‘yxatiga avtomatik tushadi.
- Tag qo‘yilmasa (masalan, guruh admini bo‘lsa), sababi bazaga yoziladi va admin panelda ko‘rinadi.

### 3.2. Chellenj
- Chellenj raqamlari chiplar ko‘rinishida (#9, #8…), o‘ngda **All**.
- **All** — hamma chellenjlar bitta lentada: 1-o‘rin katta kartada, qolganlari ikki ustunda.
- Bitta raqam tanlansa — har ish bitta qatorni egallaydi.
- Karta: muqova, o‘rin belgisi (1/2/3 yoki 🍗 “Sheflarga mazasi yoqqan”), dizayner. Bosilganda guruhdagi ish postiga o‘tadi.
- Saralash davrida tepada **joriy tur kartasi**: boshlanish, dedlayn, natijalar sanasi, necha kun qolgani.
- Janglar va tanaffus paytida “Chellenjlar vaqtincha to‘xtatilgan” xabari chiqadi.

### 3.3. Liga
- Tepada: sarlavha, mavsum, uch bosqich holati — **Saralash** (x/12 chellenj) · **Janglar** (x/15 jang) · **Tanaffus** (x kun qoldi). Tanaffusda chempion kartasi va yangi mavsum sanasi.
- **Jadval** — ochko, qatnashgan chellenjlar soni, 1-o‘rinlar soni. Top 16 belgilangan.
- **Taqvim** — butun mavsum UCL kabi oldindan: turlar, juftliklar e’loni, janglar qismlari, tanaffus. Joriy voqea ajratilgan.
- **Janglar** — bosqich bo‘yicha: boshlanish, dedlayn, holat, g‘olib.
- **Liga yo‘li** — Sofascore’dagidek setka. Saralash paytida juftliklar hozirgi jadvaldan **taxminiy** ko‘rsatiladi.
- **Dizaynlar** — mavsum ishlari va olgan ochkolari.

### 3.4. Sahna orti
- unlayered.design uslubida ro‘yxat: muqova, sana, o‘qish vaqti, “07 – Ism Familiya”, tavsif.
- Bosilganda Teletype maqolasi Telegram ichida Instant View bilan ochiladi.
- Tepada “Sahna ortida chiqish uchun ariza” tugmasi.

---

## 4. Chempionlar Ligasi qoidalari

Qoidalar muhokama orqali kelishilgan. **Ular hali real mavsumda sinalmagan** — tashqi ko‘z eng kerak joy shu.

| Qoida | Qiymat |
|---|---|
| Mavsumlar | Yiliga 2 ta, har biri ≈23–24 hafta |
| Saralash | **12 ta tur**, har hafta bitta brif: dushanba brif → yakshanba dedlayn → keyingi dushanba natija |
| Ochko | 1-o‘rin **3**, 2-o‘rin **2**, 3-o‘rin **1**, har bir 🍗 shef **0,5** (sheflar soni cheklanmagan) |
| Hisoblash | Oddiy yig‘indi. Kech qo‘shilgan ham qo‘shilgan turidan hisoblanadi |
| Teng ochko | Ko‘proq 1-o‘rin → ko‘proq top-3 |
| Janglarga yo‘llanma | Saralashdan keyin top 16 |
| Juftliklar e’loni | 12-tur natijalaridan keyin **2 kun** (qur’a yo‘q — juftliklar jadvaldan: 1–16, 8–9, 5–12, 4–13, 3–14, 6–11, 7–10, 2–15) |
| Janglar formati | UCL kabi: 1/8 va chorak final 2 qismga bo‘lingan, yarim final, final. Har jangga **1 hafta** (chorshanba → seshanba), bosqichlar orasida 1 hafta |
| G‘olib | Jangni **adminlar** aniqlaydi |
| Janglar paytida | Haftalik chellenjlar **to‘xtaydi** |
| Tanaffus | Final tugagach kamida 2 hafta, yangi mavsum dushanba boshlanadi. Ochkolar 0 ga tushadi |
| Sovrinlar | **Hali hal qilinmagan** |

**Namuna taqvim** (1-tur 6-iyul):
- Saralash: 6-iyul – 27-sentabr
- Juftliklar e’loni: 28–29-sentabr
- 1/8 final: 30-sen – 13-okt
- Chorak final: 21-okt – 3-noy
- Yarim final: 11–17-noy
- Final: 25-noy – 1-dek
- Yangi mavsum: 21-dekabr

---

## 5. Admin panel va bot

### 5.1. Admin panel (ilova ichida, faqat `ADMIN_IDS` uchun)

| Bo‘lim | Imkoniyatlar |
|---|---|
| **Chellenj** | Yaratish (raqam, nom, sana) → 1–3-o‘rin va istalgancha shef → post havolasi → muqova yuklash (brauzerda 1280px JPEG’ga siqiladi) → qoralama yoki e’lon |
| **Liga** | Mavsum ochish (15 jang sanalari avtomatik) · 1/8 finalni jadvaldan to‘ldirish · jangda juftlik, sana, havola, “Yutdi” (g‘olib keyingi bosqichga o‘tadi), bekor qilish · mavsumni o‘chirish (natija bo‘lmasa) |
| **Sahna orti** | Teletype havolasini qo‘yish — raqam, ism, tavsif, muqova, sana, o‘qish vaqti avtomatik olinadi |
| **A’zolar** | Rollar va qiziqishlar statistikasi · ro‘yxatdan o‘tganlar, tag va tag xatolari · o‘chirish (tag ham olinadi) · dizaynerlar ismi, 3 harfli qisqa nomi, username · import yozuvini ro‘yxatdan o‘tgan akkaunt bilan birlashtirish |

### 5.2. Bot

| Buyruq / hodisa | Nima qiladi |
|---|---|
| `/start` (shaxsiy chat) | “Ilovani ochish” tugmasi. `/start lg` kabi — kerakli bo‘limda ochadi |
| Menyu tugmasi | “Ilova” |
| `/pin_general`, `/pin_chellenj`, `/pin_sahna` | Admin topic ichida yozadi → bot tugmali xabarni o‘sha topicga joylaydi va pin qiladi, eski pinni va buyruqni o‘chiradi |
| `/chatid` | Guruh ID’sini qaytaradi (sozlash uchun) |
| Guruhga yangi a’zo | “Ro‘yxatdan o‘tish” tugmali salomlashish |

Pin tugmalari `t.me/<bot>/<app>?startapp=ch|lg|sh` shaklida — ilova kerakli bo‘limda ochiladi.

---

## 6. Qabul qilingan qarorlar va sabablari

Mutaxassis ayniqsa shu qarorlarga e’tiroz bildirishi foydali.

| # | Qaror | Muqobil | Sabab |
|---|---|---|---|
| 1 | Admin panel **ilova ichida**, o‘z bazamiz | Notion baza | Qat’iy tuzilmali ma’lumot (o‘rin, juftlik) uchun tekshiruv kerak. Notion rasm havolalari 1 soatda eskiradi, API sekin |
| 2 | Maqolalar **Teletype’da qoladi**, ilovada faqat kartochka | Ilova ichida maqola muharriri | Muharrir yozish qimmat. Teletype Instant View bilan yaxshi ishlaydi |
| 3 | Hosting **Railway** + Postgres | Hostinger VPS | Server boshqaruvi, SSL, zaxira bilan shug‘ullanmaslik |
| 4 | Muqovalar **Postgres’da (BYTEA)** | S3/R2 yoki Telegram’da saqlash | Bitta joy, qo‘shimcha xizmat yo‘q. Mavsumiga ~60 rasm |
| 5 | Frontend **freymvorksiz**, bitta HTML + vanilla JS | React/Vue + build | Tez prototip, build bosqichi yo‘q, Telegram WebView’da yengil |
| 6 | Liga hisobi **frontendda ham, serverda ham** | Faqat serverda | Frontend taxminiy juftliklarni o‘zi chizadi. Server 1/8 finalni rasmiy to‘ldiradi |
| 7 | Sheflar soni **cheklanmagan**, har biri 0,5 | Qat’iy 4- va 5-o‘rin | Guruhda amalda 2–5 ta shef e’lon qilingan |
| 8 | Eski chellenjlar **faqat arxiv** | Birinchi mavsumga hisoblash | Qoidalar o‘sha paytda boshqacha edi |
| 9 | Username o‘rniga **ism bo‘yicha birlashtirish taklifi** | Hammaning username’ini qo‘lda yig‘ish | Telegram eksportda username yo‘q, qo‘lda yig‘ish qimmat |
| 10 | Tag qo‘yilmasa ham **ro‘yxatdan o‘tish saqlanadi** | Xato bilan to‘xtatish | Foydalanuvchi to‘siqsiz o‘tsin, admin keyin ko‘radi |

---

## 7. Texnik arxitektura

### 7.1. Stek
- **Server:** Node.js 20+ (lokal 24), Express 5, `pg`. Jami ≈3000 qator.
- **Baza:** Postgres (Railway). Lokalda PGlite — Node ichidagi Postgres, alohida o‘rnatish shart emas.
- **Frontend:** `public/index.html` (≈700 qator, CSS + JS ichida), `public/admin.js` (≈575), Telegram WebApp SDK.
- **Deploy:** GitHub `main` → Railway avtomatik. Healthcheck `/health`.
- **Testlar:** `node:test`, 14 ta holat, xotiradagi bazada.

### 7.2. Fayllar

```
public/index.html   ilova: ro‘yxatdan o‘tish, 3 bo‘lim, liga hisobi va taqvim
public/admin.js     admin panel (faqat adminlarga, dinamik yuklanadi)
public/data.js      demo ma’lumot (?demo=1)
server/index.js     Express, statik fayllar, webhook, /img/:id
server/routes.js    /api va /api/admin yo‘nalishlari, validatsiya, auth
server/league.js    ochko, jadval, janglar jadvali, setkada o‘tish
server/telegram.js  initData imzosi, Bot API, tag, webhook
server/pins.js      pin xabarlari matnlari
server/teletype.js  Teletype sahifasidan kartochka
server/state.js     /api/state javobi
server/schema.sql   sxema va migratsiyalar (har ishga tushishda)
scripts/            seed, testlar
```

### 7.3. Ma’lumotlar modeli
- `users` — ro‘yxatdan o‘tganlar: rol, qiziqish, tag yoki tag xatosi
- `designers` — ligadagi dizaynerlar. Ro‘yxatdan o‘tgan (`tg_id`) yoki qo‘lda/import. `username` bog‘lash uchun
- `challenges` + `results` — natija: `place` 1–3 bittadan, 4 = shef (cheklanmagan)
- `seasons` + `matches` — mavsum sozlamalari, 15 jang (`r16`, `qf`, `sf`, `f`, `slot`)
- `images` — muqovalar (BYTEA)
- `sahna_posts`, `bot_pins`

### 7.4. API

| Yo‘nalish | Kimga |
|---|---|
| `GET /api/state` | Hammaga — ilovadagi barcha ochiq ma’lumot bitta javobda |
| `GET /api/me`, `POST /api/register` | Telegram imzosi bilan |
| `/api/admin/*` (17 ta) | `ADMIN_IDS` — overview, designers (CRUD, merge), images, challenges (+results), seasons (+seed), matches, sahna, users |
| `POST /telegram/webhook` | Telegram — `secret_token` sarlavhasi bilan |
| `GET /img/:id` | Hammaga, `immutable` kesh |

### 7.5. Xavfsizlik
- Har so‘rovda Telegram `initData` HMAC bilan tekshiriladi, 24 soatdan eski imzo rad etiladi.
- Admin huquqi serverda `ADMIN_IDS` bo‘yicha tekshiriladi. `admin.js` faylining o‘zi ochiq, lekin maxfiy narsa saqlamaydi.
- Webhook maxfiy kalit bilan himoyalangan.
- Teletype so‘rovi faqat `https://teletype.in` ga ruxsat etilgan (SSRF).
- SQL faqat parametrli so‘rovlar. HTML `esc()` bilan ekranlanadi.
- Tokenlar faqat Railway o‘zgaruvchilarida. Repo ochiq, lekin maxfiy ma’lumot yo‘q.

### 7.6. Testlar nimani qamraydi
- imzo (soxta, eskirgan, o‘zgartirilgan)
- ro‘yxatdan o‘tish, qayta o‘tish, username orqali bog‘lash
- admin huquqi
- 12 tur → 1/8 final avtomatik, g‘olib keyingi bosqichga, natijali jangni o‘zgartirib bo‘lmasligi
- muqova yuklash
- sheflar modeli va eski bazadan migratsiya
- o‘chirish va birlashtirish
- pin xabarlari tugmalari

**Qamramaydi:** frontend (avtomatik UI testlari yo‘q), Telegram ichidagi haqiqiy oqim, yuklama.

---

## 8. Ma’lum cheklovlar va xavflar

O‘zimiz topgan va hali tuzatilmagan joylar. Mutaxassis ustuvorligini baholasa yaxshi.

### Mahsulot va liga
1. **Liga real mavsumda sinalmagan.** Mantiq faqat demo va testlarda ishlagan.
2. **0 ochkoli dizaynerlar top 16 ga kirishi mumkin.** 12 turda ~36 ta top-3 o‘rin bor. Bir xil kuchli dizaynerlar ko‘p yutsa, ochkosi bor odam 16 tadan kam chiqadi. Saralash o‘sha holatda ham top 16 ni to‘ldiradi.
3. **Sovrinlar tizimi yo‘q.** Sovrin qo‘shilsa, adminlar baholashi manfaatlar to‘qnashuvi sifatida ko‘rinishi mumkin (anonim baholash yo‘q).
4. **Taqvim qat’iy.** Bayram yoki kechikishda turni surish uchun maxsus vosita yo‘q, sanalarni qo‘lda o‘zgartirish kerak.
5. **Pin matnlari statik** — joriy tur yoki dedlaynni avtomatik yangilamaydi.

### Kod
6. **Teng ochkoda tartib frontend va serverda farq qilishi mumkin.** Server oxirida `id` bo‘yicha saralaydi (`server/league.js:63`), frontend saralamaydi (`public/index.html:491`). Hamma ko‘rsatkichlar teng bo‘lsa, ilovadagi jadval va rasmiy juftliklar farq qilishi mumkin.
7. **Liga mantig‘i ikki joyda takrorlangan** (frontend va server) — biri o‘zgarsa, ikkinchisi unutilishi mumkin.
8. **Frontend bitta katta faylda.** Komponentlar, build va avtomatik testlar yo‘q. O‘sib borgan sari qo‘llab-quvvatlash qiyinlashadi.
9. **`esc()` bitta tirnoqni (`'`) ekranlamaydi.** Admin panelda muqova havolasi `style="background-image:url('…')"` ichiga qo‘yiladi (`public/admin.js:292`). Manba faqat admin qo‘shgan Teletype sahifasi, xavf past, lekin toza emas.
10. **`/api/state` hamma narsani bitta javobda qaytaradi** — ma’lumot ko‘paygach og‘irlashadi.
11. **Server vaqt zonasi qattiq yozilgan** (UTC+5, `server/league.js`).

### Infratuzilma va operatsiya
12. **Muqovalar Postgres’da, CDN yo‘q.** Import qilingan rasmlar siqilmagan (1,1 MB gacha). Telefonda sekin internetda og‘ir bo‘lishi mumkin.
13. **Baza zaxirasi tekshirilmagan** — Railway Postgres backup sozlamasi ko‘rib chiqilmagan.
14. **Rate limit yo‘q.** `/api/register` har chaqiruvda Telegram API’ga murojaat qiladi.
15. **Admin amallari jurnali (audit log) yo‘q** — kim nimani o‘zgartirgani saqlanmaydi.
16. **Railway `railway.json` formati eskirgan**, 2026-yil 1-dekabrgacha ishlaydi.
17. **Tag funksiyasi yangi** (Bot API 9.5, `setChatMemberTag`) — Telegram o‘zgartirsa, ro‘yxatdan o‘tish tagsiz qoladi.
18. **Monitoring va xato ogohlantirishlari yo‘q** — faqat Railway loglari.

---

## 9. Mutaxassisga savollar

### A. Mahsulot va hamjamiyat
1. Ro‘yxatdan o‘tish (2 savol) guruh uchun yetarlimi? Qanday ma’lumot yetishmayapti yoki ortiqcha?
2. Mini App guruhdagi odamlarni **qaytib kelishga** undayaptimi? Bildirishnomalar (yangi brif, natijalar) kerakmi?
3. Chellenj bo‘limida faqat g‘oliblar ko‘rinadi, barcha ishlar guruhda. Bu bo‘linish to‘g‘rimi?
4. Sahna orti ilovada kartochka, maqola Teletype’da. Foydalanuvchi uchun qulaymi?

### B. Liga dizayni
5. 12 tur, 3/2/1/0,5 ochko va top 16 — adolatli va motivatsiya beradimi?
6. §8.2 dagi **0 ochkoli qatnashchi** muammosini qanday hal qilish kerak (minimal ochko chegarasi, ko‘proq ochkoli o‘rin, qatnashgani uchun ochko)?
7. Yakkama-yakka janglarda adminlar baholashi va sovrin qo‘shilishi — **baholash ishonchliligini** qanday ta’minlash kerak?
8. Yiliga 2 mavsum, janglar paytida chellenjlar to‘xtashi — faollik pasayib ketmaydimi?

### C. UX va vizual
9. Telefonda navigatsiya (3 bo‘lim + ligada 5 ta ichki bo‘lim) tushunarlimi?
10. Admin panel haftalik ish uchun qulaymi? Chellenj kiritish qancha vaqt oladi, qayerda qiyinchilik bor?
11. Brend (qizil `#FB1B02`, qora fon, Unbounded + Inter) izchil ishlatilganmi?

### D. Texnik
12. Arxitektura hozirgi va 1–2 yillik hajm uchun to‘g‘rimi? Birinchi navbatda nimani refaktor qilish kerak (§8.6–8.10)?
13. Xavfsizlikda o‘tkazib yuborilgan narsa bormi (initData, admin huquqi, webhook, ochiq repo)?
14. Muqovalarni Postgres’dan obyekt omboriga (R2/S3) ko‘chirish qachon kerak bo‘ladi?
15. Frontendni freymvorkka o‘tkazish arziydimi yoki hozirgi holatda qolgani ma’qulmi?

### E. Ishga tushirish
16. Asosiy guruhga ulashdan oldin nimalarni albatta qilish kerak (zaxira, monitoring, rate limit, audit log)?
17. Hozirgi narx modeli (Railway Hobby ≈ $5/oy + resurs) yetarlimi?

---

## 10. Lokal ishga tushirish

Postgres shart emas — PGlite ishlatiladi.

```bash
git clone https://github.com/jasurbekhasanov/thumbnail_kitchen.git
cd thumbnail_kitchen
npm install
npm test                      # 14 ta test
npm run seed:demo             # demo dizaynerlar, chellenjlar, mavsum
DEV_USER_ID=1000 ADMIN_IDS=1000 PORT=3100 npm run dev
```

- `http://localhost:3100` — `DEV_USER_ID` bilan Telegram’siz, admin sifatida kirasiz (sarlavhada “Admin” tugmasi).
- Ro‘yxatdan o‘tish ekranini qayta ko‘rish: Admin → A’zolar → o‘zingizni o‘chiring.
- Bot funksiyalari (tag, pin, webhook) lokalda ishlamaydi — ular uchun `BOT_TOKEN` va ochiq HTTPS manzil kerak.

---

## 11. Fidbek shabloni

Har bir fikr uchun iltimos:

| Maydon | Misol |
|---|---|
| **Bo‘lim** | Liga / Chellenj / Sahna orti / Admin / Bot / Kod / Infratuzilma |
| **Muammo yoki taklif** | “Teng ochkoda jadval va juftliklar farq qiladi” |
| **Nega muhim** | “Top 16 chegarasida noto‘g‘ri odam janglarga chiqishi mumkin” |
| **Ustuvorlik** | 🔴 ishga tushirishdan oldin · 🟡 birinchi mavsum davomida · 🟢 keyinroq |
| **Taklif qilingan yechim** | “Frontend saralashiga ham `id` qo‘shish yoki jadvalni serverdan olish” |
| **Joy** (ixtiyoriy) | fayl, qator yoki ekran |

Umumiy baho uchun: **eng muhim 3 ta xavf** va **eng yaxshi ishlagan 3 ta narsa**.
