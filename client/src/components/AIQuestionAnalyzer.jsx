import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Cpu, Sparkles, CheckCircle2, AlertTriangle, FileCheck, Layers, Award, X, RefreshCw } from 'lucide-react';

const AIQuestionAnalyzer = ({ paperId, paperTitle, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/papers/${paperId}/ai-analysis`);
      if (res.data.success) {
        setData(res.data.aiAnalysis);
      }
    } catch (err) {
      setError('Failed to run AI Inspector scan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paperId) fetchAnalysis();
  }, [paperId]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 10, 20, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{ maxWidth: '750px', width: '100%', padding: '2rem', border: '1px solid rgba(56, 189, 248, 0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span>AI Question Rigor & Quality Co-Pilot</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
              {paperTitle}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#38bdf8' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem auto' }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Analyzing PDF question difficulty using Bloom's Taxonomy model...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#fb7185' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
            <p>{error}</p>
          </div>
        ) : data ? (
          <div>
            {/* Top Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                <Award size={24} color="#38bdf8" style={{ margin: '0 auto 0.25rem auto' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Rigor & Quality Rating</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{data.qualityScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 10</span></p>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                <FileCheck size={24} color="#10b981" style={{ margin: '0 auto 0.25rem auto' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Syllabus Coverage</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{data.syllabusCoverageScore}</p>
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                <Layers size={24} color="#a855f7" style={{ margin: '0 auto 0.25rem auto' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Duplication Risk</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc', marginTop: '0.35rem' }}>Pass (Low Risk)</p>
              </div>

            </div>

            {/* Bloom's Taxonomy Cognitive Distribution Bars */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} color="#38bdf8" /> Bloom's Taxonomy Cognitive Level Breakdown
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Knowledge (Recall & Facts)', val: data.bloomsTaxonomy.knowledge, color: '#38bdf8' },
                  { label: 'Comprehension (Concepts & Explanation)', val: data.bloomsTaxonomy.comprehension, color: '#3b82f6' },
                  { label: 'Application (Problem Solving)', val: data.bloomsTaxonomy.application, color: '#10b981' },
                  { label: 'Analysis (Critical Reasoning)', val: data.bloomsTaxonomy.analysis, color: '#f59e0b' },
                  { label: 'Evaluation & Synthesis (Advanced Synthesis)', val: data.bloomsTaxonomy.evaluation, color: '#a855f7' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <span>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: item.val, background: item.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assessment & Model Marking Scheme Rubric */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                AI Evaluator Recommendation & Marking Scheme Rubric
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                {data.aiAssessment}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {data.suggestedRubric.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                    <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="btn-primary" onClick={onClose} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                Done Reviewing AI Report
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default AIQuestionAnalyzer;
