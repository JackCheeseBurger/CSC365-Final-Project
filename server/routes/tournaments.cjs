const { db, saveDB } = require('../db.cjs');
const { auth } = require('../middleware/auth.cjs');
const { pairPlayers, roundDone, roundWinners } = require('../helpers/bracket.cjs');
const { tryAdvanceDE, replayDEState } = require('../helpers/doubleElim.cjs');
const { generateSwissRound } = require('../helpers/swiss.cjs');
/*Tournament Routes*/
module.exports = function(app) {
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
};
