// Enregistre une action d'un visiteur
const { redis } = require('./_redis');

const TYPES = ['visit', 'queue_join', 'queue_done', 'ticket', 'book', 'error', 'leave', 'sound'];
const MAX = 10000; // nombre d'événements gardés

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || !TYPES.includes(b.type) || typeof b.v !== 'string') return res.status(400).end();

  const h = req.headers;
  const ua = String(h['user-agent'] || '');
  const ev = {
    t: Date.now(),
    v: b.v.slice(0, 16),
    type: b.type,
    d: JSON.stringify(b.d || {}).length < 1000 ? b.d || {} : {},
    country: h['x-vercel-ip-country'] || '',
    city: decodeURIComponent(h['x-vercel-ip-city'] || ''),
    device: /iPhone|Android.*Mobile|Mobile/i.test(ua) ? 'Mobile' : /iPad|Tablet/i.test(ua) ? 'Tablette' : 'Ordinateur',
    browser: /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Autre'
  };

  try {
    await redis([['LPUSH', 'events', JSON.stringify(ev)], ['LTRIM', 'events', 0, MAX - 1]]);
    if (ev.type === 'visit' && !ev.d.reload) await notify(ev, h.host);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// SMS Free Mobile à chaque nouvelle connexion (au plus un par visiteur toutes les 30 min)
async function notify(ev, host) {
  const user = process.env.FREE_SMS_USER, pass = process.env.FREE_SMS_PASS;
  if (!user || !pass) return;
  try {
    const [first] = await redis([['SET', 'notif:' + ev.v, '1', 'NX', 'EX', 1800]]);
    if (first !== 'OK') return;
    let country = ev.country;
    try { country = new Intl.DisplayNames('fr', { type: 'region' }).of(ev.country); } catch {}
    let ref = 'accès direct';
    try { if (ev.d.ref) ref = new URL(ev.d.ref).hostname.replace(/^www\./, ''); } catch {}
    const msg = [
      'Tourticket : nouvelle connexion',
      'Lieu : ' + ([ev.city, country].filter(Boolean).join(', ') || 'inconnu'),
      'Appareil : ' + ev.device + ' · ' + ev.browser,
      'Provenance : ' + ref,
      'Panel : https://' + host + '/admin'
    ].join('\n');
    const url = 'https://smsapi.free-mobile.fr/sendmsg?user=' + encodeURIComponent(user) + '&pass=' + encodeURIComponent(pass) + '&msg=' + encodeURIComponent(msg);
    await fetch(url, { signal: AbortSignal.timeout(5000) });
  } catch {}
}
