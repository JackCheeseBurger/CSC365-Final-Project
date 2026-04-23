import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionStorage.getItem('username'));

  const login = (username, token) => {
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('token', token);
    setUser(username);
  };

  const logout = () => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
