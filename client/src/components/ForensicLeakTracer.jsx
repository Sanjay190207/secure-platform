import React, { useState } from 'react';
import api from '../services/api';
import { ShieldAlert, Search, AlertOctagon, CheckCircle2, FileSearch, UserCheck, MapPin, Monitor, Clock, X, RefreshCw } from 'lucide-react';

const ForensicLeakTracer = ({ onClose }) => {
  const [sampleCode, setSampleCode] = useState('LEAK_SAMPLE_IMG_9941');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    setScanning(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.post('/papers/trace-leak', { sampleCode });
      if (res.data.success) {
        setResult(res.data.forensicResult);
      }
    } catch (err) {
      setError('Failed to extract steganographic watermark signature.');
    } finally {
      setScanning(false);
    }
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
      <div className="glass-panel" style={{ maxWidth: '750px', width: '100%', padding: '2rem', border: '1px solid rgba(244, 63, 94, 0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ShieldAlert size={18} color="#f43f5e" />
              <span>Digital Steganography Forensic Leak Tracer</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
              Paper Leak Origin Attribution Engine
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Input Sandbox */}
        <form onSubmit={handleScan} style={{ marginBottom: '1.5rem', background: 'rgba(15,23,42,0.8)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
            Enter Leaked Snapshot Signature / Sample Hash Code:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              required
              className="input-field"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              placeholder="e.g. IMG_LEAK_SNAPSHOT_0821"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={scanning} className="btn-primary" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', flexShrink: 0 }}>
              {scanning ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
              <span>{scanning ? 'Extracting Stego Payload...' : 'Scan Steganography'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Match Banner */}
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.5)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertOctagon size={36} color="#f43f5e" style={{ flexShrink: 0 }} />
              <div>
                <span className="badge badge-compromised" style={{ marginBottom: '0.25rem' }}>Forensic Match Confirmed</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{result.matchConfidence}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.attributionReport}</p>
              </div>
            </div>

            {/* Suspect Attribution Grid */}
            <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="#f43f5e" /> Leaker Identification Profile
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUSPECT USER NAME & EMAIL</p>
                  <p style={{ fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{result.suspectDetails.userName}</p>
                  <p style={{ fontSize: '0.775rem', color: '#38bdf8' }}>{result.suspectDetails.email}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROLE PRIVILEGE & USER ID</p>
                  <p style={{ fontWeight: 700, color: '#a855f7', marginTop: '0.2rem' }}>{result.suspectDetails.role}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="font-mono">{result.suspectDetails.userId}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP ADDRESS & NETWORK NODE</p>
                  <p style={{ fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }} className="font-mono">{result.suspectDetails.ipAddress}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WATERMARK EMBED TIMESTAMP</p>
                  <p style={{ fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>{result.suspectDetails.timestamp}</p>
                </div>
              </div>

              <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEVICE & WEBGL CANVAS FINGERPRINT</p>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }} className="font-mono">{result.suspectDetails.deviceFingerprint}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={onClose}>Close Investigation</button>
              <button className="btn-danger" onClick={() => alert(`✓ Incident Report Filed for user ${result.suspectDetails.userName}.\nAccount administratively locked and audit record logged.`)}>
                <ShieldAlert size={16} /> File Security Incident & Lock User
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForensicLeakTracer;
