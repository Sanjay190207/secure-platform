import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FileUp, FileText, CheckCircle, Clock, ShieldCheck, AlertCircle, RefreshCw, Eye, UploadCloud, X, CheckCircle2, Sparkles } from 'lucide-react';
import AIQuestionAnalyzer from '../components/AIQuestionAnalyzer';

const SetterDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [examName, setExamName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const [aiPaper, setAiPaper] = useState(null);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/papers');
      if (res.data.success) {
        setPapers(res.data.papers);
      }
    } catch (err) {
      console.error('[FETCH PAPERS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setUploadError(null);

    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
        setUploadError('Only PDF format documents (.pdf) are allowed.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds maximum allowed 10MB limit.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a PDF document file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('exam_name', examName);
    formData.append('paperFile', file);

    try {
      const res = await api.post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUploadSuccess('Question paper uploaded & submitted for reviewer approval!');
        setTitle('');
        setExamName('');
        setFile(null);
        fetchPapers();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(null);
        }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to upload paper PDF.';
      setUploadError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : 'draft';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileText color="#38bdf8" size={28} /> Question Setter Vault Console
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Upload confidential examination question papers, generate SHA-256 hashes, and submit for chief reviewer approval.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchPapers} className="btn-secondary" style={{ padding: '0.65rem' }}>
              <RefreshCw size={16} />
            </button>
            <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
              <FileUp size={18} /> Upload Question Paper PDF
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Submissions</span>
              <FileText size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{papers.length}</p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a855f7', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
              <Clock size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {papers.filter(p => ['SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length}
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Papers</span>
              <CheckCircle size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {papers.filter(p => ['APPROVED', 'SCHEDULED', 'RELEASED'].includes(p.status)).length}
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Encrypted & Verified</span>
              <ShieldCheck size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {papers.length}
            </p>
          </div>
        </div>

        {/* Question Papers Directory Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f8fafc' }}>
            My Question Paper Directory
          </h3>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading paper records...</div>
          ) : papers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <FileText size={42} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No question papers uploaded yet.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.25rem' }}>Click "Upload Question Paper PDF" above to submit a paper for review.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Paper Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Target Examination</th>
                    <th style={{ padding: '0.75rem 1rem' }}>SHA-256 Hash</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Uploaded Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
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
                      <td style={{ padding: '1rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.725rem', background: 'rgba(15,23,42,0.9)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: '#38bdf8' }}>
                          {p.file_hash ? `${p.file_hash.slice(0, 16)}...` : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{getStatusBadge(p.status)}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderColor: '#38bdf8', color: '#38bdf8' }} onClick={() => setAiPaper(p)}>
                          <Sparkles size={14} color="#38bdf8" /> AI Inspector
                        </button>
                        <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => alert(`Paper ID: ${p.id}\nTitle: ${p.title}\nHash: ${p.file_hash}`)}>
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PDF Upload Modal */}
        {showUploadModal && (
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
            <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UploadCloud size={22} color="#38bdf8" /> Upload Confidential Question Paper
                </h2>
                <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                  <X size={20} />
                </button>
              </div>

              {uploadError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#fb7185', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#34d399', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> {uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUploadSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    Question Paper Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPSC Mains General Studies Paper I - 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    Target Examination Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Government Competitive Examination 2026"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    Select PDF Document File (Max 10MB)
                  </label>
                  <div style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'rgba(15,23,42,0.6)',
                    cursor: 'pointer'
                  }} onClick={() => document.getElementById('paperFileInput').click()}>
                    <FileUp size={36} color="#38bdf8" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                      {file ? file.name : 'Click to select or drop Question Paper PDF'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB - Ready to upload` : 'PDF format only. Encrypted automatically.'}
                    </p>
                    <input
                      id="paperFileInput"
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                  <button type="submit" disabled={uploading} className="btn-primary">
                    {uploading ? 'Encrypting & Storing...' : 'Upload & Submit for Review'}
                  </button>
                </div>
              </form>
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

      </div>
    </div>
  );
};

export default SetterDashboard;
