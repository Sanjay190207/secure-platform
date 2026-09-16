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

      if (token.startsWith('demo-jwt-token-')) {
        const savedUser = localStorage.getItem('secure_exam_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('secure_exam_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('[AUTH CHECK FAILED]', err);
        logout();
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
    const demoUsers = {
      'ADMIN': { id: 'demo-admin-id', name: 'System Admin', email: 'admin@secure.exam', role: 'ADMIN', status: 'ACTIVE' },
      'SETTER': { id: 'demo-setter-id', name: 'Dr. Sarah Jenkins (Question Setter)', email: 'setter@secure.exam', role: 'SETTER', status: 'ACTIVE' },
      'REVIEWER': { id: 'demo-reviewer-id', name: 'Prof. Robert Chen (Chief Reviewer)', email: 'reviewer@secure.exam', role: 'REVIEWER', status: 'ACTIVE' },
      'CONTROLLER': { id: 'demo-controller-id', name: 'Exam Controller Marcus Vance', email: 'controller@secure.exam', role: 'CONTROLLER', status: 'ACTIVE' },
      'CANDIDATE': { id: 'demo-candidate-id', name: 'Candidate Alex Turner', email: 'candidate@secure.exam', role: 'CANDIDATE', status: 'ACTIVE' }
    };

    const userData = demoUsers[targetRole] || demoUsers['ADMIN'];
    const fakeToken = 'demo-jwt-token-' + targetRole.toLowerCase();

    localStorage.setItem('secure_exam_token', fakeToken);
    localStorage.setItem('secure_exam_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, switchDemoRole, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
