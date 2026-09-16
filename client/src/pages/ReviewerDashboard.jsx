import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { CheckSquare, ShieldCheck, AlertOctagon, ThumbsUp, ThumbsDown, MessageSquare, FileText, RefreshCw, Lock, Sparkles, Key, Fingerprint } from 'lucide-react';
import AIQuestionAnalyzer from '../components/AIQuestionAnalyzer';
import CryptoPipelineVisualizer from '../components/CryptoPipelineVisualizer';
import BiometricStepUpModal from '../components/BiometricStepUpModal';

const ReviewerDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [aiPaper, setAiPaper] = useState(null);
  const [showCryptoVisualizer, setShowCryptoVisualizer] = useState(false);
  const [stepUpAction, setStepUpAction] = useState(null); // 'APPROVE' or 'REJECT'
  const [comments, setComments] = useState('Verified and approved by Chief Reviewer. Syllabus and security standards met.');
  const [submitting, setSubmitting] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/papers');
      if (res.data.success) {
        setPapers(res.data.papers);
      }
    } catch (err) {
      console.error('[FETCH REVIEWER PAPERS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const pendingCount = papers.filter(p => ['SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length;
  const approvedCount = papers.filter(p => p.status === 'APPROVED').length;
  const rejectedCount = papers.filter(p => p.status === 'REJECTED').length;

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckSquare color="#a855f7" size={28} /> Chief Reviewer Portal & Quality Audit
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Review confidential question papers, verify cryptographic file hashes, inspect content integrity, and record approval decisions.
            </p>
          </div>
          <button onClick={fetchPapers} className="btn-secondary">
            <RefreshCw size={16} /> Refresh Queue
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a855f7', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
              <CheckSquare size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{pendingCount}</p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Papers</span>
              <ThumbsUp size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{approvedCount}</p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f43f5e', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejected Papers</span>
              <ThumbsDown size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{rejectedCount}</p>
          </div>
        </div>

        {/* Papers Queue Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f8fafc' }}>
            Review Queue & Approval Pipeline
          </h3>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading review queue...</div>
          ) : papers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <ShieldCheck size={42} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No papers pending review in queue.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Paper ID & Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Exam Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Setter</th>
                    <th style={{ padding: '0.75rem 1rem' }}>SHA-256 Hash</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: 600, color: '#fff' }}>{p.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="font-mono">{p.id.slice(0, 18)}...</p>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{p.exam_name}</td>
                      <td style={{ padding: '1rem', color: '#38bdf8' }}>{p.setter_name || 'Question Setter'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.725rem', background: 'rgba(15,23,42,0.9)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: '#38bdf8' }}>
                          {p.file_hash ? `${p.file_hash.slice(0, 16)}...` : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge badge-${p.status ? p.status.toLowerCase() : 'draft'}`}>{p.status}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderColor: '#38bdf8', color: '#38bdf8' }}
                          onClick={() => setAiPaper(p)}
                        >
                          <Sparkles size={14} color="#38bdf8" /> AI Rigor
                        </button>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
                          onClick={() => setSelectedPaper(p)}
                        >
                          <CheckSquare size={14} /> Review & Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Paper Review (Phase 5 full implementation preview) */}
        {selectedPaper && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 10, 20, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '2rem', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span className="badge badge-under_review" style={{ marginBottom: '0.5rem' }}>Review Mode</span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{selectedPaper.title}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exam: {selectedPaper.exam_name}</p>
                </div>
                <button onClick={() => setSelectedPaper(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <div style={{ background: 'rgba(15,23,42,0.8)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} color={selectedPaper.status === 'COMPROMISED' ? '#f43f5e' : '#10b981'} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedPaper.status === 'COMPROMISED' ? '#f43f5e' : '#10b981' }}>
                      Cryptographic Status: {selectedPaper.status === 'COMPROMISED' ? '⚠ TAMPERING DETECTED' : '✓ VERIFIED (AES-256)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: '#a855f7', color: '#a855f7' }}
                      onClick={() => setShowCryptoVisualizer(true)}
                    >
                      <Key size={13} color="#a855f7" /> Visual Pipeline
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: '#38bdf8', color: '#38bdf8' }}
                      onClick={async () => {
                        try {
                          const res = await api.get(`/papers/${selectedPaper.id}/verify`);
                          if (res.data.success) {
                            alert(`✓ INTEGRITY VERIFIED!\n\nSHA-256 Hash Match Confirmed:\n${res.data.storedHash}`);
                          } else {
                            alert(`⚠ CRITICAL ALERT: ${res.data.alert}\n\nPaper marked as COMPROMISED! Release blocked.`);
                            fetchPapers();
                            setSelectedPaper(null);
                          }
                        } catch (err) {
                          alert('Verification check failed');
                        }
                      }}
                    >
                      Run Integrity Check
                    </button>
                    <button
                      className="btn-danger"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={async () => {
                        if (confirm(`Simulate unauthorized file tampering on "${selectedPaper.title}"?`)) {
                          await api.post(`/papers/${selectedPaper.id}/simulate-tamper`);
                          alert('File tampered in vault! Now click "Run Integrity Check" to trigger the tamper alert.');
                        }
                      }}
                    >
                      Simulate Tampering
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }} className="font-mono">
                  Stored SHA-256: {selectedPaper.file_hash}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Reviewer Comments & Feedback
                </label>
                <textarea
                  rows="3"
                  className="input-field"
                  placeholder="Add evaluation comments for question setter..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn-danger"
                  style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                  disabled={submitting}
                  onClick={() => setStepUpAction('REJECT')}
                >
                  <ThumbsDown size={16} /> Reject Paper
                </button>

                <button
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  disabled={submitting}
                  onClick={() => setStepUpAction('APPROVE')}
                >
                  <ThumbsUp size={16} /> Approve Paper (Biometric Step-Up)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Inspector Modal */}
        {aiPaper && (
          <AIQuestionAnalyzer
            paperId={aiPaper.id}
            paperTitle={aiPaper.title}
            onClose={() => setAiPaper(null)}
          />
        )}

        {/* Crypto Pipeline Visualizer Modal */}
        {showCryptoVisualizer && selectedPaper && (
          <CryptoPipelineVisualizer
            paperTitle={selectedPaper.title}
            fileHash={selectedPaper.file_hash}
            storagePath={selectedPaper.storage_object}
            onClose={() => setShowCryptoVisualizer(false)}
          />
        )}

        {/* Biometric Step-Up Modal */}
        {stepUpAction && selectedPaper && (
          <BiometricStepUpModal
            title={stepUpAction === 'APPROVE' ? 'Approve Question Paper' : 'Reject Question Paper'}
            actionLabel={`${stepUpAction === 'APPROVE' ? 'Approval' : 'Rejection'} of "${selectedPaper.title}"`}
            onClose={() => setStepUpAction(null)}
            onConfirm={async () => {
              const action = stepUpAction;
              setStepUpAction(null);
              setSubmitting(true);
              try {
                const endpoint = action === 'APPROVE' ? `/papers/${selectedPaper.id}/approve` : `/papers/${selectedPaper.id}/reject`;
                const res = await api.post(endpoint, { comments });
                if (res.data.success) {
                  alert(`✓ Action (${action}) Successful!\n\n${res.data.message}`);
                  setSelectedPaper(null);
                  fetchPapers();
                }
              } catch (err) {
                alert(err.response?.data?.error || `Failed to ${action.toLowerCase()} paper`);
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}

      </div>
    </div>
  );
};

export default ReviewerDashboard;
