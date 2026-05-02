import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Nav } from 'react-bootstrap';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!username || !password) { setError('Please fill in both fields'); return; }
    setLoading(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await api.login(username, password)
        : await api.register(username, password);
      login(data.username, data.token);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <h1 className="mb-4">♟ Lichess Tournament Manager</h1>
      <Card className="chess-card" style={{ width: '100%', maxWidth: 400 }}>
        <Card.Header style={{ padding: 0 }}>
          <Nav className="d-flex w-100">
            <Nav.Item>
              <Nav.Link
                active={mode === 'login'}
                onClick={() => { setMode('login'); setError(''); }}
                style={mode === 'login'
                  ? {
                      background: 'var(--wood-mid)',
                      color: 'var(--cream)',
                      borderColor: 'transparent'
                    }
                  : {
                      color: 'rgba( var(--wood-mid-rgb), 0.7 )'
                    }}
              >
                Sign In
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={mode === 'register'}
                onClick={() => { setMode('register'); setError(''); }}
                style={mode === 'register'
                  ? {
                      background: 'var(--wood-mid)',
                      color: 'var(--cream)',
                      borderColor: 'transparent'
                    }
                  : {
                      color: 'rgba( var(--wood-mid-rgb), 0.7 )'
                    }}
                              >
                Register
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          <Form.Control
            className="chess-input mb-2"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <Form.Control
            className="chess-input mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          {error && <Alert variant="warning" className="mb-3 py-2">{error}</Alert>}
          <Button className="btn-chess w-100" onClick={submit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
