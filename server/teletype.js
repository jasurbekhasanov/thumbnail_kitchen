// Teletype maqolasidan Sahna orti kartochkasi uchun ma'lumot olish: raqam, dizayner, tavsif, muqova, sana, o'qish vaqti.
const { httpError } = require('./league');

const decode = s => s
  .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\\'/g, "'");

async function fetchTeletype(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { throw httpError(400, 'Havola noto‘g‘ri'); }
  // Faqat Teletype — server boshqa manzillarga so'rov yubormasin
  if (url.protocol !== 'https:' || url.hostname !== 'teletype.in') throw httpError(400, 'Faqat teletype.in havolasi qabul qilinadi');

  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw httpError(400, `Maqola ochilmadi (HTTP ${res.status})`);
  const html = await res.text();

  const og = p => {
    const m = html.match(new RegExp(`<meta property="og:${p}" content="([^"]*)"`));
    return m ? decode(m[1]) : '';
  };
  const title = og('title');                       // "07 – Javohir Niyozov"
  const tm = title.match(/^(\d+)\s*[–—-]\s*(.+)$/);
  const published = (html.match(/"published_at":"([^"]+)"/) || [])[1] || og('updated_time');
  const article = (html.match(/<article[\s\S]*?<\/article>/) || [html])[0]
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  const words = article.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  return {
    url: `${url.origin}${url.pathname}`,
    no: tm ? Number(tm[1]) : null,
    designer: tm ? tm[2].trim() : title,
    desc: og('description'),
    cover: og('image') || null,
    date: published ? published.slice(0, 10) : null,
    read: Math.max(1, Math.round(words / 130)),
  };
}

module.exports = { fetchTeletype };
