const { db } = require('../db.cjs');
/*Auth middle*/
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !db.tokens[token]) return res.status(401).json({ error: 'Unauthorized' });
  req.username = db.tokens[token];
  next();
}
module.exports = { auth };
