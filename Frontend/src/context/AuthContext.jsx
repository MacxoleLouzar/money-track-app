import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  /**
   * Wrapper around fetch that auto-logs out on 401 Invalid token.
   * Use this instead of raw fetch for all authenticated requests.
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, options);
    if (res.status === 401) {
      const data = await res.clone().json().catch(() => ({}));
      if (data.message === 'Invalid token' || data.message === 'No token') {
        logout();
        window.location.href = window.location.origin + (import.meta.env.BASE_URL || '/') + 'signin';
        return res;
      }
    }
    return res;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
