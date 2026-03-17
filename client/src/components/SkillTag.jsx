export default function SkillTag({ skill, matched }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '99px',
      fontSize: '12px', fontWeight: 500,
      ...(matched ? {
        background: 'rgba(16,185,129,.12)',
        color: '#6ee7b7',
        border: '1px solid rgba(16,185,129,.28)',
        boxShadow: '0 0 8px rgba(16,185,129,.12)',
      } : {
        background: 'rgba(244,63,94,.1)',
        color: '#fda4af',
        border: '1px solid rgba(244,63,94,.25)',
      }),
    }}>
      <span style={{ marginRight: '5px', fontSize: '10px' }}>{matched ? '✓' : '✗'}</span>
      {skill}
    </span>
  );
}
