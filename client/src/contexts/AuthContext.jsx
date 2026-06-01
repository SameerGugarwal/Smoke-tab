import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if token exists and restore session
  useEffect(() => {
    const token = localStorage.getItem('smoketab_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          connectSocket();
        })
        .catch(() => {
          // Token invalid/expired — clear it
          localStorage.removeItem('smoketab_token');
        })
        .finally(() => setTimeout(() => setLoading(false), 0));
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, []);

  // Step 1: Login with Phone and DOB
  // Returns { token, user, isNewUser: false } or { isNewUser: true }
  const login = async (phone, dob) => {
    const res = await api.post('/auth/login', { phone, dob });
    const data = res.data;

    if (!data.isNewUser) {
      // Returning user — save token and set user
      localStorage.setItem('smoketab_token', data.token);
      setUser(data.user);
      connectSocket();
    }

    return data;
  };

  // Step 2: Register new user
  const registerUser = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const data = res.data;
    localStorage.setItem('smoketab_token', data.token);
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const signOut = () => {
    localStorage.removeItem('smoketab_token');
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
