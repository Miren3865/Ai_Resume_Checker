export default function ScoreBar({ label, score, color = 'blue', weight }) {
  const gradientMap = {
    blue:   'linear-gradient(90deg, #6366f1, #818cf8)',
    green:  'linear-gradient(90deg, #10b981, #34d399)',
    yellow: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
    orange: 'linear-gradient(90deg, #f97316, #fdba74)',
    purple: 'linear-gradient(90deg, #a855f7, #c084fc)',
    red:    'linear-gradient(90deg, #ef4444, #f87171)',
  };
  const glowMap = {
    blue: '#6366f1', green: '#10b981', yellow: '#f59e0b',
    orange: '#f97316', purple: '#a855f7', red: '#ef4444',
  };
  const gradient = gradientMap[color] || gradientMap.blue;
  const glow = glowMap[color] || glowMap.blue;
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {weight !== undefined && (
            <span style={{ fontSize: '11px', color: 'rgba(71,85,105,.9)' }}>wt {weight}%</span>
          )}
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: glow,
            textShadow: `0 0 8px ${glow}60` }}>{score}%</span>
        </div>
      </div>
      <div style={{ width: '100%', background: 'rgba(255,255,255,.07)', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          width: `${pct}%`,
          background: gradient,
          boxShadow: `0 0 10px ${glow}60`,
          transition: 'width .7s cubic-bezier(.34,1.56,.64,1)',
        }} />
      </div>
    </div>
  );
}
