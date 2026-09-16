import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Shield, Users, AlertTriangle, Activity, Lock, UserCheck, ShieldAlert, Database, RefreshCw, Key, Search, Filter, FileSearch } from 'lucide-react';
import ForensicLeakTracer from '../components/ForensicLeakTracer';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [criticalEvents, setCriticalEvents] = useState([]);
  const [showLeakTracer, setShowLeakTracer] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPapers: 0,
    pendingApprovals: 0,
    scheduledExams: 0,
    failedLogins: 0,
    integrityFailures: 0
  });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterAction, setFilterAction] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const auditParams = new URLSearchParams();
      if (filterAction) auditParams.append('action', filterAction);
      if (filterResult) auditParams.append('result', filterResult);
      if (searchQuery) auditParams.append('search', searchQuery);

      const [usersRes, auditRes, eventsRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get(`/audit?${auditParams.toString()}`),
        api.get('/audit/events'),
        api.get('/admin/stats')
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (auditRes.data.success) setAuditLogs(auditRes.data.auditLogs);
      if (eventsRes.data.success) setCriticalEvents(eventsRes.data.criticalEvents);
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (err) {
      console.error('[FETCH ADMIN DATA ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [filterAction, filterResult]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      const res = await api.put(`/admin/users/${userId}/status`, { status: nextStatus });
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to change user role');
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
              <Shield color="#f43f5e" size={28} /> SIEM Security Control Center & Audit Trail
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Real-time audit log streaming, cryptographic tamper detection alerts, and user privilege management.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowLeakTracer(true)} className="btn-primary" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' }}>
              <FileSearch size={16} /> Forensic Leak Tracer
            </button>
            <button onClick={fetchAdminData} className="btn-secondary">
              <RefreshCw size={16} /> Refresh SIEM Feed
            </button>
          </div>
        </div>

        {/* SIEM Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="glass-card">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Users</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{stats.totalUsers}</p>
          </div>
          <div className="glass-card">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vault Papers</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7' }}>{stats.totalPapers}</p>
          </div>
          <div className="glass-card">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pending Review</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pendingApprovals}</p>
          </div>
          <div className="glass-card">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Exams Scheduled</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{stats.scheduledExams}</p>
          </div>
          <div className="glass-card">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Failed Logins</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fb7185' }}>{stats.failedLogins}</p>
          </div>
          <div className="glass-card">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Integrity Alerts</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e' }}>{stats.integrityFailures}</p>
          </div>
        </div>

        {/* User Role & Access Control Directory */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#38bdf8" /> User Directory & Role Privilege Management
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role Privilege</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Security Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Account Control Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>{u.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        style={{
                          background: 'rgba(15,23,42,0.9)',
                          color: '#38bdf8',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.775rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="SETTER">SETTER</option>
                        <option value="REVIEWER">REVIEWER</option>
                        <option value="CONTROLLER">CONTROLLER</option>
                        <option value="CANDIDATE">CANDIDATE</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-approved' : 'badge-compromised'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        className={u.status === 'DISABLED' ? 'btn-primary' : 'btn-danger'}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStatus(u.id, u.status)}
                      >
                        {u.status === 'DISABLED' ? 'Enable Account' : 'Disable Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time SIEM Audit Stream with Filtering Controls */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="#10b981" /> Immutable SIEM Audit Stream & Security Incident Logs
            </h3>

            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAdminData()}
                  className="input-field"
                  style={{ padding: '0.35rem 0.75rem 0.35rem 2rem', fontSize: '0.775rem', width: '180px' }}
                />
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                style={{
                  background: 'rgba(15,23,42,0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.775rem'
                }}
              >
                <option value="">All Actions</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
                <option value="PAPER_UPLOADED">PAPER_UPLOADED</option>
                <option value="PAPER_APPROVED">PAPER_APPROVED</option>
                <option value="PAPER_REJECTED">PAPER_REJECTED</option>
                <option value="PAPER_SCHEDULED">PAPER_SCHEDULED</option>
                <option value="PAPER_RELEASED">PAPER_RELEASED</option>
                <option value="PAPER_ACCESS_DENIED">PAPER_ACCESS_DENIED</option>
                <option value="INTEGRITY_FAILURE">INTEGRITY_FAILURE</option>
              </select>

              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                style={{
                  background: 'rgba(15,23,42,0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.775rem'
                }}
              >
                <option value="">All Results</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="DENIED">DENIED</option>
                <option value="TAMPERING_DETECTED">TAMPERING_DETECTED</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem 1rem' }}>User / Role</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Security Action</th>
                  <th style={{ padding: '0.65rem 1rem' }}>IP Address</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Result</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit log entries matching filters.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }} className="font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>
                        {log.user_name || 'System / Anonymous'} ({log.role})
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>{log.action}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }} className="font-mono">{log.ip_address}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${log.result === 'SUCCESS' ? 'badge-approved' : log.result === 'TAMPERING_DETECTED' ? 'badge-compromised' : 'badge-rejected'}`}>
                          {log.result}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forensic Leak Tracer Modal */}
        {showLeakTracer && (
          <ForensicLeakTracer onClose={() => setShowLeakTracer(false)} />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
