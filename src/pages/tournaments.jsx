import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const FORMAT_LABELS = {
  single: '⚔️ Single Elim',
  double: '🔁 Double Elim',
  swiss: '♟ Swiss',
};

const FORMAT_COLORS = {
  single: 'var(--wood-mid)',
  double: '#4a6fa5',
  swiss: '#5a8a5a',
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [search, setSearch] = useState('');
  const [createError, setCreateError] = useState('');
  const { user } = useAuth();

  // Creation form state
  const [id, setId] = useState('');
  const [format, setFormat] = useState('single');
  const [timeControl, setTimeControl] = useState('');
  const [date, setDate] = useState('');
  const [swissRounds, setSwissRounds] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    api.getTournaments().then(setTournaments).catch(() => {});
  }, []);

  const createTournament = async () => {
    if (!id.trim()) return;
    setCreateError('');
    try {
      await api.createTournament(
        id.trim(),
        format,
        timeControl,
        date,
        format === 'swiss' ? parseInt(swissRounds, 10) || 0 : 0,
      );
      setTournaments(await api.getTournaments());
      setId('');
    } catch (e) {
      setCreateError(e.message);
    }
  };

  const filtered = useMemo(() =>
    tournaments.filter(t =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.owner.toLowerCase().includes(search.toLowerCase())
    ),
  [tournaments, search]);

  const statusColor = (status) => {
    if (status === 'active')    return '#e07b39';
    if (status === 'completed') return '#5a8a5a';
    return 'var(--wood-light)';
  };

  return (
    <div className="page">
      <h1 className="mb-4">Tournaments</h1>

      {/*Create tournament*/}
      <Card className="chess-card mb-4">
        <Card.Header>Create Tournament</Card.Header>
        <Card.Body>
          {/*Tournament ID/Create button*/}
          <Row className="g-2 mb-2">
            <Col xs={12} md={8}>
              <Form.Control
                className="chess-input"
                placeholder="Tournament ID (unique name)"
                value={id}
                onChange={e => setId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createTournament()}
              />
            </Col>
            <Col xs={12} md={4}>
              <Button className="btn-chess w-100" onClick={createTournament}>
                Create
              </Button>
            </Col>
          </Row>

          {/*Format picker*/}
          <Row className="g-2 mb-2">
            {['single', 'double', 'swiss'].map(f => (
              <Col key={f} xs={4}>
                <button
                  className="btn w-100"
                  style={{
                    fontSize: '0.82rem',
                    fontFamily: "'Playfair Display', serif",
                    border: '1px solid var(--cream-border)',
                    borderRadius: 8,
                    padding: '6px 4px',
                    background: format === f ? FORMAT_COLORS[f] : 'var(--match-bg)',
                    color: format === f ? '#fff' : 'var(--wood-dark)',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setFormat(f)}
                >
                  {FORMAT_LABELS[f]}
                </button>
              </Col>
            ))}
          </Row>

          {/*Swiss rounds*/}
          {format === 'swiss' && (
            <Row className="g-2 mb-2">
              <Col xs={12} md={6}>
                <Form.Control
                  className="chess-input"
                  type="number"
                  min="1"
                  placeholder="Number of Swiss rounds (auto if blank)"
                  value={swissRounds}
                  onChange={e => setSwissRounds(e.target.value)}
                />
              </Col>
            </Row>
          )}

          {/*time control/date*/}
          <div
            style={{ fontSize: '0.82rem', color: 'var(--wood-light)', cursor: 'pointer', marginBottom: 6 }}
            onClick={() => setShowAdvanced(v => !v)}
          >
            {showAdvanced ? '▾' : '▸'} Optional settings (time control, date)
          </div>
          {showAdvanced && (
            <Row className="g-2 mb-2">
              <Col xs={12} md={6}>
                <Form.Control
                  className="chess-input"
                  placeholder="Time control (e.g. Blitz 5+3)"
                  value={timeControl}
                  onChange={e => setTimeControl(e.target.value)}
                />
              </Col>
              <Col xs={12} md={6}>
                <Form.Control
                  className="chess-input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </Col>
            </Row>
          )}

          {createError && <Alert variant="warning" className="mt-1 mb-0">{createError}</Alert>}
        </Card.Body>
      </Card>

      {/*Tournament list*/}
      <Card className="chess-card">
        <Card.Header>
          <Row className="align-items-center">
            <Col>All Tournaments</Col>
            <Col xs={12} md={5} className="mt-2 mt-md-0">
              <Form.Control
                className="chess-input"
                placeholder="Search by name or owner…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {filtered.length === 0 ? (
            <p className="text-muted mb-0">No tournaments yet.</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filtered.map(t => (
                <Link key={t.id} to={`/tournament/${t.id}`} className="tournament-item">
                  <span style={{ fontSize: '1.4rem' }}>♟</span>
                  <span style={{ flex: 1 }}>{t.id}</span>

                  {/*Format badge*/}
                  <Badge
                    bg="false"
                    style={{
                      fontSize: '0.7rem', padding: '3px 8px',
                      background: FORMAT_COLORS[t.format] || FORMAT_COLORS.single,
                    }}
                  >
                    {FORMAT_LABELS[t.format] || 'Single Elim'}
                  </Badge>
                  {t.timeControl && (
                    <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>
                      Time Control: {t.timeControl}
                    </span>
                  )}
                  {t.date && (
                    <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>
                      Date: {t.date}
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    {t.owner === user ? 'by You!♟' : `by ${t.owner}`}
                  </span>
                  <span style={{
                    fontSize: '0.78rem', background: statusColor(t.status),
                    color: '#fff', borderRadius: 20, padding: '2px 12px',
                  }}>
                    {t.status}
                  </span>
                  {t.owner === user && (
                    <span
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          await api.deleteTournament(t.id);
                          setTournaments(await api.getTournaments());
                        } catch (err) { setCreateError(err.message); }
                      }}
                      style={{ color: 'var(--wood-mid)', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      ✕
                    </span>
                  )}
                  <span style={{ opacity: 0.4 }}>›</span>
                </Link>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
