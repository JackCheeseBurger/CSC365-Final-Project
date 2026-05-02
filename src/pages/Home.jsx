import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [tournamentCount, setTCount] = useState(0);
  const [playerCount, setPCount] = useState(0);

  useEffect(() => {
    api.getTournaments().then(list => setTCount(list.length)).catch(() => {});
    api.getRoster().then(r => setPCount(r.length)).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1 className="mb-1">Lichess Tournament Manager</h1>
      <p className="text-muted mb-4" style={{ fontFamily: 'inherit', fontSize: '1.05rem' }}>
        Welcome back, <strong>{user}</strong>
      </p>
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} md={4}>
          <div className="stat-box">
            <div className="stat-num">{tournamentCount}</div>
            <div className="stat-label">Tournaments</div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <div className="stat-box">
            <div className="stat-num">{playerCount}</div>
            <div className="stat-label">Saved Players</div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <div className="stat-box">
            <div className="stat-num">♟</div>
            <div className="stat-label">Ready to Play</div>
          </div>
        </Col>
      </Row>
      <Card className="chess-card">
        <Card.Header>Quick Actions</Card.Header>
        <Card.Body className="d-flex gap-3 flex-wrap">
          <Button as={Link} to="/players" className="btn-chess">Manage Players</Button>
          <Button as={Link} to="/tournaments" className="btn-chess">View Tournaments</Button>
        </Card.Body>
      </Card>
    </div>
  );
}
