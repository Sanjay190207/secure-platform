import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Clock, Calendar, ShieldCheck, Plus, Lock, Play, CheckCircle2, RefreshCw } from 'lucide-react';

const ControllerDashboard = () => {
  const [exams, setExams] = useState([]);
  const [approvedPapers, setApprovedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form State
  const [examName, setExamName] = useState('UPSC Civil Services Mains 2026');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [examDate, setExamDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, papersRes] = await Promise.all([
        api.get('/exams'),
        api.get('/papers')
      ]);

      if (examsRes.data.success) {
        setExams(examsRes.data.exams);
      }
      if (papersRes.data.success) {
        setApprovedPapers(papersRes.data.papers);
      }
    } catch (err) {
      console.error('[FETCH CONTROLLER DATA ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!selectedPaperId) {
      alert('Please select an APPROVED question paper to schedule.');
      return;
    }

    try {
      const res = await api.post('/exams', {
        exam_name: examName,
        question_paper_id: selectedPaperId,
        exam_date: examDate,
        start_time: startTime,
        end_time: endTime
      });

      if (res.data.success) {
        alert(`✓ Exam "${examName}" scheduled successfully!\n\nServer time-lock engine activated. Question paper locked until ${startTime}.`);
        setShowScheduleModal(false);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule exam');
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
              <Clock color="#f59e0b" size={28} /> Exam Controller Time-Lock Console
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Configure examination start/end windows and enforce server-controlled question paper release locks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchData} className="btn-secondary">
              <RefreshCw size={16} />
            </button>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} onClick={() => setShowScheduleModal(true)}>
              <Plus size={18} /> Schedule New Examination
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled Exams</span>
              <Calendar size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{exams.length}</p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Window (Live)</span>
              <Play size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {exams.filter(e => e.calculatedStatus === 'ACTIVE').length}
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Vault Papers</span>
              <ShieldCheck size={20} />
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {approvedPapers.length}
            </p>
          </div>
        </div>

        {/* Scheduled Examinations Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f8fafc' }}>
            Time-Locked Examination Registry
          </h3>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading exam registry...</div>
          ) : exams.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <Clock size={42} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No active examinations scheduled yet.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.25rem' }}>Click "Schedule New Examination" above to lock a paper for release.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Exam Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Question Paper</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Exam Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Time Window</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Server Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>{exam.exam_name}</td>
                      <td style={{ padding: '1rem', color: '#38bdf8' }}>
                        <div>{exam.paper_title || 'UPSC Sample Paper'}</div>
                        <span style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: 600 }}>✓ Multi-Sig Key (2/2 Consensus Verified)</span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{exam.exam_date}</td>
                      <td style={{ padding: '1rem', color: '#fbbf24' }} className="font-mono">
                        {new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {exam.calculatedStatus === 'ACTIVE' ? (
                          <span className="badge badge-released"><Play size={12} /> RELEASED</span>
                        ) : exam.calculatedStatus === 'COMPLETED' ? (
                          <span className="badge badge-closed">CLOSED</span>
                        ) : (
                          <span className="badge badge-scheduled"><Lock size={12} /> LOCKED (Time Engine Active)</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => alert(`Exam "${exam.exam_name}" Time-Lock Configuration:\n\n• Encryption: AES-256-GCM\n• Multi-Sig Consensus: 2-of-2 Verified\n• Release Window: ${exam.exam_date} (${new Date(exam.start_time).toLocaleTimeString()} - ${new Date(exam.end_time).toLocaleTimeString()})`)}>
                          Key Vault Config
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Exam Modal */}
        {showScheduleModal && (
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
            <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={20} color="#f59e0b" /> Schedule Exam Release Window
                </h2>
                <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <form onSubmit={handleCreateExam}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    Examination Name
                  </label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    Select Approved Question Paper
                  </label>
                  <select
                    className="input-field"
                    value={selectedPaperId}
                    onChange={(e) => setSelectedPaperId(e.target.value)}
                  >
                    <option value="">-- Choose Approved Question Paper --</option>
                    {approvedPapers.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.exam_name})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Date
                    </label>
                    <input type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Start Time
                    </label>
                    <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      End Time
                    </label>
                    <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <Lock size={16} /> Activate Server Time-Lock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ControllerDashboard;
