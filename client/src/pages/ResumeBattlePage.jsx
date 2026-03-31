import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getResumes, getJobs, resumeBattle } from '../api/services';
import DonutChart from '../components/DonutChart';
import ScoreBar from '../components/ScoreBar';
import ModernSelect from '../components/ModernSelect';

const SCORE_BARS = [
  { key: 'skillsCoverage', label: 'Skills', color: 'blue' },
  { key: 'experienceAlignment', label: 'Experience', color: 'green' },
  { key: 'educationMatch', label: 'Education', color: 'purple' },
  { key: 'keywordScore', label: 'Keywords', color: 'yellow' },
  { key: 'formattingScore', label: 'Formatting', color: 'orange' },
];

const RANK_ICON = ['🥇', '🥈', '🥉'];

export default function ResumeBattlePage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [jobId, setJobId] = useState('');
  const [results, setResults] = useState(null);
  const [battledJob, setBattledJob] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedJob = jobs.find((j) => j._id === jobId);
  const selectedCandidates = resumes.filter((r) => selectedResumes.includes(r._id));

  useEffect(() => {
    Promise.all([getResumes({ limit: 50 }), getJobs({ limit: 50 })]).then(([r, j]) => {
      setResumes(r.data.data);
      setJobs(j.data.data);
    });
  }, []);

  const toggleResume = (id) => {
    setSelectedResumes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleBattle = async (e) => {
    e.preventDefault();
    if (!jobId) { toast.error('Select a job description first'); return; }
    if (selectedResumes.length < 2) { toast.error('Select at least 2 resumes'); return; }
    setLoading(true);
    setResults(null);
    try {
      const res = await resumeBattle({ resumeIds: selectedResumes, jobId });
      setResults(res.data.results);
      setBattledJob(res.data.job);
      toast.success('Battle complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Battle failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-shell pb-10">
      <div
        className="rounded-2xl p-6 md:p-8 border"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(168,85,247,0.08) 45%, rgba(6,182,212,0.08))',
          borderColor: 'rgba(139,92,246,0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 36px rgba(99,102,241,0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Resume Battle Arena</h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(191,219,254,0.9)' }}>
              Pit multiple candidates against one role and reveal the strongest fit instantly.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: 'rgba(59,130,246,0.35)', color: '#93c5fd', background: 'rgba(30,58,138,0.25)' }}>
              {jobs.length} jobs
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: 'rgba(168,85,247,0.35)', color: '#d8b4fe', background: 'rgba(88,28,135,0.25)' }}>
              {resumes.length} candidates
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: 'rgba(16,185,129,0.35)', color: '#6ee7b7', background: 'rgba(6,78,59,0.25)' }}>
              {selectedResumes.length} selected
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleBattle} className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 rounded-2xl p-5 border" style={{ borderColor: 'rgba(59,130,246,0.28)', background: 'rgba(10,16,35,0.65)' }}>
          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">1. Select Job Description</label>
          <div className="mt-3">
            <ModernSelect
              value={jobId}
              onChange={setJobId}
              placeholder="Choose a job"
              accentColor="blue"
              searchable={false}
              options={jobs.map((j) => ({
                value: j._id,
                label: j.jobTitle,
                sub: j.company ? `@ ${j.company}` : undefined,
              }))}
            />
          </div>
        </div>

        <div className="xl:col-span-7 rounded-2xl p-5 border" style={{ borderColor: 'rgba(168,85,247,0.28)', background: 'rgba(18,10,35,0.58)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-200">2. Select Candidates (min 2, max 10)</label>
            <span className="text-xs" style={{ color: selectedResumes.length >= 2 ? '#6ee7b7' : '#fca5a5' }}>
              {selectedResumes.length >= 2 ? 'Ready to battle' : 'Select at least 2'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {resumes.map((r) => {
              const checked = selectedResumes.includes(r._id);
              const initials = (r.candidateName || 'U')
                .split(' ')
                .slice(0, 2)
                .map((w) => (w[0] || '').toUpperCase())
                .join('');

              return (
                <label
                  key={r._id}
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                  style={{
                    borderColor: checked ? 'rgba(99,102,241,0.6)' : 'rgba(148,163,184,0.25)',
                    background: checked ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.14))' : 'rgba(15,23,42,0.45)',
                    boxShadow: checked ? '0 0 18px rgba(99,102,241,0.2)' : 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleResume(r._id)}
                    className="w-4 h-4"
                  />
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: checked ? 'linear-gradient(135deg,#4f46e5,#a855f7)' : 'linear-gradient(135deg,#334155,#1f2937)' }}
                  >
                    {initials}
                  </span>
                  <div className="overflow-hidden min-w-0">
                    <p className="font-semibold text-sm truncate text-white">{r.candidateName}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(148,163,184,0.9)' }}>{r.email || 'No email provided'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-12">
          <button
            type="submit"
            className="w-full relative overflow-hidden rounded-2xl p-[2px] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <span className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(90deg, #4f46e5, #a855f7, #06b6d4)' }} />
            <span className="relative flex items-center justify-center gap-2 w-full rounded-2xl px-6 py-3.5 text-base font-bold text-white" style={{ background: 'rgba(2,6,23,0.82)' }}>
              <span style={{ opacity: 0.95 }}>{loading ? 'Analyzing battle...' : 'Start Battle'}</span>
            </span>
          </button>
        </div>
      </form>

      {!results && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-4 rounded-2xl p-5 border" style={{ borderColor: 'rgba(59,130,246,0.26)', background: 'rgba(8,18,38,0.62)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200 mb-3">Battle Setup</p>
            {selectedJob ? (
              <div className="space-y-2">
                <p className="text-white font-semibold leading-tight">{selectedJob.jobTitle}</p>
                <p className="text-sm" style={{ color: 'rgba(148,163,184,0.95)' }}>{selectedJob.company || 'Company not specified'}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedJob.employmentType && (
                    <span className="px-2 py-1 rounded-md text-xs border" style={{ borderColor: 'rgba(56,189,248,0.35)', color: '#67e8f9', background: 'rgba(12,74,110,0.35)' }}>
                      {selectedJob.employmentType}
                    </span>
                  )}
                  {selectedJob.experienceLevel && (
                    <span className="px-2 py-1 rounded-md text-xs border" style={{ borderColor: 'rgba(129,140,248,0.35)', color: '#a5b4fc', background: 'rgba(49,46,129,0.35)' }}>
                      {selectedJob.experienceLevel}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(148,163,184,0.9)' }}>
                Select a job description to preview role details here.
              </p>
            )}
          </div>

          <div className="xl:col-span-5 rounded-2xl p-5 border" style={{ borderColor: 'rgba(168,85,247,0.26)', background: 'rgba(24,10,40,0.62)' }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-200">Selected Roster</p>
              <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: 'rgba(236,72,153,0.35)', color: '#f9a8d4', background: 'rgba(131,24,67,0.25)' }}>
                {selectedCandidates.length}/10
              </span>
            </div>
            {selectedCandidates.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(148,163,184,0.9)' }}>
                No candidates selected yet. Pick at least 2 to unlock battle mode.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedCandidates.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 border"
                    style={{ borderColor: 'rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.5)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.candidateName}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(148,163,184,0.9)' }}>{c.email || 'No email provided'}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full border" style={{ borderColor: 'rgba(59,130,246,0.32)', color: '#93c5fd' }}>
                      Ready
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-3 rounded-2xl p-5 border" style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(6,25,23,0.58)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#6ee7b7' }}>How Ranking Works</p>
            <div className="space-y-2 text-sm" style={{ color: 'rgba(209,250,229,0.95)' }}>
              <p>1. Skills match and keyword overlap carry the biggest weight.</p>
              <p>2. Experience and education adjust ranking precision.</p>
              <p>3. Formatting quality breaks close-score ties.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {SCORE_BARS.map((item) => (
                <span
                  key={item.key}
                  className="text-[11px] px-2 py-1 rounded-md border text-center"
                  style={{ borderColor: 'rgba(16,185,129,0.22)', color: 'rgba(209,250,229,0.92)', background: 'rgba(6,78,59,0.2)' }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(14,165,233,0.35)', background: 'linear-gradient(135deg, rgba(2,132,199,0.22), rgba(79,70,229,0.16))' }}>
            <h2 className="text-2xl font-bold text-white">Battle Results</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(186,230,253,0.95)' }}>
              {battledJob?.title} {battledJob?.company ? `@ ${battledJob.company}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.slice(0, 3).map((r) => (
              <div
                key={r.resumeId}
                className="rounded-2xl p-5 border"
                style={{
                  borderColor: r.rank === 1 ? 'rgba(250,204,21,0.55)' : r.rank === 2 ? 'rgba(203,213,225,0.55)' : 'rgba(251,146,60,0.55)',
                  background: r.rank === 1
                    ? 'linear-gradient(135deg, rgba(113,63,18,0.35), rgba(161,98,7,0.2))'
                    : r.rank === 2
                    ? 'linear-gradient(135deg, rgba(51,65,85,0.45), rgba(100,116,139,0.25))'
                    : 'linear-gradient(135deg, rgba(124,45,18,0.35), rgba(194,65,12,0.2))',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{RANK_ICON[r.rank - 1] || `#${r.rank}`}</span>
                  <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.18)', color: '#e2e8f0' }}>
                    Grade {r.grade}
                  </span>
                </div>
                <p className="font-semibold text-white truncate">{r.candidateName}</p>
                <p className="text-xs mb-4 truncate" style={{ color: 'rgba(203,213,225,0.9)' }}>{r.email || 'No email provided'}</p>
                <DonutChart score={r.matchScore} label="Match Score" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 border overflow-x-auto" style={{ borderColor: 'rgba(99,102,241,0.28)', background: 'rgba(9,11,28,0.75)' }}>
            <h3 className="font-semibold text-white mb-4">Leaderboard</h3>
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr style={{ color: '#93c5fd' }}>
                  <th className="pb-2 pr-4 text-left">Rank</th>
                  <th className="pb-2 pr-4 text-left">Candidate</th>
                  <th className="pb-2 pr-4 text-center">Total</th>
                  <th className="pb-2 pr-4 text-center">Skills</th>
                  <th className="pb-2 pr-4 text-center">Exp</th>
                  <th className="pb-2 pr-4 text-center">Edu</th>
                  <th className="pb-2 pr-4 text-center">Keywords</th>
                  <th className="pb-2 text-center">Format</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.resumeId} style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                    <td className="py-3 pr-4 text-white font-bold">{RANK_ICON[r.rank - 1] || `#${r.rank}`}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{r.candidateName}</p>
                      <p className="text-xs" style={{ color: 'rgba(148,163,184,0.9)' }}>{r.grade}</p>
                    </td>
                    <td className="py-3 pr-4 text-center font-bold text-cyan-300">{r.matchScore}%</td>
                    <td className="py-3 pr-4 text-center text-slate-200">{r.skillsCoverage}%</td>
                    <td className="py-3 pr-4 text-center text-slate-200">{r.experienceAlignment}%</td>
                    <td className="py-3 pr-4 text-center text-slate-200">{r.educationMatch}%</td>
                    <td className="py-3 pr-4 text-center text-slate-200">{r.keywordScore}%</td>
                    <td className="py-3 text-center text-slate-200">{r.formattingScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((r) => (
              <div key={r.resumeId} className="rounded-2xl p-5 border" style={{ borderColor: 'rgba(139,92,246,0.25)', background: 'rgba(17,24,39,0.7)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{RANK_ICON[r.rank - 1] || `#${r.rank}`}</span>
                  <h4 className="font-semibold text-white">{r.candidateName}</h4>
                </div>
                <div className="space-y-3">
                  {SCORE_BARS.map(({ key, label, color }) => (
                    <ScoreBar key={key} label={label} score={r[key] || 0} color={color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
