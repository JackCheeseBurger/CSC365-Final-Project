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
module.exports = { pairPlayers, pairInterleaved, roundDone, roundWinners, roundLosers };
