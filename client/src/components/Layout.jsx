import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: '/resumes',
    label: 'Resumes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
      </svg>
    ),
  },
  {
    to: '/jobs',
    label: 'Job Descriptions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/evaluations',
    label: 'Evaluations',
    end: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/evaluations/new',
    label: 'Evaluate Now',
    accent: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    to: '/battle',
    label: 'Resume Battle',
    danger: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14.5 17.5-5-5"/><path d="m9.5 12.5-5 5-2-2 5-5"/>
        <path d="m14.5 6.5 5-5 2 2-5 5"/>
        <circle cx="17" cy="17" r="2.5"/><circle cx="7" cy="7" r="2.5"/>
      </svg>
    ),
  },
];

const systemItems = [
  // {
  //   to: '/rule-config',
  //   label: 'Rule Config',
  //   icon: (
  //     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <circle cx="12" cy="12" r="3"/>
  //       <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2m0 16v2M2 12h2m16 0h2m-4.93-7.07-1.41 1.41M7.05 16.95l-1.41 1.41M7.05 7.05 5.64 5.64M16.95 16.95l1.41 1.41"/>
  //     </svg>
  //   ),
  // },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

function SideNavLink({ to, label, icon, accent, danger, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => {
        const base = {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 13px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: isActive ? 600 : 500,
          textDecoration: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all .16s ease',
          letterSpacing: '-0.01em',
        };
        if (accent) {
          return {
            ...base,
            background: isActive
              ? 'linear-gradient(135deg, rgba(99,102,241,.32), rgba(139,92,246,.22))'
              : 'linear-gradient(135deg, rgba(99,102,241,.18), rgba(139,92,246,.12))',
            color: '#a5b4fc',
            boxShadow: isActive
              ? 'inset 0 0 0 1px rgba(129,140,248,.35), 0 0 18px rgba(99,102,241,.15)'
              : 'inset 0 0 0 1px rgba(129,140,248,.22)',
          };
        }
        if (isActive) {
          return {
            ...base,
            background: 'linear-gradient(135deg, rgba(99,102,241,.18), rgba(168,85,247,.12))',
            color: '#c4b5fd',
            boxShadow: 'inset 0 0 0 1px rgba(168,85,247,.26)',
          };
        }
        return {
          ...base,
          color: danger ? 'rgba(251,113,133,.7)' : 'rgba(148,163,184,.6)',
        };
      }}
      onMouseEnter={e => {
        const link = e.currentTarget;
        const isActive = link.getAttribute('aria-current') === 'page';
        if (!isActive && !link.dataset.accent) {
          link.style.background = 'rgba(255,255,255,.05)';
          link.style.color = danger ? '#fda4af' : '#e2e8f0';
        }
      }}
      onMouseLeave={e => {
        const link = e.currentTarget;
        const isActive = link.getAttribute('aria-current') === 'page';
        if (!isActive && !link.dataset.accent) {
          link.style.background = '';
          link.style.color = '';
        }
      }}
    >
      {({ isActive }) => (
        <>
          {isActive && !accent && (
            <div style={{
              position: 'absolute',
              left: 0, top: '50%', transform: 'translateY(-50%)',
              width: '3px', height: '54%', borderRadius: '0 2px 2px 0',
              background: 'linear-gradient(180deg, #818cf8, #a855f7)',
              boxShadow: '0 0 8px rgba(168,85,247,.8)',
            }} />
          )}
          <span style={{
            flexShrink: 0,
            opacity: isActive || accent ? 1 : 0.72,
            color: danger ? (isActive ? '#fda4af' : 'rgba(251,113,133,.7)') : undefined,
          }}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logoutUser();
    navigate('/login');
  };

  const initials = (user?.name || '??').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05050f', position: 'relative' }}>
      {/* Animated background orbs */}
      <div className="orb orb-purple" />
      <div className="orb orb-pink" />
      <div className="orb orb-cyan" />

      {/* ── Sidebar ── */}
      <aside className="sidebar-enter" style={{
        width: '252px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 20,
        background: 'rgba(4, 4, 18, 0.75)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        borderRight: '1px solid rgba(255,255,255,0.065)',
        boxShadow: '4px 0 30px rgba(0,0,0,.4)',
      }}>

        {/* ── Logo ── */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,.055)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 22px rgba(168,85,247,.48), inset 0 1px 0 rgba(255,255,255,.2)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: '15px',
                background: 'linear-gradient(135deg, #a5b4fc, #c084fc, #67e8f9)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', letterSpacing: '-0.02em',
              }}>CareerMatch</div>
              <div style={{
                fontSize: '9px', color: 'rgba(148,163,184,.45)',
                marginTop: '2px', letterSpacing: '.13em', textTransform: 'uppercase',
                fontWeight: 600,
              }}>AI Powered</div>
            </div>
          </div>
        </div>

        {/* ── User profile (below logo) ── */}
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '11px',
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.07)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '11.5px', fontWeight: 700,
              boxShadow: '0 0 12px rgba(168,85,247,.4)',
            }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{
                fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}>
                {user?.name}
              </p>
              <div style={{ marginTop: '4px' }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: '9px', fontWeight: 700, letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: '#2dd4bf',
                  background: 'rgba(45,212,191,.12)',
                  border: '1px solid rgba(45,212,191,.25)',
                  borderRadius: '4px',
                  padding: '1.5px 6px',
                  lineHeight: 1.6,
                }}>
                  {(user?.role || 'candidate').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          <div style={{
            padding: '6px 12px 7px', fontSize: '9px', fontWeight: 700,
            color: 'rgba(148,163,184,.38)', letterSpacing: '.12em', textTransform: 'uppercase',
          }}>
            Navigation
          </div>

          {navItems.map(({ to, label, icon, accent, danger, end }) => (
            <SideNavLink key={to} to={to} label={label} icon={icon} accent={accent} danger={danger} end={end} />
          ))}

          <div style={{
            padding: '14px 12px 7px', fontSize: '9px', fontWeight: 700,
            color: 'rgba(148,163,184,.38)', letterSpacing: '.12em', textTransform: 'uppercase',
          }}>
            System
          </div>

          {systemItems.map(({ to, label, icon }) => (
            <SideNavLink key={to} to={to} label={label} icon={icon} />
          ))}
        </nav>

        {/* ── Sign Out ── */}
        <div style={{ padding: '10px 10px 18px', borderTop: '1px solid rgba(255,255,255,.055)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: '10px',
              fontSize: '12.5px', fontWeight: 500,
              color: 'rgba(148,163,184,.6)',
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.07)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all .16s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.background = 'rgba(244,63,94,.1)';
              el.style.borderColor = 'rgba(244,63,94,.28)';
              el.style.color = '#fda4af';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.background = 'rgba(255,255,255,.03)';
              el.style.borderColor = 'rgba(255,255,255,.07)';
              el.style.color = 'rgba(148,163,184,.6)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-enter" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '36px 32px' }}>
          <div key={location.pathname} className="route-shell">
            <Outlet />
          </div>
        </div>
      </main>

      {showLogoutConfirm && (
        <ConfirmModal
          message="Sign out of your account?"
          subMessage="You will need to log in again to continue."
          confirmLabel="Sign Out"
          iconType="logout"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
