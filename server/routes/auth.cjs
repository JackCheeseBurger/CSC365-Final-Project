const { db, saveDB } = require('../db.cjs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;
/*Auth*/
module.exports = function(app) {
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (db.users[username]) return res.status(409).json({ error: 'Username already taken' });
  db.users[username] = { password: await bcrypt.hash(password, SALT_ROUNDS), roster: [] };
  saveDB();
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens[token] = username;
  res.json({ token, username });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.users[username];
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  if (!await bcrypt.compare(password, user.password))
    return res.status(401).json({ error: 'Invalid username or password' });
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens[token] = username;
  res.json({ token, username });
});
};
