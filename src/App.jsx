import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Private from './components/PrivateRoute';
import ServerCheck from './components/ServerCheck';
import AppNav from './components/Nav';
import Login from './pages/Login';
import Home from './pages/Home';
import Players from './pages/Players';
import Tournaments from './pages/Tournaments';
import Tournament from './pages/Tournament';
import About from './pages/About';
import NotFound from './pages/NotFound';
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
