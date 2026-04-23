import { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { api } from '../api';

export default function Players() {
  const [username, setUsername] = useState('');
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [inputMode, setInputMode] = useState('search'); // 'search' | 'manual'
  const [manualName, setManualName] = useState('');

  // Load roster from backend on mount
  useEffect(() => {
    api.getRoster().then(setSavedPlayers).catch(() => {});
  }, []);

  const fetchPlayer = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`https://lichess.org/api/user/${username}`);
      const data = await res.json();
      if (!data?.username) { setError('Player not found'); setPlayer(null); return; }
      setPlayer(data);
    } catch {
      setError('Something went wrong');
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const savePlayer = async () => {
    if (!player) return;
    try {
      const updated = await api.addToRoster(player);
      setSavedPlayers(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  const clearSavedPlayers = async () => {
    await api.clearRoster();
    setSavedPlayers([]);
  };

  const filteredPlayers = useMemo(() => {
    return savedPlayers
      .filter(p => p.username.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.perfs?.blitz?.rating || 0) - (a.perfs?.blitz?.rating || 0);
        if (sortBy === 'rapid') return (b.perfs?.rapid?.rating || 0) - (a.perfs?.rapid?.rating || 0);
        if (sortBy === 'games') return (b.count?.all || 0) - (a.count?.all || 0);
        if (sortBy === 'winrate')  {
          const rateA = a.count?.all ? a.count.win / a.count.all : 0;
          const rateB = b.count?.all ? b.count.win / b.count.all : 0;
          return rateB - rateA;
        }
        if (sortBy === 'username') return a.username.localeCompare(b.username);
        return 0;
      });
  }, [savedPlayers, search, sortBy]);

const hasRating = (p) =>
  ['bullet','blitz','rapid','classical'].some(t => p.perfs?.[t]?.rating && !p.perfs[t].prov);

const handleManualAdd = async () => {
  if (!manualName.trim()) return;
  try {
    const updated = await api.addToRoster({ username: manualName.trim() });
    setSavedPlayers(updated);
    setManualName('');
  } catch (e) {
    setError(e.message);
  }
};
  return (
    <div className="page">
      <h1 className="mb-4">Players</h1>
      <Card className="chess-card mb-4">
        <Card.Header className="d-flex gap-2" style={{ padding: '8px 16px' }}>
          <button className={inputMode === 'search' ? 'btn-chess btn btn-sm' : 'btn btn-sm btn-chess'} onClick={() => { setInputMode('search'); setError(''); }}>Search Lichess</button>
          <button className={inputMode === 'manual' ? 'btn-chess btn btn-sm' : 'btn btn-sm btn-chess'} onClick={() => { setInputMode('manual'); setError(''); }}>Add Manually</button>
        </Card.Header>
        <Card.Body>
          {inputMode === 'search' && (
            <>
              <Row className="g-2 align-items-end">
                <Col xs={12} md={8}>
                  <Form.Control
                    className="chess-input"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Lichess username"
                    onKeyDown={e => e.key === 'Enter' && fetchPlayer()}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <Button className="btn-chess w-100" onClick={fetchPlayer} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Search'}
                  </Button>
                </Col>
              </Row>
              {error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}
              {player && (
                <div className="player-card mt-3 p-3">
                  <Row className="align-items-center">
                    <Col>
                      <h5 className="mb-1">{player.username}</h5>
                      <div className="d-flex gap-2 flex-wrap">
                        <Badge style={{ background: 'var(--wood-mid)' }}>Blitz: {player.perfs?.blitz?.rating ?? 'N/A'}</Badge>
                        <Badge style={{ background: 'var(--wood-light)' }}>Games: {player.count?.all ?? 'N/A'}</Badge>
                      </div>
                    </Col>
                    <Col xs="auto">
                      <Button className="btn-chess" onClick={savePlayer}>Save to Roster</Button>
                    </Col>
                  </Row>
                </div>
              )}
            </>
          )}
          {inputMode === 'manual' && (
            <>
              <Row className="g-2 align-items-end">
                <Col xs={12} md={8}>
                  <Form.Control
                    className="chess-input"
                    placeholder="Player name"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <Button className="btn-chess w-100" onClick={handleManualAdd}>Add</Button>
                </Col>
              </Row>
              {error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}
            </>
          )}
        </Card.Body>
      </Card>
      <Card className="chess-card">
        <Card.Header>
          <Row className="align-items-center">
            <Col>My Roster</Col>
            <Col xs="auto">
              <Badge bg="none" style={{ background: 'var(--cream-border)', color: 'var(--wood-dark)' }}>
                {filteredPlayers.length}
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row className="g-2 mb-3">
            <Col xs={12} md={7}>
              <Form.Control
                className="chess-input"
                placeholder="Filter players..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Col>
            <Col xs={12} md={5}>
            <Form.Select className="chess-input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="rating">Sort by Blitz Rating</option>
              <option value="rapid">Sort by Rapid Rating</option>
              <option value="games">Sort by Games Played</option>
              <option value="winrate">Sort by Win Rate</option>
              <option value="username">Sort by Username</option>
            </Form.Select>
            </Col>
          </Row>
          {filteredPlayers.length === 0 ? (
            <p className="text-muted">No saved players yet. Search Lichess above to add some.</p>
          ) : (
            <ListGroup variant="flush" className="d-flex flex-column gap-2">
              {filteredPlayers.map((p, i) => (
                <ListGroup.Item
                  key={i}
                  className="player-card d-flex align-items-center justify-content-between px-3 py-2"
                  style={{ border: 'none', background: 'transparent' }}
                >
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div>
                    {/*name row*/}
                    <div className="d-flex align-items-center gap-2 mb-1">
                      {p.title && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--wood-mid)', border: '1px solid var(--wood-mid)', borderRadius: 4, padding: '0 4px' }}>
                          {p.title}
                        </span>
                      )}
                      {p.perfs ? (
                        <a
                          href={`https://lichess.org/@/${p.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="roster-link"
                        >
                          {p.username}
                        </a>
                        ) : (
                          <strong style={{ fontFamily: "'Playfair Display', serif" }}>{p.username}</strong>
                        )}
                        {!p.perfs && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--wood-mid)', color: 'white', borderRadius: 4, padding: '1px 5px' }}>M</span>
                        )}
                        {p.patron && <span title="Lichess Patron" style={{ fontSize: '0.8rem', color: 'var(--wood-mid)' }}>♔</span>}
                    </div>
                    <div className="d-flex gap-2 flex-wrap mb-1">
                      {['bullet','blitz','rapid','classical'].map(type =>
                        p.perfs?.[type]?.rating && !p.perfs[type].prov ? (
                          <Badge key={type} style={{ background: 'var(--wood-mid)', fontWeight: 400 }}>
                            {type} {p.perfs[type].rating}
                          </Badge>
                        ) : null
                      )}
                      {!hasRating(p) && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>No rated games</span>
                      )}
                    </div>
                    {/*win/loss/draw*/}
                    {p.count && (
                      <div className="d-flex gap-3" style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: '#5a8a5a' }}>▲ {p.count.win}</span>
                        <span style={{ color: '#a05050' }}>▼ {p.count.loss}</span>
                        <span style={{ opacity: 0.6 }}>● {p.count.draw}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ color: 'var(--wood-mid)', border: 'none', background: 'transparent', fontSize: '1rem' }}
                    onClick={async () => {
                      try {
                        const updated = await api.removeFromRoster(p.username);
                        setSavedPlayers(updated);
                      } catch (e) { setError(e.message); }
                    }}
                  >
                    ✕
                  </button>
                </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          {savedPlayers.length > 0 && (
            <div className="mt-3 text-end">
              <Button variant="outline-danger" size="sm" style={{ borderRadius: 8 }} onClick={clearSavedPlayers}>
                Clear Roster
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
