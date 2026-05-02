const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

/*Database*/
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { users: {}, tournaments: {} };
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: {}, tournaments: {} }; }
}
function saveDB() {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ users: db.users, tournaments: db.tournaments }, null, 2)
  );
}
const db = loadDB();
db.tokens = {};

app.get('/api/activity', (req, res) => res.json(db.activity || []));

/*Auth middle*/
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !db.tokens[token]) return res.status(401).json({ error: 'Unauthorized' });
  req.username = db.tokens[token];
  next();
}

/*Auth*/
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

/*Roster*/
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

/*Bracket helpers*/

function pairPlayers(players) {
  const pairs = [];
  for (let i = 0; i < players.length; i += 2) {
    const m = { p1: players[i], p2: players[i + 1] || null, winner: null };
    if (!m.p2) m.winner = m.p1;
    pairs.push(m);
  }
  return pairs;
}

function pairInterleaved(lPlayers, wDrops) {
  const pairs = [];
  const len = Math.max(lPlayers.length, wDrops.length);
  for (let i = 0; i < len; i++) {
    const a = lPlayers[i] ?? null;
    const b = wDrops[i]  ?? null;
    if (a && b) {
      pairs.push({ p1: a, p2: b, winner: null });
    } else {
      const only = a || b;
      if (only) pairs.push({ p1: only, p2: null, winner: only });
    }
  }
  return pairs;
}

function roundDone(round) {
  return !!round && round.every(m => m.winner !== null && m.winner !== undefined);
}

function roundWinners(round) {
  return (round || []).map(m => m.winner).filter(Boolean);
}

function roundLosers(round) {
  return (round || [])
    .filter(m => m.p2 && m.winner)
    .map(m => m.p1.username === m.winner.username ? m.p2 : m.p1);
}

function initDEState(t) {
  if (t._nextWDrop === undefined) t._nextWDrop = 1;
  if (t._lNextIsMixed === undefined) t._lNextIsMixed = true;
}

function replayDEState(t) {
  initDEState(t);
  t._nextWDrop = 1;
  t._lNextIsMixed = true;
  t._wChampion = null;
  t._lChampion = null;
  const L = t.losersRounds;
  for (let i = 1; i < L.length; i++) {
    if (t._lNextIsMixed) {
      t._nextWDrop++;
      t._lNextIsMixed = false;
    } else {
      const prevWins = roundWinners(L[i - 1]);
      if (prevWins.length > 1) {
        t._lNextIsMixed = true;
      } else {
        t._nextWDrop++;
        t._lNextIsMixed = false;
      }
    }
  }
  const W = t.winnersRounds;
  if (W && W.length > 0) {
    const lastW = W[W.length - 1];
    if (roundDone(lastW)) {
      const ww = roundWinners(lastW);
      if (ww.length === 1) t._wChampion = ww[0];
    }
  }
}

function _advanceDEOnce(t) {
  const W = t.winnersRounds;
  const L = t.losersRounds;
  initDEState(t);
  const lastWIdx = W.length - 1;
  const lastW = W[lastWIdx];
  if (roundDone(lastW)) {
    const wWins = roundWinners(lastW);
    if (wWins.length > 1 && W.length === lastWIdx + 1) {
      W.push(pairPlayers(wWins));
    }
    if (wWins.length === 1) t._wChampion = wWins[0];
  }
  if (L.length === 0) {
    if (roundDone(W[0])) {
      const drops = roundLosers(W[0]);
      if (drops.length > 0) L.push(pairPlayers(drops));
    }
    _checkGF(t);
    return;
  }
  const lastL = L[L.length - 1];
  if (!roundDone(lastL)) { _checkGF(t); return; }
  const lWins = roundWinners(lastL);
  if (t._lNextIsMixed) {
    const wFeed = W[t._nextWDrop];
    if (!wFeed) {
      if (lWins.length === 1) t._lChampion = lWins[0];
    } else if (roundDone(wFeed)) {
      const wDrops = roundLosers(wFeed);
      t._nextWDrop++;
      if (lWins.length + wDrops.length > 0) {
        L.push(pairInterleaved(lWins, wDrops));
        t._lNextIsMixed = false;
      }
    }
  } else {
    if (lWins.length > 1) {
      L.push(pairPlayers(lWins));
      t._lNextIsMixed = true;
    } else if (lWins.length === 1) {
      const wFeed = W[t._nextWDrop];
      if (!wFeed) {
        t._lChampion = lWins[0];
      } else if (roundDone(wFeed)) {
        const wDrops = roundLosers(wFeed);
        t._nextWDrop++;
        L.push(pairInterleaved(lWins, wDrops));
        t._lNextIsMixed = false;
      }
    }
  }
  _checkGF(t);
}

function _checkGF(t) {
  if (t._wChampion && t._lChampion && !t.grandFinal) {
    t.grandFinal = { p1: t._wChampion, p2: t._lChampion, winner: null };
  }
}

function tryAdvanceDE(t) {
  for (let i = 0; i < 60; i++) {
    const before = `${t.winnersRounds.length}|${t.losersRounds.length}|${!!t.grandFinal}|${!!t._wChampion}|${!!t._lChampion}`;
    _advanceDEOnce(t);
    const after = `${t.winnersRounds.length}|${t.losersRounds.length}|${!!t.grandFinal}|${!!t._wChampion}|${!!t._lChampion}`;
    if (before === after) break;
  }
}

/*Swiss pairing*/
function generateSwissRound(t) {
  const { players, scores, rounds } = t;
  const played = new Set();
  (rounds || []).forEach(round =>
    round.forEach(m => {
      if (m.p1 && m.p2) {
        played.add(`${m.p1.username}|${m.p2.username}`);
        played.add(`${m.p2.username}|${m.p1.username}`);
      }
    })
  );

  const sorted = [...players].sort((a, b) => {
    const diff = (scores[b.username] || 0) - (scores[a.username] || 0);
    return diff !== 0 ? diff : a.username.localeCompare(b.username);
  });
  const paired = new Set();
  const pairs  = [];
  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(sorted[i].username)) continue;
    let partnerIdx = -1;
    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(sorted[j].username)) continue;
      if (!played.has(`${sorted[i].username}|${sorted[j].username}`)) {
        partnerIdx = j; break;
      }
    }
    if (partnerIdx === -1) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (!paired.has(sorted[j].username)) { partnerIdx = j; break; }
      }
    }
    if (partnerIdx !== -1) {
      pairs.push({ p1: sorted[i], p2: sorted[partnerIdx], winner: null });
      paired.add(sorted[i].username);
      paired.add(sorted[partnerIdx].username);
    } else {
      pairs.push({ p1: sorted[i], p2: null, winner: sorted[i] });
    }
  }
  return pairs;
}

/*Tournament Routes*/
app.get('/api/tournaments', (req, res) => {
  const list = Object.entries(db.tournaments).map(([id, t]) => ({
    id, owner: t.owner, status: t.status,
    format: t.format || 'single', timeControl: t.timeControl || '', date: t.date || '',
    playerCount: t.players?.length || 0,
  }));
  res.json(list);
});

app.post('/api/tournaments', auth, (req, res) => {
  const { id, format = 'single', timeControl = '', date = '', totalRounds } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing ID' });
  if (db.tournaments[id]) return res.status(409).json({ error: 'Tournament ID already exists' });
  if (!['single', 'double', 'swiss'].includes(format))
    return res.status(400).json({ error: 'Invalid format' });
  db.tournaments[id] = {
    owner: req.username, players: [], status: 'waiting', champion: null,
    format, timeControl, date,
    rounds: null,
    winnersRounds: null, losersRounds: null, grandFinal: null,
    _wChampion: null, _lChampion: null, _nextWDrop: 1, _lNextIsMixed: true,
    scores: {}, totalRounds: totalRounds || 0, currentRound: 0,
  };
  saveDB();
  res.json({ ...db.tournaments[id], id });
});

app.get('/api/tournaments/:id', (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ ...t, id: req.params.id });
});

app.delete('/api/tournaments/:id', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  delete db.tournaments[req.params.id];
  saveDB();
  res.json({ success: true });
});

/*Tournament players*/
app.post('/api/tournaments/:id/players', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.status === 'active') return res.status(400).json({ error: 'Tournament already started' });
  const { player } = req.body;
  if (!player?.username) return res.status(400).json({ error: 'Missing player' });
  t.players.push(player);
  saveDB();
  res.json({ ...t, id: req.params.id });
});

app.delete('/api/tournaments/:id/players/:username', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  if (t.status === 'active') return res.status(400).json({ error: 'Tournament already started' });
  t.players = t.players.filter(p => p.username !== req.params.username);
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Reorder players*/
app.put('/api/tournaments/:id/players', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  if (t.status !== 'waiting') return res.status(400).json({ error: 'Tournament already started' });
  const { players } = req.body;
  if (!Array.isArray(players)) return res.status(400).json({ error: 'Invalid players array' });
  const existingNames = new Set(t.players.map(p => p.username));
  const newNames = new Set(players.map(p => p.username));
  if (existingNames.size !== newNames.size || [...existingNames].some(u => !newNames.has(u)))
    return res.status(400).json({ error: 'Player set mismatch — use add/remove routes to change the roster' });

  t.players = players;
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Generate bracket*/
app.post('/api/tournaments/:id/bracket', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  if (!t.players || t.players.length < 2)
    return res.status(400).json({ error: 'Need at least 2 players' });
  const { totalRounds } = req.body;
  const ordered = t.players;
  if (t.format === 'double') {
    t.winnersRounds = [pairPlayers(ordered)];
    t.losersRounds = [];
    t.grandFinal = null;
    t._wChampion = null;
    t._lChampion = null;
    t._nextWDrop = 1;
    t._lNextIsMixed = true;
    t.rounds = null;
    tryAdvanceDE(t);
  } else if (t.format === 'swiss') {
    const n = t.players.length;
    t.totalRounds = totalRounds ? parseInt(totalRounds, 10) : Math.ceil(Math.log2(n));
    t.scores = {};
    t.players.forEach(p => { t.scores[p.username] = 0; });
    t.currentRound = 0;
    t.rounds = [generateSwissRound(t)];
  } else {
    t.rounds = [pairPlayers(ordered)];
  }

  t.status = 'active';
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Pick winner*/
app.post('/api/tournaments/:id/pick', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  const { bracket = 'winners', roundIndex, matchIndex, winner } = req.body;
  /*Double elimination*/
  if (t.format === 'double') {
    if (bracket === 'grand') {
      if (!t.grandFinal) return res.status(400).json({ error: 'No grand final yet' });
      t.grandFinal.winner = winner;
      t.status = 'completed';
      t.champion = winner;
      saveDB();
      return res.json({ ...t, id: req.params.id });
    }
    const rounds = bracket === 'losers' ? t.losersRounds : t.winnersRounds;
    if (!rounds?.[roundIndex]?.[matchIndex])
      return res.status(400).json({ error: 'Invalid match reference' });
    rounds[roundIndex][matchIndex].winner = winner;
    tryAdvanceDE(t);
    if (t.grandFinal?.winner) { t.status = 'completed'; t.champion = t.grandFinal.winner; }
    saveDB();
    return res.json({ ...t, id: req.params.id });
  }

  /*Swiss*/
  if (t.format === 'swiss') {
    if (!t.rounds?.[roundIndex]?.[matchIndex])
      return res.status(400).json({ error: 'Invalid match reference' });
    t.rounds[roundIndex][matchIndex].winner = winner;
    if (roundDone(t.rounds[roundIndex])) {
      t.rounds[roundIndex].forEach(m => {
        if (m.winner) t.scores[m.winner.username] = (t.scores[m.winner.username] || 0) + 1;
      });
      t.currentRound++;
      if (t.currentRound < t.totalRounds) {
        t.rounds.push(generateSwissRound(t));
      } else {
        t.status = 'completed';
        t.champion = [...t.players].sort(
          (a, b) => (t.scores[b.username] || 0) - (t.scores[a.username] || 0)
        )[0];
      }
    }
    saveDB();
    return res.json({ ...t, id: req.params.id });
  }

  /*Single elimination*/
  if (!t.rounds?.[roundIndex]?.[matchIndex])
    return res.status(400).json({ error: 'Invalid match reference' });
  t.rounds[roundIndex][matchIndex].winner = winner;
  if (roundDone(t.rounds[roundIndex])) {
    const winners = roundWinners(t.rounds[roundIndex]);
    if (winners.length === 1) { t.status = 'completed'; t.champion = winners[0]; }
    else t.rounds.push(pairPlayers(winners));
  }
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Swap two players in unplayed matches*/
app.post('/api/tournaments/:id/swap', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  const { bracket1, roundIndex1, matchIndex1, slot1,
          bracket2, roundIndex2, matchIndex2, slot2 } = req.body;
  function getRounds(bracket) {
    if (t.format === 'double')
      return bracket === 'losers' ? t.losersRounds : t.winnersRounds;
    return t.rounds;
  }
  const r1 = getRounds(bracket1 || 'winners');
  const r2 = getRounds(bracket2 || 'winners');
  const m1 = r1?.[roundIndex1]?.[matchIndex1];
  const m2 = r2?.[roundIndex2]?.[matchIndex2];
  if (!m1 || !m2) return res.status(400).json({ error: 'Invalid match reference' });
  if (m1.winner || m2.winner)
    return res.status(400).json({ error: 'Cannot swap players in a completed match — reset it first' });
  const p1 = m1[slot1];
  const p2 = m2[slot2];
  if (!p1 || !p2) return res.status(400).json({ error: 'Cannot swap a BYE slot' });
  m1[slot1] = p2;
  m2[slot2] = p1;
  // Renormalise byes
  [m1, m2].forEach(m => {
    if (!m.p1 && m.p2) { m.p1 = m.p2; m.p2 = null; }
    m.winner = m.p2 ? null : (m.p1 || null);
  });
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Reset entire tournament*/
app.post('/api/tournaments/:id/reset', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });

  t.rounds = null; t.winnersRounds = null; t.losersRounds = null; t.grandFinal = null;
  t._wChampion = null; t._lChampion = null; t._nextWDrop = 1; t._lNextIsMixed = true;
  t.status = 'waiting'; t.champion = null; t.scores = {}; t.currentRound = 0;
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Reset individual match*/
app.post('/api/tournaments/:id/reset-match', auth, (req, res) => {
  const t = db.tournaments[req.params.id];
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.owner !== req.username) return res.status(403).json({ error: 'Only the owner' });
  const { bracket = 'winners', roundIndex, matchIndex } = req.body;
  if (t.format === 'double') {
    /*Double elim*/
    if (bracket === 'grand') {
      if (t.grandFinal) {
        t.grandFinal.winner = null;
        t.status = 'active'; t.champion = null;
      }
    } else if (bracket === 'losers') {
      const match = t.losersRounds?.[roundIndex]?.[matchIndex];
      if (!match) return res.status(400).json({ error: 'Invalid match' });
      if (!match.p2) return res.status(400).json({ error: 'Cannot reset a bye match' });
      match.winner = null;
      t.losersRounds = t.losersRounds.slice(0, roundIndex + 1);
      t.grandFinal = null;
      t._lChampion = null;
      t.status = 'active'; t.champion = null;
      replayDEState(t);
    } else {
      const match = t.winnersRounds?.[roundIndex]?.[matchIndex];
      if (!match) return res.status(400).json({ error: 'Invalid match' });
      if (!match.p2) return res.status(400).json({ error: 'Cannot reset a bye match' });
      match.winner = null;
      t.winnersRounds = t.winnersRounds.slice(0, roundIndex + 1);
      t.losersRounds = [];
      t.grandFinal = null;
      t._wChampion = null; t._lChampion  = null;
      t._nextWDrop = 1; t._lNextIsMixed = true;
      t.status = 'active'; t.champion = null;
      tryAdvanceDE(t);
    }
  } else if (t.format === 'swiss') {
    const match = t.rounds?.[roundIndex]?.[matchIndex];
    if (!match) return res.status(400).json({ error: 'Invalid match' });
    if (!match.p2) return res.status(400).json({ error: 'Cannot reset a bye match' });
    match.winner = null;
    t.rounds = t.rounds.slice(0, roundIndex + 1);
    t.scores = {};
    t.players.forEach(p => { t.scores[p.username] = 0; });
    for (let r = 0; r < roundIndex; r++) {
      (t.rounds[r] || []).forEach(m => {
        if (m.winner) t.scores[m.winner.username] = (t.scores[m.winner.username] || 0) + 1;
      });
    }
    t.currentRound = roundIndex;
    t.status = 'active'; t.champion = null;
  } else {
    // Single elimination
    const match = t.rounds?.[roundIndex]?.[matchIndex];
    if (!match) return res.status(400).json({ error: 'Invalid match' });
    if (!match.p2) return res.status(400).json({ error: 'Cannot reset a bye match' });
    match.winner = null;
    t.rounds = t.rounds.slice(0, roundIndex + 1);
    t.status = 'active'; t.champion = null;
  }
  saveDB();
  res.json({ ...t, id: req.params.id });
});

/*Serve Built Frontend*/
const dist = path.join(__dirname, 'dist');
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
