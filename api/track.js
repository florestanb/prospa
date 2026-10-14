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
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
