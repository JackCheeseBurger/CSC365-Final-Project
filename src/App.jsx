import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNav from './components/nav';
import Login from './pages/Login';
import Home from './pages/home';
import Players from './pages/Players';
import Tournaments from './pages/tournaments';
import Tournament from './pages/tournament';
import About from './pages/about';
import NotFound from './pages/NotFound';

function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
import { useEffect, useState } from 'react';

function ServerCheck({ children }) {
  const [online, setOnline] = useState(null);

useEffect(() => {
  fetch('/api/activity')
    .then(res => res.text())
    .then(text => {
      try {
        JSON.parse(text);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    })
    .catch(() => setOnline(false));
}, []);

  if (!online) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 12,
    }}>
      <div style={{ fontSize: '3rem' }}>♟</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif" }}>Server Offline</h2>
      <p style={{ color: '#666' }}>The backend isn't running. Start it with <code>npm run start</code>.</p>
    </div>
  );
  return children;
}
function App() {
  return (
    <AuthProvider>
      <ServerCheck>
      <Router>
        <AppNav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Private><Home /></Private>} />
          <Route path="/players" element={<Private><Players /></Private>} />
          <Route path="/tournaments" element={<Private><Tournaments /></Private>} />
          <Route path="/tournament/:id" element={<Tournament />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </ServerCheck>
    </AuthProvider>
  );
}
export default App;
