import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, FileText, CheckSquare, Clock, UserCheck, Zap } from 'lucide-react';

const roles = [
  { id: 'ADMIN', label: 'SIEM Admin', icon: Shield, color: '#f43f5e', path: '/admin/dashboard' },
  { id: 'SETTER', label: 'Paper Setter', icon: FileText, color: '#38bdf8', path: '/setter/dashboard' },
  { id: 'REVIEWER', label: 'Chief Reviewer', icon: CheckSquare, color: '#a855f7', path: '/reviewer/dashboard' },
  { id: 'CONTROLLER', label: 'Exam Controller', icon: Clock, color: '#f59e0b', path: '/controller/dashboard' },
  { id: 'CANDIDATE', label: 'Candidate', icon: UserCheck, color: '#10b981', path: '/candidate/dashboard' }
];

const RoleSwitcherBar = () => {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleRoleSelect = async (roleId, targetPath) => {
    if (user.role === roleId) {
      navigate(targetPath);
      return;
    }
    const res = await switchDemoRole(roleId);
    if (res?.success) {
      navigate(targetPath);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #090d16 0%, #0f172a 50%, #090d16 100%)',
      borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
      padding: '0.4rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      fontSize: '0.775rem',
      zIndex: 9999,
      position: 'sticky',
      top: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <Zap size={15} color="#38bdf8" />
        <span>Viva Sandbox Role Switcher:</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = user?.role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleRoleSelect(r.id, r.path)}
              style={{
                background: isActive ? `rgba(${r.color === '#f43f5e' ? '244,63,94' : r.color === '#38bdf8' ? '56,189,248' : r.color === '#a855f7' ? '168,85,247' : r.color === '#f59e0b' ? '245,158,11' : '16,185,129'}, 0.2)` : 'rgba(30, 41, 59, 0.6)',
                border: isActive ? `1px solid ${r.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? r.color : 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '0.25rem 0.6rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.75rem',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 10px ${r.color}40` : 'none'
              }}
            >
              <Icon size={13} color={isActive ? r.color : 'var(--text-muted)'} />
              <span>{r.label}</span>
              {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.color, display: 'inline-block' }} />}
            </button>
          );
        })}
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', fontFamily: 'var(--font-mono)' }}>
        Active User: <strong style={{ color: '#fff' }}>{user.name}</strong> ({user.role})
      </div>
    </div>
  );
};

export default RoleSwitcherBar;
