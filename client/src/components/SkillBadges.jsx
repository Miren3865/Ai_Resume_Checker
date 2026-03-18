import SkillTag from './SkillTag';

const VARIANT_STYLES = {
  required: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-400/40',
    text: 'text-blue-200 hover:text-blue-100',
    icon: '✓',
  },
  preferred: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-400/40',
    text: 'text-purple-200 hover:text-purple-100',
    icon: '⚡',
  },
  keyword: {
    bg: 'bg-pink-500/15',
    border: 'border-pink-400/40',
    text: 'text-pink-200 hover:text-pink-100',
    icon: '🏷️',
  },
};

export default function SkillBadges({ skills, variant = 'required' }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.required;

  return (
    <div className="flex flex-wrap gap-2.5">
      {skills.map((skill) => (
        <SkillTag key={skill} skill={skill} variant={variant} style={style} />
      ))}
    </div>
  );
}
