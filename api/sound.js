// Son envoyé depuis l'admin : POST (admin) pour le déclencher, GET (site) pour le récupérer
const { redis } = require('./_redis');

const NAMES = ['perso', 'bip', 'sonnette', 'klaxon', 'alarme', 'sirene', 'voix'];

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [v] = await redis([['GET', 'sound']]);
      const s = v ? JSON.parse(v) : null;
      // Petit cache CDN : les visiteurs interrogent toutes les 3 s, Redis au plus une fois toutes les 2 s
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=2');
      return res.status(200).json(s ? { id: s.id, s: s.s, text: s.text, age: Date.now() - s.t } : {});
    }

    if (req.method !== 'POST') return res.status(405).end();
    const pw = process.env.ADMIN_PASSWORD;
    if (!pw || req.headers.authorization !== 'Bearer ' + pw) return res.status(401).json({ error: 'Mot de passe incorrect' });
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
    if (!b || !NAMES.includes(b.s)) return res.status(400).json({ error: 'Son inconnu' });
    const s = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), s: b.s, text: String(b.text || '').slice(0, 200), t: Date.now() };
    await redis([['SET', 'sound', JSON.stringify(s), 'EX', 60]]);
    res.status(200).json({ id: s.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
