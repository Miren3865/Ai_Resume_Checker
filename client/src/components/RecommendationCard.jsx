const PRIORITY_CONFIG = {
  HIGH:   { badge: 'badge-high',   glow: 'rgba(244,63,94,.2)',  icon: '↑' },
  MEDIUM: { badge: 'badge-medium', glow: 'rgba(245,158,11,.2)', icon: '→' },
  LOW:    { badge: 'badge-low',    glow: 'rgba(16,185,129,.2)', icon: '↓' },
};

import { motion } from 'framer-motion';

export default function RecommendationCard({ rec }) {
  const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.LOW;

  return (
    <motion.div
      whileHover={{
        scale: 1.035,
        boxShadow: `0 0 0 2px ${cfg.glow}, 0 0 18px ${cfg.glow}`,
        transition: { duration: 0.18 },
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: '12px', padding: '14px 16px',
        background: 'rgba(255,255,255,.025)',
        transition: 'all .18s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
          background: cfg.glow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: 'rgba(203,213,225,.8)',
        }}>{cfg.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span className={cfg.badge}>{rec.priority}</span>
            <span style={{
              fontSize: '11px', color: 'rgba(100,116,139,.9)',
              background: 'rgba(255,255,255,.06)', padding: '2px 8px',
              borderRadius: '99px', border: '1px solid rgba(255,255,255,.08)',
            }}>{rec.category}</span>
          </div>
          <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#cbd5e1', lineHeight: 1.5 }}>{rec.message}</p>
          {rec.action && rec.action !== rec.message && (
            <p style={{ fontSize: '12.5px', color: '#818cf8', marginTop: '6px' }}>→ {rec.action}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
