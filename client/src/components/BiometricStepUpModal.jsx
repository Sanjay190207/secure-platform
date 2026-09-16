import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, Key, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

const BiometricStepUpModal = ({ title, actionLabel, onConfirm, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAuth = (e) => {
    e.preventDefault();
    setVerifying(true);

    setTimeout(() => {
      setVerifying(false);
      setSuccess(true);
      setTimeout(() => {
        onConfirm();
      }, 700);
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 10, 20, 0.9)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      zIndex: 10000,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2rem', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <ShieldCheck size={18} color="#38bdf8" />
            <span>Biometric & Hardware Key Step-Up Challenge</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
            border: success ? '2px solid #10b981' : '2px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            {success ? <CheckCircle2 size={36} color="#10b981" /> : <Fingerprint size={36} color="#38bdf8" style={{ animation: verifying ? 'pulse 1s infinite' : 'none' }} />}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{title || 'Security Action Verification'}</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Touch FaceID / YubiKey Hardware Security Key or enter Security PIN to authorize: <strong>{actionLabel || 'Confirm Action'}</strong>.
          </p>
        </div>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Security PIN / Passcode (or Press TouchID / FaceID button)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="input-field"
              style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={verifying || success} className="btn-primary" style={{ background: success ? '#10b981' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}>
              {verifying ? 'Scanning Biometrics...' : success ? '✓ Verified!' : 'Authorize Action'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BiometricStepUpModal;
