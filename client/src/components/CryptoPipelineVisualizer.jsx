import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, Cpu, Database, CheckCircle2, ArrowRight, Play, RefreshCw, X } from 'lucide-react';

const CryptoPipelineVisualizer = ({ paperTitle, fileHash, storagePath, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);

  const steps = [
    { title: '1. SHA-256 Digest Generation', desc: `Computing immutable Merkle hash digest on raw PDF stream: ${fileHash ? fileHash.slice(0, 24) : 'e3b0c44298fc1c149afbf4c8996fb924'}...`, icon: Cpu, color: '#38bdf8' },
    { title: '2. PBKDF2 / GCP KMS Key Derivation', desc: 'Deriving 256-bit AES master key with 100,000 rounds PBKDF2 & GCP KMS HSM wrapping key.', icon: Key, color: '#a855f7' },
    { title: '3. Salt & IV IV Generation', desc: 'Generating 32-byte cryptographically secure Salt and 16-byte random IV vector.', icon: Lock, color: '#f59e0b' },
    { title: '4. AES-256-GCM Authenticated Cipher', desc: 'Encrypting payload with Galois/Counter Mode & computing 16-byte GCM Authentication Tag for tamper detection.', icon: ShieldCheck, color: '#10b981' },
    { title: '5. Storage Vault Packing', desc: `Packing [SALT][IV][AUTH_TAG][CIPHERTEXT] into cold storage: ${storagePath || 'papers/vault_object.enc'}`, icon: Database, color: '#34d399' }
  ];

  const handleSimulate = () => {
    setRunning(true);
    setActiveStep(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setActiveStep(current);
      } else {
        clearInterval(interval);
        setRunning(false);
      }
    }, 800);
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
      <div className="glass-panel" style={{ maxWidth: '780px', width: '100%', padding: '2rem', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Key size={18} color="#a855f7" />
              <span>Zero-Trust Cryptographic Pipeline Visualizer</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
              AES-256-GCM Envelope Encryption Engine
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Document: <strong>{paperTitle || 'Confidential Question Paper'}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Steps Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx <= activeStep;
            const isCurrent = idx === activeStep && running;

            return (
              <div
                key={idx}
                style={{
                  background: isDone ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.4)',
                  border: isCurrent ? `1px solid ${s.color}` : isDone ? '1px solid var(--border-color)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? `0 0 15px ${s.color}40` : 'none'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: isDone ? `rgba(${s.color === '#38bdf8' ? '56,189,248' : s.color === '#a855f7' ? '168,85,247' : s.color === '#f59e0b' ? '245,158,11' : '16,185,129'}, 0.2)` : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} color={isDone ? s.color : 'var(--text-muted)'} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: isDone ? '#fff' : 'var(--text-muted)' }}>{s.title}</h4>
                    {isDone && <CheckCircle2 size={16} color="#10b981" />}
                  </div>
                  <p style={{ fontSize: '0.775rem', color: isDone ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: '0.15rem' }} className="font-mono">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleSimulate}
            disabled={running}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
          >
            {running ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
            <span>{running ? 'Executing Pipeline Steps...' : 'Re-Run Encryption Pipeline Simulation'}</span>
          </button>

          <button className="btn-secondary" onClick={onClose}>Close Visualizer</button>
        </div>

      </div>
    </div>
  );
};

export default CryptoPipelineVisualizer;
