import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="orb orb-purple" />
      <div className="orb orb-pink" />
      <div className="orb orb-cyan" />

      {/* Left hero panel */}
      <div className="auth-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '72px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', boxShadow: '0 0 28px rgba(168,85,247,.55)',
          }}>✦</div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '19px',
            background: 'linear-gradient(135deg, #a5b4fc, #c084fc, #67e8f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>CareerMatch</span>
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(38px, 4vw, 54px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f1f5f9',
          marginBottom: '20px',
        }}>
          Match the{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #a855f7, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>right talent</span>
          <br />to every role.
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(148,163,184,.72)', lineHeight: 1.65, maxWidth: '400px', marginBottom: '48px' }}>
          AI-powered resume intelligence that analyses, scores, and ranks candidates with unprecedented precision.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['⚡ AI Scoring', '🎯 Skill Match', '⚔️ Resume Battle', '📊 Deep Insights'].map((f) => (
            <div key={f} className="auth-chip" style={{
              padding: '7px 16px', borderRadius: '99px',
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              fontSize: '12.5px', fontWeight: 500, color: 'rgba(203,213,225,.75)',
            }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel">
        <div className="auth-card" style={{ padding: '40px 36px' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,.7), rgba(168,85,247,.8), rgba(6,182,212,.5), transparent)',
          }} />

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '13.5px', color: 'rgba(148,163,184,.58)', marginBottom: '30px' }}>
            Sign in to continue to CareerMatch
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '14.5px', marginTop: '6px' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(148,163,184,.55)', marginTop: '24px' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
