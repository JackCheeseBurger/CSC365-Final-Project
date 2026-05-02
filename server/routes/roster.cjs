const { db, saveDB } = require('../db.cjs');
const { auth } = require('../middleware/auth.cjs');
/*Roster*/
module.exports = function(app) {
app.get('/api/roster', auth, (req, res) => res.json(db.users[req.username].roster || []));

app.post('/api/roster', auth, (req, res) => {
  const { player } = req.body;
  const user = db.users[req.username];
  if (user.roster.some(p => p.username === player.username))
    return res.status(409).json({ error: 'Player already saved' });
  user.roster.push(player);
  saveDB();
  res.json(user.roster);
});

app.delete('/api/roster', auth, (req, res) => {
  db.users[req.username].roster = [];
  saveDB();
  res.json([]);
});

app.delete('/api/roster/:username', auth, (req, res) => {
  const user = db.users[req.username];
  user.roster = user.roster.filter(p => p.username !== req.params.username);
  saveDB();
  res.json(user.roster);
});
};
