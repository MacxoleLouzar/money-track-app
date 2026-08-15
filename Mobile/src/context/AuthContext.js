import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(['user', 'token']).then(([[, u], [, t]]) => {
      if (u) setUser(JSON.parse(u));
      if (t) setToken(t);
      setReady(true);
    });
  }, []);

  const login = async (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    await AsyncStorage.multiSet([['user', JSON.stringify(userData)], ['token', jwt]]);
  };

  const logout = async () => {
    setUser(null);
    setToken('');
    await AsyncStorage.multiRemove(['user', 'token']);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
