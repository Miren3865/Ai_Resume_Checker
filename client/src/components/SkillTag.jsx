import { useState } from 'react';

export default function SkillTag({ skill, variant = 'required', style }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useState(null)[1];

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(skill);
      setIsCopied(true);
      
      // Auto-dismiss "Copied!" tooltip after 1.5 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Skill Badge Button */}
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs transition-all duration-200 cursor-pointer ${style.bg} border ${style.border} ${style.text} hover:shadow-lg hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
        title="Click to copy"
      >
        <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
          {style.icon}
        </span>
        <span className="font-medium">{skill}</span>
      </button>

      {/* Hover Tooltip - "Click to copy" */}
      {isHovered && !isCopied && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs font-medium rounded-md shadow-lg whitespace-nowrap pointer-events-none z-10 animate-in fade-in slide-in-from-bottom-2 duration-150">
          Click to copy
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      )}

      {/* Copied Tooltip - "Copied!" */}
      {isCopied && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 px-2.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap pointer-events-none z-10 animate-in fade-in slide-in-from-bottom-2 duration-150">
          Copied! ✓
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rotate-45" />
        </div>
      )}
    </div>
  );
}
