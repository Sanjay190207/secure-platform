import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('secure_exam_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('secure_exam_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('secure_exam_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('[AUTH CHECK FAILED]', err);
        // Do not clear session on network glitch, only if 401
        if (err.response && err.response.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('secure_exam_token', token);
        localStorage.setItem('secure_exam_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication server connection failed.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (name, email, password, role) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('secure_exam_token', token);
        localStorage.setItem('secure_exam_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Account registration failed.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('secure_exam_token');
    localStorage.removeItem('secure_exam_user');
    setUser(null);
  };

  const switchDemoRole = async (targetRole) => {
    try {
      const res = await api.post('/auth/demo-switch', { role: targetRole });
      if (res.data && res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('secure_exam_token', token);
        localStorage.setItem('secure_exam_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (err) {
      console.warn('[DEMO ROLE SWITCH API FAILED - USING LOCAL FALLBACK]', err);
    }

    // Resilient local fallback so demo role switching never fails or redirects to login
    const defaultDemoUsers = {
      'SETTER': { id: 'u-setter-1', name: 'Dr. Sarah Jenkins (Question Setter)', email: 'setter@secure.exam', role: 'SETTER' },
      'REVIEWER': { id: 'u-reviewer-1', name: 'Prof. Robert Chen (Chief Reviewer)', email: 'reviewer@secure.exam', role: 'REVIEWER' },
      'CONTROLLER': { id: 'u-controller-1', name: 'Exam Controller Marcus Vance', email: 'controller@secure.exam', role: 'CONTROLLER' },
      'CANDIDATE': { id: 'u-candidate-1', name: 'Candidate Alex Turner', email: 'candidate@secure.exam', role: 'CANDIDATE' },
      'ADMIN': { id: 'u-admin-1', name: 'System Admin', email: 'admin@secure.exam', role: 'ADMIN' }
    };
    const fallbackUser = defaultDemoUsers[targetRole];
    if (fallbackUser) {
      setUser(fallbackUser);
      localStorage.setItem('secure_exam_user', JSON.stringify(fallbackUser));
      return { success: true, user: fallbackUser };
    }
    return { success: false, error: 'Role switch failed' };
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, switchDemoRole, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
