import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, KeyRound, AlertTriangle, UserCheck, User, UserPlus, LogIn, FileText, CheckCircle, Clock, GraduationCap, Sparkles } from 'lucide-react';

const demoAccounts = [
  { role: 'SETTER', label: 'Question Setter', email: 'setter@secure.exam', pass: 'SetterPassword123!', color: '#38bdf8', icon: '📝' },
  { role: 'REVIEWER', label: 'Reviewer', email: 'reviewer@secure.exam', pass: 'ReviewerPassword123!', color: '#a855f7', icon: '🔍' },
  { role: 'CONTROLLER', label: 'Exam Controller', email: 'controller@secure.exam', pass: 'ControllerPassword123!', color: '#f59e0b', icon: '⏱️' },
  { role: 'CANDIDATE', label: 'Candidate', email: 'candidate@secure.exam', pass: 'CandidatePassword123!', color: '#10b981', icon: '🎓' },
  { role: 'ADMIN', label: 'System Admin', email: 'admin@secure.exam', pass: 'AdminPassword123!', color: '#f43f5e', icon: '🛡️' }
];

const roleOptions = [
  { role: 'CANDIDATE', label: 'Candidate', color: '#10b981', icon: '🎓', desc: 'Examinee viewing released papers & portal' },
  { role: 'SETTER', label: 'Question Setter', color: '#38bdf8', icon: '📝', desc: 'Upload & manage exam question papers' },
  { role: 'REVIEWER', label: 'Reviewer', color: '#a855f7', icon: '🔍', desc: 'Review, approve, or reject draft papers' },
  { role: 'CONTROLLER', label: 'Exam Controller', color: '#f59e0b', icon: '⏱️', desc: 'Schedule exams & enforce key releases' },
  { role: 'ADMIN', label: 'System Admin', color: '#f43f5e', icon: '🛡️', desc: 'System management, users & security audit' }
];

const LoginPage = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [email, setEmail] = useState('setter@secure.exam');
  const [password, setPassword] = useState('SetterPassword123!');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('CANDIDATE');
  const [localError, setLocalError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setLocalError(null);
    if (setError) setError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result && result.success) {
      const targetRole = result.user.role.toLowerCase();
      navigate(`/${targetRole}/dashboard`);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (regPassword !== regConfirmPassword) {
      setLocalError('Passwords do not match. Please verify your passwords.');
      return;
    }

    if (regPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(regName, regEmail, regPassword, regRole);
    setIsSubmitting(false);

    if (result && result.success) {
      const targetRole = result.user.role.toLowerCase();
      navigate(`/${targetRole}/dashboard`);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    if (setError) setError(null);
    setLocalError(null);
  };

  const activeError = localError || error;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1050px', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
        
        {/* Left Side: Clean Application Overview & Key Features */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px', marginBottom: '1.25rem' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
              EXAMINATION MANAGEMENT PORTAL
            </span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', color: '#ffffff' }}>
            Competitive Examination <br />
            <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Question Paper Vault
            </span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Unified cloud platform for setting, reviewing, scheduling, and conducting competitive examinations with role-based access control.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#38bdf8' }}>
                <FileText size={18} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Paper Authoring</h4>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Streamlined draft creation and submission for question setters.</p>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#a855f7' }}>
                <CheckCircle size={18} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Review & Approval</h4>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Thorough evaluation and approval workflows for reviewers.</p>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#f59e0b' }}>
                <Clock size={18} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Exam Schedule Control</h4>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Precise scheduling and paper release management for controllers.</p>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#10b981' }}>
                <GraduationCap size={18} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Candidate Access</h4>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Direct access to authorized examination papers and schedules.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card with Login / Register Navigation */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* Tab Navigation Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              style={{
                background: authMode === 'login' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.6rem',
                borderRadius: '7px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('register')}
              style={{
                background: authMode === 'register' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
                color: authMode === 'register' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.6rem',
                borderRadius: '7px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.6rem auto'
            }}>
              {authMode === 'login' ? (
                <Lock size={24} color="#38bdf8" />
              ) : (
                <UserPlus size={24} color="#38bdf8" />
              )}
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
              {authMode === 'login' ? 'Portal Authentication' : 'Create Vault Account'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {authMode === 'login'
                ? 'Enter credentials or click a role shortcut below'
                : 'Register a new user account to access the vault system'}
            </p>
          </div>

          {activeError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}>
              <AlertTriangle size={18} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.825rem', color: '#fb7185', lineHeight: 1.4 }}>{activeError}</p>
            </div>
          )}

          {/* SIGN IN FORM VIEW */}
          {authMode === 'login' ? (
            <>
              {/* Quick Demo Role Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                  Quick Demo Role Switcher
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      style={{
                        background: email === acc.email ? `${acc.color}25` : 'rgba(30, 41, 59, 0.6)',
                        border: `1px solid ${email === acc.email ? acc.color : 'rgba(51, 65, 85, 0.6)'}`,
                        color: email === acc.email ? acc.color : 'var(--text-secondary)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{acc.icon}</span> {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    System User Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="name@secure.exam"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <UserCheck size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Account Secret Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••••••"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }}
                >
                  {isSubmitting ? (
                    <span>Verifying Credentials & Session...</span>
                  ) : (
                    <>
                      <Shield size={18} /> Authenticate & Access Vault
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('register')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Register here
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* REGISTER FORM VIEW */
            <>
              <form onSubmit={handleRegisterSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Dr. Alex Morgan"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="input-field"
                      placeholder="user@secure.exam"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <UserCheck size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Assign System Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer', appearance: 'auto' }}
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.role} value={opt.role} style={{ background: '#0f172a', color: '#f8fafc' }}>
                        {opt.icon} {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        style={{ paddingLeft: '2.3rem' }}
                      />
                      <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        style={{ paddingLeft: '2.3rem' }}
                      />
                      <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }}
                >
                  {isSubmitting ? (
                    <span>Creating Security Account...</span>
                  ) : (
                    <>
                      <UserPlus size={18} /> Complete Registration & Sign In
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
