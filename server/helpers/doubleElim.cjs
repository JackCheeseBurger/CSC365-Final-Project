const { pairPlayers, pairInterleaved, roundDone, roundWinners, roundLosers } = require('./bracket.cjs');
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
module.exports = { initDEState, replayDEState, tryAdvanceDE };
