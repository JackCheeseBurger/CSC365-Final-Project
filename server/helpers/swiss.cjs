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
module.exports = { generateSwissRound };
