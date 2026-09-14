// Thumbnail Kitchen — demo ma'lumotlar (?demo=1 yoki server ishlamaganda).
// Server /api/state aynan shu shaklda javob qaytaradi.

window.TK_DEMO = {
  sponsorUrl: 'https://t.me/khasanov_jasurbek',

  // Sahna — dizaynerlar muqova ortidagi jarayonni ko'rsatadi. Maqolalar Teletype'da yoziladi,
  // bu yerda faqat kartochka: havola, muqova, qisqa tavsif (Teletype'dagi og:description). (Haqiqiy maqolalar, 2026-09-14 holatiga)
  sahna: {
    blog: 'https://teletype.in/@thumbnail_kitchen',
    submitUrl: 'https://t.me/khasanov_jasurbek',
    posts: [
      { no: 7, designer: 'Javohir Niyozov', desc: 'Muqova dizayneri, “UzChess” uchun tayyorlagan dizayni bilan.', date: '2026-09-06', read: 3,
        url: 'https://teletype.in/@thumbnail_kitchen/07-javohir-niyozov', cover: 'https://img2.teletype.in/files/10/b7/10b73b34-745b-490a-82ae-78f18d815ae4.png' },
      { no: 6, designer: 'Shamshod Axtamov', desc: 'Muqova dizayneri, Thumbnail Kitchen chellenji uchun tayyorlagan dizayni bilan.', date: '2026-08-24', read: 3,
        url: 'https://teletype.in/@thumbnail_kitchen/06-shamshod-axtamov', cover: 'https://img4.teletype.in/files/f1/72/f17207e1-eb11-4365-b39b-8f337a6706d2.png' },
      { no: 5, designer: 'Siroj Rustamov', desc: 'Muqova dizayneri, “Abdullajon” uchun tayyorlagan dizayni bilan.', date: '2026-08-21', read: 2,
        url: 'https://teletype.in/@thumbnail_kitchen/05-siroj-rustamov', cover: 'https://img3.teletype.in/files/22/9c/229cc126-1f45-42af-92d2-116d5b3c3d16.png' },
      { no: 4, designer: 'Abdurahmon Shomurodov', desc: 'Muqova dizayneri, Thumbnail Kitchen chellenji uchun tayyorlagan dizayni bilan.', date: '2026-08-18', read: 4,
        url: 'https://teletype.in/@thumbnail_kitchen/04-abdurahmon-shomurodov', cover: 'https://img4.teletype.in/files/bf/47/bf47cf43-7ca0-4596-b8c0-20bec5fabf9f.png' },
      { no: 3, designer: 'Azimxon Zokirov', desc: 'Muqova dizayneri, “Maqsad” uchun tayyorlagan dizayni bilan.', date: '2026-08-15', read: 3,
        url: 'https://teletype.in/@thumbnail_kitchen/03-azimxon-zokirov', cover: 'https://img1.teletype.in/files/c7/57/c7575f62-d8c5-457d-848e-032f9862ad02.png' },
      { no: 2, designer: 'Usmonxon G‘oyibnazarov', desc: 'Muqova dizayneri, Thumbnail Kitchen’dagi faol dizayner.', date: '2026-08-10', read: 3,
        url: 'https://teletype.in/@thumbnail_kitchen/02-usmonxon-goyibnazarov', cover: 'https://img3.teletype.in/files/69/ea/69ea0677-0068-4469-ba07-ab3d749c7ba2.png' },
      { no: 1, designer: 'Jasurbek Hasanov', desc: 'Muqova dizayneri, 5+ yillik tajribaga ega.', date: '2026-08-08', read: 3,
        url: 'https://teletype.in/@thumbnail_kitchen/01-jasurbek-hasanov', cover: 'https://img4.teletype.in/files/71/cb/71cb3936-a115-4b3c-937e-ca02264767c0.png' },
    ],
  },

  // Ochko tizimi: o'rin -> ochko
  points: { 1: 3, 2: 2, 3: 1, 4: 0.5, 5: 0.5 },

  designers: [
    { id: 'd1', name: 'Siroj', short: 'SIR' },
    { id: 'd2', name: 'Usmonxon', short: 'USM' },
    { id: 'd3', name: 'Komron', short: 'KOM' },
    { id: 'd4', name: 'Abdurahmon', short: 'ABD' },
    { id: 'd5', name: 'Nusratilla', short: 'NUS' },
    { id: 'd6', name: 'Jahongir', short: 'JAH' },
    { id: 'd7', name: 'Sardor', short: 'SAR' },
    { id: 'd8', name: 'Behruz', short: 'BEH' },
    { id: 'd9', name: 'Dilshod', short: 'DIL' },
    { id: 'd10', name: 'Azizbek', short: 'AZI' },
    { id: 'd11', name: 'Madina', short: 'MAD' },
    { id: 'd12', name: 'Otabek', short: 'OTA' },
    { id: 'd13', name: 'Shoxrux', short: 'SHO' },
    { id: 'd14', name: 'Firdavs', short: 'FIR' },
    { id: 'd15', name: 'Laziz', short: 'LAZ' },
    { id: 'd16', name: 'Ulug‘bek', short: 'ULU' },
    { id: 'd17', name: 'Kamola', short: 'KAM' },
    { id: 'd18', name: 'Bekzod', short: 'BEK' },
  ],

  // Chellenjlar — g'oliblar qo'lda qo'shiladi. post = Telegram chatdagi ish havolasi.
  challenges: [
    { no: 12, title: 'Men 30 kun faqat non yedim', date: '2026-09-07', results: [
      { place: 1, designer: 'd1', post: 'https://t.me/thumbnailkitchen/1201' },
      { place: 2, designer: 'd4', post: 'https://t.me/thumbnailkitchen/1202' },
      { place: 3, designer: 'd3', post: 'https://t.me/thumbnailkitchen/1203' },
      { place: 4, designer: 'd9', post: 'https://t.me/thumbnailkitchen/1204' },
      { place: 5, designer: 'd12', post: 'https://t.me/thumbnailkitchen/1205' },
    ]},
    { no: 11, title: '1$ vs 1000$ lik mashina', date: '2026-08-31', results: [
      { place: 1, designer: 'd2', post: 'https://t.me/thumbnailkitchen/1101' },
      { place: 2, designer: 'd1', post: 'https://t.me/thumbnailkitchen/1102' },
      { place: 3, designer: 'd5', post: 'https://t.me/thumbnailkitchen/1103' },
      { place: 4, designer: 'd6', post: 'https://t.me/thumbnailkitchen/1104' },
      { place: 5, designer: 'd14', post: 'https://t.me/thumbnailkitchen/1105' },
    ]},
    { no: 10, title: 'Toshkentdagi eng arzon uy', date: '2026-08-24', results: [
      { place: 1, designer: 'd3', post: 'https://t.me/thumbnailkitchen/1001' },
      { place: 2, designer: 'd7', post: 'https://t.me/thumbnailkitchen/1002' },
      { place: 3, designer: 'd1', post: 'https://t.me/thumbnailkitchen/1003' },
      { place: 4, designer: 'd2', post: 'https://t.me/thumbnailkitchen/1004' },
      { place: 5, designer: 'd11', post: 'https://t.me/thumbnailkitchen/1005' },
    ]},
    { no: 9, title: 'Har davlat taomini pishirdim', date: '2026-08-17', results: [
      { place: 1, designer: 'd4', post: 'https://t.me/thumbnailkitchen/901' },
      { place: 2, designer: 'd8', post: 'https://t.me/thumbnailkitchen/902' },
      { place: 3, designer: 'd10', post: 'https://t.me/thumbnailkitchen/903' },
      { place: 4, designer: 'd13', post: 'https://t.me/thumbnailkitchen/904' },
      { place: 5, designer: 'd5', post: 'https://t.me/thumbnailkitchen/905' },
    ]},
    { no: 8, title: '24 soat muzlatkichda', date: '2026-08-10', results: [
      { place: 1, designer: 'd5', post: 'https://t.me/thumbnailkitchen/801' },
      { place: 2, designer: 'd3', post: 'https://t.me/thumbnailkitchen/802' },
      { place: 3, designer: 'd15', post: 'https://t.me/thumbnailkitchen/803' },
      { place: 4, designer: 'd16', post: 'https://t.me/thumbnailkitchen/804' },
      { place: 5, designer: 'd17', post: 'https://t.me/thumbnailkitchen/805' },
    ]},
    { no: 7, title: 'Eng qimmat burger sinovi', date: '2026-08-03', results: [
      { place: 1, designer: 'd6', post: 'https://t.me/thumbnailkitchen/701' },
      { place: 2, designer: 'd2', post: 'https://t.me/thumbnailkitchen/702' },
      { place: 3, designer: 'd8', post: 'https://t.me/thumbnailkitchen/703' },
      { place: 4, designer: 'd18', post: 'https://t.me/thumbnailkitchen/704' },
      { place: 5, designer: 'd7', post: 'https://t.me/thumbnailkitchen/705' },
    ]},
    { no: 6, title: 'Bir kun millioner bo‘ldim', date: '2026-07-27', results: [
      { place: 1, designer: 'd7', post: 'https://t.me/thumbnailkitchen/601' },
      { place: 2, designer: 'd10', post: 'https://t.me/thumbnailkitchen/602' },
      { place: 3, designer: 'd2', post: 'https://t.me/thumbnailkitchen/603' },
      { place: 4, designer: 'd1', post: 'https://t.me/thumbnailkitchen/604' },
      { place: 5, designer: 'd15', post: 'https://t.me/thumbnailkitchen/605' },
    ]},
    { no: 5, title: 'Tog‘da 3 kun telefonsiz', date: '2026-07-20', results: [
      { place: 1, designer: 'd8', post: 'https://t.me/thumbnailkitchen/501' },
      { place: 2, designer: 'd5', post: 'https://t.me/thumbnailkitchen/502' },
      { place: 3, designer: 'd4', post: 'https://t.me/thumbnailkitchen/503' },
      { place: 4, designer: 'd11', post: 'https://t.me/thumbnailkitchen/504' },
      { place: 5, designer: 'd3', post: 'https://t.me/thumbnailkitchen/505' },
    ]},
    { no: 4, title: 'Bozordagi eng g‘alati mahsulot', date: '2026-07-13', results: [
      { place: 1, designer: 'd11', post: 'https://t.me/thumbnailkitchen/401' },
      { place: 2, designer: 'd6', post: 'https://t.me/thumbnailkitchen/402' },
      { place: 3, designer: 'd12', post: 'https://t.me/thumbnailkitchen/403' },
      { place: 4, designer: 'd14', post: 'https://t.me/thumbnailkitchen/404' },
      { place: 5, designer: 'd13', post: 'https://t.me/thumbnailkitchen/405' },
    ]},
    { no: 3, title: 'Eski mashinani qayta tikladik', date: '2026-07-06', results: [
      { place: 1, designer: 'd9', post: 'https://t.me/thumbnailkitchen/301' },
      { place: 2, designer: 'd13', post: 'https://t.me/thumbnailkitchen/302' },
      { place: 3, designer: 'd6', post: 'https://t.me/thumbnailkitchen/303' },
      { place: 4, designer: 'd17', post: 'https://t.me/thumbnailkitchen/304' },
      { place: 5, designer: 'd18', post: 'https://t.me/thumbnailkitchen/305' },
    ]},
  ],

  league: {
    title: 'Chempionlar Ligasi',
    season: '2026',
    start: '2026-07-06', // 1-tur boshlanishi (dushanba)
    end: '2026-12-01',   // final dedlayni
    qualify: 16,
    // Saralash: futboldagi turlar kabi — shuncha chellenj o'tgach ochko yig'ish tugaydi,
    // jadval muzlatiladi va janglar boshlanadi. Janglar vaqtida chellenjlar to'xtaydi.
    qualifyRounds: 12,
    tourDays: 7,   // har tur 1 hafta: dushanba brief -> yakshanba dedlayn -> keyingi dushanba natijalar
    submitDays: 7,
    // Final tugagach tanaffus (kun). Final match'da decidedAt bo'lsa, shu sanadan hisoblanadi.
    breakDays: 14,
    // Saralash natijalari (dushanba) va 1/8 final boshlanishi orasida: top 16 va juftliklar e'loni, e'tirozlar uchun
    drawDays: 2,
    // Janglar. deadline — ishni topshirish muddati. winner — adminlar belgilaydi.
    // Format (UCL kabi): 1/8 va chorak final 2 qismga bo'lingan, har jangga 1 hafta dedlayn, bosqichlar orasida 1 hafta.
    // Janglar ritmi: chorshanba brif -> keyingi seshanba dedlayn.
    // Saralash davomida 1/8 final juftliklari jadvaldan taxminiy ko'rsatiladi (1–16, 8–9, ...).
    rounds: [
      { key: 'r16', name: '1/8 final', matches: [
        { a: 'd1', b: 'd16', start: '2026-09-30', deadline: '2026-10-06', winner: 'd1', post: 'https://t.me/thumbnailkitchen/r16-1' },
        { a: 'd8', b: 'd9', start: '2026-09-30', deadline: '2026-10-06', winner: 'd8' },
        { a: 'd5', b: 'd12', start: '2026-09-30', deadline: '2026-10-06', winner: 'd5' },
        { a: 'd4', b: 'd13', start: '2026-09-30', deadline: '2026-10-06', winner: 'd13' },
        { a: 'd3', b: 'd14', start: '2026-10-07', deadline: '2026-10-13' },
        { a: 'd6', b: 'd11', start: '2026-10-07', deadline: '2026-10-13' },
        { a: 'd2', b: 'd15', start: '2026-10-07', deadline: '2026-10-13' },
        { a: 'd7', b: 'd10', start: '2026-10-07', deadline: '2026-10-13' },
      ]},
      { key: 'qf', name: 'Chorak final', matches: [
        { a: 'd1', b: 'd8', start: '2026-10-21', deadline: '2026-10-27' },
        { a: 'd5', b: 'd13', start: '2026-10-21', deadline: '2026-10-27' },
        { start: '2026-10-28', deadline: '2026-11-03' },
        { start: '2026-10-28', deadline: '2026-11-03' },
      ]},
      { key: 'sf', name: 'Yarim final', matches: [
        { start: '2026-11-11', deadline: '2026-11-17' },
        { start: '2026-11-11', deadline: '2026-11-17' },
      ]},
      { key: 'f', name: 'Final', matches: [
        { start: '2026-11-25', deadline: '2026-12-01' },
      ]},
    ],
  },
};
