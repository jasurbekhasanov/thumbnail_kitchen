// Admin panel — faqat ADMIN_IDS dagilarga ochiladi (server ham har so'rovda tekshiradi).
// Asosiy ilova window.TK orqali api, tg va yordamchilarni beradi.
(() => {
  const { api, tg, esc, fmt, haptic, initData } = window.TK;

  let A = null;            // /api/admin/overview
  let tab = 'ch';          // ch | lg | sh | us
  let openId = null;       // ochiq chellenj
  let roundSel = 'r16';
  let dirty = false;       // yopilganda ilovani yangilash kerakmi
  let root = null;

  const ROUND_NAMES = { r16: '1/8 final', qf: 'Chorak final', sf: 'Yarim final', f: 'Final' };
  const ROLE_NAMES = { designer: 'Dizayner', youtuber: 'YouTuber' };
  const INT_NAMES = { feedback: 'Fidbek', inspiration: 'Ilhom', challenges: 'Chellenj' };
  const localToday = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const $ = s => root.querySelector(s);
  const val = s => { const el = $(s); return el ? el.value.trim() : ''; };

  /* ---------- Yordamchilar ---------- */
  function toast(msg, err = false) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = `toast ${err ? 'err' : ''}`;
    t.textContent = msg;
    document.body.appendChild(t);
    try { tg && tg.HapticFeedback.notificationOccurred(err ? 'error' : 'success'); } catch (e) {}
    setTimeout(() => t.remove(), err ? 4500 : 2200);
  }

  const confirmBox = msg => new Promise(res => {
    if (tg && tg.showConfirm && tg.isVersionAtLeast && tg.isVersionAtLeast('6.2')) tg.showConfirm(msg, ok => res(ok));
    else res(window.confirm(msg));
  });

  // Amal: bajarish → ma'lumotni qayta olish → xabar. Tugma bosilgan paytda bloklanadi.
  async function act(btn, fn, okMsg) {
    if (btn) btn.disabled = true;
    try {
      const out = await fn();
      dirty = true;
      await load();
      if (okMsg) toast(typeof okMsg === 'function' ? okMsg(out) : okMsg);
    } catch (e) {
      toast(e.message, true);
    } finally {
      if (btn && btn.isConnected) btn.disabled = false;
    }
  }

  const designerOptions = (selected, { empty = '— tanlang —' } = {}) =>
    `<option value="">${empty}</option>` + [...A.designers].sort((a, b) => a.name.localeCompare(b.name))
      .map(d => `<option value="${d.id}" ${String(d.id) === String(selected) ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
  const dName = id => (A.designers.find(d => d.id === id) || {}).name || '—';

  // Muqovani 1280px gacha kichraytirib JPEG qiladi (odatda 150–300 KB)
  function compress(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 1280 / img.naturalWidth);
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => (b ? resolve(b) : reject(new Error('Rasmni o‘qib bo‘lmadi'))), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Rasm formati qo‘llab-quvvatlanmaydi')); };
      img.src = url;
    });
  }

  async function uploadImage(file) {
    const blob = await compress(file);
    const res = await fetch('/api/admin/images', { method: 'POST', headers: { 'content-type': 'image/jpeg', 'x-telegram-init-data': initData }, body: blob });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json.id;
  }

  /* ---------- Chellenjlar ---------- */
  function viewChallenges() {
    if (openId) {
      const c = A.challenges.find(x => x.id === openId);
      if (c) return challengeEditor(c);
      openId = null;
    }
    const nextNo = Math.max(0, ...A.challenges.map(c => c.no)) + 1;
    return `
      <div class="a-sec"><h3>Yangi chellenj</h3>
        <div class="a-card">
          <div class="a-row">
            <label class="fld narrow"><span>Raqam</span><input id="nc-no" type="number" inputmode="numeric" value="${nextNo}"></label>
            <label class="fld"><span>Natijalar sanasi</span><input id="nc-date" type="date" value="${localToday()}"></label>
          </div>
          <div class="a-row"><label class="fld"><span>Nomi (brif sarlavhasi)</span><input id="nc-title" placeholder="Men 30 kun faqat non yedim" maxlength="120"></label></div>
          <div class="btns"><button class="btn pri" data-act="ch-create">Yaratish va g‘oliblarni kiritish</button></div>
        </div>
      </div>
      <div class="a-sec"><h3>Chellenjlar <span>${A.challenges.length}</span></h3>
        <div class="a-list">${A.challenges.map(c => `
          <button class="a-item" data-open="${c.id}">
            <div class="grow"><b>#${c.no} · ${esc(c.title)}</b><small>${fmt(c.date)} · ${c.results.length}/5 g‘olib</small></div>
            <span class="badge ${c.published ? 'pub' : 'draft'}">${c.published ? 'E’lon qilingan' : 'Qoralama'}</span><span class="chev">›</span>
          </button>`).join('') || '<div class="a-empty">Hozircha chellenj yo‘q</div>'}
        </div>
      </div>`;
  }

  function challengeEditor(c) {
    const byPlace = Object.fromEntries(c.results.map(r => [r.place, r]));
    const rows = [1, 2, 3, 4, 5].map(p => {
      const r = byPlace[p] || {};
      return `<div class="place-row">
        <div class="pl p${p}">${p}</div>
        <div class="cols">
          <label class="fld"><select id="r-d-${p}">${designerOptions(r.designer_id)}</select></label>
          <input class="a-in" id="r-u-${p}" type="url" inputmode="url" placeholder="Guruhdagi post havolasi (t.me/…)" value="${esc(r.post_url || '')}">
          <div class="up">
            <div class="up-prev" id="r-p-${p}" data-img="${r.image_id || ''}" style="${r.image_id ? `background-image:url('/img/${r.image_id}')` : ''}">${r.image_id ? '' : 'Muqova yo‘q'}</div>
            <label class="btn sm">${r.image_id ? 'Almashtirish' : 'Muqova yuklash'}<input type="file" accept="image/*" data-upload="${p}"></label>
            ${r.image_id ? `<button class="btn sm danger" data-act="img-clear" data-p="${p}">×</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    return `
      <div class="a-sec"><button class="btn sm" data-act="ch-back">‹ Chellenjlar</button></div>
      <div class="a-sec"><h3>#${c.no} <span class="badge ${c.published ? 'pub' : 'draft'}">${c.published ? 'E’lon qilingan' : 'Qoralama'}</span></h3>
        <div class="a-card">
          <div class="a-row">
            <label class="fld narrow"><span>Raqam</span><input id="ce-no" type="number" inputmode="numeric" value="${c.no}"></label>
            <label class="fld"><span>Natijalar sanasi</span><input id="ce-date" type="date" value="${c.date}"></label>
          </div>
          <div class="a-row"><label class="fld"><span>Nomi</span><input id="ce-title" value="${esc(c.title)}" maxlength="120"></label></div>
          <div class="btns"><button class="btn" data-act="ch-save">Ma’lumotni saqlash</button></div>
        </div>
      </div>

      <div class="a-sec"><h3>G‘oliblar</h3>
        ${rows}
        <p class="a-hint">Bo‘sh qoldirilgan o‘rinlar saqlanmaydi. Ochko: 3 / 2 / 1 / 0,5 / 0,5.</p>
        <div class="btns"><button class="btn pri" data-act="res-save">G‘oliblarni saqlash</button></div>
      </div>

      <div class="a-sec"><h3>Ro‘yxatda yo‘q dizayner</h3>
        <div class="a-card">
          <div class="a-row">
            <label class="fld"><span>Ism</span><input id="nd-name" placeholder="Ism Familiya" maxlength="80"></label>
            <label class="fld narrow"><span>Qisqa</span><input id="nd-short" placeholder="ISM" maxlength="4"></label>
          </div>
          <div class="a-row"><label class="fld"><span>Telegram username (tavsiya)</span><input id="nd-user" placeholder="@username"></label></div>
          <div class="btns"><button class="btn" data-act="ds-create">Dizayner qo‘shish</button></div>
        </div>
      </div>

      <div class="a-sec">
        <div class="btns">
          ${c.published
            ? '<button class="btn" data-act="ch-publish" data-v="0">E’londan olish</button>'
            : '<button class="btn ok" data-act="ch-publish" data-v="1">Ilovada e’lon qilish</button>'}
          <button class="btn danger" data-act="ch-delete">O‘chirish</button>
        </div>
        <p class="a-hint">${c.published ? 'Ilovada ko‘rinib turibdi va liga jadvaliga hisoblanadi.' : 'Qoralama ilovada ko‘rinmaydi. G‘oliblarni saqlab, keyin e’lon qiling.'}</p>
      </div>`;
  }

  // Qayta chizishda kiritilgan, lekin saqlanmagan qiymatlar yo'qolmasin
  function snapshotResults() {
    if (!openId || !$('#r-d-1')) return null;
    return [1, 2, 3, 4, 5].map(p => ({ d: val(`#r-d-${p}`), u: val(`#r-u-${p}`), img: $(`#r-p-${p}`).dataset.img }));
  }
  function restoreResults(snap) {
    if (!snap || !$('#r-d-1')) return;
    snap.forEach((s, i) => {
      const p = i + 1;
      if (s.d && $(`#r-d-${p} option[value="${s.d}"]`)) $(`#r-d-${p}`).value = s.d;
      $(`#r-u-${p}`).value = s.u;
      setPreview(p, s.img);
    });
  }
  function setPreview(p, id) {
    const el = $(`#r-p-${p}`);
    el.dataset.img = id || '';
    el.style.backgroundImage = id ? `url('/img/${id}')` : '';
    el.textContent = id ? '' : 'Muqova yo‘q';
  }

  /* ---------- Liga ---------- */
  function viewLeague() {
    const season = A.seasons.find(s => s.active);
    if (!season) {
      const year = new Date().getFullYear();
      return `
        <div class="a-sec"><h3>Yangi mavsum</h3>
          <div class="a-card">
            <div class="a-row">
              <label class="fld"><span>Nomi</span><input id="ns-label" value="${year}" maxlength="40"></label>
              <label class="fld narrow"><span>Turlar</span><input id="ns-rounds" type="number" inputmode="numeric" value="12"></label>
            </div>
            <div class="a-row"><label class="fld"><span>1-tur boshlanishi (dushanba)</span><input id="ns-start" type="date"></label></div>
            <details class="a-more"><summary>Qo‘shimcha sozlamalar ›</summary>
              <div class="a-row" style="margin-top:10px">
                <label class="fld"><span>Tur (kun)</span><input id="ns-tour" type="number" value="7"></label>
                <label class="fld"><span>Topshirish (kun)</span><input id="ns-submit" type="number" value="7"></label>
              </div>
              <div class="a-row">
                <label class="fld"><span>E’lon (kun)</span><input id="ns-draw" type="number" value="2"></label>
                <label class="fld"><span>Tanaffus (kun)</span><input id="ns-break" type="number" value="14"></label>
              </div>
            </details>
            <div class="btns"><button class="btn pri" data-act="season-create">Mavsumni ochish</button></div>
            <p class="a-hint">15 ta jangning sanalari avtomatik qo‘yiladi. ${A.seasons.length ? 'Oldingi mavsum arxivga o‘tadi.' : ''}</p>
          </div>
        </div>`;
    }

    const matches = A.matches.filter(m => m.season_id === season.id);
    const tours = A.challenges.filter(c => c.published && c.date >= season.start).length;
    const decided = matches.filter(m => m.winner).length;
    const list = matches.filter(m => m.round === roundSel).sort((a, b) => a.slot - b.slot);

    const side = (m, key) => {
      const id = m[key];
      const isWin = m.winner && m.winner === id;
      return `<div class="mt-side ${isWin ? 'win' : ''}">
        <label class="fld"><select id="m-${key}-${m.id}" ${m.winner ? 'disabled' : ''}>${designerOptions(id, { empty: 'Aniqlanmagan' })}</select></label>
        ${isWin ? '<span class="mt-win">G‘OLIB</span>'
          : !m.winner && m.a && m.b ? `<button class="btn sm ok" data-act="mt-win" data-m="${m.id}" data-w="${id}">Yutdi</button>` : '<span class="mt-win"></span>'}
      </div>`;
    };

    return `
      <div class="a-sec"><h3>${esc(season.title)} · ${esc(season.label)}</h3>
        <div class="stat">
          <div><b>${Math.min(tours, season.qualify_rounds)}/${season.qualify_rounds}</b><span>Saralash turi</span></div>
          <div><b>${decided}/15</b><span>Jang hal qilindi</span></div>
          <div><b>${A.designers.length}</b><span>Dizayner</span></div>
        </div>
        <p class="a-hint">Boshlanish: ${fmt(season.start)}. ${season.qualify_rounds}-tur natijalari e’lon qilinganda 1/8 final jadvaldan avtomatik to‘ladi.</p>
        <div class="btns">
          <button class="btn" data-act="season-seed" data-id="${season.id}">1/8 finalni jadvaldan to‘ldirish</button>
          <button class="btn danger" data-act="season-delete" data-id="${season.id}">O‘chirish</button>
        </div>
      </div>

      <div class="a-sec"><h3>Janglar</h3>
        <div class="select" id="a-rounds">${Object.entries(ROUND_NAMES).map(([k, n]) => `<button data-round="${k}" class="${k === roundSel ? 'on' : ''}">${n}</button>`).join('')}</div>
        ${list.map(m => `
          <div class="mt">
            <div class="mt-head"><span>${ROUND_NAMES[m.round]} · ${m.slot + 1}-jang</span><span>${fmt(m.start)} – ${fmt(m.deadline)}</span></div>
            ${side(m, 'a')}${side(m, 'b')}
            ${m.winner ? `<div class="btns"><button class="btn sm danger" data-act="mt-unwin" data-m="${m.id}">G‘olibni bekor qilish</button></div>` : ''}
            <details class="a-more"><summary>Sanalar va havola ›</summary>
              <div class="a-row" style="margin-top:10px">
                <label class="fld"><span>Boshlanish</span><input id="m-start-${m.id}" type="date" value="${m.start}"></label>
                <label class="fld"><span>Dedlayn</span><input id="m-deadline-${m.id}" type="date" value="${m.deadline}"></label>
              </div>
              <div class="a-row"><label class="fld"><span>Guruhdagi post</span><input id="m-post-${m.id}" type="url" placeholder="https://t.me/…" value="${esc(m.post_url || '')}"></label></div>
            </details>
            <div class="btns"><button class="btn sm" data-act="mt-save" data-m="${m.id}">Saqlash</button></div>
          </div>`).join('')}
      </div>`;
  }

  /* ---------- Sahna orti ---------- */
  function viewSahna() {
    return `
      <div class="a-sec"><h3>Maqola qo‘shish</h3>
        <div class="a-card">
          <label class="fld"><span>Teletype havolasi</span><input id="sh-url" type="url" inputmode="url" placeholder="https://teletype.in/@thumbnail_kitchen/08-…"></label>
          <div class="btns"><button class="btn pri" data-act="sh-add">Qo‘shish</button></div>
          <p class="a-hint">Raqam, ism, tavsif, muqova, sana va o‘qish vaqti maqoladan avtomatik olinadi. Sarlavha “08 – Ism Familiya” shaklida bo‘lsin.</p>
        </div>
      </div>
      <div class="a-sec"><h3>Maqolalar <span>${A.sahna.length}</span></h3>
        <div class="a-list">${A.sahna.map(p => `
          <div class="a-item">
            <div class="up-prev" style="width:64px;background-image:url('${esc(p.cover || '')}')"></div>
            <div class="grow"><b>${String(p.no).padStart(2, '0')} – ${esc(p.designer)}</b><small>${fmt(p.date)} · ${p.read_min} daqiqa</small></div>
            <button class="btn sm danger" data-act="sh-del" data-id="${p.id}">O‘chirish</button>
          </div>`).join('') || '<div class="a-empty">Maqola yo‘q</div>'}
        </div>
      </div>`;
  }

  /* ---------- A'zolar ---------- */
  function viewUsers() {
    const errors = A.users.filter(u => u.tag_error).length;
    const count = (field, key) => A.users.filter(u => u[field].includes(key)).length;
    const bar = (label, n) => {
      const pct = A.users.length ? Math.round(n / A.users.length * 100) : 0;
      return `<div class="i-bar"><div class="i-top"><span>${label}</span><b>${n} · ${pct}%</b></div><div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`;
    };
    return `
      <div class="a-sec">
        <div class="stat">
          <div><b>${A.users.length}</b><span>Ro‘yxatdan o‘tgan</span></div>
          <div><b>${A.designers.length}</b><span>Dizayner</span></div>
          <div><b>${errors}</b><span>Tag xatosi</span></div>
        </div>
      </div>
      <div class="a-sec"><h3>Rollar va qiziqishlar</h3>
        <div class="a-card">
          ${bar('🎨 Muqova dizayner', count('roles', 'designer'))}
          ${bar('▶️ YouTuber', count('roles', 'youtuber'))}
          <div style="height:6px"></div>
          ${bar('💬 Dizayn fidbeklari', count('interests', 'feedback'))}
          ${bar('🖼️ Muqova ilhomlari', count('interests', 'inspiration'))}
          ${bar('🏆 Haftalik chellenjlar', count('interests', 'challenges'))}
        </div>
        <p class="a-hint">Bir kishi bir nechta variantni tanlashi mumkin, shuning uchun foizlar yig‘indisi 100 dan oshadi.</p>
      </div>
      <div class="a-sec"><h3>Ro‘yxatdan o‘tganlar</h3>
        <div class="a-list">${A.users.map(u => {
          const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || `ID ${u.tg_id}`;
          return `<div class="a-item">
            <div class="grow"><b>${esc(name)}${u.username ? ` <span style="color:var(--muted);font-weight:400">@${esc(u.username)}</span>` : ''}</b>
              <small>${u.roles.map(r => ROLE_NAMES[r] || r).join(', ')} · ${u.interests.map(i => INT_NAMES[i] || i).join(', ')}</small>
              ${u.tag_error ? `<small style="color:var(--accent-ink)">${esc(u.tag_error)}</small>` : ''}</div>
            <div class="u-side">
              ${u.tag ? `<span class="badge tag">${esc(u.tag)}</span>` : u.tag_error ? '<span class="badge err">Tagsiz</span>' : ''}
              <button class="btn sm danger" data-act="us-del" data-id="${u.tg_id}" data-name="${esc(name)}">O‘chirish</button>
            </div>
          </div>`;
        }).join('') || '<div class="a-empty">Hozircha hech kim yo‘q</div>'}
        </div>
      </div>
      <div class="a-sec"><h3>Dizaynerlar</h3>
        ${A.designers.map(d => `
          <div class="a-card">
            <div class="a-row">
              <label class="fld"><span>${d.tg_id ? 'Ro‘yxatdan o‘tgan' : 'Qo‘lda qo‘shilgan'}</span><input id="d-name-${d.id}" value="${esc(d.name)}" maxlength="80"></label>
              <label class="fld narrow"><span>Qisqa</span><input id="d-short-${d.id}" value="${esc(d.short)}" maxlength="4"></label>
            </div>
            <div class="a-row"><label class="fld"><span>Telegram username</span><input id="d-user-${d.id}" value="${esc(d.username ? '@' + d.username : '')}" placeholder="@username" ${d.tg_id ? 'disabled' : ''}></label></div>
            <div class="btns"><button class="btn sm" data-act="ds-save" data-id="${d.id}">Saqlash</button></div>
          </div>`).join('') || '<div class="a-empty">Dizayner yo‘q</div>'}
        <p class="a-hint">“Qisqa” — Liga yo‘li setkasida ko‘rinadigan 3 harf. Qo‘lda qo‘shilgan dizaynerga username yozsangiz, u keyin ro‘yxatdan o‘tganda shu yozuvga bog‘lanadi — ochkolari saqlanadi.</p>
      </div>`;
  }

  /* ---------- Chizish va hodisalar ---------- */
  const VIEWS = { ch: viewChallenges, lg: viewLeague, sh: viewSahna, us: viewUsers };

  function render() {
    const snap = snapshotResults();
    root.querySelectorAll('.adm-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('.adm-body').innerHTML = VIEWS[tab]();
    restoreResults(snap);
    if (tg && tg.BackButton) tg.BackButton.show();
  }

  async function load() {
    A = await api('/api/admin/overview');
    render();
  }

  const handlers = {
    'ch-back': () => { openId = null; render(); window.scrollTo(0, 0); root.scrollTo(0, 0); },
    'ch-create': btn => act(btn, async () => {
      const c = await api('/api/admin/challenges', { method: 'POST', body: { no: val('#nc-no'), title: val('#nc-title'), date: val('#nc-date') } });
      openId = c.id;
    }, 'Chellenj yaratildi — endi g‘oliblarni kiriting'),
    'ch-save': btn => act(btn, () => api(`/api/admin/challenges/${openId}`, { method: 'PATCH', body: { no: val('#ce-no'), title: val('#ce-title'), date: val('#ce-date') } }), 'Saqlandi'),
    'res-save': btn => act(btn, () => {
      const results = [1, 2, 3, 4, 5].map(p => ({ place: p, designer_id: val(`#r-d-${p}`), post_url: val(`#r-u-${p}`) || null, image_id: $(`#r-p-${p}`).dataset.img || null }))
        .filter(r => r.designer_id);
      if (!results.length) throw new Error('Kamida bitta g‘olibni tanlang');
      return api(`/api/admin/challenges/${openId}/results`, { method: 'PUT', body: { results } });
    }, out => (out && out.seed && out.seed.seeded ? 'Saqlandi. Saralash tugadi — 1/8 final to‘ldirildi!' : 'G‘oliblar saqlandi')),
    'ch-publish': btn => act(btn, () => api(`/api/admin/challenges/${openId}`, { method: 'PATCH', body: { published: btn.dataset.v === '1' } }),
      btn.dataset.v === '1' ? 'Ilovada e’lon qilindi' : 'E’londan olindi'),
    'ch-delete': async btn => {
      if (!(await confirmBox('Chellenj va uning g‘oliblari o‘chiriladi. Davom etasizmi?'))) return;
      act(btn, async () => { await api(`/api/admin/challenges/${openId}`, { method: 'DELETE' }); openId = null; }, 'O‘chirildi');
    },
    'img-clear': btn => setPreview(btn.dataset.p, null),
    'ds-create': btn => act(btn, async () => {
      const d = await api('/api/admin/designers', { method: 'POST', body: { name: val('#nd-name'), short: val('#nd-short') || undefined, username: val('#nd-user') || undefined } });
      $('#nd-name').value = ''; $('#nd-short').value = ''; $('#nd-user').value = '';
      return d;
    }, d => `${d.name} qo‘shildi — ro‘yxatdan tanlashingiz mumkin`),
    'ds-save': btn => act(btn, () => {
      const id = btn.dataset.id;
      const body = { name: val(`#d-name-${id}`), short: val(`#d-short-${id}`) };
      if (!$(`#d-user-${id}`).disabled) body.username = val(`#d-user-${id}`) || null;
      return api(`/api/admin/designers/${id}`, { method: 'PATCH', body });
    }, 'Saqlandi'),

    'season-create': btn => act(btn, () => api('/api/admin/seasons', { method: 'POST', body: {
      label: val('#ns-label'), start: val('#ns-start'), qualify_rounds: val('#ns-rounds'),
      tour_days: val('#ns-tour'), submit_days: val('#ns-submit'), draw_days: val('#ns-draw'), break_days: val('#ns-break'),
    } }), 'Mavsum ochildi'),
    'season-seed': btn => act(btn, () => api(`/api/admin/seasons/${btn.dataset.id}/seed`, { method: 'POST' }).then(r => {
      if (!r.seeded) throw new Error(r.reason);
      return r;
    }), '1/8 final jadvaldan to‘ldirildi'),
    'season-delete': async btn => {
      if (!(await confirmBox('Mavsum va uning janglari o‘chiriladi. Chellenjlar saqlanib qoladi. Davom etasizmi?'))) return;
      act(btn, () => api(`/api/admin/seasons/${btn.dataset.id}`, { method: 'DELETE' }), 'Mavsum o‘chirildi');
    },
    'mt-win': async btn => {
      if (!(await confirmBox(`G‘olib: ${dName(Number(btn.dataset.w))}. Tasdiqlaysizmi?`))) return;
      act(btn, () => api(`/api/admin/matches/${btn.dataset.m}`, { method: 'PATCH', body: { winner: Number(btn.dataset.w) } }), 'G‘olib belgilandi — keyingi bosqichga o‘tdi');
    },
    'mt-unwin': btn => act(btn, () => api(`/api/admin/matches/${btn.dataset.m}`, { method: 'PATCH', body: { winner: null } }), 'G‘olib bekor qilindi'),
    'mt-save': btn => act(btn, () => {
      const id = btn.dataset.m;
      const m = A.matches.find(x => String(x.id) === id);
      const body = { start: val(`#m-start-${id}`), deadline: val(`#m-deadline-${id}`), post_url: val(`#m-post-${id}`) || null };
      if (!m.winner) { body.a = val(`#m-a-${id}`) || null; body.b = val(`#m-b-${id}`) || null; }
      if (body.a && body.a === body.b) throw new Error('Bitta dizayner o‘ziga qarshi bo‘la olmaydi');
      return api(`/api/admin/matches/${id}`, { method: 'PATCH', body });
    }, 'Saqlandi'),

    'us-del': async btn => {
      const ok = await confirmBox(`${btn.dataset.name} ro‘yxatdan o‘chiriladi va guruhdagi tagi olib tashlanadi. Ilovani ochganda qayta ro‘yxatdan o‘tishi kerak bo‘ladi. Davom etasizmi?`);
      if (!ok) return;
      act(btn, () => api(`/api/admin/users/${btn.dataset.id}`, { method: 'DELETE' }), r =>
        r.designer === 'kept' ? 'O‘chirildi. Chellenj natijalari bor — dizayner sifatida ismi va ochkolari saqlandi'
          : r.hadTag && !r.tagRemoved ? 'O‘chirildi, lekin tagni olib bo‘lmadi — guruhda qo‘lda olib tashlang' : 'O‘chirildi');
    },
    'sh-add': btn => act(btn, () => api('/api/admin/sahna', { method: 'POST', body: { url: val('#sh-url') } }), p => `${p.designer} qo‘shildi`),
    'sh-del': async btn => {
      if (!(await confirmBox('Maqola ilovadan olib tashlanadi (Teletype’da qoladi). Davom etasizmi?'))) return;
      act(btn, () => api(`/api/admin/sahna/${btn.dataset.id}`, { method: 'DELETE' }), 'O‘chirildi');
    },
  };

  function onClick(e) {
    const t = e.target.closest('[data-tab]');
    if (t) { haptic(); tab = t.dataset.tab; openId = null; render(); return; }
    if (e.target.closest('[data-act="close"]')) return close();
    const o = e.target.closest('[data-open]');
    if (o) { haptic(); openId = Number(o.dataset.open); render(); root.scrollTo(0, 0); return; }
    const r = e.target.closest('[data-round]');
    if (r) { haptic(); roundSel = r.dataset.round; render(); return; }
    const b = e.target.closest('[data-act]');
    if (b && handlers[b.dataset.act]) { haptic(); handlers[b.dataset.act](b); }
  }

  async function onChange(e) {
    const input = e.target.closest('[data-upload]');
    if (!input || !input.files[0]) return;
    const p = input.dataset.upload;
    const label = input.parentElement;
    const text = label.firstChild;
    text.textContent = 'Yuklanmoqda…';
    try {
      setPreview(p, await uploadImage(input.files[0]));
      text.textContent = 'Almashtirish';
      toast('Muqova yuklandi — “G‘oliblarni saqlash”ni bosing');
    } catch (err) {
      text.textContent = 'Muqova yuklash';
      toast(err.message, true);
    }
    input.value = '';
  }

  function onBack() {
    if (openId) { openId = null; render(); } else close();
  }

  function close() {
    if (tg && tg.BackButton) { tg.BackButton.offClick(onBack); tg.BackButton.hide(); }
    root.remove();
    root = null;
    document.body.style.overflow = '';
    if (dirty) location.reload(); // ilova yangi ma'lumot bilan qayta chizilsin
  }

  async function open() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'adm';
    root.innerHTML = `<div class="adm-in">
      <div class="adm-top">
        <div class="adm-head"><h2>Admin</h2><button class="adm-close" data-act="close" aria-label="Yopish">×</button></div>
        <div class="adm-tabs">
          <button data-tab="ch">Chellenj</button><button data-tab="lg">Liga</button><button data-tab="sh">Sahna orti</button><button data-tab="us">A’zolar</button>
        </div>
      </div>
      <div class="adm-body"><div class="a-empty">Yuklanmoqda…</div></div>
    </div>`;
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    if (tg && tg.BackButton) { tg.BackButton.onClick(onBack); tg.BackButton.show(); }
    try {
      await load();
    } catch (e) {
      $('.adm-body').innerHTML = `<div class="a-empty">${esc(e.message)}</div>`;
    }
  }

  window.TKAdmin = { open };
})();
