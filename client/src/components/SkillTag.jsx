const LEGACY_STYLES = {
  matched: {
    bg: 'bg-green-500/15',
    border: 'border-green-400/40',
    text: 'text-green-200 hover:text-green-100',
    icon: '✓',
  },
  missing: {
    bg: 'bg-red-500/15',
    border: 'border-red-400/40',
    text: 'text-red-200 hover:text-red-100',
    icon: '✗',
  },
};

export default function SkillTag({ skill, matched = true, variant = 'required', style }) {
  const safeSkill = typeof skill === 'string' ? skill : String(skill || '');
  const fallbackStyle = matched ? LEGACY_STYLES.matched : LEGACY_STYLES.missing;
  const resolvedStyle = style || fallbackStyle;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs transition-all duration-200 border ${resolvedStyle.bg} ${resolvedStyle.border} ${resolvedStyle.text}`}
    >
      <span className="opacity-80">{resolvedStyle.icon}</span>
      <span className="font-medium">{safeSkill}</span>
    </div>
  );
}
