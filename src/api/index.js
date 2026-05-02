import { request } from './client.js';
export const api = {
  // auth
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // roster
  getRoster:        ()         => request('/roster'),
  addToRoster:      (player)   => request('/roster', { method: 'POST', body: JSON.stringify({ player }) }),
  clearRoster:      ()         => request('/roster', { method: 'DELETE' }),
  removeFromRoster: (username) => request(`/roster/${username}`, { method: 'DELETE' }),

  // tournaments
  getTournaments: () => request('/tournaments'),
  createTournament: (id, format = 'single', timeControl = '', date = '', totalRounds = 0) =>
    request('/tournaments', {
      method: 'POST',
      body: JSON.stringify({ id, format, timeControl, date, totalRounds }),
    }),
  deleteTournament: (id) => request(`/tournaments/${id}`, { method: 'DELETE' }),
  getTournament:    (id) => request(`/tournaments/${id}`),

  // players in tournament
  addPlayerToTournament: (id, player) =>
    request(`/tournaments/${id}/players`, { method: 'POST', body: JSON.stringify({ player }) }),
  removePlayerFromTournament: (id, username) =>
    request(`/tournaments/${id}/players/${username}`, { method: 'DELETE' }),

  // bracket
  generateBracket: (id, totalRounds) =>
    request(`/tournaments/${id}/bracket`, {
      method: 'POST',
      body: JSON.stringify({ totalRounds }),
    }),

  // pick winner
  pickWinner: (id, bracket, roundIndex, matchIndex, winner) =>
    request(`/tournaments/${id}/pick`, {
      method: 'POST',
      body: JSON.stringify({ bracket, roundIndex, matchIndex, winner }),
    }),

  // reorder players in setup
  reorderPlayers: (id, players) =>
    request(`/tournaments/${id}/players`, {
      method: 'PUT',
      body: JSON.stringify({ players }),
    }),

  // resets
  resetTournament: (id) =>
    request(`/tournaments/${id}/reset`, { method: 'POST' }),
  resetMatch: (id, bracket, roundIndex, matchIndex) =>
    request(`/tournaments/${id}/reset-match`, {
      method: 'POST',
      body: JSON.stringify({ bracket, roundIndex, matchIndex }),
    }),
};
