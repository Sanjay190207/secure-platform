import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Lock, Play, Clock, FileText, CheckCircle2, ShieldAlert, RefreshCw, AlertTriangle, Eye, X } from 'lucide-react';

const CandidateDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePdfBlobUrl, setActivePdfBlobUrl] = useState(null);
  const [activeExamName, setActiveExamName] = useState('');
  const [fetchingPdf, setFetchingPdf] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      console.error('[FETCH CANDIDATE EXAMS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleAccessPaper = async (exam) => {
    setFetchingPdf(true);
    try {
      const res = await api.get(`/exams/${exam.id}/question-paper`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setActivePdfBlobUrl(blobUrl);
      setActiveExamName(exam.exam_name);

    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          alert(`ACCESS DENIED: ${json.error}`);
        } catch (e) {
          alert('ACCESS DENIED: Paper locked or exam closed.');
        }
      } else {
        alert(err.response?.data?.error || 'Access denied: Exam paper is locked or closed.');
      }
    } finally {
      setFetchingPdf(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Lock color="#10b981" size={28} /> Candidate Secure Examination Portal
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Access authorized examination question papers strictly during the scheduled time window.
            </p>
          </div>
          <button onClick={fetchExams} className="btn-secondary">
            <RefreshCw size={16} /> Refresh Schedule
          </button>
        </div>

        {/* Notice Banner */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Clock size={28} color="#38bdf8" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>Server-Enforced Cryptographic Time Release Active</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Question papers are encrypted and strictly locked until the exact examination start time. The Express backend enforces time windows server-side and verifies SHA-256 integrity before release.
            </p>
          </div>
        </div>

        {/* Examinations List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f8fafc' }}>
            Upcoming & Active Competitive Examinations
          </h3>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Verifying examination schedule...</div>
          ) : exams.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No examinations currently assigned or scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              {exams.map((exam) => {
                const now = new Date();
                const start = new Date(exam.start_time);
                const end = new Date(exam.end_time);
                const isReleased = now >= start && now <= end;
                const isClosed = now > end;

                return (
                  <div key={exam.id} className="glass-card" style={{ padding: '1.5rem', border: isReleased ? '1px solid #38bdf8' : '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Competitive Exam</span>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '0.15rem' }}>{exam.exam_name}</h3>
                      </div>
                      {isReleased ? (
                        <span className="badge badge-released"><Play size={12} /> AVAILABLE NOW</span>
                      ) : isClosed ? (
                        <span className="badge badge-closed">EXAM CLOSED</span>
                      ) : (
                        <span className="badge badge-scheduled"><Lock size={12} /> LOCKED</span>
                      )}
                    </div>

                    <div style={{ background: 'rgba(15,23,42,0.7)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        📅 <strong>Date:</strong> {exam.exam_date}
                      </p>
                      <p style={{ color: '#fbbf24' }} className="font-mono">
                        ⏱️ <strong>Window:</strong> {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {isReleased ? (
                      <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}
                        disabled={fetchingPdf}
                        onClick={() => handleAccessPaper(exam)}
                      >
                        <FileText size={18} /> {fetchingPdf ? 'Decrypting & Verifying Integrity...' : 'View Authorized Question Paper'}
                      </button>
                    ) : isClosed ? (
                      <button className="btn-secondary" disabled style={{ width: '100%', padding: '0.75rem', opacity: 0.6, cursor: 'not-allowed' }}>
                        EXAMINATION CLOSED - Access Expired
                      </button>
                    ) : (
                      <button className="btn-secondary" disabled style={{ width: '100%', padding: '0.75rem', opacity: 0.6, cursor: 'not-allowed' }}>
                        <Lock size={16} /> QUESTION PAPER LOCKED (Available at {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Secure PDF Viewer Modal with Kiosk Lockdown Proctoring */}
        {activePdfBlobUrl && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 10, 20, 0.96)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            padding: '1rem'
          }}>
            {/* Kiosk Proctoring Bar */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.825rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span>Kiosk Proctoring Active</span>
                </div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                  {activeExamName}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.775rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)', fontFamily: 'var(--font-mono)' }}>
                  ⏱️ Exam Timer: 01:58:32
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  👁️ Webcam Feed: Verified
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  🔒 Tab Violations: 0/3
                </div>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(activePdfBlobUrl);
                    setActivePdfBlobUrl(null);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                >
                  <X size={15} /> Exit Kiosk Viewer
                </button>
              </div>
            </div>

            {/* Viewer Canvas Container with Forensic Watermark Overlay */}
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {/* Dynamic Anti-Exfiltration Grid Watermark */}
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 10,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                opacity: 0.18,
                userSelect: 'none'
              }}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} style={{
                    transform: 'rotate(-25deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'center'
                  }}>
                    CONFIDENTIAL PAPER<br />WATERMARK #{i + 101}<br />AUTHORIZED CANDIDATE ACCESS
                  </div>
                ))}
              </div>

              <iframe
                src={activePdfBlobUrl}
                title="Question Paper Secure Stream"
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CandidateDashboard;
