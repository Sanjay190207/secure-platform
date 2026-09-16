import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User, Lock, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return '#f43f5e';
      case 'SETTER': return '#38bdf8';
      case 'REVIEWER': return '#a855f7';
      case 'CONTROLLER': return '#f59e0b';
      case 'CANDIDATE': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <nav style={{
      background: 'rgba(6, 9, 19, 0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 2rem',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo & Security Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            padding: '0.55rem',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Lock size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#fff' }}>
                EXAM<span style={{ color: '#38bdf8' }}>VAULT</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.15rem 0.5rem',
                borderRadius: '20px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
              }}>
                <Activity size={10} /> ZERO-TRUST ENFORCED
              </span>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Cloud Examination & Question Security System
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.4rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${getRoleColor(user.role)}25`,
                border: `1px solid ${getRoleColor(user.role)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={16} color={getRoleColor(user.role)} />
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>{user.name}</p>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{user.email}</p>
              </div>

              <span style={{
                background: `${getRoleColor(user.role)}25`,
                color: getRoleColor(user.role),
                border: `1px solid ${getRoleColor(user.role)}60`,
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.675rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: `0 0 10px ${getRoleColor(user.role)}30`
              }}>
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              title="Secure Logout"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
