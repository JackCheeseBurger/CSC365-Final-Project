import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Card, Form, Button, Alert, Badge, Row, Col, ListGroup, Table,
} from 'react-bootstrap';
import {
  Bracket, Seed, SeedItem, SeedTeam, SingleLineSeed,
} from 'react-brackets';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

/*constants*/
const FORMAT_LABELS = {
  single: 'Single Elimination',
  double: 'Double Elimination',
  swiss: 'Swiss',
};

/*helpers*/
// Convert tournament round array to react-brackets RoundProps
function toRoundProps(rounds) {
  if (!rounds?.length) return [];
  return rounds.map((round, rIdx) => ({
    title: `Round ${rIdx + 1}`,
    seeds: round.map((match, mIdx) => ({
      id: `${rIdx}-${mIdx}`,
      teams: [
        { name: match.p1?.username || 'BYE' },
        { name: match.p2?.username || 'BYE' },
      ],
      _match: match,
      _rIdx: rIdx,
      _mIdx: mIdx,
    })),
  }));
}

function toRoundPropsLoser(rounds) {
  if (!rounds?.length) return [];
  return rounds.map((round, rIdx) => ({
    title: `L Round ${rIdx + 1}`,
    seeds: round.map((match, mIdx) => ({
      id: `l-${rIdx}-${mIdx}`,
      teams:  [
        { name: match.p1?.username || 'BYE' },
        { name: match.p2?.username || 'BYE' },
      ],
      _match: match,
      _rIdx: rIdx,
      _mIdx: mIdx,
    })),
  }));
}

/*Seed renderer*/
function makeSeedRenderer({ bracket, isOwner, onPick, onReset, losersRounds }) {
  return function CustomSeed({ seed, breakpoint, roundIndex }) {
    const { _match: match, _rIdx: rIdx, _mIdx: mIdx } = seed;
    const p1Win = match.winner?.username === match.p1?.username;
    const p2Win = match.winner?.username === match.p2?.username;
    const isLoser = bracket === 'losers';
    const sameCount = isLoser
      && losersRounds?.[roundIndex]?.length === losersRounds?.[roundIndex + 1]?.length;
    const Wrapper = sameCount ? SingleLineSeed : Seed;
    const woodMid   = 'var(--wood-mid)';
    const winColor  = '#4a7a4a';
    const baseColor = 'var(--wood-dark)';

    return (
      <Wrapper mobileBreakpoint={breakpoint} style={{ fontSize: 13, marginBottom: 4 }}>
        <SeedItem style={{ background: 'var(--match-bg)', border: '1px solid var(--cream-border)', borderRadius: 8, padding: 0, overflow: 'hidden' }}>
          {/*Team rows*/}
          <div>
            <SeedTeam
              style={{
                fontFamily: "'Playfair Display', serif",
                color: p1Win ? winColor : baseColor,
                fontWeight: p1Win ? 700 : 400,
                padding: '5px 10px',
                borderBottom: '1px solid var(--cream-border)',
              }}
            >
              {match.p1?.username || 'BYE'}
              {p1Win && ' ♛'}
            </SeedTeam>
            <SeedTeam
              style={{
                fontFamily: "'Playfair Display', serif",
                color: p2Win ? winColor : match.p2 ? baseColor : '#bbb',
                fontWeight: p2Win ? 700 : 400,
                padding: '5px 10px',
              }}
            >
              {match.p2?.username || 'BYE'}
              {p2Win && ' ♛'}
            </SeedTeam>
          </div>
        </SeedItem>

        {/*Owner controls*/}
        {isOwner && !match.winner && match.p2 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              style={{ flex: 1, fontSize: '0.72rem', background: 'var(--wood-mid)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 6px' }}
              onClick={() => onPick(bracket, rIdx, mIdx, match.p1)}
            >
              ♟ {match.p1?.username}
            </button>
            <button
              className="btn btn-sm"
              style={{ flex: 1, fontSize: '0.72rem', background: 'var(--wood-mid)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 6px' }}
              onClick={() => onPick(bracket, rIdx, mIdx, match.p2)}
            >
              ♟ {match.p2?.username}
            </button>
          </div>
        )}
        {isOwner && match.winner && match.p2 && (
          <button
            className="btn btn-sm"
            style={{ width: '100%', marginTop: 4, fontSize: '0.7rem', color: woodMid, background: 'transparent', border: '1px solid var(--cream-border)', borderRadius: 6 }}
            onClick={() => onReset(bracket, rIdx, mIdx)}
          >
            ↺ Reset result
          </button>
        )}

        {!isOwner && !match.winner && match.p2 && (
          <div style={{ fontSize: '0.68rem', opacity: 0.45, textAlign: 'center', marginTop: 3 }}>
            Awaiting result…
          </div>
        )}
      </Wrapper>
    );
  };
}

/*Grand inal card*/
function GrandFinalCard({ gf, isOwner, onPick, onReset }) {
  const p1Win = gf.winner?.username === gf.p1?.username;
  const p2Win = gf.winner?.username === gf.p2?.username;

  return (
    <Card className="chess-card mb-4" style={{ maxWidth: 380, margin: '0 auto' }}>
      <Card.Header style={{ textAlign: 'center', fontFamily: "'Playfair Display',serif", fontSize: '1.1rem' }}>
        🏆 Grand Final
      </Card.Header>
      <Card.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[gf.p1, gf.p2].map((player, idx) => {
            const isWinner = idx === 0 ? p1Win : p2Win;
            return (
              <div
                key={player?.username}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--cream-border)',
                  background: isWinner ? 'rgba(74,122,74,0.12)' : 'var(--match-bg)',
                  fontFamily: "'Playfair Display',serif",
                  color: isWinner ? '#4a7a4a' : 'var(--wood-dark)',
                  fontWeight: isWinner ? 700 : 400,
                }}
              >
                {player?.username} {isWinner && '♛'}
              </div>
            );
          })}
        </div>
        {isOwner && !gf.winner && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button className="btn-chess flex-fill" onClick={() => onPick('grand', 0, 0, gf.p1)}>
              ♟ {gf.p1?.username}
            </Button>
            <Button className="btn-chess flex-fill" onClick={() => onPick('grand', 0, 0, gf.p2)}>
              ♟ {gf.p2?.username}
            </Button>
          </div>
        )}
        {isOwner && gf.winner && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="w-100 mt-2"
            onClick={() => onReset('grand', 0, 0)}
          >
            ↺ Reset Grand Final
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}

/*Swiss standings*/
function SwissStandings({ tournament }) {
  const sorted = [...(tournament.players || [])].sort((a, b) =>
    (tournament.scores?.[b.username] || 0) - (tournament.scores?.[a.username] || 0)
  );
  return (
    <Card className="chess-card mb-4">
      <Card.Header>📊 Standings</Card.Header>
      <Card.Body style={{ padding: 0 }}>
        <Table size="sm" className="mb-0" style={{ fontFamily: "'Playfair Display',serif" }}>
          <thead>
            <tr style={{ background: 'var(--match-bg)' }}>
              <th style={{ padding: '6px 12px', color: 'var(--wood-mid)' }}>#</th>
              <th style={{ padding: '6px 12px', color: 'var(--wood-mid)' }}>Player</th>
              <th style={{ padding: '6px 12px', color: 'var(--wood-mid)', textAlign: 'right' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.username} style={{ background: i % 2 === 0 ? 'var(--match-bg)' : 'var(--cream-light)' }}>
                <td style={{ padding: '6px 12px', color: 'var(--wood-light)' }}>{i + 1}</td>
                <td style={{ padding: '6px 12px', color: 'var(--wood-dark)', fontWeight: i === 0 ? 700 : 400 }}>
                  {i === 0 && '♟ '}{p.username}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--wood-mid)' }}>
                  {tournament.scores?.[p.username] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

/*Swiss round cards*/
function SwissRounds({ tournament, isOwner, onPick, onReset }) {
  const rounds = tournament.rounds || [];
  return (
    <div>
      {rounds.map((round, rIdx) => (
        <Card key={rIdx} className="chess-card mb-3">
          <Card.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Round {rIdx + 1}</span>
            {rIdx === rounds.length - 1 && tournament.status === 'active' && (
              <Badge bg="false" style={{ background: '#e07b39', fontSize: '0.72rem' }}>Current</Badge>
            )}
          </Card.Header>
          <Card.Body style={{ padding: '8px 12px' }}>
            {round.map((match, mIdx) => {
              const p1Win = match.winner?.username === match.p1?.username;
              const p2Win = match.winner?.username === match.p2?.username;
              return (
                <div
                  key={mIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: mIdx < round.length - 1 ? '1px solid var(--cream-border)' : 'none',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ flex: 1, fontFamily: "'Playfair Display',serif", fontWeight: p1Win ? 700 : 400, color: p1Win ? '#4a7a4a' : 'var(--wood-dark)' }}>
                    {match.p1?.username}{p1Win && ' ♛'}
                  </span>
                  <span style={{ opacity: 0.4, fontSize: '0.85rem' }}>vs</span>
                  <span style={{ flex: 1, fontFamily: "'Playfair Display',serif", fontWeight: p2Win ? 700 : 400, color: p2Win ? '#4a7a4a' : match.p2 ? 'var(--wood-dark)' : '#bbb' }}>
                    {match.p2?.username || 'BYE'}{p2Win && ' ♛'}
                  </span>
                  {isOwner && !match.winner && match.p2 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-sm"
                        style={{ fontSize: '0.72rem', background: 'var(--wood-mid)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px' }}
                        onClick={() => onPick('winners', rIdx, mIdx, match.p1)}
                      >
                        {match.p1?.username} wins
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ fontSize: '0.72rem', background: 'var(--wood-mid)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px' }}
                        onClick={() => onPick('winners', rIdx, mIdx, match.p2)}
                      >
                        {match.p2?.username} wins
                      </button>
                    </div>
                  )}
                  {isOwner && match.winner && match.p2 && (
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: '0.68rem', color: 'var(--wood-light)', background: 'transparent', border: '1px solid var(--cream-border)', borderRadius: 6, padding: '2px 8px' }}
                      onClick={() => onReset('winners', rIdx, mIdx)}
                    >
                      ↺
                    </button>
                  )}
                  {!isOwner && !match.winner && match.p2 && (
                    <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Awaiting…</span>
                  )}
                </div>
              );
            })}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

/*MAIN TOURNAMENT PAGE*/
export default function Tournament() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [error, setError] = useState('');
  const [roster, setRoster] = useState([]);

  // drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // visitor
  const [showJoin, setShowJoin] = useState(false);
  const [joinMode, setJoinMode] = useState('roster');
  const [joinPick, setJoinPick] = useState('');
  const [joinManual, setJoinManual] = useState('');
  const [joinError, setJoinError] = useState('');

  // swiss
  const [swissRounds, setSwissRounds] = useState('');

  const isOwner = user && tournament && tournament.owner === user;

  const availableRoster = roster.filter(
    p => !tournament?.players?.some(tp => tp.username === p.username)
  );

  useEffect(() => {
    api.getTournament(id).then(setTournament).catch(e => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (user) api.getRoster().then(setRoster).catch(() => {});
  }, [user]);

  const refresh = () => api.getTournament(id).then(setTournament).catch(() => {});

  /*Pick winner*/
  const pickWinner = async (bracket, roundIndex, matchIndex, winner) => {
    try {
      const updated = await api.pickWinner(id, bracket, roundIndex, matchIndex, winner);
      setTournament(updated);
    } catch (e) { setError(e.message); }
  };

  /*Reset individual match*/
  const resetMatch = async (bracket, roundIndex, matchIndex) => {
    try {
      const updated = await api.resetMatch(id, bracket, roundIndex, matchIndex);
      setTournament(updated);
    } catch (e) { setError(e.message); }
  };

  /*Reset whole tournament*/
  const resetTournament = async () => {
    if (!window.confirm('Reset the entire bracket? Players will be kept.')) return;
    try {
      const updated = await api.resetTournament(id);
      setTournament(updated);
    } catch (e) { setError(e.message); }
  };

  /*Generate bracket*/
  const generateBracket = async () => {
    try {
      const rounds = tournament.format === 'swiss'
        ? parseInt(swissRounds, 10) || undefined
        : undefined;
      const updated = await api.generateBracket(id, rounds);
      setTournament(updated);
    } catch (e) { setError(e.message); }
  };

  /*drag setup*/
  const handleDrop = async (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null); setDragOverIndex(null); return;
    }
    const players = [...tournament.players];
    const [moved] = players.splice(dragIndex, 1);
    players.splice(dropIndex, 0, moved);
    setDragIndex(null); setDragOverIndex(null);
    try {
      const updated = await api.reorderPlayers(id, players);
      setTournament(updated);
    } catch (e) { setError(e.message); }
  };

  /*visitor*/
  const joinTournament = async () => {
    setJoinError('');
    let player = null;
    if (joinMode === 'roster') {
      player = roster.find(p => p.username === joinPick);
      if (!player) { setJoinError('Select a player from your roster'); return; }
    } else {
      if (!joinManual.trim()) { setJoinError('Enter a player name'); return; }
      player = { username: joinManual.trim() };
    }
    try {
      await api.addPlayerToTournament(id, player);
      setShowJoin(false); setJoinManual(''); setJoinPick('');
      refresh();
    } catch (e) { setJoinError(e.message); }
  };

  /*Loading/Error*/
  if (error && !tournament)
    return <div className="page"><Alert variant="danger">{error}</Alert></div>;
  if (!tournament)
    return <div className="page"><p>Loading tournament…</p></div>;

  const fmt = tournament.format || 'single';
  const bracketActive = tournament.status === 'active' || tournament.status === 'completed';

  /*Champion screen*/
  if (tournament.status === 'completed') {
    return (
      <div className="page text-center">
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>🏆</div>
        <h1>Tournament Complete!</h1>
        <h2 className="mt-3">{tournament.champion?.username}</h2>
        <p className="text-muted">Champion crowned. Well played!</p>
        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
          {FORMAT_LABELS[fmt]}
          {tournament.timeControl && ` · ${tournament.timeControl}`}
          {tournament.date && ` · ${tournament.date}`}
        </p>
        {isOwner && (
          <Button variant="outline-secondary" className="mt-3" onClick={resetTournament}>
            ↺ Reset & play again
          </Button>
        )}
      </div>
    );
  }

  /*Seed renderers*/
  const renderWinnerSeed = makeSeedRenderer({
    bracket: 'winners', isOwner, onPick: pickWinner, onReset: resetMatch,
  });
  const renderLoserSeed = makeSeedRenderer({
    bracket: 'losers', isOwner, onPick: pickWinner, onReset: resetMatch,
    losersRounds: tournament.losersRounds,
  });

  /*Player list*/
  const canDrag = isOwner && !bracketActive;
  const playerList = tournament.players?.length > 0 ? (
    <>
      {canDrag && tournament.players.length > 1 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--wood-light)', marginBottom: 6, fontStyle: 'italic' }}>
          Drag players to set seeding order before generating the bracket.
        </div>
      )}
      <div className="chess-scroll" style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 8, borderRadius: 6, border: '1px solid var(--cream-border)' }}>
        <ListGroup variant="flush">
          {tournament.players.map((p, i) => {
            const isDragging = dragIndex === i;
            const isOver = dragOverIndex === i && dragIndex !== i;
            return (
              <ListGroup.Item
                key={i}
                draggable={canDrag}
                onDragStart={() => setDragIndex(i)}
                onDragOver={e => { e.preventDefault(); setDragOverIndex(i); }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={e => { e.preventDefault(); handleDrop(i); }}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                style={{
                  background:   isDragging ? 'var(--cream-light)' : 'transparent',
                  padding:      '5px 8px',
                  borderColor:  'var(--cream-border)',
                  borderTop:    isOver ? '2px solid var(--wood-mid)' : undefined,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'space-between',
                  opacity:      isDragging ? 0.45 : 1,
                  cursor:       canDrag ? 'grab' : 'default',
                  transition:   'border-top 0.1s',
                  userSelect:   'none',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {canDrag && (
                    <span style={{ color: 'var(--wood-light)', fontSize: '1rem', lineHeight: 1, letterSpacing: '-1px' }}>⠿</span>
                  )}
                  {canDrag && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--wood-light)', fontVariantNumeric: 'tabular-nums', minWidth: 16 }}>
                      {i + 1}.
                    </span>
                  )}
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.92rem', color: 'var(--wood-dark)' }}>
                    ♟ {p.username}
                    {p.rating && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--wood-light)', marginLeft: 5 }}>({p.rating})</span>
                    )}
                  </span>
                </span>
                {canDrag && (
                  <button
                    className="btn btn-sm"
                    style={{ color: '#c0392b', border: 'none', background: 'transparent', padding: '1px 4px' }}
                    onClick={async () => {
                      try {
                        const updated = await api.removePlayerFromTournament(id, p.username);
                        setTournament(updated);
                      } catch (e) { setError(e.message); }
                    }}
                  >✕</button>
                )}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>
    </>
  ) : (
    <p className="text-muted">No players yet.</p>
  );

  /*MAIN RENDER*/
  return (
    <div className="page">
      {/*Header*/}
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Tournament: {id}</h1>
          <small style={{ color: 'var(--wood-light)' }}>
            Organised by {tournament.owner}
            {tournament.timeControl && ` · Time Control: ${tournament.timeControl}`}
            {tournament.date && ` · Date: ${tournament.date}`}
          </small>
        </Col>
        <Col xs="auto" className="d-flex gap-2 flex-wrap">
          <Badge bg="false" style={{ background: 'var(--wood-mid)', fontSize: '0.78rem', padding: '5px 12px' }}>
            {FORMAT_LABELS[fmt]}
          </Badge>
          <Badge bg="false" style={{ fontSize: '0.78rem', padding: '5px 12px', background: tournament.status === 'active' ? '#e07b39' : 'var(--wood-light)' }}>
            {tournament.players?.length ?? 0} players · {tournament.status}
          </Badge>
          {fmt === 'swiss' && bracketActive && (
            <Badge bg="false" style={{ fontSize: '0.78rem', padding: '5px 12px', background: '#5a8a5a' }}>
              Round {tournament.currentRound + (tournament.status === 'active' ? 1 : 0)} / {tournament.totalRounds}
            </Badge>
          )}
        </Col>
      </Row>

      {error && <Alert variant="warning" className="mb-3">{error}</Alert>}

      {/*Shareable*/}
      <div className="mb-4 p-3" style={{ background: 'var(--match-bg)', border: '1px solid var(--cream-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--wood-mid)', whiteSpace: 'nowrap' }}>Shareable link:</span>
        <code style={{ flex: 1, fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--wood-dark)' }}>{window.location.href}</code>
        <button
          className="btn-chess btn"
          style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '4px 12px' }}
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >Copy</button>
      </div>

      {/*Login nudge*/}
      {!user && (
        <Alert variant="info" style={{ background: 'var(--match-bg)', borderColor: 'var(--match-border)', color: 'var(--wood-dark)' }}>
          <Link to="/login">Sign in</Link> or <Link to="/login">register</Link> to join this tournament.
        </Alert>
      )}

      {/*PRE BRACKET STAGE*/}
      {!bracketActive && (
        <Row className="g-3 mb-4">
          {/*Players panel*/}
          <Col xs={12} md={isOwner ? 6 : 12}>
            <Card className="chess-card h-100">
              <Card.Header>Registered Players</Card.Header>
              <Card.Body>
                {playerList}
                {isOwner && (
                  <>
                    <hr className="chess-hr" />
                    <p className="mb-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: '0.9rem' }}>
                      Add from roster
                    </p>
                    {availableRoster.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {availableRoster.map(p => (
                          <button
                            key={p.username}
                            className="btn btn-sm"
                            style={{
                              background: 'var(--match-bg)',
                              border: '1px solid var(--cream-border)',
                              borderRadius: 20,
                              color: 'var(--wood-dark)',
                              fontFamily: "'Playfair Display', serif",
                              fontSize: '0.82rem',
                              padding: '3px 10px',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--wood-mid)' || (e.currentTarget.style.color = '#fff')}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--match-bg)'; e.currentTarget.style.color = 'var(--wood-dark)'; }}
                            onClick={async () => {
                              try {
                                const updated = await api.addPlayerToTournament(id, p);
                                setTournament(updated);
                              } catch (e) { setError(e.message); }
                            }}
                          >
                            + {p.username}{p.rating ? ` (${p.rating})` : ''}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.83rem', color: 'var(--wood-light)', margin: 0 }}>
                        {roster.length === 0
                          ? 'Your roster is empty, add players on the Players page.'
                          : 'All roster players already added.'}
                      </p>
                    )}
                  </>
                )}

                {/*Visitor: join*/}
                {user && !isOwner && tournament.status === 'waiting' && (
                  <>
                    <hr className="chess-hr"/>
                    {!showJoin ? (
                      <Button className="btn-chess w-100" onClick={() => setShowJoin(true)}>
                        Register to Tournament
                      </Button>
                    ) : (
                      <div>
                        <p className="mb-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>Add a player</p>
                        <div className="d-flex gap-2 mb-2">
                          <Button size="sm" className={joinMode === 'roster' ? 'btn-chess' : 'btn-chess-outline btn'} onClick={() => setJoinMode('roster')}>
                            From my roster
                          </Button>
                          <Button size="sm" className={joinMode === 'manual' ? 'btn-chess' : 'btn-chess-outline btn'} onClick={() => setJoinMode('manual')}>
                            Enter manually
                          </Button>
                        </div>
                        {joinMode === 'roster' ? (
                          <Form.Select className="chess-input mb-2" value={joinPick} onChange={e => setJoinPick(e.target.value)}>
                            <option value="">Select from your roster…</option>
                            {availableRoster.map(p => (
                              <option key={p.username} value={p.username}>{p.username}</option>
                            ))}
                          </Form.Select>
                        ) : (
                          <Form.Control className="chess-input mb-2" placeholder="Player username" value={joinManual} onChange={e => setJoinManual(e.target.value)} />
                        )}
                        {joinError && <Alert variant="warning" className="py-1 mb-2">{joinError}</Alert>}
                        <div className="d-flex gap-2">
                          <Button className="btn-chess" onClick={joinTournament}>Confirm</Button>
                          <Button className="btn-chess-outline btn" onClick={() => { setShowJoin(false); setJoinError(''); }}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/*generate bracket*/}
          {isOwner && (
            <Col xs={12} md={6}>
              <Card className="chess-card h-100">
                <Card.Header>Start Tournament</Card.Header>
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div>
                    <p style={{ color: 'var(--wood-mid)' }}>
                      Format: <strong>{FORMAT_LABELS[fmt]}</strong>
                      {tournament.timeControl && <> <strong>{tournament.timeControl}</strong></>}
                      {tournament.date && <> <strong>{tournament.date}</strong></>}
                    </p>
                    <p style={{ color: 'var(--wood-mid)', fontSize: '0.9rem' }}>
                      Once you generate the bracket, no more players can be added.
                      You need at least 2 players.
                    </p>
                    {fmt === 'swiss' && (
                      <Form.Control
                        className="chess-input mb-3"
                        type="number"
                        min="1"
                        placeholder={`Swiss rounds (default: ${Math.ceil(Math.log2(Math.max(tournament.players?.length || 2, 2)))})`}
                        value={swissRounds}
                        onChange={e => setSwissRounds(e.target.value)}
                      />
                    )}
                  </div>
                  <Button
                    className="btn-chess"
                    onClick={generateBracket}
                    disabled={!tournament.players || tournament.players.length < 2}
                  >
                    ♟ Generate Bracket
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/*ACTIVE BRACKET*/}
      {bracketActive && (
        <>
          {/*reset controls*/}
          {isOwner && (
            <div className="mb-3 d-flex gap-2 flex-wrap">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={resetTournament}
              >
                ↺ Reset Entire Tournament
              </Button>
            </div>
          )}

          {/*SINGLE ELIMINATION*/}
          {fmt === 'single' && tournament.rounds && (
            <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
              <Bracket
                rounds={toRoundProps(tournament.rounds)}
                renderSeedComponent={renderWinnerSeed}
                mobileBreakpoint={0}
              />
            </div>
          )}

          {/*DOUBLE ELIMINATION*/}
          {fmt === 'double' && (
            <>
              {tournament.winnersRounds?.length > 0 && (
                <div className="mb-2">
                  <h4 style={{ color: 'var(--wood-mid)', fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>
                    🏆 Winners Bracket
                  </h4>
                  <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
                    <Bracket
                      rounds={toRoundProps(tournament.winnersRounds)}
                      renderSeedComponent={renderWinnerSeed}
                      mobileBreakpoint={0}
                    />
                  </div>
                </div>
              )}

              {tournament.losersRounds?.length > 0 && (
                <div className="mb-2">
                  <h4 style={{ color: '#4a6fa5', fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>
                    🔁 Losers Bracket
                  </h4>
                  <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
                    <Bracket
                      rounds={toRoundPropsLoser(tournament.losersRounds)}
                      renderSeedComponent={renderLoserSeed}
                      mobileBreakpoint={0}
                    />
                  </div>
                </div>
              )}

              {tournament.grandFinal && (
                <div className="mb-4">
                  <GrandFinalCard
                    gf={tournament.grandFinal}
                    isOwner={isOwner}
                    onPick={pickWinner}
                    onReset={resetMatch}
                  />
                </div>
              )}

              {!tournament.grandFinal && tournament.winnersRounds && (
                <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>
                  Grand Final unlocks when both brackets produce a finalist.
                </p>
              )}
            </>
          )}

          {/*SWISS*/}
          {fmt === 'swiss' && (
            <>
              <SwissStandings tournament={tournament} />
              <SwissRounds
                tournament={tournament}
                isOwner={isOwner}
                onPick={pickWinner}
                onReset={resetMatch}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

GrandFinalCard.propTypes = {
  gf: PropTypes.shape({ p1: PropTypes.object, p2: PropTypes.object, winner: PropTypes.object }).isRequired,
  isOwner: PropTypes.bool.isRequired,
  onPick: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

SwissStandings.propTypes = {
  tournament: PropTypes.object.isRequired,
};

SwissRounds.propTypes = {
  tournament: PropTypes.object.isRequired,
  isOwner: PropTypes.bool.isRequired,
  onPick: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};