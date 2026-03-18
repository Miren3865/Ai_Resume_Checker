import { useState } from 'react';

export default function JobHeader({ job }) {
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(job.jobTitle);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-700/50 via-slate-750/40 to-slate-800/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
      {/* Decorative gradient orb */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Job Title */}
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-3 leading-tight">
          {job.jobTitle}
        </h1>

        {/* Divider */}
        <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-4" />

        {/* Description info */}
        <p className="text-slate-300 text-sm leading-relaxed mb-5">
          {job.company && job.location
            ? `${job.company} is seeking a ${job.jobTitle} in ${job.location}`
            : `Apply for this ${job.jobTitle} position today`}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-600/30">
          <button
            onClick={handleCopyTitle}
            className="w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2 group"
          >
            <span>📋</span>
            {showCopyToast ? 'Copied!' : 'Copy Title'}
          </button>
        </div>
      </div>
    </div>
  );
}
