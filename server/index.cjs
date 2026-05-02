const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { db, DB_FILE } = require('./db.cjs');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/activity', (req, res) => res.json(db.activity || []));

require('./routes/auth.cjs')(app);
require('./routes/roster.cjs')(app);
require('./routes/tournaments.cjs')(app);

/*Serve Built Frontend*/
const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.listen(PORT, '0.0.0.0', () =>
  console.log(`\n♟Lichess backend|http://localhost:${PORT}\n`)
);

function cleanup() {
  try { if (fs.existsSync(DB_FILE)) { fs.unlinkSync(DB_FILE); console.log('db.json deleted'); } }
  catch (err) { console.error('Cleanup error:', err); }
  finally { process.exit(); }
}
process.on('SIGINT',  cleanup);
process.on('SIGTERM', cleanup);
