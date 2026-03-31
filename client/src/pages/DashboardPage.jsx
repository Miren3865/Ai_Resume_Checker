import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/services';
import DonutChart from '../components/DonutChart';

const STAT_CONFIG = [
  {
    key: 'totalResumes',
    label: 'Resumes',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="3"/>
        <path d="M9 7h6M9 11h6M9 15h2"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg,#6366f1,#818cf8)'
  },
  {
    key: 'totalJobs',
    label: 'Job Descriptions',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="13" rx="3"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg,#a855f7,#c084fc)'
  },
  {
    key: 'totalEvaluations',
    label: 'Evaluations',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3"/>
        <path d="M9 12l2 2l4-4"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg,#06b6d4,#67e8f9)'
  },
  {
    key: 'averageScore',
    label: 'Avg Match Score',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20a8 8 0 1 1 8-8"/>
        <path d="M12 4v4"/>
        <path d="M12 12l3 3"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg,#10b981,#6ee7b7)',
    suffix: '%'
  },
];

const GRADE_COLOR = {
  'A+': '#22c55e', A: '#4ade80', B: '#f59e0b', C: '#f97316', 'Needs Improvement': '#ef4444',
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px' }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          border: '3px solid rgba(168,85,247,.15)',
          borderTopColor: '#a855f7',
          animation: 'spin 0.9s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '28px', fontWeight: 800, letterSpacing: '-0.025em',
          background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: '4px',
        }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: 'rgba(100,116,139,.9)' }}>Your career match analytics at a glance</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {STAT_CONFIG.map(({ key, label, icon, gradient, suffix }) => (
          <div key={key} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 22px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '13px', flexShrink: 0,
              background: gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: `0 0 18px rgba(168,85,247,.25)`,
            }}>{icon}</div>
            <div>
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '26px', fontWeight: 800, letterSpacing: '-0.025em',
                background: gradient,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1.1,
              }}>
                {(stats?.[key] ?? 0)}{suffix || ''}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,.65)', marginTop: '2px', fontWeight: 500 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Grade Distribution */}
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '20px', letterSpacing: '-0.01em' }}>
            Grade Distribution
          </h2>
          {stats?.gradeDistribution?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.gradeDistribution
                .sort((a, b) => (a._id > b._id ? 1 : -1))
                .map((g) => (
                  <div key={g._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      minWidth: '38px', textAlign: 'center', fontSize: '11.5px', fontWeight: 700,
                      borderRadius: '6px', padding: '2px 6px',
                      color: GRADE_COLOR[g._id] || '#6b7280',
                      background: `${GRADE_COLOR[g._id] || '#6b7280'}18`,
                      border: `1px solid ${GRADE_COLOR[g._id] || '#6b7280'}30`,
                    }}>{g._id}</span>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,.07)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '99px',
                        width: `${Math.min(100, (g.count / (stats.totalEvaluations || 1)) * 100)}%`,
                        background: GRADE_COLOR[g._id] || '#6b7280',
                        boxShadow: `0 0 8px ${GRADE_COLOR[g._id] || '#6b7280'}80`,
                        transition: 'width .6s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(148,163,184,.55)', minWidth: '18px', textAlign: 'right' }}>{g.count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,.4)', paddingTop: '8px' }}>No evaluations yet</p>
          )}
        </div>

        {/* Donut chart */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutChart score={stats?.averageScore || 0} label="Platform Average Score" />
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/resumes" className="btn-primary" style={{ justifyContent: 'center', fontSize: '13px' }}>
              Upload Resume
            </Link>
            <Link to="/jobs" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '13px' }}>
              Add Job Description
            </Link>
            <Link to="/evaluations/new" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '13px' }}>
              Run Evaluation
            </Link>
            <Link to="/battle" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '13px' }}>
              Resume Battle
            </Link>
          </div>
        </div>
      </div>

      {/* Recent evaluations */}
      {stats?.recentEvaluations?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
              Recent Evaluations
            </h2>
            <Link to="/evaluations" style={{ fontSize: '12.5px', color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          <div>
            {stats.recentEvaluations.map((ev, i) => (
              <Link
                key={ev._id}
                to={`/evaluations/${ev._id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 10px', borderRadius: '10px',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,.05)' : 'none',
                  textDecoration: 'none',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#e2e8f0' }}>
                    {ev.resumeId?.candidateName || 'Unknown'} → {ev.jobId?.jobTitle || 'Unknown Job'}
                  </p>
                  <p style={{ fontSize: '11.5px', color: 'rgba(71,85,105,.9)', marginTop: '2px' }}>
                    {ev.jobId?.company} · {new Date(ev.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: GRADE_COLOR[ev.grade] || '#94a3b8', display: 'block',
                    textShadow: `0 0 10px ${GRADE_COLOR[ev.grade] || '#94a3b8'}60` }}>
                    {ev.matchScore}%
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: GRADE_COLOR[ev.grade] || '#94a3b8' }}>
                    {ev.grade}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
