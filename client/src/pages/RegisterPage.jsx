import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f1f5f9', marginBottom: '20px',
        }}>
          Start hiring{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #a855f7, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>smarter</span>
          <br />not harder.
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(148,163,184,.72)', lineHeight: 1.65, maxWidth: '400px', marginBottom: '48px' }}>
          Join thousands of recruiters and candidates who use CareerMatch to find the perfect fit using next-generation AI.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { icon: '🧠', text: 'AI parses and understands any resume format' },
            { icon: '📈', text: 'Detailed match scores across 5 key dimensions' },
            { icon: '⚔️', text: 'Battle mode to compare candidates side-by-side' },
          ].map(({ icon, text }) => (
            <div key={text} className="auth-chip" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}>{icon}</div>
              <span style={{ fontSize: '14px', color: 'rgba(203,213,225,.75)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel">
        <div className="auth-card" style={{ padding: '38px 34px' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,.7), rgba(168,85,247,.8), rgba(6,182,212,.5), transparent)',
          }} />

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, color: '#f1f5f9', marginBottom: '5px', letterSpacing: '-0.02em' }}>
            Create your account
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,.55)', marginBottom: '28px' }}>
            Free forever. No credit card required.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Doe"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required autoComplete="new-password" />
            </div>
            <div>
              <label className="label">I am a</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="candidate">Candidate — looking for a job</option>
                <option value="recruiter">Recruiter — hiring talent</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '14.5px', marginTop: '4px' }}>
              {loading ? 'Creating account…' : 'Get Started Free →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(148,163,184,.55)', marginTop: '22px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
