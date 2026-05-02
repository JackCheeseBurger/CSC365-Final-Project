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
export default ServerCheck;
