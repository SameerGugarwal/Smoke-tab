import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

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
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Step 1: Send OTP to phone number
  const sendOtp = async (phone) => {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  };

  // Step 2: Verify OTP
  // Returns { token, user, isNewUser } or { registrationToken, isNewUser }
  const verifyOtp = async ({ phone, otp }) => {
    const res = await api.post('/auth/verify-otp', { phone, otp });
    const data = res.data;

    if (!data.isNewUser) {
      // Returning user — save token and set user
      localStorage.setItem('smoketab_token', data.token);
      setUser(data.user);
      connectSocket();
    }

    return data;
  };

  // Step 3: Register new user (after OTP verified)
  const registerUser = async ({ registrationToken, name, role }) => {
    const res = await api.post('/auth/register',
      { name, role },
      { headers: { Authorization: `Bearer ${registrationToken}` } }
    );
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
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, registerUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
