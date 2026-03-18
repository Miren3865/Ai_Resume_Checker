export default function JobSection({ icon, title, subtitle, children }) {
  return (
    <div className="group bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600/50">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-600/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{icon}</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-slate-300">
        {children}
      </div>
    </div>
  );
}
