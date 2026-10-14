// Renvoie les derniers événements au panel d'admin (protégé par mot de passe)
const { redis } = require('./_redis');

module.exports = async (req, res) => {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return res.status(500).json({ error: 'ADMIN_PASSWORD non défini sur Vercel' });
  if (req.headers.authorization !== 'Bearer ' + pw) return res.status(401).json({ error: 'Mot de passe incorrect' });

  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'DELETE') {
      await redis([['DEL', 'events']]);
      return res.status(204).end();
    }
    const [list] = await redis([['LRANGE', 'events', 0, 4999]]);
    res.status(200).json((list || []).map(s => JSON.parse(s)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
