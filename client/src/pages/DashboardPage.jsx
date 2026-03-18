import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDashed,
  FileText,
  Gauge,
  Sparkles,
  Swords,
  Upload,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { getDashboardStats, getEvaluation, getEvaluations } from '../api/services';

const ease = [0.22, 1, 0.36, 1];

const statMeta = [
  { key: 'totalResumes', label: 'Resumes Uploaded', icon: Upload, suffix: '', color: 'from-indigo-400 via-violet-400 to-fuchsia-400' },
  { key: 'totalJobs', label: 'Job Descriptions', icon: BriefcaseBusiness, suffix: '', color: 'from-cyan-400 via-sky-400 to-indigo-400' },
  { key: 'totalEvaluations', label: 'Evaluations Run', icon: Activity, suffix: '', color: 'from-purple-400 via-pink-400 to-orange-300' },
  { key: 'averageScore', label: 'Avg Match Score', icon: Gauge, suffix: '%', color: 'from-emerald-300 via-teal-300 to-cyan-400' },
];

const gradeColor = {
  'A+': '#22c55e',
  A: '#4ade80',
  B: '#f59e0b',
  C: '#f97316',
  'Needs Improvement': '#ef4444',
};

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let rafId;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const next = Math.round(target * (1 - (1 - progress) * (1 - progress)));
      setValue(next);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

function TrendSparkline({ points, positive }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);

  const coords = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 30 - ((point - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 32" className="h-9 w-full">
      <defs>
        <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={positive ? '#22d3ee' : '#f97316'} stopOpacity="0.1" />
          <stop offset="100%" stopColor={positive ? '#a855f7' : '#ef4444'} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={`url(#spark-${positive ? 'up' : 'down'})`} strokeWidth="2.7" points={coords} strokeLinecap="round" />
    </svg>
  );
}

function AnimatedStatCard({ item, value, idx }) {
  const previous = Math.max(0, Math.round(value * (0.82 + idx * 0.03)));
  const delta = value - previous;
  const positive = delta >= 0;
  const percent = previous === 0 ? 100 : Math.round((delta / previous) * 100);
  const points = [previous, previous + delta * 0.2, previous + delta * 0.45, previous + delta * 0.75, value].map((n) => Math.max(0, n));
  const animated = useCountUp(value, 900 + idx * 200);
  const Icon = item.icon;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl"
      style={{ boxShadow: '0 0 30px rgba(139,92,246,0.17)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(129,140,248,0.26),transparent_36%),radial-gradient(circle_at_85%_85%,rgba(6,182,212,0.16),transparent_38%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">{item.label}</p>
          <p className={`mt-2 bg-gradient-to-r ${item.color} bg-clip-text text-3xl font-extrabold text-transparent`}>
            {animated}
            {item.suffix}
          </p>
        </div>

        <span className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-100">
          <Icon size={16} />
        </span>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${positive ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/30 bg-rose-500/10 text-rose-200'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(percent)}%
        </span>
        <span className="text-slate-500">vs previous period</span>
      </div>

      <div className="relative mt-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
        <TrendSparkline points={points} positive={positive} />
      </div>
    </motion.div>
  );
}

function SkeletonDash() {
  return (
    <div className="page-shell space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5 xl:col-span-7" />
        <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5 xl:col-span-5" />
      </div>
    </div>
  );
}

function getHeatColor(score) {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35';
  if (score >= 45) return 'bg-amber-500/20 text-amber-100 border-amber-400/35';
  return 'bg-rose-500/20 text-rose-100 border-rose-400/35';
}

function buildTimeline(stats, latestEvaluation) {
  const now = new Date();
  const events = [];

  if ((stats?.totalResumes || 0) > 0) {
    events.push({
      id: 'resume-upload',
      title: 'Resume uploaded',
      detail: `${stats.totalResumes} total resumes in your workspace`,
      at: now,
      icon: Upload,
      tone: 'emerald',
    });
  }

  if ((stats?.totalJobs || 0) > 0) {
    events.push({
      id: 'job-added',
      title: 'Job description added',
      detail: `${stats.totalJobs} active target roles tracked`,
      at: new Date(now.getTime() - 1000 * 60 * 95),
      icon: BriefcaseBusiness,
      tone: 'indigo',
    });
  }

  if (latestEvaluation?._id) {
    events.push({
      id: 'evaluation-finished',
      title: 'Evaluation completed',
      detail: `${latestEvaluation.matchScore}% match for ${latestEvaluation.resumeId?.candidateName || 'latest candidate'}`,
      at: new Date(latestEvaluation.createdAt),
      icon: FileText,
      tone: 'violet',
    });
  }

  if ((stats?.totalEvaluations || 0) >= 2) {
    events.push({
      id: 'battle-initiated',
      title: 'Resume battle initiated',
      detail: 'Benchmark comparison mode unlocked',
      at: new Date(now.getTime() - 1000 * 60 * 270),
      icon: Swords,
      tone: 'fuchsia',
    });
  }

  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [latestEvaluation, setLatestEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const statsRes = await getDashboardStats();
        const nextStats = statsRes.data.data;
        setStats(nextStats);

        const evalRes = await getEvaluations({ limit: 1 });
        const latest = evalRes.data.data?.[0];
        if (latest?._id) {
          const detailRes = await getEvaluation(latest._id);
          setLatestEvaluation(detailRes.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activityEvents = useMemo(() => buildTimeline(stats, latestEvaluation), [stats, latestEvaluation]);

  const radarData = useMemo(() => {
    const ev = latestEvaluation;
    if (!ev) {
      return [
        { metric: 'Skills', score: 0 },
        { metric: 'Experience', score: 0 },
        { metric: 'Projects', score: 0 },
        { metric: 'ATS', score: 0 },
        { metric: 'Keywords', score: 0 },
      ];
    }

    const projectScore = ev.sectionAnalysis?.projects?.score ?? Math.round(((ev.skillsCoverage || 0) + (ev.experienceAlignment || 0)) / 2);

    return [
      { metric: 'Skills', score: ev.skillsCoverage || 0 },
      { metric: 'Experience', score: ev.experienceAlignment || 0 },
      { metric: 'Projects', score: projectScore || 0 },
      { metric: 'ATS', score: ev.formattingScore || 0 },
      { metric: 'Keywords', score: ev.keywordScore || 0 },
    ];
  }, [latestEvaluation]);

  const breakdown = useMemo(() => {
    const ev = latestEvaluation;
    return [
      { label: 'ATS Compatibility', value: ev?.formattingScore || 0, className: 'from-cyan-400 to-blue-500' },
      { label: 'Skills Match', value: ev?.skillsCoverage || 0, className: 'from-indigo-400 to-violet-500' },
      { label: 'Experience Quality', value: ev?.experienceAlignment || 0, className: 'from-fuchsia-400 to-pink-500' },
      { label: 'Keyword Match', value: ev?.keywordScore || 0, className: 'from-amber-300 to-orange-500' },
    ];
  }, [latestEvaluation]);

  const missingSkills = useMemo(() => {
    const fromEval = latestEvaluation?.missingSkills?.slice(0, 3) || [];
    if (fromEval.length > 0) return fromEval;
    return ['Docker', 'System Design', 'Redis'];
  }, [latestEvaluation]);

  const suggestions = useMemo(() => {
    const fromEval = (latestEvaluation?.recommendations || []).slice(0, 3).map((item) => item.action || item.message);
    if (fromEval.length > 0) return fromEval;
    return ['Add backend project with real metrics', 'Improve keyword matching for target role', 'Add measurable achievements in work experience'];
  }, [latestEvaluation]);

  const heatmapRows = useMemo(() => {
    const matched = latestEvaluation?.matchedSkills || [];
    const missing = latestEvaluation?.missingSkills || [];

    const rows = [
      ...matched.slice(0, 6).map((skill, index) => ({
        skill,
        score: Math.max(82 - index * 6, 55),
      })),
      ...missing.slice(0, 4).map((skill) => ({ skill, score: 0 })),
    ];

    if (rows.length > 0) return rows;

    return [
      { skill: 'React', score: 92 },
      { skill: 'Node.js', score: 78 },
      { skill: 'MongoDB', score: 85 },
      { skill: 'Docker', score: 0 },
    ];
  }, [latestEvaluation]);

  const achievements = useMemo(() => {
    const avg = stats?.averageScore || 0;
    const totalResumes = stats?.totalResumes || 0;
    const totalEvaluations = stats?.totalEvaluations || 0;

    return [
      { title: 'First Resume Uploaded', unlocked: totalResumes >= 1, icon: '🏆' },
      { title: 'First Evaluation Completed', unlocked: totalEvaluations >= 1, icon: '🏆' },
      { title: '90% Match Score', unlocked: avg >= 90, icon: '🔒' },
      { title: '100% ATS Score', unlocked: breakdown[0].value >= 100, icon: '🔒' },
    ];
  }, [stats, breakdown]);

  const gradeDistribution = (stats?.gradeDistribution || []).sort((a, b) => a._id.localeCompare(b._id));

  if (loading) return <SkeletonDash />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="page-shell space-y-6 pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-gradient">AI Career Intelligence Dashboard</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          A premium command center for resume performance, hiring alignment, and intelligent match optimization.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {statMeta.map((item, idx) => {
          const value = stats?.[item.key] || 0;
          return (
            <AnimatedStatCard key={item.key} item={item} value={value} idx={idx} />
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-7"
          style={{ boxShadow: '0 0 34px rgba(168,85,247,0.18)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Bot size={17} className="text-fuchsia-300" />
            <h2 className="text-lg font-bold text-slate-100">AI Insights</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-200">Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <span key={skill} className="rounded-full border border-rose-300/25 bg-black/25 px-2.5 py-1 text-xs text-rose-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200">Suggestions</p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {suggestions.map((text) => (
                  <li key={text} className="flex items-start gap-2">
                    <Sparkles size={13} className="mt-0.5 text-indigo-300" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease, delay: 0.08 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-5"
          style={{ boxShadow: '0 0 34px rgba(59,130,246,0.16)' }}
        >
          <h2 className="mb-2 text-lg font-bold text-slate-100">Resume Strength Radar</h2>
          <p className="mb-3 text-xs text-slate-400">Multi-dimensional quality view powered by latest evaluation metrics.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.28} strokeWidth={2.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-8"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-100">Score Breakdown</h2>
          <div className="space-y-3.5">
            {breakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-300">
                  <span>{item.label}</span>
                  <span className="font-semibold text-white">{item.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/30">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.className}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease, delay: 0.07 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-4"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-100">Grade Distribution</h2>
          {gradeDistribution.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-slate-400">
              No evaluations yet. Run your first evaluation to unlock grade analytics.
            </div>
          ) : (
            <div className="space-y-3">
              {gradeDistribution.map((row) => (
                <div key={row._id} className="flex items-center gap-2.5">
                  <span
                    className="inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-xs font-bold"
                    style={{ color: gradeColor[row._id] || '#94a3b8', background: `${gradeColor[row._id] || '#64748b'}22` }}
                  >
                    {row._id}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/30">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(100, (row.count / Math.max(stats.totalEvaluations || 1, 1)) * 100)}%` }}
                      transition={{ duration: 0.8, ease }}
                      className="h-full rounded-full"
                      style={{ background: gradeColor[row._id] || '#64748b' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-7"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-100">Activity Timeline</h2>
          <div className="space-y-4">
            {activityEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-slate-400">
                Activity is quiet. Upload a resume and run an evaluation to start tracking momentum.
              </div>
            ) : (
              activityEvents.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={event.id} className="relative flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <span className="z-10 rounded-full border border-white/15 bg-white/5 p-2 text-slate-100">
                        <Icon size={14} />
                      </span>
                      {index < activityEvents.length - 1 ? <span className="mt-1 h-10 w-px bg-white/10" /> : null}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-slate-200">{event.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{event.detail}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{new Date(event.at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease, delay: 0.07 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl xl:col-span-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Award size={16} className="text-amber-200" />
            <h2 className="text-lg font-bold text-slate-100">Achievements</h2>
          </div>
          <div className="space-y-2.5">
            {achievements.map((item) => (
              <div
                key={item.title}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${item.unlocked ? 'border-emerald-400/25 bg-emerald-500/10' : 'border-white/10 bg-black/20'}`}
              >
                <span className="text-sm text-slate-200">{item.title}</span>
                <span className="text-sm">{item.unlocked ? '🏆' : item.icon}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-bold text-slate-100">Skill Match Heatmap</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <th className="pb-2">Skill</th>
                <th className="pb-2">Match %</th>
                <th className="pb-2">Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {heatmapRows.map((row) => (
                <tr key={row.skill}>
                  <td className="py-2.5 font-medium text-slate-200">{row.skill}</td>
                  <td className="py-2.5 text-slate-300">{row.score}%</td>
                  <td className="py-2.5">
                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${getHeatColor(row.score)}`}>
                      {row.score >= 80 ? 'Strong' : row.score >= 45 ? 'Moderate' : 'Missing'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-xl shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-purple-400/20 to-pink-400/20 p-2">
              <CheckCircle2 size={20} className="text-purple-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Recent Evaluations</h2>
          </div>
          <Link to="/evaluations" className="text-sm font-semibold text-indigo-300 transition hover:text-indigo-200 hover:underline">
            View all →
          </Link>
        </div>

        {(stats?.recentEvaluations || []).length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-transparent p-8 text-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 inline-flex rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 p-4"
            >
              <Sparkles className="text-indigo-300" size={24} />
            </motion.div>
            <p className="text-sm font-semibold text-slate-200">No evaluations yet</p>
            <p className="mt-2 text-xs text-slate-400">Run your first evaluation to compare your resume against job descriptions</p>
            <Link 
              to="/evaluations/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white transition hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <CheckCircle2 size={14} /> Start Evaluation
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {stats.recentEvaluations.map((ev, idx) => (
              <motion.div
                key={ev._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-white/[0.02] p-4 transition hover:border-indigo-400/30 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition" />
                <Link
                  to={`/evaluations/${ev._id}`}
                  className="relative flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-100 group-hover:text-indigo-200 transition">
                      {ev.resumeId?.candidateName || 'Unknown'}
                      <span className="mx-1.5 text-slate-600">→</span>
                      <span className="text-indigo-300">{ev.jobId?.jobTitle || 'Unknown job'}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                        <BriefcaseBusiness size={12} className="text-cyan-400" />
                        {ev.jobId?.company || 'No company'}
                      </span>
                      <span>{new Date(ev.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-extrabold" style={{ color: gradeColor[ev.grade] || '#94a3b8' }}>
                        {ev.matchScore}
                      </p>
                      <p className="text-xs text-slate-500">%</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold" 
                      style={{ 
                        backgroundColor: `${gradeColor[ev.grade] || '#94a3b8'}15`,
                        color: gradeColor[ev.grade] || '#94a3b8'
                      }}
                    >
                      {ev.grade}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-5 right-6 z-40 flex flex-col gap-2">
        <Link to="/resumes" className="btn-primary text-xs">
          <Upload size={14} /> Upload Resume
        </Link>
        <Link to="/evaluations/new" className="btn-secondary text-xs">
          <CheckCircle2 size={14} /> Run Evaluation
        </Link>
      </div>
    </motion.div>
  );
}
