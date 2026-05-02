import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <Navbar className="chess-nav" expand="md">
      <Container fluid>
        <Navbar.Brand href="/">♟ Lichess Tournament Manager</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" style={{ borderColor: 'rgba(245,230,211,0.4)' }} />
        <Navbar.Collapse id="main-nav">
          {user ? (
            <>
              <Nav className="me-auto gap-1">
                <Nav.Link as={NavLink} to="/">Home</Nav.Link>
                <Nav.Link as={NavLink} to="/players">Players</Nav.Link>
                <Nav.Link as={NavLink} to="/tournaments">Tournaments</Nav.Link>
                <Nav.Link as={NavLink} to="/about">About</Nav.Link>
              </Nav>
              <Nav className="ms-auto align-items-center gap-2">
                <span style={{ color: 'rgba(245,230,211,0.7)', fontSize: '0.85rem' }}>
                  {user}
                </span>
                <Button
                  size="sm"
                  className="btn-chess-outline btn"
                  style={{ color: 'var(--cream)', borderColor: 'rgba(245,230,211,0.4)' }}
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/login">Sign In</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
