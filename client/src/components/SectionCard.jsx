const STATUS_CLASS = {
  Strong: 'status-strong',
  Moderate: 'status-moderate',
  Weak: 'status-weak',
  Missing: 'status-missing',
};

const SECTION_ICONS = {
  contact: '📋',
  summary: '📝',
  experience: '💼',
  education: '🎓',
  skills: '🔧',
  projects: '🚀',
  certifications: '🏆',
  achievements: '⭐',
};

export default function SectionCard({ sectionName, data }) {
  if (!data) return null;
  const icon = SECTION_ICONS[sectionName] || '📌';
  const statusClass = STATUS_CLASS[data.status] || 'status-missing';

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
          <span>{icon}</span>
          {sectionName}
        </h3>
        <span className={statusClass}>{data.status}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div
          style={{
            height: '6px',
            borderRadius: '99px',
            width: `${data.score || 0}%`,
            transition: 'width .7s ease',
            background: data.score >= 80
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : data.score >= 50
              ? 'linear-gradient(90deg, #f59e0b, #fcd34d)'
              : 'linear-gradient(90deg, #ef4444, #f87171)',
            boxShadow: data.score >= 80
              ? '0 0 8px rgba(16,185,129,.5)'
              : data.score >= 50
              ? '0 0 8px rgba(245,158,11,.5)'
              : '0 0 8px rgba(239,68,68,.5)',
          }}
        />
      </div>
      {data.feedback && data.feedback.length > 0 && (
        <ul className="space-y-1">
          {data.feedback.map((fb, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-orange-400 mt-0.5">⚠</span>
              {fb}
            </li>
          ))}
        </ul>
      )}
      {(!data.feedback || data.feedback.length === 0) && data.status === 'Strong' && (
        <p className="text-sm text-green-600">✓ This section looks great!</p>
      )}
    </div>
  );
}
